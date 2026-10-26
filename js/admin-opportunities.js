function opportunityAdminDate(value) {
  if (!value) return 'Not checked';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Not checked' : date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function opportunityAdminElement(tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function opportunityAdminNotice(message, isError = false) {
  const status = document.getElementById('opportunity-form-status');
  status.textContent = message;
  status.className = isError ? 'is-error' : 'is-success';
}

function renderAdminOpportunityRows(records) {
  const body = document.getElementById('opportunity-records-body');
  body.replaceChildren();
  document.getElementById('opportunity-record-count').textContent = `${records.length} ${records.length === 1 ? 'record' : 'records'}`;
  if (!records.length) {
    const row = document.createElement('tr');
    const cell = opportunityAdminElement('td', 'No opportunity records yet. Add a listing from its official notice page.', 'text-center admin-empty');
    cell.colSpan = 5;
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement('tr');
    const detail = document.createElement('td');
    detail.className = 'admin-opportunity-copy';
    detail.append(
      opportunityAdminElement('strong', record.title),
      opportunityAdminElement('small', `${record.organisation} · ${record.category} · ${record.province}`),
      opportunityAdminElement('small', record.description)
    );

    const links = document.createElement('td');
    links.className = 'admin-opportunity-links';
    for (const [label, url] of [['Source', record.source_url], ['Apply', record.application_url]]) {
      if (!url) continue;
      const link = opportunityAdminElement('a', label);
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.appendChild(link);
    }

    const closing = opportunityAdminElement('td', opportunityAdminDate(record.application_deadline));
    const status = opportunityAdminElement('td');
    const statusLabel = record.expired && record.verification_status === 'verified' ? 'Expired by date' : record.verification_status;
    status.append(
      opportunityAdminElement('strong', statusLabel, `admin-opportunity-status is-${record.expired ? 'expired' : record.verification_status}`),
      opportunityAdminElement('small', record.date_checked ? `Checked ${opportunityAdminDate(record.date_checked)}` : 'Not source-checked')
    );

    const actions = opportunityAdminElement('td', undefined, 'admin-opportunity-actions');
    const edit = opportunityAdminElement('button', 'Edit', 'btn btn-sm btn-outline-secondary');
    edit.type = 'button';
    edit.addEventListener('click', () => editAdminOpportunity(record));
    actions.appendChild(edit);

    if (record.verification_status !== 'removed' && !record.expired) {
      const verifyWrap = opportunityAdminElement('div', undefined, 'admin-verify-control');
      const checkLabel = opportunityAdminElement('label');
      const checked = document.createElement('input');
      checked.type = 'checkbox';
      const checkText = opportunityAdminElement('span', 'I checked the official listing and application page');
      checkLabel.append(checked, checkText);
      const verify = opportunityAdminElement('button', 'Verify', 'btn btn-sm admin-verify-button');
      verify.type = 'button';
      verify.disabled = true;
      checked.addEventListener('change', () => { verify.disabled = !checked.checked; });
      verify.addEventListener('click', async () => {
        verify.disabled = true;
        try {
          await PortalApi.request(`/opportunities/${encodeURIComponent(record.id)}/verify`, {
            method: 'POST', body: JSON.stringify({ confirmed: true })
          });
          await loadAdminOpportunities();
        } catch (error) {
          opportunityAdminNotice(error.message || 'Could not verify this opportunity.', true);
          verify.disabled = false;
        }
      });
      verifyWrap.append(checkLabel, verify);
      actions.appendChild(verifyWrap);

      const expire = opportunityAdminElement('button', 'Expire', 'btn btn-sm btn-outline-warning');
      expire.type = 'button';
      expire.addEventListener('click', async () => {
        try {
          await PortalApi.request(`/opportunities/${encodeURIComponent(record.id)}/expire`, { method: 'POST' });
          await loadAdminOpportunities();
        } catch (error) {
          opportunityAdminNotice(error.message || 'Could not expire this opportunity.', true);
        }
      });
      actions.appendChild(expire);
    }

    if (record.verification_status !== 'removed') {
      const remove = opportunityAdminElement('button', 'Remove', 'btn btn-sm btn-outline-danger');
      remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!window.confirm(`Remove “${record.title}” from public listings? Existing application and saved records will be retained.`)) return;
        try {
          await PortalApi.request(`/opportunities/${encodeURIComponent(record.id)}`, { method: 'DELETE' });
          await loadAdminOpportunities();
        } catch (error) {
          opportunityAdminNotice(error.message || 'Could not remove this opportunity.', true);
        }
      });
      actions.appendChild(remove);
    }

    row.append(detail, links, closing, status, actions);
    body.appendChild(row);
  });
}

