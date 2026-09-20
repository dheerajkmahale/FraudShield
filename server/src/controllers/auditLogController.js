const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog');

// @route GET /api/audit-logs (admin only)
const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, resource, userId, page = 1, limit = 30 } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (userId) filter.user = userId;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: 'Audit logs retrieved',
    data: logs,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

module.exports = { listAuditLogs };
