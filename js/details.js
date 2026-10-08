// ===== DETAILS PAGE =====
document.addEventListener('DOMContentLoaded', () => {
  const id = parseInt(new URLSearchParams(location.search).get('id'));
  const opp = opportunities.find(o => o.id === id);
  const container = document.getElementById('details-content');
  if (!container) return;

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
  const eligibility = Array.isArray(opp.eligibility) && opp.eligibility.length ? opp.eligibility : ['No eligibility requirements have been provided.'];
  const qualifications = Array.isArray(opp.qualifications) && opp.qualifications.length ? opp.qualifications : ['No required qualifications have been provided.'];
  const documents = Array.isArray(opp.documents) && opp.documents.length ? opp.documents : ['No required documents have been provided.'];
  const applicationInstructions = opp.applicationInstructions || 'No application instructions have been provided.';

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
        <button class="save-btn ${saved ? 'saved' : ''}" data-id="${opp.id}" onclick="toggleSave(${opp.id})" aria-label="${saved ? 'Remove from saved' : 'Save opportunity'}" style="font-size:1.5rem">
          ${iconStar}
        </button>
      </div>
      <h1>${opp.title}</h1>
      <div class="details-meta">
        <span class="meta-item">${iconOrg} <strong>${opp.organisation}</strong></span>
        <span class="meta-item">${iconPin} ${opp.location}</span>
        <span class="meta-item">${iconUser} ${opp.experienceLevel.charAt(0).toUpperCase() + opp.experienceLevel.slice(1)} level</span>
        <span class="meta-item">${iconCal} Added: ${formatDate(opp.dateAdded)}</span>
      </div>
      ${getDeadlineBadge(opp.closingDate)}
    </div>

    <div class="details-section">
      <h2>About This Opportunity</h2>
      <p>${description}</p>
    </div>

    <div class="details-section">
      <h2>Eligibility Requirements</h2>
      <ul>${eligibility.map(e => `<li>${e}</li>`).join('')}</ul>
    </div>

    <div class="details-section">
      <h2>Required Qualifications</h2>
      <ul>${qualifications.map(q => `<li>${q}</li>`).join('')}</ul>
    </div>

    <div class="details-section">
      <h2>Required Documents</h2>
      <ul>${documents.map(d => `<li>${d}</li>`).join('')}</ul>
    </div>

    <div class="details-section">
      <h2>Application Instructions</h2>
      <p>${applicationInstructions}</p>
    </div>

    <div class="apply-box">
      <h2>Ready to Apply?</h2>
      ${opp.stipend ? `<div class="stipend-badge">${iconMoney} ${opp.stipend}</div>` : ''}
      <p>Application closes: <strong>${formatDate(opp.closingDate)}</strong> ${days >= 0 ? `(${days} days remaining)` : '(Closed)'}</p>
      ${days >= 0
        ? `<a href="${opp.applicationLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-full">Apply Now at ${opp.organisation} &rarr;</a>
           <p style="font-size:0.78rem;margin-top:0.75rem;color:var(--text-muted)">You will be redirected to the organisation's official website. Always verify the opportunity before applying. Never pay a fee to apply.</p>`
        : `<p style="color:var(--danger);font-weight:700">This opportunity has closed. Check our <a href="opportunities.html">opportunities page</a> for current listings.</p>`
      }
    </div>

    <div class="details-section">
      <h2>About ${opp.organisation}</h2>
      <p>Visit the official website: <a href="${opp.organisationUrl}" target="_blank" rel="noopener noreferrer">${opp.organisationUrl}</a></p>
    </div>

    <div style="margin-top:1rem">
      <a href="opportunities.html" class="btn btn-outline">&larr; Back to Opportunities</a>
    </div>`;
});
