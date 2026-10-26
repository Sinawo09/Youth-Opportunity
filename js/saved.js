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

  container.innerHTML = saved.map(renderCard).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.opportunitiesReady;
  } catch (error) {
    document.getElementById('saved-content').textContent = error.message || 'Opportunities could not be loaded.';
    return;
  }
  renderSavedOpportunities();
  document.addEventListener('click', event => {
    if (event.target.closest('.save-btn[data-id]')) {
      window.setTimeout(renderSavedOpportunities, 0);
    }
  });
});
