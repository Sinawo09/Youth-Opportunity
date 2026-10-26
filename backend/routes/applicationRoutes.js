const express = require('express');
const applicationController = require('../controllers/applicationController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { applicationId, createApplicationRules, reviewApplicationRules, withdrawApplicationRules } = require('../validators/applicationValidators');

const router = express.Router();
router.use(authenticate);
router.post('/', createApplicationRules, validate, asyncHandler(applicationController.createApplication));
router.get('/me', asyncHandler(applicationController.listMyApplications));
router.patch('/:id/review', authorize('admin'), reviewApplicationRules, validate, asyncHandler(applicationController.reviewApplication));
router.patch('/:id', withdrawApplicationRules, validate, asyncHandler(applicationController.withdrawApplication));
router.delete('/:id', applicationId, validate, asyncHandler(applicationController.deleteApplication));

module.exports = router;