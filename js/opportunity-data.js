var opportunities = [];
var categories = [
  { value: 'job', label: 'Jobs', icon: 'job' },
  { value: 'internship', label: 'Internships', icon: 'internship' },
  { value: 'learnership', label: 'Learnerships', icon: 'learnership' },
  { value: 'apprenticeship', label: 'Apprenticeships', icon: 'learnership' },
  { value: 'bursary', label: 'Bursaries', icon: 'bursary' },
  { value: 'course', label: 'Courses', icon: 'course' },
  { value: 'free-course', label: 'Free Courses', icon: 'course' },
  { value: 'skills-programme', label: 'Skills Programmes', icon: 'skills' },
  { value: 'career-event', label: 'Career Events', icon: 'event' }
];
var locations = [];
var opportunityDataTotal = 0;
window.opportunityDataStatus = 'loading';
window.opportunityDataError = '';
let resolveOpportunitiesReady;
let rejectOpportunitiesReady;
window.opportunitiesReady = new Promise((resolve, reject) => {
  resolveOpportunitiesReady = resolve;
  rejectOpportunitiesReady = reject;
});
window.opportunitiesReady.catch(() => {});

function mapOpportunityRecord(record) {
  const listValue = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  };

  return {
    id: String(record.id),
    title: record.title || '',
    organisation: record.organisation || '',
    sourceUrl: record.source_url || null,
    category: record.category || '',
    location: record.location || record.province || '',
    province: record.province || record.location || '',
    closingDate: record.closing_date || '',
    experienceLevel: record.experience_level || '',
    description: record.description || '',
    fullDescription: record.full_description || record.description || '',
    eligibility: listValue(record.eligibility),
    requirements: listValue(record.eligibility),
    qualifications: listValue(record.qualifications),
    documents: listValue(record.documents),
    applicationInstructions: record.application_instructions || '',
    applicationUrl: record.application_url || null,
    applicationLink: record.application_url || null,
    minimumQualification: record.minimum_qualification || '',
    stipend: record.stipend || '',
    dateAdded: record.date_added || '',
    dateChecked: record.date_checked || null,
    lastUpdated: record.date_checked || null,
    tags: listValue(record.tags),
    verified: record.verification_status === 'verified',
    expired: Boolean(record.expired),
    verificationStatus: record.verification_status || 'unverified'
  };
}

function setOpportunityRows(records, total = records.length) {
  opportunities = records.map(mapOpportunityRecord);
  window.opportunities = opportunities;
  opportunityDataTotal = total;
  window.opportunityDataTotal = total;

  const knownCategories = new Set(categories.map((category) => category.value));
  for (const opportunity of opportunities) {
    if (opportunity.category && !knownCategories.has(opportunity.category)) {
      knownCategories.add(opportunity.category);
      categories.push({
        value: opportunity.category,
        label: opportunity.category.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        icon: 'course'
      });
    }
  }
  locations = [...new Set(opportunities.map((opportunity) => opportunity.province).filter(Boolean))].sort();
  window.opportunityDataStatus = 'ready';
  window.opportunityDataError = '';
  resolveOpportunitiesReady(opportunities);
  window.dispatchEvent(new CustomEvent('opportunities:loaded', { detail: { total: opportunities.length } }));
}

function setOpportunityError(message) {
  window.opportunityDataStatus = 'error';
  window.opportunityDataError = message;
  rejectOpportunitiesReady(new Error(message));
  window.dispatchEvent(new CustomEvent('opportunities:error', { detail: { message } }));
}
