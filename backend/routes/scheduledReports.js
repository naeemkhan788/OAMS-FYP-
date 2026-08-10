const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  runScheduledReport
} = require('../controllers/scheduledReportController');

const router = express.Router();

router.post('/', protect, authorize('admin'), createScheduledReport);
router.get('/', protect, authorize('admin'), getScheduledReports);
router.put('/:id', protect, authorize('admin'), updateScheduledReport);
router.delete('/:id', protect, authorize('admin'), deleteScheduledReport);
router.post('/:id/run', protect, authorize('admin'), runScheduledReport);

module.exports = router;
