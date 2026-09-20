const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Writes an audit log entry. Fire-and-forget with error logging so an audit
 * failure never breaks the primary request flow.
 */
async function recordAudit({ user, action, resource, resourceId = null, metadata = {}, ipAddress = '' }) {
  try {
    await AuditLog.create({ user, action, resource, resourceId, metadata, ipAddress });
  } catch (err) {
    logger.error(`Failed to write audit log for action=${action}: ${err.message}`);
  }
}

module.exports = { recordAudit };
