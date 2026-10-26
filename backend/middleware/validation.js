const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the submitted input.',
        details: result.array().map(({ path, msg }) => ({ field: path, message: msg }))
      }
    });
  }
  return next();
}

module.exports = validate;