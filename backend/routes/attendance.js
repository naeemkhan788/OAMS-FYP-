const express = require('express');
const { body, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance,
  getAttendanceByClass,
  getStudentAttendance,
  getAttendanceReport,
  getTeacherAttendance,
  markBulkAttendance
} = require('../controllers/attendanceController');

const router = express.Router();

const markAttendanceValidation = [
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required'),
  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('Attendance data is required'),
  body('attendanceData.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('attendanceData.*.status')
    .isIn(['present', 'absent', 'leave'])
    .withMessage('Status must be present, absent, or leave'),
  body('attendanceData.*.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const getAttendanceValidation = [
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  query('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
];

const getStudentAttendanceValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
];

const getReportValidation = [
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  query('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
];

router.post('/mark', protect, authorize('teacher', 'admin'), markAttendanceValidation, markAttendance);
router.post('/bulk', protect, authorize('teacher', 'admin'), markBulkAttendance);
router.get('/class', protect, authorize('teacher', 'admin'), getAttendanceValidation, getAttendanceByClass);
router.get('/student', protect, getStudentAttendanceValidation, getStudentAttendance);
router.get('/student/:studentId', protect, authorize('teacher', 'admin'), getStudentAttendanceValidation, getStudentAttendance);
router.get('/report', protect, authorize('teacher', 'admin'), getReportValidation, getAttendanceReport);
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherAttendance);

module.exports = router;
