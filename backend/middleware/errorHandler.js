function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'The requested API route was not found.' } });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_JSON', message: 'The request body must contain valid JSON.' } });
  }
  if (!error.status || error.status >= 500) console.error(error);
  return res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.status ? error.message : 'An unexpected server error occurred.'
    }
  });
}

module.exports = { notFound, errorHandler };