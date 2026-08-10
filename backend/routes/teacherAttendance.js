const express = require('express');
const { protect } = require('../middleware/auth');
const {
  markTeacherAttendance,
  getTeacherAttendanceByDate,
  getMyTeacherAttendance,
  getTeacherAttendanceStats,
  updateTeacherAttendance,
  deleteTeacherAttendance,
  getAllTeachers
} = require('../controllers/teacherAttendanceController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/teacher-attendance
 * @desc    Mark attendance for teachers (Admin only)
 * @access  Private (Admin)
 */
router.post('/', markTeacherAttendance);

/**
 * @route   GET /api/teacher-attendance/date/:date
 * @desc    Get teacher attendance for a specific date (Admin only)
 * @access  Private (Admin)
 */
router.get('/date/:date', getTeacherAttendanceByDate);

/**
 * @route   GET /api/teacher-attendance/my
 * @desc    Get current teacher's own attendance (Teacher only)
 * @access  Private (Teacher)
 */
router.get('/my', getMyTeacherAttendance);

/**
 * @route   GET /api/teacher-attendance/stats
 * @desc    Get teacher attendance statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats', getTeacherAttendanceStats);

/**
 * @route   PUT /api/teacher-attendance/:id
 * @desc    Update teacher attendance (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id', updateTeacherAttendance);

/**
 * @route   DELETE /api/teacher-attendance/:id
 * @desc    Delete teacher attendance (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', deleteTeacherAttendance);

/**
 * @route   GET /api/teacher-attendance/teachers/all
 * @desc    Get all teachers for attendance marking (Admin only)
 * @access  Private (Admin)
 */
router.get('/teachers/all', getAllTeachers);

module.exports = router;
