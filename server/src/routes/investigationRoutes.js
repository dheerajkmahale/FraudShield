const express = require('express');
const { body } = require('express-validator');
const {
  listInvestigations,
  getInvestigation,
  createInvestigation,
  updateInvestigation,
  addNote,
  linkTransaction,
} = require('../controllers/investigationController');
const {
  createInvestigationValidator,
  updateInvestigationValidator,
  addNoteValidator,
} = require('../validators/investigationValidators');
const { idParamValidator } = require('../validators/transactionValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', listInvestigations);
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.INVESTIGATOR),
  createInvestigationValidator,
  validate,
  createInvestigation
);

router.get('/:id', idParamValidator, validate, getInvestigation);
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.INVESTIGATOR),
  updateInvestigationValidator,
  validate,
  updateInvestigation
);
router.post(
  '/:id/notes',
  authorize(ROLES.ADMIN, ROLES.INVESTIGATOR),
  addNoteValidator,
  validate,
  addNote
);
router.post(
  '/:id/link-transaction',
  authorize(ROLES.ADMIN, ROLES.INVESTIGATOR),
  idParamValidator,
  body('transactionId').isMongoId(),
  validate,
  linkTransaction
);

module.exports = router;