function editAdminOpportunity(record) {
  const form = document.getElementById('opportunity-form');
  form.elements.id.value = record.id;
  form.elements.title.value = record.title || '';
  form.elements.organisation.value = record.organisation || '';
  form.elements.category.value = record.category || '';
  form.elements.province.value = record.province || '';
  form.elements.location.value = record.location || '';
  form.elements.application_deadline.value = record.application_deadline || '';
  form.elements.minimum_qualification.value = record.minimum_qualification || '';
  form.elements.description.value = record.description || '';
  form.elements.eligibility.value = Array.isArray(record.eligibility) ? record.eligibility.join('\n') : '';
  form.elements.source_url.value = record.source_url || '';
  form.elements.application_url.value = record.application_url || '';
  document.getElementById('opportunity-form-title').textContent = 'Edit opportunity';
  document.getElementById('opportunity-submit').lastChild.textContent = 'Save changes';
  document.getElementById('opportunity-cancel-edit').hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetAdminOpportunityForm() {
  const form = document.getElementById('opportunity-form');
  form.reset();
  form.elements.id.value = '';
  document.getElementById('opportunity-form-title').textContent = 'Add opportunity';
  document.getElementById('opportunity-submit').lastChild.textContent = 'Save as unverified';
  document.getElementById('opportunity-cancel-edit').hidden = true;
  opportunityAdminNotice('');
}

async function loadAdminOpportunities() {
  const result = await PortalApi.request('/opportunities?include_all=true');
  renderAdminOpportunityRows(result.opportunities || []);
}

async function initializeOpportunityAdmin() {
  const loading = document.getElementById('opportunity-loading');
  const errorRegion = document.getElementById('opportunity-error');
  if (!PortalApi.getSession()?.access_token) {
    window.location.replace('../account.html?next=admin/opportunities.html');
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
    await loadAdminOpportunities();
    document.getElementById('admin-logout').addEventListener('click', async () => {
      try { await PortalApi.request('/auth/logout', { method: 'POST' }); } catch { /* Clear local session if offline. */ }
      PortalApi.clearSession();
      window.location.replace('../account.html');
    });
    document.getElementById('opportunity-cancel-edit').addEventListener('click', resetAdminOpportunityForm);
    document.getElementById('opportunity-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const id = form.elements.id.value;
      const body = {
        title: form.elements.title.value.trim(),
        organisation: form.elements.organisation.value.trim(),
        category: form.elements.category.value,
        province: form.elements.province.value,
        location: form.elements.location.value.trim() || form.elements.province.value,
        application_deadline: form.elements.application_deadline.value,
        minimum_qualification: form.elements.minimum_qualification.value.trim(),
        description: form.elements.description.value.trim(),
        eligibility: form.elements.eligibility.value.split('\n').map((item) => item.trim()).filter(Boolean),
        source_url: form.elements.source_url.value.trim(),
        application_url: form.elements.application_url.value.trim()
      };
      const submit = document.getElementById('opportunity-submit');
      submit.disabled = true;
      try {
        await PortalApi.request(id ? `/opportunities/${encodeURIComponent(id)}` : '/opportunities', {
          method: id ? 'PATCH' : 'POST', body: JSON.stringify(body)
        });
        resetAdminOpportunityForm();
        opportunityAdminNotice(id ? 'Saved. This record needs verification again before it is public.' : 'Saved as an unverified draft.');
        await loadAdminOpportunities();
      } catch (error) {
        opportunityAdminNotice(error.message || 'Could not save this opportunity.', true);
      } finally {
        submit.disabled = false;
      }
    });
    loading.hidden = true;
    document.getElementById('opportunity-content').hidden = false;
  } catch (error) {
    if (error.status === 401) {
      PortalApi.clearSession();
      window.location.replace('../account.html?next=admin/opportunities.html');
      return;
    }
    if (error.status === 403) {
      window.location.replace('../dashboard.html');
      return;
    }
    loading.hidden = true;
    errorRegion.textContent = error.message || 'Could not load opportunity records.';
    errorRegion.hidden = false;
  }
}

document.addEventListener('DOMContentLoaded', initializeOpportunityAdmin);