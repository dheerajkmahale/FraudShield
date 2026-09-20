// Centralized enums / constants used across models, validators and business logic.
// Keeping these in one place avoids "magic strings" scattered through the codebase.

const ROLES = Object.freeze({
  ADMIN: 'admin',
  INVESTIGATOR: 'investigator',
  ANALYST: 'analyst',
});

const ROLE_VALUES = Object.values(ROLES);

const TRANSACTION_TYPES = Object.freeze([
  'transfer',
  'withdrawal',
  'deposit',
  'payment',
  'refund',
]);

const PAYMENT_METHODS = Object.freeze([
  'card',
  'bank_transfer',
  'wallet',
  'upi',
  'crypto',
  'cash',
]);

const TRANSACTION_STATUS = Object.freeze([
  'pending',
  'completed',
  'failed',
  'reversed',
]);

const FRAUD_STATUS = Object.freeze({
  CLEAN: 'clean',
  FLAGGED: 'flagged',
  CONFIRMED_FRAUD: 'confirmed_fraud',
  FALSE_POSITIVE: 'false_positive',
});

const FRAUD_STATUS_VALUES = Object.values(FRAUD_STATUS);

const RISK_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

function riskLevelFromScore(score) {
  if (score >= 80) return RISK_LEVELS.CRITICAL;
  if (score >= 60) return RISK_LEVELS.HIGH;
  if (score >= 30) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

const INVESTIGATION_STATUS = Object.freeze([
  'open',
  'under_investigation',
  'escalated',
  'resolved',
  'closed',
]);

const INVESTIGATION_PRIORITY = Object.freeze(['low', 'medium', 'high', 'urgent']);

const NOTIFICATION_TYPES = Object.freeze([
  'critical_transaction',
  'investigation_assigned',
  'investigation_updated',
  'suspicious_transaction',
  'system',
]);

module.exports = {
  ROLES,
  ROLE_VALUES,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
  FRAUD_STATUS,
  FRAUD_STATUS_VALUES,
  RISK_LEVELS,
  riskLevelFromScore,
  INVESTIGATION_STATUS,
  INVESTIGATION_PRIORITY,
  NOTIFICATION_TYPES,
};
