// ===== CV BUILDER =====
const CV_STORAGE_KEY = 'youthOpportunityCv';
const defaultCv = {
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', summary: '' },
  education: [],
  skills: [],
  experience: [],
  projects: [],
  certifications: []
};

let cvData = cloneCvData(loadCvData());

function cloneCvData(data) {
  return JSON.parse(JSON.stringify({ ...defaultCv, ...data }));
}

function loadCvData() {
  try {
    const saved = localStorage.getItem(CV_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('CV data could not be loaded.', error);
    return {};
  }
}

function saveCvData() {
  try {
    localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(cvData));
    return true;
  } catch (error) {
    console.warn('CV data could not be saved.', error);
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(value) {
  const url = String(value ?? '').trim();
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

function formatDateRange(start, end) {
  if (!start && !end) return '';
  return [start, end].filter(Boolean).join(' – ');
}

function renderList(containerId, items, renderItem) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.length
    ? items.map(renderItem).join('')
    : '<p class="cv-empty-list">No entries added yet.</p>';
}

function renderItemFields(item, index, type) {
  const fields = {
    education: ['institution', 'qualification', 'startYear', 'endYear'],
    experience: ['jobTitle', 'organisation', 'startDate', 'endDate', 'responsibilities'],
    project: ['name', 'description', 'technologies', 'link'],
    certification: ['name', 'issuer', 'date']
  }[type];
  const labels = {
    institution: 'Institution', qualification: 'Qualification', startYear: 'Start year', endYear: 'End year',
    jobTitle: 'Job title', organisation: 'Organisation', startDate: 'Start date', endDate: 'End date', responsibilities: 'Responsibilities',
    name: 'Name', description: 'Description', technologies: 'Technologies used', link: 'Project link', issuer: 'Issuer', date: 'Date'
  };
  const input = (field, value = '') => `<input type="${field === 'startYear' || field === 'endYear' || field === 'date' ? 'number' : 'text'}" data-type="${type}" data-index="${index}" data-field="${field}" value="${escapeHtml(value)}" ${field === 'date' || field === 'startYear' || field === 'endYear' ? 'min="2000" max="2100"' : ''} />`;
  const textarea = (field, value = '') => `<textarea data-type="${type}" data-index="${index}" data-field="${field}" rows="3">${escapeHtml(value)}</textarea>`;
  return fields.map(field => `<div class="form-group"><label>${labels[field]}</label>${field === 'responsibilities' || field === 'description' ? textarea(field, item[field]) : input(field, item[field])}</div>`).join('');
}

function renderDynamicLists() {
  renderList('education-list', cvData.education, (item, index) => `<div class="cv-form-section"><h3>Education ${index + 1}<button type="button" class="remove-item" data-remove="education" data-index="${index}" aria-label="Remove education ${index + 1}">×</button></h3><div class="cv-form-grid">${renderItemFields(item, index, 'education')}</div></div>`);
  renderList('experience-list', cvData.experience, (item, index) => `<div class="cv-form-section"><h3>Work Experience ${index + 1}<button type="button" class="remove-item" data-remove="experience" data-index="${index}" aria-label="Remove work experience ${index + 1}">×</button></h3><div class="cv-form-grid">${renderItemFields(item, index, 'experience')}</div></div>`);
  renderList('project-list', cvData.projects, (item, index) => `<div class="cv-form-section"><h3>Project ${index + 1}<button type="button" class="remove-item" data-remove="project" data-index="${index}" aria-label="Remove project ${index + 1}">×</button></h3><div class="cv-form-grid">${renderItemFields(item, index, 'project')}</div></div>`);
  renderList('certification-list', cvData.certifications, (item, index) => `<div class="cv-form-section"><h3>Certification ${index + 1}<button type="button" class="remove-item" data-remove="certification" data-index="${index}" aria-label="Remove certification ${index + 1}">×</button></h3><div class="cv-form-grid">${renderItemFields(item, index, 'certification')}</div></div>`);
  renderSkills();
}

function renderSkills() {
  const list = document.getElementById('skill-list');
  if (!list) return;
  list.innerHTML = cvData.skills.length
    ? cvData.skills.map((skill, index) => `<span class="skill-chip">${escapeHtml(skill)}<button type="button" class="remove-item" data-remove-skill="${index}" aria-label="Remove ${escapeHtml(skill)}">×</button></span>`).join('')
    : '<p class="cv-empty-list">No skills added yet.</p>';
}

function renderCvPreview() {
  const preview = document.getElementById('cv-preview');
  if (!preview) return;
  const personal = cvData.personal;
  const links = [
    personal.email ? `<a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a>` : '',
    personal.phone ? escapeHtml(personal.phone) : '',
    personal.location ? escapeHtml(personal.location) : '',
    personal.linkedin ? `<a href="${safeUrl(personal.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : '',
    personal.github ? `<a href="${safeUrl(personal.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''
  ].filter(Boolean).join(' · ');

  const section = (heading, content) => content ? `<section class="cv-preview-section"><h2>${escapeHtml(heading)}</h2>${content}</section>` : '';
  const education = cvData.education.map(item => `<li>${escapeHtml(item.qualification || 'Qualification')} — ${escapeHtml(item.institution || 'Institution')} (${formatDateRange(item.startYear, item.endYear)})</li>`).join('');
  const experience = cvData.experience.map(item => `<li><strong>${escapeHtml(item.jobTitle || 'Job title')}</strong> at ${escapeHtml(item.organisation || 'Organisation')} — ${formatDateRange(item.startDate, item.endDate)}<br>${escapeHtml(item.responsibilities || 'No responsibilities added.')}</li>`).join('');
  const projects = cvData.projects.map(item => `<li><strong>${escapeHtml(item.name || 'Project')}</strong><br>${escapeHtml(item.description || 'No description added.')}<br>Technologies: ${escapeHtml(item.technologies || 'Not specified')}${item.link ? `<br><a href="${safeUrl(item.link)}" target="_blank" rel="noopener noreferrer">View project</a>` : ''}</li>`).join('');
  const certifications = cvData.certifications.map(item => `<li>${escapeHtml(item.name || 'Certification')} — ${escapeHtml(item.issuer || 'Issuer')} (${escapeHtml(item.date || 'Date')})</li>`).join('');
  const skills = cvData.skills.length ? `<ul>${cvData.skills.map(skill => `<li>${escapeHtml(skill)}</li>`).join('')}</ul>` : '<p class="cv-preview-empty">No skills added yet.</p>';

  preview.innerHTML = `
    <h1>${escapeHtml(personal.name || 'Your Name')}</h1>
    <div class="cv-preview-contact">${links || 'Add contact details to begin your CV.'}</div>
    ${section('Personal Summary', personal.summary ? `<p>${escapeHtml(personal.summary)}</p>` : '<p class="cv-preview-empty">Add a short professional summary.</p>')}
    ${section('Education', cvData.education.length ? `<ul>${education}</ul>` : '<p class="cv-preview-empty">No education added yet.</p>')}
    ${section('Skills', skills)}
    ${section('Work Experience', cvData.experience.length ? `<ul>${experience}</ul>` : '<p class="cv-preview-empty">No work experience added yet.</p>')}
    ${section('Projects', cvData.projects.length ? `<ul>${projects}</ul>` : '<p class="cv-preview-empty">No projects added yet.</p>')}
    ${section('Certifications', cvData.certifications.length ? `<ul>${certifications}</ul>` : '<p class="cv-preview-empty">No certifications added yet.</p>')}`;
}

function populateForm() {
  const fields = ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'summary'];
  fields.forEach(field => {
    const input = document.getElementById(`cv-${field}`);
    if (input) input.value = cvData.personal[field] || '';
  });
  renderDynamicLists();
  renderCvPreview();
}

function readForm() {
  const fields = ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'summary'];
  fields.forEach(field => {
    const input = document.getElementById(`cv-${field}`);
    if (input) cvData.personal[field] = input.value;
  });
}

