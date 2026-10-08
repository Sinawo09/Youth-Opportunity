// ===== OPPORTUNITIES PAGE =====
const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let filtered = [...opportunities];

function getFilters() {
  return {
    search: document.getElementById('search-input')?.value.toLowerCase().trim() || '',
    category: document.getElementById('filter-category')?.value || '',
    location: document.getElementById('filter-location')?.value || '',
    experience: document.getElementById('filter-experience')?.value || '',
    closing: document.getElementById('filter-closing')?.value || ''
  };
}

function applyFilters() {
  const f = getFilters();
  const now = new Date();
  filtered = opportunities.filter(opp => {
    const matchSearch = !f.search || opp.title.toLowerCase().includes(f.search) ||
      opp.organisation.toLowerCase().includes(f.search) ||
      opp.description.toLowerCase().includes(f.search) ||
      opp.tags.some(t => t.includes(f.search));
    const matchCat = !f.category || opp.category === f.category;
    const matchLoc = !f.location || opp.location === f.location;
    const matchExp = !f.experience || opp.experienceLevel === f.experience;
    let matchClose = true;
    if (f.closing === 'week') matchClose = getDaysUntil(opp.closingDate) <= 7 && getDaysUntil(opp.closingDate) >= 0;
    else if (f.closing === 'month') matchClose = getDaysUntil(opp.closingDate) <= 30 && getDaysUntil(opp.closingDate) >= 0;
    else if (f.closing === 'open') matchClose = new Date(opp.closingDate) >= now;
    return matchSearch && matchCat && matchLoc && matchExp && matchClose;
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
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <h3>No opportunities found</h3>
      <p>Try adjusting your search or filters.</p>
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
    catSel.innerHTML = '<option value="">All Categories</option>' +
      categories.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
  }
  if (locSel) {
    locSel.innerHTML = '<option value="">All Locations</option>' +
      locations.map(l => `<option value="${l}">${l}</option>`).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateFilters();

  // Pre-filter from URL params (e.g. from home page category click)
  const params = new URLSearchParams(location.search);
  if (params.get('category')) {
    const el = document.getElementById('filter-category');
    if (el) el.value = params.get('category');
  }
  if (params.get('search')) {
    const el = document.getElementById('search-input');
    if (el) el.value = params.get('search');
  }

  applyFilters();

  // Attach filter listeners
  ['filter-category', 'filter-location', 'filter-experience', 'filter-closing'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  document.getElementById('search-input')?.addEventListener('input', applyFilters);
  document.getElementById('filter-form')?.addEventListener('submit', e => { e.preventDefault(); applyFilters(); });
  document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
});
