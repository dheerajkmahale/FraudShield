const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler. Normalizes Mongoose errors (validation, cast,
 * duplicate key) into consistent 4xx responses, and hides internal details
 * for unexpected 500s so stack traces / secrets never leak to clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    details = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value';
  }

  // JWT errors (in case they escape the auth middleware)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
    // Never leak internal error details in production
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