function getDynamicItems(type) {
  return [
    ...document.querySelectorAll(`[data-type="${type}"]`)
  ].reduce((items, input) => {
    const index = Number(input.dataset.index);
    const field = input.dataset.field;
    if (!items[index]) items[index] = {};
    items[index][field] = input.value;
    return items;
  }, []);
}

function validateCv() {
  const name = document.getElementById('cv-name');
  const email = document.getElementById('cv-email');
  const summary = document.getElementById('cv-summary');
  let valid = true;
  const fields = [name, email, summary];
  fields.forEach(input => {
    const error = document.getElementById(`${input.id}-error`);
    let message = '';
    if (input.required && !input.value.trim()) message = 'This field is required.';
    else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) message = 'Please enter a valid email address.';
    else if (input.minLength && input.value.trim().length < input.minLength) message = `Please add at least ${input.minLength} characters.`;
    if (error) error.textContent = message;
    error?.classList.toggle('show', Boolean(message));
    input.classList.toggle('input-error', Boolean(message));
    if (message) valid = false;
  });
  return valid;
}

function updateCv() {
  readForm();
  cvData.education = getDynamicItems('education');
  cvData.experience = getDynamicItems('experience');
  cvData.projects = getDynamicItems('project');
  cvData.certifications = getDynamicItems('certification');
  renderCvPreview();
  if (saveCvData()) {
    document.getElementById('cv-status').textContent = 'CV saved in this browser.';
  }
}

