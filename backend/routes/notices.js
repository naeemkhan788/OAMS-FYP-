const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createNotice,
  createTeacherNotice,
  getAdminNotices,
  getTeacherNotices,
  getStudentNotices,
  markNoticeAsRead,
  markStudentNoticeAsRead,
  markAllNoticesAsRead,
  updateNotice,
  deleteNotice,
  getUnreadCount
} = require('../controllers/noticeController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/notices
 * @desc    Create a new notice (Admin only)
 * @access  Admin
 */
router.post('/', authorize('admin'), createNotice);

/**
 * @route   POST /api/notices/teacher
 * @desc    Create a notice for students (Teacher only)
 * @access  Teacher
 */
router.post('/teacher', authorize('teacher'), createTeacherNotice);

/**
 * @route   GET /api/notices/admin
 * @desc    Get all notices for admin with filtering
 * @access  Admin
 */
router.get('/admin', authorize('admin'), getAdminNotices);

/**
 * @route   GET /api/notices/teacher
 * @desc    Get notices for current teacher
 * @access  Teacher
 */
router.get('/teacher', authorize('teacher'), getTeacherNotices);

/**
 * @route   GET /api/notices/student
 * @desc    Get notices for current student
 * @access  Student
 */
router.get('/student', authorize('student'), getStudentNotices);

/**
 * @route   GET /api/notices/teacher/unread-count
 * @desc    Get unread notice count for teacher
 * @access  Teacher
 */
router.get('/teacher/unread-count', authorize('teacher'), getUnreadCount);

/**
 * @route   PATCH /api/notices/:id/read
 * @desc    Mark a notice as read (Teacher)
 * @access  Teacher
 */
router.patch('/:id/read', authorize('teacher'), markNoticeAsRead);

/**
 * @route   PATCH /api/notices/:id/student-read
 * @desc    Mark a notice as read (Student)
 * @access  Student
 */
router.patch('/:id/student-read', authorize('student'), markStudentNoticeAsRead);

/**
 * @route   PATCH /api/notices/read-all
 * @desc    Mark all notices as read for current teacher
 * @access  Teacher
 */
router.patch('/read-all', authorize('teacher'), markAllNoticesAsRead);

/**
 * @route   PUT /api/notices/:id
 * @desc    Update a notice (Admin only)
 * @access  Admin
 */
router.put('/:id', authorize('admin'), updateNotice);

/**
 * @route   DELETE /api/notices/:id
 * @desc    Delete a notice (Admin only)
 * @access  Admin
 */
router.delete('/:id', authorize('admin'), deleteNotice);

module.exports = router;
