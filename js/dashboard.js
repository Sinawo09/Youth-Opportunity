const dashboardState = {
  user: null,
  opportunities: [],
  opportunitiesTotal: 0,
  applications: [],
  applicationsTotal: 0,
  saved: [],
  savedTotal: 0,
  requests: []
};

function dashboardMessage(message, isError = false) {
  const region = document.getElementById('dashboard-message');
  region.textContent = message;
  region.classList.toggle('is-error', isError);
  region.hidden = false;
}

function clearDashboardMessage() {
  const region = document.getElementById('dashboard-message');
  region.textContent = '';
  region.hidden = true;
  region.classList.remove('is-error');
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDashboardDate(value) {
  if (!value) return 'Deadline not provided';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? 'Deadline not provided' : date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatStatus(status) {
  return String(status || 'unknown').replaceAll('_', ' ');
}

function addStatus(parent, status) {
  const badge = makeElement('span', 'dashboard-status', formatStatus(status));
  badge.dataset.status = status || 'unknown';
  parent.appendChild(badge);
}

function profileCompletion(user) {
  const fields = [user.full_name, user.email, user.province];
  return Math.round((fields.filter((value) => typeof value === 'string' && value.trim()).length / fields.length) * 100);
}

function updateSummary() {
  const name = dashboardState.user.full_name || 'there';
  document.getElementById('welcome-name').textContent = `Welcome, ${name}`;
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-role').textContent = dashboardState.user.role === 'admin' ? 'Administrator' : 'Youth member';
  document.getElementById('dashboard-avatar').textContent = name.trim().charAt(0).toUpperCase() || 'Y';
  document.getElementById('stat-opportunities').textContent = dashboardState.opportunitiesTotal.toLocaleString();
  document.getElementById('stat-applications').textContent = dashboardState.applicationsTotal.toLocaleString();
  document.getElementById('stat-saved').textContent = dashboardState.savedTotal.toLocaleString();

  const completion = profileCompletion(dashboardState.user);
  document.getElementById('stat-profile').textContent = `${completion}%`;
  document.getElementById('profile-progress-bar').style.width = `${completion}%`;
  document.getElementById('profile-progress-hint').textContent = completion === 100 ? 'Your profile is complete' : 'Add your details in My Profile';
}

function setEmpty(container, message, linkText, href) {
  container.replaceChildren();
  const paragraph = makeElement('p', 'dashboard-empty', message);
  container.appendChild(paragraph);
  if (linkText && href) {
    const link = makeElement('a', 'btn btn-outline btn-sm', linkText);
    link.href = href;
    if (href.startsWith('#')) link.dataset.view = href.slice(1);
    container.appendChild(link);
  }
}

function makeListItem(title, detail, status) {
  const row = makeElement('article', 'dashboard-list-item');
  const copy = makeElement('div');
  copy.appendChild(makeElement('h3', '', title || 'Untitled record'));
  if (detail) copy.appendChild(makeElement('p', '', detail));
  row.appendChild(copy);
  if (status) addStatus(row, status);
  return row;
}

function renderApplications() {
  const container = document.getElementById('dashboard-applications');
  const overview = document.getElementById('overview-applications');
  if (!dashboardState.applications.length) {
    setEmpty(container, 'You have not applied to an opportunity yet.', 'Find opportunities', '#opportunities');
    setEmpty(overview, 'No applications to show yet.', 'Browse opportunities', '#opportunities');
    return;
  }

  container.replaceChildren();
  overview.replaceChildren();
  dashboardState.applications.forEach((application, index) => {
    const opportunity = application.opportunities || {};
    const title = opportunity.title || 'Opportunity';
    const details = `${opportunity.organisation || 'Organisation not listed'} · Applied ${formatDashboardDate(application.created_at?.slice(0, 10))}`;
    container.appendChild(makeListItem(title, details, application.status));
    if (index < 3) overview.appendChild(makeListItem(title, details, application.status));
  });
}

function renderRequests() {
  const container = document.getElementById('dashboard-requests');
  const overview = document.getElementById('overview-requests');
  if (!dashboardState.requests.length) {
    setEmpty(container, 'You have not created a request yet. Use the form to ask for support.');
    setEmpty(overview, 'No requests to show yet.', 'Create a request', '#requests');
    return;
  }

  container.replaceChildren();
  overview.replaceChildren();
  dashboardState.requests.forEach((request, index) => {
    const row = makeListItem(request.title, `${request.category} · Created ${formatDashboardDate(request.created_at?.slice(0, 10))}`, request.status);
    const remove = makeElement('button', 'btn btn-outline btn-sm', 'Delete');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete request: ${request.title}`);
    remove.addEventListener('click', () => deleteRequest(request.id, remove));
    row.appendChild(remove);
    container.appendChild(row);
    if (index < 3) overview.appendChild(makeListItem(request.title, request.category, request.status));
  });
}

function populateOpportunityFilters() {
  const categories = [...new Set(dashboardState.opportunities.map((item) => item.category).filter(Boolean))].sort();
  const provinces = [...new Set(dashboardState.opportunities.map((item) => item.province).filter(Boolean))].sort();
  const categorySelect = document.getElementById('category-filter');
  const provinceSelect = document.getElementById('province-filter');

  for (const value of categories) categorySelect.add(new Option(value, value));
  for (const value of provinces) provinceSelect.add(new Option(value, value));
}

function filteredOpportunities() {
  const query = document.getElementById('opportunity-search').value.trim().toLocaleLowerCase();
  const category = document.getElementById('category-filter').value;
  const province = document.getElementById('province-filter').value;
  return dashboardState.opportunities.filter((item) => {
    const searchable = [item.title, item.organisation, item.description, item.category, item.province].join(' ').toLocaleLowerCase();
    return (!query || searchable.includes(query)) && (!category || item.category === category) && (!province || item.province === province);
  });
}

function renderOpportunityCard(opportunity, savedView = false) {
  const card = makeElement('article', 'dashboard-opportunity');
  card.appendChild(makeElement('h2', '', opportunity.title));
  const meta = makeElement('div', 'dashboard-opportunity-meta');
  meta.appendChild(makeElement('span', 'dashboard-tag', opportunity.category));
  if (opportunity.expired) meta.appendChild(makeElement('span', 'dashboard-status', 'Expired'));
  else meta.appendChild(makeElement('span', 'dashboard-status', 'Verified opportunity'));
  meta.appendChild(makeElement('span', '', opportunity.organisation));
  meta.appendChild(makeElement('span', '', opportunity.province));
  meta.appendChild(makeElement('span', '', `Closes ${formatDashboardDate(opportunity.application_deadline)}`));
  meta.appendChild(makeElement('span', '', `Last checked ${formatDashboardDate(opportunity.date_checked)}`));
  card.appendChild(meta);
  if (opportunity.minimum_qualification) {
    card.appendChild(makeElement('p', 'dashboard-opportunity-description', `Minimum qualification: ${opportunity.minimum_qualification}`));
  }
  card.appendChild(makeElement('p', 'dashboard-opportunity-description', opportunity.description));

  const actions = makeElement('div', 'dashboard-actions');
  if (opportunity.application_url && !opportunity.expired) {
    const officialApply = makeElement('a', 'btn btn-primary btn-sm', 'Apply on official website');
    officialApply.href = opportunity.application_url;
    officialApply.target = '_blank';
    officialApply.rel = 'noopener noreferrer';
    actions.appendChild(officialApply);
  }
  const existingApplication = dashboardState.applications.find((item) => item.opportunity_id === opportunity.id);
  if (existingApplication) {
    const appliedLabel = makeElement('span', 'dashboard-status', `Applied: ${formatStatus(existingApplication.status)}`);
    appliedLabel.dataset.status = existingApplication.status;
    actions.appendChild(appliedLabel);
  } else if (!opportunity.expired) {
    const apply = makeElement('button', 'btn btn-outline btn-sm', 'Track application');
    apply.type = 'button';
    apply.addEventListener('click', () => applyForOpportunity(opportunity, apply));
    actions.appendChild(apply);
  }

  const isSaved = dashboardState.saved.some((entry) => entry.opportunity_id === opportunity.id);
  const save = makeElement('button', 'btn btn-outline btn-sm', savedView || isSaved ? 'Remove saved' : 'Save');
  save.type = 'button';
  save.setAttribute('aria-label', `${savedView || isSaved ? 'Remove saved' : 'Save'} opportunity: ${opportunity.title}`);
  save.addEventListener('click', () => toggleSavedOpportunity(opportunity, save));
  actions.appendChild(save);
  card.appendChild(actions);
  return card;
}

function renderOpportunities() {
  const results = filteredOpportunities();
  const container = document.getElementById('dashboard-opportunities');
  document.getElementById('opportunity-result-count').textContent = `${results.length} ${results.length === 1 ? 'opportunity' : 'opportunities'}`;
  if (!results.length) {
    setEmpty(container, dashboardState.opportunities.length ? 'No opportunities match these filters.' : 'No published opportunities are available yet.');
    return;
  }
  container.replaceChildren(...results.map((opportunity) => renderOpportunityCard(opportunity)));
}

function renderSavedOpportunities() {
  const container = document.getElementById('dashboard-saved');
  const opportunities = dashboardState.saved.map((entry) => entry.opportunity).filter(Boolean);
  if (!opportunities.length) {
    setEmpty(container, 'You have not saved an opportunity yet.', 'Find opportunities', '#opportunities');
    return;
  }
  container.replaceChildren(...opportunities.map((opportunity) => renderOpportunityCard(opportunity, true)));
}

function renderDashboard() {
  updateSummary();
  populateOpportunityFilters();
  renderApplications();
  renderRequests();
  renderOpportunities();
  renderSavedOpportunities();
}

async function reloadApplications() {
  const result = await PortalApi.request('/applications/me');
  dashboardState.applications = result.applications;
  dashboardState.applicationsTotal = result.total ?? result.applications.length;
  renderApplications();
  updateSummary();
  renderOpportunities();
  renderSavedOpportunities();
}

async function reloadSaved() {
  const result = await PortalApi.request('/saved-opportunities');
  dashboardState.saved = result.saved_opportunities;
  dashboardState.savedTotal = result.total ?? result.saved_opportunities.length;
  updateSummary();
  renderSavedOpportunities();
  renderOpportunities();
}

async function applyForOpportunity(opportunity, button) {
  button.disabled = true;
  try {
    await PortalApi.request('/applications', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunity.id })
    });
    await reloadApplications();
    dashboardMessage(`Your application for ${opportunity.title} was submitted.`);
  } catch (error) {
    dashboardMessage(error.message, true);
    button.disabled = false;
  }
}

async function toggleSavedOpportunity(opportunity, button) {
  button.disabled = true;
  const isSaved = dashboardState.saved.some((entry) => entry.opportunity_id === opportunity.id);
  try {
    if (isSaved) {
      await PortalApi.request(`/saved-opportunities/${encodeURIComponent(opportunity.id)}`, { method: 'DELETE' });
    } else {
      await PortalApi.request('/saved-opportunities', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: opportunity.id })
      });
    }
    await reloadSaved();
    clearDashboardMessage();
  } catch (error) {
    dashboardMessage(error.message, true);
    button.disabled = false;
  }
}

function validateDashboardForm(form) {
  let valid = true;
  for (const field of form.querySelectorAll('input, select, textarea')) {
    const error = document.getElementById(`${field.id}-error`);
    const message = field.validity.valid ? '' : field.validationMessage;
    if (error) {
      error.textContent = message;
      error.classList.toggle('show', Boolean(message));
    }
    field.classList.toggle('input-error', Boolean(message));
    valid = valid && !message;
  }
  return valid;
}

function bindRequestForm() {
  const form = document.getElementById('assistance-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateDashboardForm(form)) return;
    const button = document.getElementById('request-submit');
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const result = await PortalApi.request('/requests', { method: 'POST', body: JSON.stringify(values) });
      dashboardState.requests.unshift(result.request);
      renderRequests();
      form.reset();
      clearDashboardMessage();
    } catch (error) {
      dashboardMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

async function deleteRequest(id, button) {
  button.disabled = true;
  try {
    await PortalApi.request(`/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
    dashboardState.requests = dashboardState.requests.filter((request) => request.id !== id);
    renderRequests();
  } catch (error) {
    dashboardMessage(error.message, true);
    button.disabled = false;
  }
}

function bindProfileForm() {
  const form = document.getElementById('profile-form');
  const fullName = document.getElementById('profile-full-name');
  const email = document.getElementById('profile-email');
  const province = document.getElementById('profile-province');
  fullName.value = dashboardState.user.full_name || '';
  email.value = dashboardState.user.email || '';
  province.value = dashboardState.user.province || '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateDashboardForm(form)) return;
    const button = document.getElementById('profile-save');
    button.disabled = true;
    try {
      const result = await PortalApi.request('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName.value.trim(), province: province.value })
      });
      dashboardState.user = result.user;
      updateSummary();
      dashboardMessage('Your profile has been updated.');
    } catch (error) {
      dashboardMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

function bindDashboardNavigation() {
  const links = [...document.querySelectorAll('[data-view]')];
  const views = [...document.querySelectorAll('.dashboard-view')];

  function activate(viewName) {
    const target = document.getElementById(`view-${viewName}`);
    if (!target) return;
    views.forEach((view) => { view.hidden = view !== target; });
    links.forEach((link) => link.classList.toggle('is-current', link.dataset.view === viewName));
    history.replaceState(null, '', `#${viewName}`);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-view]');
    if (!link) return;
    event.preventDefault();
    activate(link.dataset.view);
  });
  const initialView = location.hash.slice(1);
  if (initialView) activate(initialView);
}

function bindFilters() {
  const form = document.getElementById('opportunity-filters');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    renderOpportunities();
  });
  document.getElementById('opportunity-search').addEventListener('input', renderOpportunities);
  document.getElementById('category-filter').addEventListener('change', renderOpportunities);
  document.getElementById('province-filter').addEventListener('change', renderOpportunities);
}

