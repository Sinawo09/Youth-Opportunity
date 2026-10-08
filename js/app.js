// ===== UTILITIES =====
function getDaysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDeadlineBadge(dateStr) {
  const days = getDaysUntil(dateStr);
  if (days < 0) return `<span class="deadline-badge deadline-urgent">Closed</span>`;
  if (days <= 7) return `<span class="deadline-badge deadline-urgent">${days}d left — Urgent</span>`;
  if (days <= 21) return `<span class="deadline-badge deadline-soon">${days}d left — Closing Soon</span>`;
  return `<span class="deadline-badge deadline-ok">${days}d left — Open</span>`;
}

function getBadgeClass(category) {
  return `badge badge-${category}`;
}

function getCategoryLabel(cat) {
  const found = categories.find(c => c.value === cat);
  return found ? found.label : cat;
}

function getSavedIds() {
  return JSON.parse(localStorage.getItem('savedOpps') || '[]');
}

function toggleSave(id) {
  let saved = getSavedIds();
  const idx = saved.indexOf(id);
  if (idx === -1) { saved.push(id); showToast('Opportunity saved!'); }
  else { saved.splice(idx, 1); showToast('Removed from saved.'); }
  localStorage.setItem('savedOpps', JSON.stringify(saved));
  document.querySelectorAll(`.save-btn[data-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('saved', saved.includes(id));
    btn.setAttribute('aria-label', saved.includes(id) ? 'Remove from saved' : 'Save opportunity');
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== CARD RENDERING =====
function renderCard(opp) {
  const saved = getSavedIds().includes(opp.id);
  const days = getDaysUntil(opp.closingDate);
  const closingClass = days <= 14 ? 'closing-soon' : 'closing-ok';
  return `
    <article class="opp-card" role="article">
      <div class="card-header">
        <h3 class="card-title">${opp.title}</h3>
        <button class="save-btn ${saved ? 'saved' : ''}" data-id="${opp.id}" onclick="toggleSave(${opp.id})" aria-label="${saved ? 'Remove from saved' : 'Save opportunity'}" title="Save opportunity">
          ${saved ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'}
        </button>
      </div>
      <div class="card-meta">
        <span class="${getBadgeClass(opp.category)}">${getCategoryLabel(opp.category)}</span>
        <span class="meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> ${opp.organisation}</span>
        <span class="meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${opp.location}</span>
        <span class="meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${opp.experienceLevel.charAt(0).toUpperCase() + opp.experienceLevel.slice(1)}</span>
      </div>
      <p class="card-desc">${opp.description}</p>
      <div class="card-footer">
        <div>
          <span class="closing-date ${closingClass}">Closes: ${formatDate(opp.closingDate)}</span>
          <br>${getDeadlineBadge(opp.closingDate)}
        </div>
        <div class="card-actions">
          <a href="opportunity-details.html?id=${opp.id}" class="btn btn-outline btn-sm">View Details</a>
          <a href="${opp.applicationLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Apply Now →</a>
        </div>
      </div>
    </article>`;
}

// ===== NAV =====
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  if (!hamburger || !nav) return;
  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
  // Active link
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', initNav);
