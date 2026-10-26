process.env.SQLITE_DB_PATH = ':memory:';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { db } = require('../db/database');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  db.close();
});

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  return { response, payload: await response.json().catch(() => ({})) };
}

async function register(email) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Ayo Example',
      email,
      password: 'a-unique-password',
      province: 'Gauteng'
    })
  });
}

test('SQLite health, validation, empty opportunity results, and not-found responses', async () => {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.payload, { success: true, data: { status: 'ok' } });

  const config = await request('/api/public-config');
  assert.equal(config.response.status, 200);
  assert.equal(config.payload.data.database, 'sqlite');

  const publicOpportunities = await request('/api/opportunities');
  assert.equal(publicOpportunities.response.status, 200);
  assert.deepEqual(publicOpportunities.payload.data.opportunities, []);

  const missingAuth = await request('/api/auth/me');
  assert.equal(missingAuth.response.status, 401);
  assert.equal(missingAuth.payload.error.code, 'AUTH_REQUIRED');

  const invalidRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name: 'A', email: 'bad', password: 'short', province: '' })
  });
  assert.equal(invalidRegistration.response.status, 400);
  assert.equal(invalidRegistration.payload.error.code, 'VALIDATION_ERROR');

  const invalidRole = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name: 'Ayo Example', email: 'ayo@example.test', password: 'a-unique-password', province: 'Gauteng', role: 'admin' })
  });
  assert.equal(invalidRole.response.status, 400);
  assert.equal(invalidRole.payload.error.code, 'VALIDATION_ERROR');

  const missingRoute = await request('/api/does-not-exist');
  assert.equal(missingRoute.response.status, 404);
  assert.equal(missingRoute.payload.error.code, 'NOT_FOUND');
});

test('registration, login, password hashing, refresh rotation, and logout', async () => {
  const email = `user-${Date.now()}@example.test`;
  const created = await register(email);
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.data.user.email, email);
  assert.ok(created.payload.data.session.access_token);
  assert.ok(created.payload.data.session.refresh_token);
  assert.equal(Object.hasOwn(created.payload.data.user, 'password_hash'), false);

  const stored = db.prepare('SELECT password_hash FROM profiles WHERE email = ?').get(email);
  assert.ok(stored.password_hash);
  assert.notEqual(stored.password_hash, 'a-unique-password');

  const duplicate = await register(email);
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.payload.error.code, 'EMAIL_ALREADY_REGISTERED');

  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'incorrect-password' })
  });
  assert.equal(badLogin.response.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'a-unique-password' })
  });
  assert.equal(login.response.status, 200);
  assert.ok(login.payload.data.session.refresh_token);

  const refresh = await request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: login.payload.data.session.refresh_token })
  });
  assert.equal(refresh.response.status, 200);
  assert.notEqual(refresh.payload.data.session.refresh_token, login.payload.data.session.refresh_token);

  const currentUser = await request('/api/auth/me', { token: refresh.payload.data.session.access_token });
  assert.equal(currentUser.response.status, 200);
  assert.equal(currentUser.payload.data.user.email, email);

  for (let attempt = 0; attempt < 22; attempt += 1) {
    const profile = await request('/api/auth/me', { token: refresh.payload.data.session.access_token });
    assert.equal(profile.response.status, 200);
  }

  const logout = await request('/api/auth/logout', { method: 'POST', token: refresh.payload.data.session.access_token });
  assert.equal(logout.response.status, 200);
  const revoked = await request('/api/auth/me', { token: refresh.payload.data.session.access_token });
  assert.equal(revoked.response.status, 401);
});

