const { body, param } = require('express-validator');

const requestId = param('id').isUUID().withMessage('A valid request UUID is required.');

const createRequestRules = [
  body('title').trim().isLength({ min: 3, max: 160 }).withMessage('Title must be between 3 and 160 characters.'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters.'),
  body('category').trim().isLength({ min: 1, max: 80 }).withMessage('Category is required.'),
  body('status').not().exists().withMessage('Request status is assigned by the server.'),
  body('user_id').not().exists().withMessage('The request owner is taken from your signed-in account.')
];

const updateRequestRules = [
  requestId,
  body().custom((value) => {
    if (!value || !['title', 'description', 'category'].some((key) => Object.hasOwn(value, key))) {
      throw new Error('Provide at least one editable request field.');
    }
    return true;
  }),
  body('title').optional().trim().isLength({ min: 3, max: 160 }).withMessage('Title must be between 3 and 160 characters.'),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters.'),
  body('category').optional().trim().isLength({ min: 1, max: 80 }).withMessage('Category is required.'),
  body('status').not().exists().withMessage('Only administrators may review requests.'),
  body('user_id').not().exists().withMessage('Request ownership cannot be changed.')
];

const reviewRequestRules = [
  requestId,
  body('status').isIn(['pending', 'in_review', 'approved', 'rejected']).withMessage('Choose a valid request status.')
];

module.exports = { createRequestRules, requestId, updateRequestRules, reviewRequestRules };