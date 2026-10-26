// ===== DETAILS PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('details-content');
  if (!container) return;

  try {
    await window.opportunitiesReady;
  } catch (error) {
    container.textContent = error.message || 'Opportunities could not be loaded.';
    return;
  }

  const id = new URLSearchParams(location.search).get('id');
  const opp = opportunities.find(o => o.id === id);

  if (!opp) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>Opportunity not found</h3><p><a href="opportunities.html" class="btn btn-primary">Browse All Opportunities</a></p></div>`;
    return;
  }

  let recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  recent = [opp.id, ...recent.filter(i => i !== opp.id)].slice(0, 5);
  localStorage.setItem('recentlyViewed', JSON.stringify(recent));

  document.title = `${opp.title} – Youth Opportunity Portal`;

  const saved = getSavedIds().includes(opp.id);
  const days = getDaysUntil(opp.closingDate);
  const description = opp.fullDescription || opp.description || 'No full description has been provided.';
  const requirements = Array.isArray(opp.requirements) && opp.requirements.length ? opp.requirements : ['No requirements have been provided.'];
  const qualifications = Array.isArray(opp.qualifications) && opp.qualifications.length ? opp.qualifications : ['No required qualifications have been provided.'];
  const documents = Array.isArray(opp.documents) && opp.documents.length ? opp.documents : ['No required documents have been provided.'];
  const applicationInstructions = opp.applicationInstructions || 'No application instructions have been provided.';
  const verificationLabel = opp.expired
    ? '<span class="verification-badge expired">Expired Opportunity</span>'
    : opp.verified
    ? '<span class="verification-badge verified">Verified Opportunity</span>'
    : '<span class="verification-badge pending">Not verified</span>';
  const sourceLink = opp.sourceUrl
    ? `<a href="${escapeHTML(opp.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(opp.sourceUrl)}</a>`
    : 'No source link has been added yet.';
  const applicationLink = opp.applicationUrl && !opp.expired
    ? `<a href="${escapeHTML(opp.applicationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-full">Apply on official website</a>`
    : '<p class="application-unavailable">Application link not available. Check the source page before applying.</p>';

  const iconOrg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  const iconPin = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const iconUser = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const iconCal = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const iconMoney = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
  const iconStar = saved
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

  container.innerHTML = `
    <div class="details-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;flex-wrap:wrap">
        <span class="${getBadgeClass(opp.category)}">${getCategoryLabel(opp.category)}</span>
        <button class="save-btn ${saved ? 'saved' : ''}" data-id="${opp.id}" onclick="toggleSave('${opp.id}')" aria-label="${saved ? 'Remove from saved' : 'Save opportunity'}" style="font-size:1.5rem">
          ${iconStar}
        </button>
      </div>
      <h1>${escapeHTML(opp.title)}</h1>
      <div class="details-meta">
        <span class="meta-item">${iconOrg} <strong>${escapeHTML(opp.organisation)}</strong></span>
        <span class="meta-item">${iconPin} ${escapeHTML(opp.location)}</span>
        <span class="meta-item">${iconUser} ${escapeHTML(opp.experienceLevel.charAt(0).toUpperCase() + opp.experienceLevel.slice(1))} level</span>
        <span class="meta-item">${iconCal} Closing: ${formatDate(opp.closingDate)}</span>
      </div>
      <div class="details-status-row">
        ${verificationLabel}
        <span class="status-chip">Last checked ${formatDate(opp.dateChecked)}</span>
      </div>
      ${opp.expired ? '<span class="deadline-badge deadline-urgent">Expired</span>' : getDeadlineBadge(opp.closingDate)}
    </div>

    <div class="details-section">
      <h2>About This Opportunity</h2>
      <p>${escapeHTML(description)}</p>
    </div>

    <div class="details-section">
      <h2>Requirements</h2>
      <ul>${requirements.map(e => `<li>${escapeHTML(e)}</li>`).join('')}</ul>
    </div>

    <div class="details-section">
      <h2>Required Qualifications</h2>
      <p><strong>Minimum qualification:</strong> ${escapeHTML(opp.minimumQualification || 'Not specified in source')}</p>
      <ul>${qualifications.map(q => `<li>${escapeHTML(q)}</li>`).join('')}</ul>
    </div>

    <div class="details-section">
      <h2>Required Documents</h2>
      <ul>${documents.map(d => `<li>${escapeHTML(d)}</li>`).join('')}</ul>
    </div>

    <div class="details-section">
      <h2>Application Instructions</h2>
      <p>${escapeHTML(applicationInstructions)}</p>
    </div>

    <div class="details-section">
      <h2>Organisation Details</h2>
      <p><strong>Organisation:</strong> ${escapeHTML(opp.organisation)}</p>
      <p><strong>Official source:</strong> ${sourceLink}</p>
      <p><strong>Verification status:</strong> ${opp.verified ? 'Verified Opportunity' : 'Not verified'}</p>
      <p><strong>Last checked:</strong> ${formatDate(opp.dateChecked)}</p>
    </div>

    <div class="apply-box">
      <h2>Ready to Apply?</h2>
      ${opp.stipend ? `<div class="stipend-badge">${iconMoney} ${opp.stipend}</div>` : ''}
      <p>Application closes: <strong>${formatDate(opp.closingDate)}</strong> ${days >= 0 ? `(${days} days remaining)` : '(Closed)'}</p>
      ${days >= 0 && !opp.expired ? applicationLink : `<p style="color:var(--danger);font-weight:700">This opportunity has closed. Check our <a href="opportunities.html">opportunities page</a> for current listings.</p>`}
      <p style="font-size:0.78rem;margin-top:0.75rem;color:var(--text-muted)">Always verify the opportunity on its official source before applying. Never pay a fee to apply.</p>
    </div>

    <div class="details-section">
      <h2>Source Information</h2>
      <p>Official source: ${sourceLink}</p>
      <p>Verification status: <strong>${opp.verified ? 'Verified Opportunity' : 'Not verified'}</strong></p>
    </div>

    <div style="margin-top:1rem">
      <a href="opportunities.html" class="btn btn-outline">&larr; Back to Opportunities</a>
    </div>`;
});
