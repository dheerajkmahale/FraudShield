const mongoose = require('mongoose');
const { INVESTIGATION_STATUS, INVESTIGATION_PRIORITY } = require('../config/constants');

const noteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const investigationSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    priority: { type: String, enum: INVESTIGATION_PRIORITY, default: 'medium' },
    status: { type: String, enum: INVESTIGATION_STATUS, default: 'open', index: true },
    notes: [noteSchema],
  },
  { timestamps: true }
);

investigationSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Investigation', investigationSchema);
