function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An internal server error occurred. Please try again later.';

  res.status(status).json({
    success: false,
    message: message,
    // Never expose stack trace in API responses
    error: process.env.NODE_ENV === 'development' ? { details: err.details || err.name } : undefined
  });
}

module.exports = { errorHandler };