test('requests, saved opportunities, and applications enforce ownership and uniqueness', async () => {
  const suffix = Date.now();
  const owner = await register(`owner-${suffix}@example.test`);
  const other = await register(`other-${suffix}@example.test`);
  const ownerToken = owner.payload.data.session.access_token;
  const otherToken = other.payload.data.session.access_token;
  const opportunityAdmin = await register(`opportunity-admin-${Date.now()}@example.test`);
  db.prepare('UPDATE profiles SET role = \'admin\' WHERE id = ?').run(opportunityAdmin.payload.data.user.id);
  const createdOpportunity = await request('/api/opportunities', {
    method: 'POST', token: opportunityAdmin.payload.data.session.access_token,
    body: JSON.stringify({
      title: 'Test opportunity record', organisation: 'Test organisation',
      description: 'This record exists only as an integration-test fixture.',
      category: 'internship', province: 'Gauteng', application_deadline: '2030-01-01',
      source_url: 'https://example.test/opportunities/test-internship',
      application_url: 'https://example.test/apply/test-internship',
      minimum_qualification: 'Test fixture only', eligibility: ['Integration-test fixture']
    })
  });
  assert.equal(createdOpportunity.response.status, 201);
  const opportunity = createdOpportunity.payload.data.opportunity;
  const verification = await request(`/api/opportunities/${opportunity.id}/verify`, {
    method: 'POST', token: opportunityAdmin.payload.data.session.access_token,
    body: JSON.stringify({ confirmed: true })
  });
  assert.equal(verification.response.status, 200);

  const createdRequest = await request('/api/requests', {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ title: 'Training support', description: 'I need help with this application.', category: 'Support' })
  });
  assert.equal(createdRequest.response.status, 201);

  const ownerRequests = await request('/api/requests/mine', { token: ownerToken });
  assert.equal(ownerRequests.payload.data.requests.length, 1);
  const otherRequests = await request('/api/requests/mine', { token: otherToken });
  assert.equal(otherRequests.payload.data.requests.length, 0);

  const saved = await request('/api/saved-opportunities', {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ opportunity_id: opportunity.id })
  });
  assert.equal(saved.response.status, 201);
  const savedList = await request('/api/saved-opportunities', { token: ownerToken });
  assert.equal(savedList.payload.data.saved_opportunities[0].opportunity.id, opportunity.id);
  const otherSaved = await request('/api/saved-opportunities', { token: otherToken });
  assert.equal(otherSaved.payload.data.saved_opportunities.length, 0);

  const application = await request('/api/applications', {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ opportunity_id: opportunity.id })
  });
  assert.equal(application.response.status, 201);
  const duplicateApplication = await request('/api/applications', {
    method: 'POST', token: ownerToken,
    body: JSON.stringify({ opportunity_id: opportunity.id })
  });
  assert.equal(duplicateApplication.response.status, 409);
  const applications = await request('/api/applications/me', { token: ownerToken });
  assert.equal(applications.payload.data.applications[0].opportunities.title, opportunity.title);

  const removed = await request(`/api/opportunities/${opportunity.id}`, { method: 'DELETE', token: opportunityAdmin.payload.data.session.access_token });
  assert.equal(removed.response.status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM applications WHERE opportunity_id = ?').get(opportunity.id).total, 1);
  const savedAfterRemoval = await request('/api/saved-opportunities', { token: ownerToken });
  assert.equal(savedAfterRemoval.payload.data.saved_opportunities.length, 0);
});

