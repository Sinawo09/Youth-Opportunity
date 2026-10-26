const { body, param } = require('express-validator');

const opportunityId = param('id').isUUID().withMessage('A valid opportunity UUID is required.');
const webUrl = { protocols: ['http', 'https'], require_protocol: true };
const categories = ['job', 'internship', 'learnership', 'bursary', 'apprenticeship', 'course', 'free-course', 'skills-programme', 'career-event'];
const createOpportunityRules = [
  body('title').trim().isLength({ min: 3, max: 180 }).withMessage('Title must be between 3 and 180 characters.'),
  body('organisation').trim().isLength({ min: 2, max: 180 }).withMessage('Organisation is required.'),
  body('description').trim().isLength({ min: 10, max: 10000 }).withMessage('Description must be between 10 and 10000 characters.'),
  body('category').isIn(categories).withMessage('Choose a supported opportunity category.'),
  body('province').trim().isLength({ min: 2, max: 80 }).withMessage('Province is required.'),
  body('application_deadline').isISO8601({ strict: true, strictSeparator: true }).withMessage('Use an ISO date for the application deadline.'),
  body('source_url').isURL(webUrl).withMessage('Enter the official page for this specific opportunity.'),
  body('application_url').isURL(webUrl).withMessage('Enter the direct official application URL.'),
  body('minimum_qualification').trim().isLength({ min: 2, max: 300 }).withMessage('Minimum qualification is required.'),
  body('eligibility').isArray({ min: 1, max: 30 }).withMessage('Add eligibility requirements from the official notice.'),
  body('qualifications').optional().isArray({ max: 30 }).withMessage('Qualifications must be a list.'),
  body('documents').optional().isArray({ max: 30 }).withMessage('Documents must be a list.'),
  body('is_published').not().exists().withMessage('Opportunities can only be published through the verification action.')
];

const updateOpportunityRules = [
  opportunityId,
  body().custom((value) => {
    const fields = ['title', 'organisation', 'source_url', 'application_url', 'minimum_qualification', 'description', 'full_description', 'category', 'province', 'location', 'closing_date', 'application_deadline', 'experience_level', 'eligibility', 'qualifications', 'documents', 'application_instructions', 'stipend', 'tags'];
    if (!value || !Object.keys(value).some((key) => fields.includes(key))) throw new Error('Provide at least one opportunity field.');
    return true;
  }),
  body('title').optional().trim().isLength({ min: 3, max: 180 }).withMessage('Title must be between 3 and 180 characters.'),
  body('organisation').optional().trim().isLength({ min: 2, max: 180 }).withMessage('Organisation is required.'),
  body('description').optional().trim().isLength({ min: 10, max: 10000 }).withMessage('Description must be between 10 and 10000 characters.'),
  body('category').optional().isIn(categories).withMessage('Choose a supported opportunity category.'),
  body('province').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Province is required.'),
  body('application_deadline').optional().isISO8601({ strict: true, strictSeparator: true }).withMessage('Use an ISO date for the application deadline.'),
  body('closing_date').optional().isISO8601({ strict: true, strictSeparator: true }).withMessage('Use an ISO date for the closing date.'),
  body('source_url').optional().isURL(webUrl).withMessage('Enter a valid official opportunity URL.'),
  body('application_url').optional().isURL(webUrl).withMessage('Enter a valid direct application URL.'),
  body('minimum_qualification').optional().trim().isLength({ min: 2, max: 300 }).withMessage('Minimum qualification is required.'),
  body('eligibility').optional().isArray({ max: 30 }).withMessage('Eligibility must be a list of requirements.'),
  body('qualifications').optional().isArray({ max: 30 }).withMessage('Qualifications must be a list.'),
  body('documents').optional().isArray({ max: 30 }).withMessage('Documents must be a list.')
];

const verifyOpportunityRules = [
  opportunityId,
  body('confirmed').custom((value) => value === true).withMessage('Confirm that you checked the official listing and application pages.')
];

module.exports = { createOpportunityRules, opportunityId, updateOpportunityRules, verifyOpportunityRules };