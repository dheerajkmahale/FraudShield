const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    relatedInvestigation: { type: mongoose.Schema.Types.ObjectId, ref: 'Investigation', default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
