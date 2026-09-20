const express = require('express');
const { listNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { idParamValidator } = require('../validators/transactionValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', idParamValidator, validate, markAsRead);

module.exports = router;
