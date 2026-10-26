const express = require('express');
const requestController = require('../controllers/requestController');
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createRequestRules, requestId, reviewRequestRules, updateRequestRules } = require('../validators/requestValidators');

const router = express.Router();
router.use(authenticate);
router.get('/mine', asyncHandler(requestController.listMyRequests));
router.get('/', asyncHandler(requestController.listRequests));
router.post('/', createRequestRules, validate, asyncHandler(requestController.createRequest));
router.patch('/:id/review', authorize('admin'), reviewRequestRules, validate, asyncHandler(requestController.reviewRequest));
router.patch('/:id', updateRequestRules, validate, asyncHandler(requestController.updateRequest));
router.delete('/:id', requestId, validate, asyncHandler(requestController.deleteRequest));

module.exports = router;