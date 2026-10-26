const { body } = require('express-validator');

const updateProfileRules = [
  body().custom((value) => {
    if (!value || !['full_name', 'province'].some((key) => Object.hasOwn(value, key))) {
      throw new Error('Provide full_name or province to update.');
    }
    return true;
  }),
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),
  body('province').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Province must be between 2 and 80 characters.'),
  body('email').not().exists().withMessage('Email cannot be changed here.'),
  body('role').not().exists().withMessage('Only administrators can change a role.'),
  body('id').not().exists().withMessage('Profile ID is assigned by the server.')
];

module.exports = { updateProfileRules };