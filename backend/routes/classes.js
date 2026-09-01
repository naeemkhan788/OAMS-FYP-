const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getTeacherClasses,
  getTeacherStudents,
  assignStudentToClass,
  getStudentClass,
  getClassStudents,
  assignTeacher,
  getClassStats
} = require('../controllers/classController');

const router = express.Router();

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Social Sciences',
  'English',
  'Mathematics',
  'Other'
];

const classValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('code').notEmpty().withMessage('Code is required').isLength({ max: 20 }).withMessage('Code cannot exceed 20 characters'),
  body('semester').notEmpty().withMessage('Semester is required').isIn(['1', '2', '3', '4', '5', '6', '7', '8']).withMessage('Semester must be 1, 2, 3, 4, 5, 6, 7, or 8'),
  body('department').optional({ nullable: true }).isIn(DEPARTMENTS).withMessage('Invalid department'),
  body('section').notEmpty().withMessage('Section is required').isIn(['A', 'B', 'C', 'D', 'E', 'F']).withMessage('Section must be A, B, C, D, E, or F'),
  body('teacher').optional({ nullable: true }),
  body('room').notEmpty().withMessage('Room is required'),
  body('capacity').notEmpty().withMessage('Capacity is required').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('academicYear').notEmpty().withMessage('Academic year is required')
];

router.post('/', protect, authorize('admin', 'teacher'), classValidation, createClass);
router.get('/', protect, authorize('admin', 'teacher', 'student'), getClasses);
router.get('/teacher/my-classes', protect, authorize('teacher', 'admin'), getTeacherClasses);
router.get('/teacher/students', protect, authorize('teacher', 'admin'), getTeacherStudents);
router.post('/assign-student', protect, authorize('teacher', 'admin'), assignStudentToClass);
router.get('/student/my-class', protect, authorize('student'), getStudentClass);
router.get('/:id/stats', protect, authorize('admin', 'teacher'), getClassStats);
router.get('/:id', protect, authorize('admin', 'teacher', 'student'), getClassById);
router.get('/:id/students', protect, authorize('admin', 'teacher'), getClassStudents);
router.put('/:id', protect, authorize('admin', 'teacher'), classValidation, updateClass);
router.put('/:id/assign-teacher', protect, authorize('admin', 'teacher'), body('teacher').notEmpty().withMessage('Teacher is required'), assignTeacher);
router.delete('/:id', protect, authorize('admin', 'teacher'), deleteClass);

module.exports = router;
