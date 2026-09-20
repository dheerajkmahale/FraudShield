const express = require('express');
const { body } = require('express-validator');
const {
  listUsers,
  getUser,
  updateProfile,
  changePassword,
  updateUserRole,
  updateUserStatus,
} = require('../controllers/userController');
const { changePasswordValidator } = require('../validators/authValidators');
const { idParamValidator } = require('../validators/transactionValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES, ROLE_VALUES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.put('/profile', body('name').optional().trim().isLength({ min: 2, max: 80 }), validate, updateProfile);
router.put('/change-password', changePasswordValidator, validate, changePassword);

// Admin-only user management
router.get('/', authorize(ROLES.ADMIN), listUsers);
router.get('/:id', authorize(ROLES.ADMIN), idParamValidator, validate, getUser);
router.put(
  '/:id/role',
  authorize(ROLES.ADMIN),
  idParamValidator,
  body('role').isIn(ROLE_VALUES),
  validate,
  updateUserRole
);
router.put(
  '/:id/status',
  authorize(ROLES.ADMIN),
  idParamValidator,
  body('isActive').isBoolean(),
  validate,
  updateUserStatus
);

module.exports = router;
