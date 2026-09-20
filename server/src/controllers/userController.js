const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const User = require('../models/User');
const { recordAudit } = require('../middleware/auditLogger');

// @route GET /api/users (admin only)
const listUsers = asyncHandler(async (req, res) => {
  const { search = '', role, isActive, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: 'Users retrieved',
    data: users,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @route GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { message: 'User retrieved', data: user });
});

// @route PUT /api/users/profile (self update)
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  await user.save();
  sendSuccess(res, { message: 'Profile updated', data: user.toSafeObject() });
});

// @route PUT /api/users/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  await recordAudit({ user: user._id, action: 'PASSWORD_CHANGE', resource: 'User', resourceId: user._id });

  sendSuccess(res, { message: 'Password changed successfully' });
});

// @route PUT /api/users/:id/role (admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await recordAudit({
    user: req.user._id,
    action: 'USER_ROLE_CHANGE',
    resource: 'User',
    resourceId: user._id,
    metadata: { previousRole, newRole: role },
  });

  sendSuccess(res, { message: 'User role updated', data: user.toSafeObject() });
});

// @route PUT /api/users/:id/status (admin only) - activate/deactivate
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (String(user._id) === String(req.user._id) && isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  user.isActive = isActive;
  await user.save();

  await recordAudit({
    user: req.user._id,
    action: isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
    resource: 'User',
    resourceId: user._id,
  });

  sendSuccess(res, { message: `User ${isActive ? 'activated' : 'deactivated'}`, data: user.toSafeObject() });
});

module.exports = { listUsers, getUser, updateProfile, changePassword, updateUserRole, updateUserStatus };
