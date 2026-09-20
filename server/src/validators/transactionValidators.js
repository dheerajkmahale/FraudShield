const { body, param, query } = require('express-validator');
const {
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
} = require('../config/constants');

const createTransactionValidator = [
  body('senderAccount').trim().notEmpty().withMessage('Sender account is required'),
  body('receiverAccount').trim().notEmpty().withMessage('Receiver account is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('transactionType').isIn(TRANSACTION_TYPES).withMessage(`transactionType must be one of: ${TRANSACTION_TYPES.join(', ')}`),
  body('paymentMethod').isIn(PAYMENT_METHODS).withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`),
  body('status').optional().isIn(TRANSACTION_STATUS),
  body('location').optional().isString().trim(),
  body('ipAddress').optional().isString().trim(),
  body('deviceInfo').optional().isString().trim(),
  body('occurredAt').optional().isISO8601().withMessage('occurredAt must be a valid date'),
];

const updateTransactionValidator = [
  param('id').isMongoId().withMessage('Invalid transaction id'),
  body('amount').optional().isFloat({ gt: 0 }),
  body('transactionType').optional().isIn(TRANSACTION_TYPES),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS),
  body('status').optional().isIn(TRANSACTION_STATUS),
  body('fraudStatus').optional().isIn(['clean', 'flagged', 'confirmed_fraud', 'false_positive']),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('status').optional().isIn(TRANSACTION_STATUS),
  query('fraudStatus').optional().isIn(['clean', 'flagged', 'confirmed_fraud', 'false_positive']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

module.exports = {
  createTransactionValidator,
  updateTransactionValidator,
  idParamValidator,
  listQueryValidator,
};
