const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { getUsers, getUserById, updateUser, deleteUser, getUnassignedStudents, getPendingTeachers, approveRejectTeacher } = require('../controllers/userController');

const router = express.Router();

const userValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Role must be student, teacher, or admin'),
  body('studentId').optional().notEmpty().withMessage('Student ID cannot be empty'),
  body('teacherId').optional().notEmpty().withMessage('Teacher ID cannot be empty')
];

const statusValidation = [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
];

router.get('/', protect, authorize('admin'), getUsers);
router.get('/pending-teachers', protect, authorize('admin'), getPendingTeachers);
router.get('/unassigned-students', protect, authorize('teacher', 'admin'), getUnassignedStudents);
router.get('/:id', protect, authorize('admin', 'teacher', 'student'), getUserById);
router.put('/:id', protect, authorize('admin', 'teacher', 'student'), userValidation, updateUser);
router.put('/:id/status', protect, authorize('admin'), statusValidation, approveRejectTeacher);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;