test('admin authorization and opportunity management use SQLite', async () => {
  const suffix = Date.now();
  const admin = await register(`admin-${suffix}@example.test`);
  const youth = await register(`youth-${suffix}@example.test`);
  db.prepare('UPDATE profiles SET role = \'admin\' WHERE id = ?').run(admin.payload.data.user.id);
  const adminToken = admin.payload.data.session.access_token;
  const youthToken = youth.payload.data.session.access_token;

  const forbiddenUsers = await request('/api/users', { token: youthToken });
  assert.equal(forbiddenUsers.response.status, 403);
  const users = await request('/api/users', { token: adminToken });
  assert.equal(users.response.status, 200);
  assert.ok(users.payload.data.users.some((user) => user.email === youth.payload.data.user.email));
  const forbiddenAllOpportunities = await request('/api/opportunities?include_all=true', { token: youthToken });
  assert.equal(forbiddenAllOpportunities.response.status, 403);

  const directPublish = await request('/api/opportunities', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({
      title: 'Unverified Test Listing', organisation: 'Test Organisation',
      description: 'The API must reject attempts to directly publish a listing.',
      category: 'internship', province: 'Gauteng', application_deadline: '2030-01-01',
      source_url: 'https://example.test/opportunities/unverified',
      application_url: 'https://example.test/apply/unverified',
      minimum_qualification: 'Test fixture only', eligibility: ['Integration-test fixture'], is_published: true
    })
  });
  assert.equal(directPublish.response.status, 400);

  const created = await request('/api/opportunities', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({
      title: 'SQLite Test Opportunity',
      organisation: 'Test Organisation',
      description: 'This opportunity is created by the SQLite integration test.',
      category: 'internship',
      province: 'Gauteng',
      application_deadline: '2030-01-01',
      source_url: 'https://example.test/opportunities/sqlite-test',
      application_url: 'https://example.test/apply/sqlite-test',
      minimum_qualification: 'Test fixture only', eligibility: ['SQLite test fixture']
    })
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.data.opportunity.is_published, false);

  const invalidUrl = await request('/api/opportunities', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({
      title: 'Invalid URL Listing', organisation: 'Test Organisation',
      description: 'The API must reject a non-web application URL.',
      category: 'internship', province: 'Gauteng', application_deadline: '2030-01-01',
      source_url: 'https://example.test/opportunities/invalid', application_url: 'javascript:alert(1)',
      minimum_qualification: 'Test fixture only', eligibility: ['Integration-test fixture']
    })
  });
  assert.equal(invalidUrl.response.status, 400);

  const duplicate = await request('/api/opportunities', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({
      title: 'Duplicate Test Opportunity', organisation: 'Test Organisation',
      description: 'This duplicate official source must be rejected.',
      category: 'internship', province: 'Gauteng', application_deadline: '2030-01-01',
      source_url: 'HTTPS://EXAMPLE.TEST/opportunities/SQLITE-test',
      application_url: 'https://example.test/apply/duplicate',
      minimum_qualification: 'Test fixture only', eligibility: ['Integration-test fixture']
    })
  });
  assert.equal(duplicate.response.status, 409);

  const unpublishedList = await request('/api/opportunities');
  assert.equal(unpublishedList.payload.data.opportunities.some((item) => item.id === created.payload.data.opportunity.id), false);

  const unconfirmed = await request(`/api/opportunities/${created.payload.data.opportunity.id}/verify`, {
    method: 'POST', token: adminToken, body: JSON.stringify({ confirmed: false })
  });
  assert.equal(unconfirmed.response.status, 400);

  const published = await request(`/api/opportunities/${created.payload.data.opportunity.id}/verify`, {
    method: 'POST', token: adminToken,
    body: JSON.stringify({ confirmed: true })
  });
  assert.equal(published.response.status, 200);
  assert.equal(published.payload.data.opportunity.verification_status, 'verified');
  assert.ok(published.payload.data.opportunity.date_checked);
  assert.equal(published.payload.data.opportunity.is_published, true);
  const publishedList = await request('/api/opportunities');
  assert.equal(publishedList.payload.data.opportunities.some((item) => item.id === created.payload.data.opportunity.id), true);

  const edited = await request(`/api/opportunities/${created.payload.data.opportunity.id}`, {
    method: 'PATCH', token: adminToken, body: JSON.stringify({ title: 'Updated SQLite Test Opportunity' })
  });
  assert.equal(edited.response.status, 200);
  assert.equal(edited.payload.data.opportunity.verification_status, 'unverified');
  assert.equal(edited.payload.data.opportunity.is_published, false);

  const verifiedAgain = await request(`/api/opportunities/${created.payload.data.opportunity.id}/verify`, {
    method: 'POST', token: adminToken, body: JSON.stringify({ confirmed: true })
  });
  assert.equal(verifiedAgain.response.status, 200);
  const expired = await request(`/api/opportunities/${created.payload.data.opportunity.id}/expire`, {
    method: 'POST', token: adminToken
  });
  assert.equal(expired.response.status, 200);
  assert.equal(expired.payload.data.opportunity.verification_status, 'expired');
  const activeAfterExpiry = await request('/api/opportunities');
  assert.equal(activeAfterExpiry.payload.data.opportunities.some((item) => item.id === created.payload.data.opportunity.id), false);
  const expiredHistory = await request('/api/opportunities?include_expired=true');
  const expiredRecord = expiredHistory.payload.data.opportunities.find((item) => item.id === created.payload.data.opportunity.id);
  assert.equal(expiredRecord.verification_status, 'expired');
  assert.equal(expiredRecord.expired, true);
});

test('admin overview is denied to youth and served to database admins', async () => {
  const suffix = Date.now();
  const admin = await register(`overview-admin-${suffix}@example.test`);
  const youth = await register(`overview-youth-${suffix}@example.test`);
  const adminToken = admin.payload.data.session.access_token;
  const youthToken = youth.payload.data.session.access_token;

  const submittedRequest = await request('/api/requests', {
    method: 'POST', token: youthToken,
    body: JSON.stringify({ title: 'Application guidance', description: 'Please help me prepare my application.', category: 'Career support' })
  });
  assert.equal(submittedRequest.response.status, 201);

  const unauthenticated = await request('/api/admin/overview');
  assert.equal(unauthenticated.response.status, 401);

  const youthResponse = await request('/api/admin/overview', { token: youthToken });
  assert.equal(youthResponse.response.status, 403);

  db.prepare('UPDATE profiles SET role = \'admin\' WHERE id = ?').run(admin.payload.data.user.id);
  const adminResponse = await request('/api/admin/overview', { token: adminToken });
  assert.equal(adminResponse.response.status, 200);
  assert.ok(adminResponse.payload.data.totals.youth >= 1);
  assert.ok(Array.isArray(adminResponse.payload.data.recent_users));
  const listedRequest = adminResponse.payload.data.recent_requests.find((item) => item.id === submittedRequest.payload.data.request.id);
  assert.equal(listedRequest.full_name, youth.payload.data.user.full_name);
  assert.equal(listedRequest.email, youth.payload.data.user.email);
  assert.equal(Object.hasOwn(adminResponse.payload.data.recent_users[0] || {}, 'password_hash'), false);

  const reviewed = await request(`/api/requests/${listedRequest.id}/review`, {
    method: 'PATCH', token: adminToken, body: JSON.stringify({ status: 'in_review' })
  });
  assert.equal(reviewed.response.status, 200);
  assert.equal(reviewed.payload.data.request.status, 'in_review');
});