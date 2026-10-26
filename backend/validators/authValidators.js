const { body } = require('express-validator');

const provinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

const registerRules = [
  body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters.'),
  body('province').trim().isIn(provinces).withMessage('Select a valid South African province.'),
  body('role').not().exists().withMessage('Role is assigned by an administrator.')
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 72 }).withMessage('Password is required.')
];

module.exports = { registerRules, loginRules };