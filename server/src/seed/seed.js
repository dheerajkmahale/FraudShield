/**
 * Seed script - wipes and repopulates the database with realistic fictional
 * demo data: users (one per role), transactions (including deliberately
 * suspicious ones so the fraud engine has something to flag), investigations,
 * notifications and audit logs.
 *
 * Run with: npm run seed --prefix server
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const logger = require('../utils/logger');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investigation = require('../models/Investigation');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const { evaluateTransaction } = require('../services/fraudDetectionService');
const { FRAUD_STATUS, RISK_LEVELS } = require('../config/constants');

const LOCATIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
const TX_TYPES = ['transfer', 'withdrawal', 'deposit', 'payment', 'refund'];
const PAYMENT_METHODS = ['card', 'bank_transfer', 'wallet', 'upi', 'crypto', 'cash'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randomAccount(prefix, n) {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000 - Math.random() * 60 * 60 * 1000);
}

async function seed() {
  await connectDB();
  logger.info('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Investigation.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  logger.info('Creating demo users...');
  const admin = await User.create({
    name: 'Ava Admin',
    email: 'admin@fraudshield.dev',
    password: 'Admin@1234',
    role: 'admin',
  });
  const investigator = await User.create({
    name: 'Ian Investigator',
    email: 'investigator@fraudshield.dev',
    password: 'Investigator@1234',
    role: 'investigator',
  });
  const analyst = await User.create({
    name: 'Amara Analyst',
    email: 'analyst@fraudshield.dev',
    password: 'Analyst@1234',
    role: 'analyst',
  });
  const extraInvestigator = await User.create({
    name: 'Noah Reyes',
    email: 'noah.reyes@fraudshield.dev',
    password: 'Investigator@1234',
    role: 'investigator',
  });

  logger.info('Generating accounts...');
  const accounts = Array.from({ length: 25 }, (_, i) => randomAccount('ACC', i + 1));
  const highRiskAccounts = accounts.slice(0, 3); // reused to create fraud patterns

  logger.info('Generating normal transactions...');
  const createdTransactions = [];

  // 1. Baseline "clean" transactions spread over the last 60 days.
  for (let i = 0; i < 220; i += 1) {
    const sender = randomItem(accounts);
    let receiver = randomItem(accounts);
    while (receiver === sender) receiver = randomItem(accounts);

    const tx = new Transaction({
      senderAccount: sender,
      receiverAccount: receiver,
      amount: randomAmount(200, 45000),
      currency: 'INR',
      transactionType: randomItem(TX_TYPES),
      paymentMethod: randomItem(PAYMENT_METHODS),
      status: 'completed',
      location: randomItem(LOCATIONS),
      ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      deviceInfo: randomItem(['Chrome/Windows', 'Safari/iOS', 'Chrome/Android', 'Firefox/Linux']),
      occurredAt: daysAgo(Math.floor(Math.random() * 60)),
      createdBy: analyst._id,
    });

    const evalResult = await evaluateTransaction(tx);
    tx.riskScore = evalResult.riskScore;
    tx.riskLevel = evalResult.riskLevel;
    tx.suspicionReasons = evalResult.suspicionReasons;
    if (evalResult.isSuspicious) {
      tx.fraudStatus = FRAUD_STATUS.FLAGGED;
      tx.detectedAt = new Date();
    }
    await tx.save();
    createdTransactions.push(tx);
  }

  // 2. Deliberately suspicious burst: high-risk accounts moving large sums
  //    rapidly through several receivers, to exercise every fraud rule.
  logger.info('Generating suspicious transaction patterns...');
  for (const acc of highRiskAccounts) {
    const baseTime = daysAgo(Math.floor(Math.random() * 10));
    for (let j = 0; j < 6; j += 1) {
      const receiver = randomItem(accounts.filter((a) => a !== acc));
      const tx = new Transaction({
        senderAccount: acc,
        receiverAccount: receiver,
        amount: randomAmount(210000, 600000),
        currency: 'INR',
        transactionType: 'transfer',
        paymentMethod: randomItem(['bank_transfer', 'crypto', 'wallet']),
        status: 'completed',
        location: randomItem(LOCATIONS),
        ipAddress: `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        deviceInfo: 'Unknown/Emulator',
        occurredAt: new Date(baseTime.getTime() + j * 2 * 60 * 1000),
        createdBy: analyst._id,
      });

      const evalResult = await evaluateTransaction(tx);
      tx.riskScore = evalResult.riskScore;
      tx.riskLevel = evalResult.riskLevel;
      tx.suspicionReasons = evalResult.suspicionReasons;
      if (evalResult.isSuspicious) {
        tx.fraudStatus = FRAUD_STATUS.FLAGGED;
        tx.detectedAt = new Date();
      }
      // Mark a couple as confirmed fraud so the "linked high-risk account" rule has data to key off.
      if (j === 5 && tx.riskLevel === RISK_LEVELS.CRITICAL) {
        tx.fraudStatus = FRAUD_STATUS.CONFIRMED_FRAUD;
      }
      await tx.save();
      createdTransactions.push(tx);
    }
  }

  const suspiciousTx = createdTransactions.filter((t) => t.fraudStatus !== FRAUD_STATUS.CLEAN);
  logger.info(`Created ${createdTransactions.length} transactions (${suspiciousTx.length} flagged as suspicious).`);

  logger.info('Creating investigations...');
  const inv1 = await Investigation.create({
    title: `Suspicious activity on account ${highRiskAccounts[0]}`,
    description: 'Multiple high-value transfers across several receiver accounts within minutes.',
    assignedTo: investigator._id,
    createdBy: admin._id,
    relatedTransactions: suspiciousTx.slice(0, 4).map((t) => t._id),
    priority: 'high',
    status: 'under_investigation',
    notes: [{ author: investigator._id, text: 'Initial review shows a structuring pattern. Escalating to compliance.' }],
  });

  const inv2 = await Investigation.create({
    title: `Review flagged transfers for ${highRiskAccounts[1]}`,
    description: 'Analyst flagged repeated round-number transfers to the same receiver.',
    assignedTo: extraInvestigator._id,
    createdBy: analyst._id,
    relatedTransactions: suspiciousTx.slice(4, 7).map((t) => t._id),
    priority: 'medium',
    status: 'open',
  });

  await Transaction.updateMany(
    { _id: { $in: inv1.relatedTransactions } },
    { $set: { investigation: inv1._id } }
  );
  await Transaction.updateMany(
    { _id: { $in: inv2.relatedTransactions } },
    { $set: { investigation: inv2._id } }
  );

  logger.info('Creating notifications...');
  const criticalTx = createdTransactions.find((t) => t.riskLevel === RISK_LEVELS.CRITICAL);
  await Notification.create([
    {
      user: admin._id,
      type: 'critical_transaction',
      message: criticalTx
        ? `Critical-risk transaction ${criticalTx.transactionRef} requires review`
        : 'A critical-risk transaction requires review',
      relatedTransaction: criticalTx ? criticalTx._id : null,
    },
    {
      user: investigator._id,
      type: 'investigation_assigned',
      message: `You have been assigned investigation ${inv1.caseId}`,
      relatedInvestigation: inv1._id,
    },
    {
      user: extraInvestigator._id,
      type: 'investigation_assigned',
      message: `You have been assigned investigation ${inv2.caseId}`,
      relatedInvestigation: inv2._id,
    },
    {
      user: analyst._id,
      type: 'suspicious_transaction',
      message: 'A transaction you created was flagged as suspicious',
      isRead: true,
    },
  ]);

  logger.info('Creating audit logs...');
  await AuditLog.create([
    { user: admin._id, action: 'LOGIN', resource: 'User', resourceId: admin._id },
    { user: investigator._id, action: 'LOGIN', resource: 'User', resourceId: investigator._id },
    { user: analyst._id, action: 'TRANSACTION_CREATE', resource: 'Transaction', resourceId: createdTransactions[0]._id },
    { user: admin._id, action: 'USER_ROLE_CHANGE', resource: 'User', resourceId: analyst._id, metadata: { previousRole: 'analyst', newRole: 'analyst' } },
    { user: investigator._id, action: 'INVESTIGATION_CREATE', resource: 'Investigation', resourceId: inv1._id },
  ]);

  logger.info('Seed complete!');
  logger.info('--------------------------------------------------');
  logger.info('Demo credentials (development only):');
  logger.info('  Admin:        admin@fraudshield.dev / Admin@1234');
  logger.info('  Investigator: investigator@fraudshield.dev / Investigator@1234');
  logger.info('  Analyst:      analyst@fraudshield.dev / Analyst@1234');
  logger.info('--------------------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
