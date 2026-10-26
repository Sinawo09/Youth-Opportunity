const { body, param } = require('express-validator');

const applicationId = param('id').isUUID().withMessage('A valid application UUID is required.');
const createApplicationRules = [
  body('opportunity_id').isUUID().withMessage('A valid opportunity UUID is required.'),
  body('user_id').not().exists().withMessage('The applicant is taken from your signed-in account.'),
  body('status').not().exists().withMessage('Application status is assigned by the server.')
];
const withdrawApplicationRules = [
  applicationId,
  body('status').equals('withdrawn').withMessage('Users may only withdraw their own application.')
];
const reviewApplicationRules = [
  applicationId,
  body('status').isIn(['reviewing', 'accepted', 'rejected']).withMessage('Choose an allowed review status.')
];

module.exports = { applicationId, createApplicationRules, reviewApplicationRules, withdrawApplicationRules };