function addDynamicItem(type) {
  const list = { education: cvData.education, experience: cvData.experience, project: cvData.projects, certification: cvData.certifications }[type];
  list.push({});
  renderDynamicLists();
  renderCvPreview();
  const newInputs = document.querySelectorAll(`[data-type="${type}"]:last-of-type`);
  newInputs.forEach(input => input.focus());
}

function removeDynamicItem(type, index) {
  const list = { education: cvData.education, experience: cvData.experience, project: cvData.projects, certification: cvData.certifications }[type];
  list.splice(index, 1);
  renderDynamicLists();
  renderCvPreview();
}

function clearCv() {
  if (!window.confirm('Clear all CV information from this browser?')) return;
  cvData = cloneCvData(defaultCv);
  localStorage.removeItem(CV_STORAGE_KEY);
  document.getElementById('cv-form').reset();
  populateForm();
  document.getElementById('cv-status').textContent = 'CV data cleared.';
  showToast('CV data cleared.');
}

function printCv() {
  if (!document.getElementById('cv-preview').textContent.trim()) {
    showToast('Add at least your name before printing.');
    return;
  }
  window.print();
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cv-form');
  if (!form) return;
  populateForm();
  form.addEventListener('input', updateCv);
  form.addEventListener('change', updateCv);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validateCv()) {
      document.getElementById('cv-status').textContent = 'Please correct the highlighted fields.';
      document.getElementById('cv-name').focus();
      return;
    }
    readForm();
    cvData.education = getDynamicItems('education');
    cvData.experience = getDynamicItems('experience');
    cvData.projects = getDynamicItems('project');
    cvData.certifications = getDynamicItems('certification');
    if (saveCvData()) {
      document.getElementById('cv-status').textContent = 'Your CV has been saved in this browser.';
      showToast('CV saved successfully.');
    }
  });
  document.getElementById('add-skill').addEventListener('click', () => {
    const input = document.getElementById('cv-skill-input');
    const skill = input.value.trim();
    if (!skill) return;
    cvData.skills.push(skill);
    input.value = '';
    renderSkills();
    renderCvPreview();
    saveCvData();
  });
  document.getElementById('cv-skill-input').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); document.getElementById('add-skill').click(); }
  });
  document.addEventListener('click', event => {
    const removeSkill = event.target.closest('[data-remove-skill]');
    if (removeSkill) { cvData.skills.splice(Number(removeSkill.dataset.removeSkill), 1); renderSkills(); renderCvPreview(); saveCvData(); }
    const removeItem = event.target.closest('[data-remove]');
    if (removeItem) removeDynamicItem(removeItem.dataset.remove, Number(removeItem.dataset.index));
  });
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addDynamicItem(button.dataset.add)));
  document.getElementById('print-cv').addEventListener('click', printCv);
  document.getElementById('print-cv-secondary').addEventListener('click', printCv);
  document.getElementById('clear-cv').addEventListener('click', clearCv);
  document.getElementById('clear-cv-secondary').addEventListener('click', clearCv);
});
