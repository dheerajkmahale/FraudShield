const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Notification = require('../models/Notification');

// @route GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const { isRead, page = 1, limit = 20 } = req.query;
  const filter = { user: req.user._id };
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  sendSuccess(res, {
    message: 'Notifications retrieved',
    data: notifications,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), unreadCount },
  });
});

// @route PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw ApiError.notFound('Notification not found');

  notification.isRead = true;
  await notification.save();

  sendSuccess(res, { message: 'Notification marked as read', data: notification });
});

// @route PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  sendSuccess(res, { message: 'All notifications marked as read' });
});

module.exports = { listNotifications, markAsRead, markAllAsRead };
