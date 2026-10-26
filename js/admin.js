function adminDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function adminNotice(message) {
  const region = document.getElementById('admin-error');
  region.textContent = message;
  region.hidden = false;
  document.getElementById('admin-loading').hidden = true;
}

function renderRecentUsers(users) {
  const body = document.getElementById('recent-users-body');
  body.replaceChildren();
  if (!users.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'text-center admin-empty';
    cell.textContent = 'No user registrations yet.';
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  users.forEach((user) => {
    const row = document.createElement('tr');
    const name = document.createElement('td');
    const identity = document.createElement('div');
    identity.className = 'admin-user-cell';
    const avatar = document.createElement('span');
    avatar.className = 'admin-user-avatar';
    avatar.textContent = (user.full_name || user.email || 'Y').trim().charAt(0).toUpperCase();
    const text = document.createElement('span');
    const fullName = document.createElement('strong');
    fullName.textContent = user.full_name || 'Youth member';
    const email = document.createElement('small');
    email.textContent = user.email;
    text.append(fullName, email);
    identity.append(avatar, text);
    name.appendChild(identity);

    const province = document.createElement('td');
    province.textContent = user.province || '—';
    const role = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `admin-role-badge${user.role === 'admin' ? ' is-admin' : ''}`;
    badge.textContent = user.role === 'admin' ? 'Admin' : 'Youth';
    role.appendChild(badge);
    const joined = document.createElement('td');
    joined.textContent = adminDate(user.created_at);
    row.append(name, province, role, joined);
    body.appendChild(row);
  });
}

function renderActivity(items) {
  const list = document.getElementById('recent-activity');
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No applications or service requests yet.';
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const entry = document.createElement('article');
    entry.className = 'admin-activity-item';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined admin-activity-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = item.kind === 'application' ? 'description' : 'support_agent';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.title || 'Untitled activity';
    const meta = document.createElement('small');
    meta.textContent = `${item.kind === 'application' ? 'Application' : 'Service request'} · ${String(item.status || 'pending').replaceAll('_', ' ')} · ${adminDate(item.created_at)}`;
    copy.append(title, meta);
    entry.append(icon, copy);
    list.appendChild(entry);
  });
}

function renderRequests(requests) {
  const body = document.getElementById('recent-requests-body');
  body.replaceChildren();
  if (!requests.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'text-center admin-empty';
    cell.textContent = 'No service requests have been submitted.';
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  requests.forEach((request) => {
    const row = document.createElement('tr');
    const requestCell = document.createElement('td');
    requestCell.className = 'admin-request-copy';
    const title = document.createElement('strong');
    title.textContent = request.title;
    const description = document.createElement('small');
    description.textContent = request.description;
    requestCell.append(title, description);

    const userCell = document.createElement('td');
    const userName = document.createElement('strong');
    userName.textContent = request.full_name || 'Youth member';
    const userEmail = document.createElement('small');
    userEmail.textContent = request.email || '';
    userCell.className = 'admin-request-copy';
    userCell.append(userName, userEmail);

    const category = document.createElement('td');
    category.textContent = request.category || '—';
    const submitted = document.createElement('td');
    submitted.textContent = adminDate(request.created_at);

    const reviewCell = document.createElement('td');
    const reviewControls = document.createElement('div');
    reviewControls.className = 'admin-request-review';
    const status = document.createElement('select');
    status.className = 'form-select form-select-sm';
    status.setAttribute('aria-label', `Review status for ${request.title}`);
    ['pending', 'in_review', 'approved', 'rejected'].forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value.replaceAll('_', ' ');
      option.selected = value === request.status;
      status.appendChild(option);
    });
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn btn-sm admin-request-save';
    save.textContent = 'Save';
    save.addEventListener('click', async () => {
      save.disabled = true;
      try {
        const result = await PortalApi.request(`/requests/${encodeURIComponent(request.id)}/review`, {
          method: 'PATCH',
          body: JSON.stringify({ status: status.value })
        });
        request.status = result.request.status;
        save.textContent = 'Saved';
      } catch (error) {
        save.textContent = error.message || 'Retry';
      } finally {
        save.disabled = false;
      }
    });
    reviewControls.append(status, save);
    reviewCell.appendChild(reviewControls);
    row.append(requestCell, userCell, category, submitted, reviewCell);
    body.appendChild(row);
  });
}

async function initializeAdminDashboard() {
  const loading = document.getElementById('admin-loading');
  if (!PortalApi.getSession()?.access_token) {
    window.location.replace('../account.html?next=admin/dashboard.html');
    return;
  }

  try {
    const profile = await PortalApi.request('/auth/me');
    if (profile.user.role !== 'admin') {
      window.location.replace('../dashboard.html');
      return;
    }
    document.getElementById('admin-name').textContent = profile.user.full_name || 'Administrator';
    document.getElementById('admin-email').textContent = profile.user.email;

    const result = await PortalApi.request('/admin/overview');
    const { totals, recent_users, recent_requests, recent_activity } = result;
    document.getElementById('metric-youth').textContent = totals.youth.toLocaleString();
    document.getElementById('metric-published').textContent = totals.published_opportunities.toLocaleString();
    document.getElementById('metric-pending').textContent = totals.pending_opportunities.toLocaleString();
    document.getElementById('metric-activity').textContent = (totals.applications + totals.requests).toLocaleString();
    document.getElementById('metric-applications').textContent = totals.applications.toLocaleString();
    document.getElementById('metric-requests').textContent = totals.requests.toLocaleString();
    document.getElementById('admin-logout').addEventListener('click', async () => {
      try {
        await PortalApi.request('/auth/logout', { method: 'POST' });
      } catch {
        // Clear the local session even if the server is unreachable.
      }
      PortalApi.clearSession();
      window.location.replace('../account.html');
    });
    renderRecentUsers(recent_users);
    renderActivity(recent_activity);
    renderRequests(recent_requests || []);
    loading.hidden = true;
    document.getElementById('admin-content').hidden = false;
  } catch (error) {
    if (error.status === 401) {
      PortalApi.clearSession();
      window.location.replace('../account.html?next=admin/dashboard.html');
      return;
    }
    if (error.status === 403) {
      window.location.replace('../dashboard.html');
      return;
    }
    adminNotice(error.message || 'Could not load the administration dashboard.');
  }
}

document.addEventListener('DOMContentLoaded', initializeAdminDashboard);
