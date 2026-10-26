const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();
router.use(authenticate);
router.get('/', authorize('admin'), asyncHandler(userController.listUsers));
router.patch('/:id/role', authorize('admin'), [
  param('id').isUUID().withMessage('A valid user UUID is required.'),
  body('role').isIn(['youth', 'admin']).withMessage('Role must be youth or admin.')
], validate, asyncHandler(userController.updateRole));

module.exports = router;