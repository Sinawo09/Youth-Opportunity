const express = require('express');
const { body, param } = require('express-validator');
const savedOpportunityController = require('../controllers/savedOpportunityController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();
router.use(authenticate);
router.get('/', asyncHandler(savedOpportunityController.listSavedOpportunities));
router.post('/', body('opportunity_id').isUUID().withMessage('A valid opportunity UUID is required.'), validate, asyncHandler(savedOpportunityController.saveOpportunity));
router.delete('/:id', param('id').isUUID().withMessage('A valid opportunity UUID is required.'), validate, asyncHandler(savedOpportunityController.unsaveOpportunity));

module.exports = router;