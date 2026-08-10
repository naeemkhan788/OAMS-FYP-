const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const {
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getAllTeachers,
  markTeacherAttendance,
  getTeacherAttendance,
  addTeacherNote,
  getTeacherNotes
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/pending-teachers
 * @desc    Get all pending teacher registrations
 * @access  Admin only
 */
router.get('/pending-teachers', getPendingTeachers);

/**
 * @route   GET /api/admin/teachers
 * @desc    Get all teachers
 * @access  Admin only
 */
router.get('/teachers', getAllTeachers);

/**
 * @route   PUT /api/admin/approve-teacher/:id
 * @desc    Approve a teacher registration
 * @access  Admin only
 */
router.put('/approve-teacher/:id', approveTeacher);

/**
 * @route   PUT /api/admin/reject-teacher/:id
 * @desc    Reject a teacher registration
 * @access  Admin only
 */
router.put('/reject-teacher/:id', rejectTeacher);

/**
 * @route   POST /api/admin/teacher-attendance
 * @desc    Mark teacher attendance
 * @access  Admin only
 */
router.post('/teacher-attendance', markTeacherAttendance);

/**
 * @route   GET /api/admin/teacher-attendance
 * @desc    Get teacher attendance records
 * @access  Admin only
 */
router.get('/teacher-attendance', getTeacherAttendance);

/**
 * @route   POST /api/admin/teacher-notes
 * @desc    Add note to teacher
 * @access  Admin only
 */
router.post('/teacher-notes', addTeacherNote);

/**
 * @route   GET /api/admin/teacher-notes/:teacherId
 * @desc    Get teacher notes
 * @access  Admin only
 */
router.get('/teacher-notes/:teacherId', getTeacherNotes);

module.exports = router;
