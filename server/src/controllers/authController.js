const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const User = require('../models/User');
const { recordAudit } = require('../middleware/auditLogger');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  // Role is optional and defaults to 'analyst'; only allow explicit elevation
  // to admin/investigator here for demo convenience. In a real production
  // system self-registration would never grant elevated roles.
  const user = await User.create({ name, email, password, role: role || 'analyst' });

  const token = signToken(user);
  await recordAudit({ user: user._id, action: 'REGISTER', resource: 'User', resourceId: user._id, ipAddress: req.ip });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { user: user.toSafeObject(), token },
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user);
  await recordAudit({ user: user._id, action: 'LOGIN', resource: 'User', resourceId: user._id, ipAddress: req.ip });

  sendSuccess(res, { message: 'Login successful', data: { user: user.toSafeObject(), token } });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Current user retrieved', data: { user: req.user.toSafeObject() } });
});

// @route POST /api/auth/logout
// Stateless JWT: the server has nothing to invalidate. This endpoint exists
// for API symmetry / audit logging; the client is responsible for discarding
// the token.
const logout = asyncHandler(async (req, res) => {
  await recordAudit({ user: req.user._id, action: 'LOGOUT', resource: 'User', resourceId: req.user._id, ipAddress: req.ip });
  sendSuccess(res, { message: 'Logged out successfully' });
});

module.exports = { register, login, getMe, logout };
