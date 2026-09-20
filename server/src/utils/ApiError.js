/**
 * Custom error class carrying an HTTP status code, so the central error
 * handler can respond with the right status/message instead of always 500.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Not authorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Unprocessable entity', details) {
    return new ApiError(422, message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
