const mongoose = require('mongoose');
const {
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
  FRAUD_STATUS,
  FRAUD_STATUS_VALUES,
  RISK_LEVELS,
} = require('../config/constants');

const transactionSchema = new mongoose.Schema(
  {
    transactionRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `TXN-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    },
    senderAccount: { type: String, required: true, trim: true, index: true },
    receiverAccount: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    currency: { type: String, required: true, default: 'INR', uppercase: true, trim: true, maxlength: 3 },
    transactionType: { type: String, enum: TRANSACTION_TYPES, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: TRANSACTION_STATUS, default: 'completed' },

    location: { type: String, trim: true, default: 'Unknown' },
    ipAddress: { type: String, trim: true, default: '' },
    deviceInfo: { type: String, trim: true, default: '' },

    occurredAt: { type: Date, required: true, default: Date.now, index: true },

    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.LOW,
      index: true,
    },
    fraudStatus: {
      type: String,
      enum: FRAUD_STATUS_VALUES,
      default: FRAUD_STATUS.CLEAN,
      index: true,
    },
    suspicionReasons: [{ type: String }],
    detectedAt: { type: Date, default: null },

    investigation: { type: mongoose.Schema.Types.ObjectId, ref: 'Investigation', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Compound indexes to support the common query/filter/sort patterns used by
// the transaction list, statistics and network endpoints.
transactionSchema.index({ occurredAt: -1 });
transactionSchema.index({ riskLevel: 1, fraudStatus: 1 });
transactionSchema.index({ senderAccount: 1, occurredAt: -1 });
transactionSchema.index({ amount: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
