const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Transaction = require('../models/Transaction');
const { evaluateTransaction } = require('../services/fraudDetectionService');
const { notifyInvestigatorsAndAdmins } = require('../services/notificationService');
const { recordAudit } = require('../middleware/auditLogger');
const { FRAUD_STATUS, RISK_LEVELS } = require('../config/constants');

/** Builds a Mongo filter object from validated query params. Shared by list + statistics. */
function buildFilter(query) {
  const {
    search,
    status,
    riskLevel,
    fraudStatus,
    transactionType,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    location,
  } = query;

  const filter = {};
  if (status) filter.status = status;
  if (riskLevel) filter.riskLevel = riskLevel;
  if (fraudStatus) filter.fraudStatus = fraudStatus;
  if (transactionType) filter.transactionType = transactionType;
  if (location) filter.location = { $regex: location, $options: 'i' };

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = parseFloat(minAmount);
    if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
  }

  if (startDate || endDate) {
    filter.occurredAt = {};
    if (startDate) filter.occurredAt.$gte = new Date(startDate);
    if (endDate) filter.occurredAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { transactionRef: { $regex: search, $options: 'i' } },
      { senderAccount: { $regex: search, $options: 'i' } },
      { receiverAccount: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
}

// @route GET /api/transactions
const listTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy = 'occurredAt', sortOrder = 'desc' } = req.query;
  const filter = buildFilter(req.query);

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('investigation', 'caseId status'),
    Transaction.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: 'Transactions retrieved',
    data: transactions,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @route GET /api/transactions/suspicious
const listSuspicious = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const filter = { fraudStatus: { $ne: FRAUD_STATUS.CLEAN } };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ riskScore: -1, occurredAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Transaction.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: 'Suspicious transactions retrieved',
    data: transactions,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @route GET /api/transactions/:id
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('investigation');
  if (!transaction) throw ApiError.notFound('Transaction not found');

  // "Related transactions": other transactions sharing sender or receiver account.
  const related = await Transaction.find({
    _id: { $ne: transaction._id },
    $or: [{ senderAccount: transaction.senderAccount }, { receiverAccount: transaction.receiverAccount }],
  })
    .sort({ occurredAt: -1 })
    .limit(10);

  sendSuccess(res, { message: 'Transaction retrieved', data: { transaction, related } });
});

// @route POST /api/transactions
const createTransaction = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user._id };
  const transaction = new Transaction(payload);

  // Run the fraud detection engine before first save so risk fields are populated atomically.
  const result = await evaluateTransaction(transaction);
  transaction.riskScore = result.riskScore;
  transaction.riskLevel = result.riskLevel;
  transaction.suspicionReasons = result.suspicionReasons;
  if (result.isSuspicious) {
    transaction.fraudStatus = FRAUD_STATUS.FLAGGED;
    transaction.detectedAt = new Date();
  }

  await transaction.save();

  await recordAudit({
    user: req.user._id,
    action: 'TRANSACTION_CREATE',
    resource: 'Transaction',
    resourceId: transaction._id,
    metadata: { amount: transaction.amount, riskScore: transaction.riskScore },
    ipAddress: req.ip,
  });

  if (transaction.riskLevel === RISK_LEVELS.CRITICAL) {
    await notifyInvestigatorsAndAdmins({
      type: 'critical_transaction',
      message: `Critical-risk transaction ${transaction.transactionRef} detected (score ${transaction.riskScore})`,
      relatedTransaction: transaction._id,
    });
  } else if (result.isSuspicious) {
    await notifyInvestigatorsAndAdmins({
      type: 'suspicious_transaction',
      message: `Suspicious transaction ${transaction.transactionRef} flagged (score ${transaction.riskScore})`,
      relatedTransaction: transaction._id,
    });
  }

  sendSuccess(res, { statusCode: 201, message: 'Transaction created successfully', data: transaction });
});

