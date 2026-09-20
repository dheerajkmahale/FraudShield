const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an array of express-validator checks; if any failed, short-circuits
// with a 422 and a list of field-level messages instead of reaching the controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    throw ApiError.unprocessable('Validation failed', details);
  }
  next();
}

module.exports = validate;
