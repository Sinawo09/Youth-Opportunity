// ===== OPPORTUNITIES PAGE =====
const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let filtered = [...opportunities];
let searchResultById = new Map();

function getFilters() {
  return {
    search: document.getElementById('search-input')?.value.trim() || '',
    category: document.getElementById('filter-category')?.value || '',
    province: document.getElementById('filter-location')?.value || '',
    experience: document.getElementById('filter-experience')?.value || '',
    closing: document.getElementById('filter-closing')?.value || ''
  };
}

function applyFilters() {
  const f = getFilters();
  const now = new Date();
  const naturalSearch = f.search ? searchYouthOrganisations(f.search, {
    organisations: opportunities,
    limit: opportunities.length
  }) : { results: opportunities, analysis: { text: '' } };
  searchResultById = new Map(naturalSearch.results.map(result => [result.id, result.searchScore]));

  filtered = opportunities.filter(opp => {
    const matchSearch = !f.search || searchResultById.has(opp.id);
    const matchCat = !f.category || opp.category === f.category;
    const matchProvince = !f.province || opp.province === f.province;
    const matchExp = !f.experience || opp.experienceLevel === f.experience;
    let matchClose = true;
    if (f.closing === 'expired') matchClose = opp.expired;
    else if (f.closing === 'week') matchClose = getDaysUntil(opp.closingDate) <= 7 && getDaysUntil(opp.closingDate) >= 0;
    else if (f.closing === 'month') matchClose = getDaysUntil(opp.closingDate) <= 30 && getDaysUntil(opp.closingDate) >= 0;
    else if (f.closing === 'open') matchClose = new Date(opp.closingDate) >= now;
    return matchSearch && matchCat && matchProvince && matchExp && matchClose;
  });

  const sort = document.getElementById('sort-opportunities')?.value || 'deadline';
  filtered.sort((a, b) => {
    if (f.search) return (searchResultById.get(b.id) || 0) - (searchResultById.get(a.id) || 0);
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'organisation') return a.organisation.localeCompare(b.organisation);
    if (sort === 'newest') return new Date(b.dateAdded) - new Date(a.dateAdded);
    return new Date(a.closingDate) - new Date(b.closingDate);
  });
  currentPage = 1;
  renderPage();
}

function renderPage() {
  const grid = document.getElementById('cards-grid');
  const info = document.getElementById('results-info');
  const pagination = document.getElementById('pagination');
  if (!grid) return;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  if (info) info.innerHTML = `Showing <strong>${filtered.length}</strong> opportunit${filtered.length !== 1 ? 'ies' : 'y'}`;

  if (filtered.length === 0) {
    const noActiveRecords = opportunityDataTotal === 0;
    const expiredFilter = getFilters().closing === 'expired';
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">${noActiveRecords ? '📭' : '🔍'}</div>
      <h3>${expiredFilter ? 'No expired opportunities to show' : noActiveRecords ? 'No verified active opportunities right now' : 'No opportunities match these filters'}</h3>
      <p>${expiredFilter ? 'Expired listings appear here only after they have been verified and their closing status is recorded.' : noActiveRecords ? 'Check back later, or browse official opportunity sources. We only list opportunities after an administrator checks the notice and application page.' : 'Try another keyword, province or category.'}</p>
      <button class="btn btn-outline" style="margin-top:1rem" onclick="clearFilters()">Clear Filters</button>
    </div>`;
    if (pagination) pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = pageItems.map(renderCard).join('');

  if (pagination) {
    pagination.innerHTML = '';
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn${i === currentPage ? ' active' : ''}`;
        btn.textContent = i;
        btn.setAttribute('aria-label', `Page ${i}`);
        btn.addEventListener('click', () => { currentPage = i; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        pagination.appendChild(btn);
      }
    }
  }
}

function clearFilters() {
  ['search-input', 'filter-category', 'filter-location', 'filter-experience', 'filter-closing'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  applyFilters();
}

function populateFilters() {
  const catSel = document.getElementById('filter-category');
  const locSel = document.getElementById('filter-location');
  if (catSel) {
    catSel.replaceChildren(new Option('All Categories', ''));
    categories.forEach((category) => catSel.add(new Option(category.label, category.value)));
  }
  if (locSel) {
    locSel.replaceChildren(new Option('All Provinces', ''));
    locations.forEach((province) => locSel.add(new Option(province, province)));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const showLoadError = (error) => {
    const grid = document.getElementById('cards-grid');
    const info = document.getElementById('results-info');
    const pagination = document.getElementById('pagination');
    const state = document.createElement('div');
    state.className = 'empty-state';
    state.setAttribute('role', 'status');
    const heading = document.createElement('h3');
    heading.textContent = 'Unable to load opportunities';
    const message = document.createElement('p');
    message.textContent = error.message;
    const retry = document.createElement('button');
    retry.className = 'btn btn-outline';
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => window.location.reload());
    state.append(heading, message, retry);
    grid.replaceChildren(state);
    info.textContent = '';
    pagination.replaceChildren();
  };

  window.opportunitiesReady.then(() => {
    populateFilters();

    const params = new URLSearchParams(location.search);
    if (params.get('category')) document.getElementById('filter-category').value = params.get('category');
    if (params.get('search')) document.getElementById('search-input').value = params.get('search');
    if (params.get('closing')) document.getElementById('filter-closing').value = params.get('closing');

    applyFilters();
    ['filter-category', 'filter-location', 'filter-experience', 'filter-closing'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('sort-opportunities')?.addEventListener('change', applyFilters);
    document.getElementById('filter-form')?.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
  }).catch(showLoadError);
});
