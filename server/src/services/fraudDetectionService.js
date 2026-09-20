/**
 * Rule-based fraud detection engine.
 *
 * IMPORTANT: This is NOT machine learning. It is a deterministic set of
 * configurable rules that inspect a transaction (and its account's recent
 * history) and accumulate a risk score from 0-100. The engine is written as
 * an isolated module with a stable input/output contract
 * (transaction + context -> { score, reasons }) specifically so that it can
 * later be swapped for, or combined with, an ML model without touching the
 * rest of the codebase (see README "Future Improvements").
 */

const Transaction = require('../models/Transaction');
const { riskLevelFromScore } = require('../config/constants');

// Configurable thresholds - in a real system these would live in a DB
// collection editable by admins. Kept as constants here for simplicity.
const RULES_CONFIG = {
  HIGH_AMOUNT_THRESHOLD: 200000, // absolute currency units
  VERY_HIGH_AMOUNT_THRESHOLD: 500000,
  VELOCITY_WINDOW_MINUTES: 10,
  VELOCITY_TX_COUNT: 3,
  RAPID_MOVEMENT_WINDOW_MINUTES: 5,
  REPEATED_TRANSFER_WINDOW_HOURS: 24,
  REPEATED_TRANSFER_COUNT: 5,
  UNUSUAL_LOCATION_LOOKBACK: 20, // number of past transactions to compare location against
};

/**
 * Evaluate a single transaction (already saved or about to be saved) against
 * the rule set. `context` allows passing an account's recent transactions so
 * we don't have to re-query inside every rule.
 */
async function evaluateTransaction(transaction) {
  const reasons = [];
  let score = 0;

  const { senderAccount, amount, location, occurredAt } = transaction;
  const windowStart = (minutes) => new Date(new Date(occurredAt).getTime() - minutes * 60 * 1000);

  // Rule 1: Unusually high transaction amount
  if (amount >= RULES_CONFIG.VERY_HIGH_AMOUNT_THRESHOLD) {
    score += 35;
    reasons.push(`Transaction amount (${amount}) exceeds very-high threshold of ${RULES_CONFIG.VERY_HIGH_AMOUNT_THRESHOLD}`);
  } else if (amount >= RULES_CONFIG.HIGH_AMOUNT_THRESHOLD) {
    score += 20;
    reasons.push(`Transaction amount (${amount}) exceeds high threshold of ${RULES_CONFIG.HIGH_AMOUNT_THRESHOLD}`);
  }

  // Fetch recent transactions for this sender account once, reused by several rules below.
  const recentBySender = await Transaction.find({
    senderAccount,
    occurredAt: { $gte: windowStart(24 * 60), $lt: occurredAt },
  })
    .sort({ occurredAt: -1 })
    .limit(50)
    .lean();

  // Rule 2: Multiple transactions within a short period (velocity check)
  const withinVelocityWindow = recentBySender.filter(
    (t) => new Date(t.occurredAt) >= windowStart(RULES_CONFIG.VELOCITY_WINDOW_MINUTES)
  );
  if (withinVelocityWindow.length + 1 >= RULES_CONFIG.VELOCITY_TX_COUNT) {
    score += 20;
    reasons.push(
      `${withinVelocityWindow.length + 1} transactions from this account within ${RULES_CONFIG.VELOCITY_WINDOW_MINUTES} minutes`
    );
  }

  // Rule 3: Rapid movement between accounts (send then immediately receive elsewhere, or many distinct receivers fast)
  const rapidWindow = recentBySender.filter(
    (t) => new Date(t.occurredAt) >= windowStart(RULES_CONFIG.RAPID_MOVEMENT_WINDOW_MINUTES)
  );
  const distinctReceivers = new Set(rapidWindow.map((t) => t.receiverAccount));
  distinctReceivers.add(transaction.receiverAccount);
  if (distinctReceivers.size >= 3) {
    score += 15;
    reasons.push(
      `Funds moved to ${distinctReceivers.size} distinct accounts within ${RULES_CONFIG.RAPID_MOVEMENT_WINDOW_MINUTES} minutes`
    );
  }

  // Rule 4: Repeated transfers to the same receiver (structuring / layering pattern)
  const repeatedWindow = recentBySender.filter(
    (t) =>
      new Date(t.occurredAt) >= windowStart(RULES_CONFIG.REPEATED_TRANSFER_WINDOW_HOURS * 60) &&
      t.receiverAccount === transaction.receiverAccount
  );
  if (repeatedWindow.length + 1 >= RULES_CONFIG.REPEATED_TRANSFER_COUNT) {
    score += 15;
    reasons.push(
      `${repeatedWindow.length + 1} transfers to the same receiver within ${RULES_CONFIG.REPEATED_TRANSFER_WINDOW_HOURS} hours`
    );
  }

  // Rule 5: Unusual location compared to account's recent history
  const lookback = recentBySender.slice(0, RULES_CONFIG.UNUSUAL_LOCATION_LOOKBACK);
  if (lookback.length >= 3 && location) {
    const knownLocations = new Set(lookback.map((t) => t.location).filter(Boolean));
    if (knownLocations.size > 0 && !knownLocations.has(location)) {
      score += 15;
      reasons.push(`Transaction location "${location}" has not been seen before for this account`);
    }
  }

  // Rule 6: High-risk account - sender or receiver has a history of confirmed fraud
  const priorFraudCount = await Transaction.countDocuments({
    $or: [{ senderAccount }, { receiverAccount: transaction.receiverAccount }],
    fraudStatus: 'confirmed_fraud',
  });
  if (priorFraudCount > 0) {
    score += 25;
    reasons.push(`Sender or receiver account linked to ${priorFraudCount} prior confirmed-fraud transaction(s)`);
  }

  // Rule 7: Abnormal pattern - round-number large transfer (common in structured fraud)
  if (amount >= 50000 && amount % 10000 === 0) {
    score += 5;
    reasons.push('Round-number high-value amount, a common structuring pattern');
  }

  score = Math.min(100, Math.round(score));

  return {
    riskScore: score,
    riskLevel: riskLevelFromScore(score),
    suspicionReasons: reasons,
    isSuspicious: score >= 30,
  };
}

module.exports = { evaluateTransaction, RULES_CONFIG };
