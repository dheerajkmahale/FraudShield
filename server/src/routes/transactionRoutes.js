const express = require('express');
const {
  listTransactions,
  listSuspicious,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStatistics,
  getNetwork,
} = require('../controllers/transactionController');
const {
  createTransactionValidator,
  updateTransactionValidator,
  idParamValidator,
  listQueryValidator,
} = require('../validators/transactionValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

// Specific routes before /:id to avoid Express treating them as an id param.
router.get('/statistics', listQueryValidator, validate, getStatistics);
router.get('/suspicious', listQueryValidator, validate, listSuspicious);
router.get('/network', getNetwork);

router.get('/', listQueryValidator, validate, listTransactions);
router.post('/', authorize(ROLES.ADMIN, ROLES.ANALYST, ROLES.INVESTIGATOR), createTransactionValidator, validate, createTransaction);

router.get('/:id', idParamValidator, validate, getTransaction);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.INVESTIGATOR), updateTransactionValidator, validate, updateTransaction);
router.delete('/:id', authorize(ROLES.ADMIN), idParamValidator, validate, deleteTransaction);

module.exports = router;
