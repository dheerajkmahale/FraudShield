const { body, param } = require('express-validator');
const { INVESTIGATION_STATUS, INVESTIGATION_PRIORITY } = require('../config/constants');

const createInvestigationValidator = [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3-150 characters'),
  body('description').optional().isString().isLength({ max: 3000 }),
  body('assignedTo').optional().isMongoId().withMessage('assignedTo must be a valid user id'),
  body('relatedTransactions').optional().isArray().withMessage('relatedTransactions must be an array'),
  body('relatedTransactions.*').optional().isMongoId(),
  body('priority').optional().isIn(INVESTIGATION_PRIORITY),
];

const updateInvestigationValidator = [
  param('id').isMongoId().withMessage('Invalid investigation id'),
  body('title').optional().trim().isLength({ min: 3, max: 150 }),
  body('status').optional().isIn(INVESTIGATION_STATUS),
  body('priority').optional().isIn(INVESTIGATION_PRIORITY),
  body('assignedTo').optional().isMongoId(),
];

const addNoteValidator = [
  param('id').isMongoId().withMessage('Invalid investigation id'),
  body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Note text is required (max 2000 chars)'),
];

module.exports = { createInvestigationValidator, updateInvestigationValidator, addNoteValidator };
