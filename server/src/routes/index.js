const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');
const investigationRoutes = require('./investigationRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'FraudShield API is running' }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/investigations', investigationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
