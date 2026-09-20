const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT on the Authorization header, loads the corresponding
 * user (excluding password), and attaches it to req.user. Rejects requests
 * from deactivated accounts.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  req.user = user;
  next();
});

/**
 * Role-based authorization guard. Usage: authorize('admin', 'investigator')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authorized');
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

module.exports = { protect, authorize };
