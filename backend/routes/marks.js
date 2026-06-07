const express = require('express');
const { body, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  addMarks,
  getMarksByClass,
  getStudentMarks,
  publishMarks,
  getMarksReport,
  getTeacherMarks
} = require('../controllers/marksController');

const router = express.Router();

const addMarksValidation = [
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required'),
  body('assessmentType')
    .isIn(['quiz', 'assignment', 'midterm', 'final', 'practical', 'project'])
    .withMessage('Invalid assessment type'),
  body('title')
    .notEmpty()
    .withMessage('Assessment title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('marksData')
    .isArray({ min: 1 })
    .withMessage('Marks data is required'),
  body('marksData.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('marksData.*.marksObtained')
    .isFloat({ min: 0 })
    .withMessage('Marks obtained must be a non-negative number'),
  body('marksData.*.maxMarks')
    .isFloat({ min: 1 })
    .withMessage('Maximum marks must be at least 1'),
  body('marksData.*.remarks')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

const getMarksValidation = [
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  query('subject')
    .optional()
    .notEmpty()
    .withMessage('Subject cannot be empty'),
  query('assessmentType')
    .optional()
    .isIn(['quiz', 'assignment', 'midterm', 'final', 'practical', 'project'])
    .withMessage('Invalid assessment type')
];

const getStudentMarksValidation = [
  query('subject')
    .optional()
    .notEmpty()
    .withMessage('Subject cannot be empty'),
  query('assessmentType')
    .optional()
    .isIn(['quiz', 'assignment', 'midterm', 'final', 'practical', 'project'])
    .withMessage('Invalid assessment type')
];

const publishMarksValidation = [
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required'),
  body('assessmentType')
    .isIn(['quiz', 'assignment', 'midterm', 'final', 'practical', 'project'])
    .withMessage('Invalid assessment type'),
  body('title')
    .notEmpty()
    .withMessage('Assessment title is required')
];

const getReportValidation = [
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
];

router.post('/add', protect, authorize('teacher', 'admin'), addMarksValidation, addMarks);
router.get('/class', protect, authorize('teacher', 'admin'), getMarksValidation, getMarksByClass);
router.get('/student', protect, getStudentMarksValidation, getStudentMarks);
router.get('/student/:studentId', protect, authorize('teacher', 'admin'), getStudentMarksValidation, getStudentMarks);
router.post('/publish', protect, authorize('teacher', 'admin'), publishMarksValidation, publishMarks);
router.get('/report', protect, authorize('teacher', 'admin'), getReportValidation, getMarksReport);
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherMarks);

module.exports = router;
