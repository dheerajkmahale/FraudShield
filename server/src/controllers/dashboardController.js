const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const Transaction = require('../models/Transaction');
const Investigation = require('../models/Investigation');
const User = require('../models/User');
const { FRAUD_STATUS, RISK_LEVELS } = require('../config/constants');

// @route GET /api/dashboard/statistics
// Aggregates data the frontend dashboard needs in a single round trip.
const getDashboardStatistics = asyncHandler(async (req, res) => {
  const [txAgg, activeInvestigations, userCount] = await Promise.all([
    Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalValue: { $sum: '$amount' },
          avgRiskScore: { $avg: '$riskScore' },
          suspiciousCount: { $sum: { $cond: [{ $ne: ['$fraudStatus', FRAUD_STATUS.CLEAN] }, 1, 0] } },
          criticalCount: { $sum: { $cond: [{ $eq: ['$riskLevel', RISK_LEVELS.CRITICAL] }, 1, 0] } },
        },
      },
    ]),
    Investigation.countDocuments({ status: { $in: ['open', 'under_investigation', 'escalated'] } }),
    User.countDocuments({}),
  ]);

  const summary = txAgg[0] || {
    totalTransactions: 0,
    totalValue: 0,
    avgRiskScore: 0,
    suspiciousCount: 0,
    criticalCount: 0,
  };

  const fraudRate = summary.totalTransactions
    ? Number(((summary.suspiciousCount / summary.totalTransactions) * 100).toFixed(2))
    : 0;

  sendSuccess(res, {
    message: 'Dashboard statistics retrieved',
    data: {
      totalTransactions: summary.totalTransactions,
      totalTransactionValue: Number((summary.totalValue || 0).toFixed(2)),
      suspiciousTransactions: summary.suspiciousCount,
      criticalRiskTransactions: summary.criticalCount,
      activeInvestigations,
      totalUsers: userCount,
      fraudRate,
      avgRiskScore: Number((summary.avgRiskScore || 0).toFixed(2)),
    },
  });
});

module.exports = { getDashboardStatistics };
