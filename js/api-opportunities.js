(function () {
  const API_BASE = `${window.YOP_API_BASE_URL || 'http://localhost:5000'}/api`;

  async function loadOpportunities() {
    const includeExpired = new URLSearchParams(window.location.search).get('closing') === 'expired'
      || window.location.pathname.endsWith('saved-opportunities.html');
    const response = await fetch(`${API_BASE}/opportunities${includeExpired ? '?include_expired=true' : ''}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || `Could not load opportunities (${response.status}).`);
    const records = payload.data?.opportunities;
    if (!Array.isArray(records)) throw new Error('The API returned an invalid opportunities response.');
    setOpportunityRows(records, payload.data.total ?? records.length);
  }

  loadOpportunities().catch((error) => {
    console.error('Opportunities could not be loaded.', error);
    setOpportunityError(error.message || 'Opportunities could not be loaded.');
  });
})();