async function signOut() {
  const button = document.getElementById('dashboard-logout');
  button.disabled = true;
  try {
    await PortalApi.request('/auth/logout', { method: 'POST' });
  } catch (error) {
    dashboardMessage(error.message, true);
  } finally {
    PortalApi.clearSession();
    window.location.replace('account.html');
  }
}

async function initializeDashboard() {
  const loading = document.getElementById('dashboard-loading');
  const views = document.getElementById('dashboard-views');
  const session = PortalApi.getSession();
  if (!session?.access_token) {
    window.location.replace('account.html?next=dashboard.html');
    return;
  }

  try {
    const profileResult = await PortalApi.request('/auth/me');
    if (profileResult.user.role === 'admin') {
      window.location.replace('admin/dashboard.html');
      return;
    }
    dashboardState.user = profileResult.user;
    const [opportunities, applications, saved, requests] = await Promise.all([
      PortalApi.request('/opportunities'),
      PortalApi.request('/applications/me'),
      PortalApi.request('/saved-opportunities'),
      PortalApi.request('/requests/mine')
    ]);
    dashboardState.opportunities = opportunities.opportunities;
    dashboardState.opportunitiesTotal = opportunities.total ?? opportunities.opportunities.length;
    dashboardState.applications = applications.applications;
    dashboardState.applicationsTotal = applications.total ?? applications.applications.length;
    dashboardState.saved = saved.saved_opportunities;
    dashboardState.savedTotal = saved.total ?? saved.saved_opportunities.length;
    dashboardState.requests = requests.requests;

    bindDashboardNavigation();
    bindFilters();
    bindRequestForm();
    bindProfileForm();
    document.getElementById('dashboard-logout').addEventListener('click', signOut);
    renderDashboard();
    loading.hidden = true;
    views.hidden = false;
  } catch (error) {
    loading.hidden = true;
    if (error.status === 401) {
      PortalApi.clearSession();
      window.location.replace('account.html?next=dashboard.html');
      return;
    }
    dashboardMessage(error.message, true);
  }
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
