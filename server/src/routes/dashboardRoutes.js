const express = require('express');
const { getDashboardStatistics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/statistics', getDashboardStatistics);

module.exports = router;
