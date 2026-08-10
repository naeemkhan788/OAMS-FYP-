const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getAnalyticsData } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/', protect, authorize('admin'), getAnalyticsData);

module.exports = router;
