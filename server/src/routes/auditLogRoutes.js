const express = require('express');
const { listAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));
router.get('/', listAuditLogs);

module.exports = router;
