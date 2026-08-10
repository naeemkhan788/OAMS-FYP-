const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  generateAttendanceReport,
  generateMarksReport,
  generateEnrollmentReport,
  generateFacultyReport,
  getAllReports,
  downloadReport,
  viewReport,
  deleteReport,
  archiveReport,
  unarchiveReport,
  getArchivedReports,
  sendReportEmail
} = require('../controllers/reportController');

const router = express.Router();

router.get('/attendance', protect, authorize('admin'), generateAttendanceReport);
router.get('/marks', protect, authorize('admin'), generateMarksReport);
router.get('/enrollment', protect, authorize('admin'), generateEnrollmentReport);
router.get('/faculty', protect, authorize('admin'), generateFacultyReport);
router.get('/', protect, authorize('admin'), getAllReports);
router.get('/archived', protect, authorize('admin'), getArchivedReports);
router.get('/:id/download', protect, authorize('admin'), downloadReport);
router.get('/:id/view', protect, authorize('admin'), viewReport);
router.put('/:id/archive', protect, authorize('admin'), archiveReport);
router.put('/:id/unarchive', protect, authorize('admin'), unarchiveReport);
router.delete('/:id', protect, authorize('admin'), deleteReport);
router.post('/email', protect, authorize('admin'), sendReportEmail);

module.exports = router;
