const Notification = require('../models/Notification');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/** Create a single notification for one user. */
async function notifyUser(userId, { type, message, relatedTransaction = null, relatedInvestigation = null }) {
  try {
    return await Notification.create({
      user: userId,
      type,
      message,
      relatedTransaction,
      relatedInvestigation,
    });
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
    return null;
  }
}

/** Notify every admin + investigator (the roles who act on critical transactions). */
async function notifyInvestigatorsAndAdmins({ type, message, relatedTransaction = null }) {
  const recipients = await User.find({
    role: { $in: [ROLES.ADMIN, ROLES.INVESTIGATOR] },
    isActive: true,
  }).select('_id');

  await Promise.all(
    recipients.map((u) => notifyUser(u._id, { type, message, relatedTransaction }))
  );
}

module.exports = { notifyUser, notifyInvestigatorsAndAdmins };
