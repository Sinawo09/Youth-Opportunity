// ===== SAVED OPPORTUNITIES PAGE =====
function getSavedOpportunities() {
  const savedIds = getSavedIds();
  return opportunities.filter(opportunity => savedIds.includes(opportunity.id));
}

function renderSavedOpportunities() {
  const container = document.getElementById('saved-content');
  const count = document.getElementById('saved-count');
  if (!container || !count) return;

  const saved = getSavedOpportunities();
  count.textContent = saved.length === 1
    ? '1 saved opportunity'
    : `${saved.length} saved opportunities`;

  if (!saved.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon" aria-hidden="true">♡</div>
      <h3>You haven't saved any opportunities yet.</h3>
      <p>Save an opportunity from the details page or opportunity listing.</p>
      <a href="opportunities.html" class="btn btn-primary" style="margin-top:1rem">Find Opportunities</a>
    </div>`;
    return;
  }

  container.innerHTML = saved.map(opportunity => `
    <article class="opp-card">
      <div class="card-header">
        <div><span class="badge badge-${opportunity.category}">${getCategoryLabel(opportunity.category)}</span><h3 class="card-title" style="margin-top:0.5rem">${opportunity.title}</h3></div>
        <button class="save-btn saved" data-id="${opportunity.id}" onclick="toggleSave(${opportunity.id})" aria-label="Remove ${opportunity.title} from saved opportunities" title="Remove from saved">♥</button>
      </div>
      <div class="card-meta"><span class="meta-item">${opportunity.organisation}</span><span class="meta-item">${opportunity.location}</span></div>
      <p class="card-desc">${opportunity.description}</p>
      <div class="card-footer"><span class="closing-date">${getDeadlineBadge(opportunity.closingDate)}</span><div class="card-actions"><a href="opportunity-details.html?id=${opportunity.id}" class="btn btn-outline btn-sm">View Details</a>${opportunity.applicationUrl ? `<a href="${opportunity.applicationUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Apply Now →</a>` : ''}</div></div>
    </article>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSavedOpportunities();
  document.addEventListener('click', event => {
    if (event.target.closest('.save-btn[data-id]')) {
      window.setTimeout(renderSavedOpportunities, 0);
    }
  });
});
