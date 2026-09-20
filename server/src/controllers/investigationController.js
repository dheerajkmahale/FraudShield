const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Investigation = require('../models/Investigation');
const Transaction = require('../models/Transaction');
const { notifyUser } = require('../services/notificationService');
const { recordAudit } = require('../middleware/auditLogger');

// @route GET /api/investigations
const listInvestigations = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [investigations, total] = await Promise.all([
    Investigation.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('relatedTransactions', 'transactionRef amount riskLevel')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Investigation.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: 'Investigations retrieved',
    data: investigations,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @route GET /api/investigations/:id
const getInvestigation = asyncHandler(async (req, res) => {
  const investigation = await Investigation.findById(req.params.id)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('relatedTransactions')
    .populate('notes.author', 'name role');

  if (!investigation) throw ApiError.notFound('Investigation not found');
  sendSuccess(res, { message: 'Investigation retrieved', data: investigation });
});

// @route POST /api/investigations
const createInvestigation = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, relatedTransactions = [], priority } = req.body;

  const investigation = await Investigation.create({
    title,
    description,
    assignedTo: assignedTo || req.user._id,
    createdBy: req.user._id,
    relatedTransactions,
    priority,
  });

  if (relatedTransactions.length) {
    await Transaction.updateMany(
      { _id: { $in: relatedTransactions } },
      { $set: { investigation: investigation._id } }
    );
  }

  if (investigation.assignedTo && String(investigation.assignedTo) !== String(req.user._id)) {
    await notifyUser(investigation.assignedTo, {
      type: 'investigation_assigned',
      message: `You have been assigned investigation ${investigation.caseId}: ${investigation.title}`,
      relatedInvestigation: investigation._id,
    });
  }

  await recordAudit({
    user: req.user._id,
    action: 'INVESTIGATION_CREATE',
    resource: 'Investigation',
    resourceId: investigation._id,
  });

  sendSuccess(res, { statusCode: 201, message: 'Investigation created successfully', data: investigation });
});

// @route PUT /api/investigations/:id
const updateInvestigation = asyncHandler(async (req, res) => {
  const investigation = await Investigation.findById(req.params.id);
  if (!investigation) throw ApiError.notFound('Investigation not found');

  const editableFields = ['title', 'description', 'status', 'priority', 'assignedTo'];
  const previousAssignee = String(investigation.assignedTo || '');

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) investigation[field] = req.body[field];
  });

  await investigation.save();

  if (req.body.assignedTo && req.body.assignedTo !== previousAssignee) {
    await notifyUser(investigation.assignedTo, {
      type: 'investigation_assigned',
      message: `You have been assigned investigation ${investigation.caseId}: ${investigation.title}`,
      relatedInvestigation: investigation._id,
    });
  } else if (investigation.assignedTo) {
    await notifyUser(investigation.assignedTo, {
      type: 'investigation_updated',
      message: `Investigation ${investigation.caseId} was updated (status: ${investigation.status})`,
      relatedInvestigation: investigation._id,
    });
  }

  await recordAudit({
    user: req.user._id,
    action: 'INVESTIGATION_UPDATE',
    resource: 'Investigation',
    resourceId: investigation._id,
    metadata: { updatedFields: Object.keys(req.body) },
  });

  sendSuccess(res, { message: 'Investigation updated successfully', data: investigation });
});

// @route POST /api/investigations/:id/notes
const addNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const investigation = await Investigation.findById(req.params.id);
  if (!investigation) throw ApiError.notFound('Investigation not found');

  investigation.notes.push({ author: req.user._id, text });
  await investigation.save();

  sendSuccess(res, { statusCode: 201, message: 'Note added successfully', data: investigation });
});

// @route POST /api/investigations/:id/link-transaction
const linkTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  const investigation = await Investigation.findById(req.params.id);
  if (!investigation) throw ApiError.notFound('Investigation not found');

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw ApiError.notFound('Transaction not found');

  if (!investigation.relatedTransactions.map(String).includes(String(transactionId))) {
    investigation.relatedTransactions.push(transactionId);
    await investigation.save();
  }
  transaction.investigation = investigation._id;
  await transaction.save();

  sendSuccess(res, { message: 'Transaction linked to investigation', data: investigation });
});

module.exports = {
  listInvestigations,
  getInvestigation,
  createInvestigation,
  updateInvestigation,
  addNote,
  linkTransaction,
};
