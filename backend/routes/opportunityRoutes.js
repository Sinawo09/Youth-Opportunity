const express = require('express');
const opportunityController = require('../controllers/opportunityController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createOpportunityRules, opportunityId, updateOpportunityRules, verifyOpportunityRules } = require('../validators/opportunityValidators');

const router = express.Router();
router.get('/', optionalAuthenticate, asyncHandler(opportunityController.listOpportunities));
router.post('/', authenticate, authorize('admin'), createOpportunityRules, validate, asyncHandler(opportunityController.createOpportunity));
router.post('/:id/verify', authenticate, authorize('admin'), verifyOpportunityRules, validate, asyncHandler(opportunityController.verifyOpportunity));
router.post('/:id/expire', authenticate, authorize('admin'), opportunityId, validate, asyncHandler(opportunityController.expireOpportunity));
router.patch('/:id', authenticate, authorize('admin'), updateOpportunityRules, validate, asyncHandler(opportunityController.updateOpportunity));
router.delete('/:id', authenticate, authorize('admin'), opportunityId, validate, asyncHandler(opportunityController.deleteOpportunity));

module.exports = router;