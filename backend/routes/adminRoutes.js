const express = require('express');
const adminController = require('../controllers/adminController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('admin'));
router.get('/overview', asyncHandler(adminController.overview));

module.exports = router;