// @route PUT /api/transactions/:id
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) throw ApiError.notFound('Transaction not found');

  const editableFields = [
    'amount',
    'currency',
    'transactionType',
    'paymentMethod',
    'status',
    'location',
    'fraudStatus',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) transaction[field] = req.body[field];
  });

  await transaction.save();

  await recordAudit({
    user: req.user._id,
    action: 'TRANSACTION_UPDATE',
    resource: 'Transaction',
    resourceId: transaction._id,
    metadata: { updatedFields: Object.keys(req.body) },
    ipAddress: req.ip,
  });

  sendSuccess(res, { message: 'Transaction updated successfully', data: transaction });
});

// @route DELETE /api/transactions/:id (admin only)
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) throw ApiError.notFound('Transaction not found');

  await transaction.deleteOne();

  await recordAudit({
    user: req.user._id,
    action: 'TRANSACTION_DELETE',
    resource: 'Transaction',
    resourceId: transaction._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { message: 'Transaction deleted successfully' });
});

// @route GET /api/transactions/statistics
const getStatistics = asyncHandler(async (req, res) => {
  const [
    totals,
    riskDistribution,
    typeDistribution,
    timeSeries,
    topSuspiciousAccounts,
  ] = await Promise.all([
    Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalValue: { $sum: '$amount' },
          avgRiskScore: { $avg: '$riskScore' },
          suspiciousCount: {
            $sum: { $cond: [{ $ne: ['$fraudStatus', FRAUD_STATUS.CLEAN] }, 1, 0] },
          },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$riskLevel', RISK_LEVELS.CRITICAL] }, 1, 0] },
          },
        },
      },
    ]),
    Transaction.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
    Transaction.aggregate([{ $group: { _id: '$transactionType', count: { $sum: 1 } } }]),
    Transaction.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } },
          count: { $sum: 1 },
          suspiciousCount: {
            $sum: { $cond: [{ $ne: ['$fraudStatus', FRAUD_STATUS.CLEAN] }, 1, 0] },
          },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
    ]),
    Transaction.aggregate([
      { $match: { fraudStatus: { $ne: FRAUD_STATUS.CLEAN } } },
      {
        $group: {
          _id: '$senderAccount',
          suspiciousCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          maxRiskScore: { $max: '$riskScore' },
        },
      },
      { $sort: { suspiciousCount: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const summary = totals[0] || {
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
    message: 'Statistics retrieved',
    data: {
      summary: { ...summary, fraudRate, avgRiskScore: Number((summary.avgRiskScore || 0).toFixed(2)) },
      riskDistribution,
      typeDistribution,
      timeSeries,
      topSuspiciousAccounts,
    },
  });
});

// @route GET /api/transactions/network - data for the account relationship graph
const getNetwork = asyncHandler(async (req, res) => {
  const { limit = 300 } = req.query;

  const transactions = await Transaction.find({})
    .sort({ occurredAt: -1 })
    .limit(Math.min(1000, parseInt(limit, 10)))
    .select('senderAccount receiverAccount amount fraudStatus riskLevel transactionRef occurredAt');

  const nodesMap = new Map();
  const edges = [];

  transactions.forEach((t) => {
    [t.senderAccount, t.receiverAccount].forEach((acc) => {
      if (!nodesMap.has(acc)) nodesMap.set(acc, { id: acc, transactionCount: 0, suspiciousCount: 0 });
    });
    const senderNode = nodesMap.get(t.senderAccount);
    const receiverNode = nodesMap.get(t.receiverAccount);
    senderNode.transactionCount += 1;
    receiverNode.transactionCount += 1;
    if (t.fraudStatus !== FRAUD_STATUS.CLEAN) {
      senderNode.suspiciousCount += 1;
      receiverNode.suspiciousCount += 1;
    }

    edges.push({
      source: t.senderAccount,
      target: t.receiverAccount,
      amount: t.amount,
      transactionRef: t.transactionRef,
      suspicious: t.fraudStatus !== FRAUD_STATUS.CLEAN,
      riskLevel: t.riskLevel,
    });
  });

  sendSuccess(res, {
    message: 'Network data retrieved',
    data: { nodes: Array.from(nodesMap.values()), edges },
  });
});

module.exports = {
  listTransactions,
  listSuspicious,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStatistics,
  getNetwork,
};
