const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { loginRules, registerRules } = require('../validators/authValidators');
const { updateProfileRules } = require('../validators/profileValidators');

const router = express.Router();

router.post('/register', registerRules, validate, asyncHandler(authController.register));
router.post('/login', loginRules, validate, asyncHandler(authController.login));
router.post('/refresh', body('refresh_token').isString().isLength({ min: 20 }).withMessage('A valid refresh token is required.'), validate, asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, authController.currentUser);
router.patch('/me', authenticate, updateProfileRules, validate, asyncHandler(authController.updateProfile));

module.exports = router;