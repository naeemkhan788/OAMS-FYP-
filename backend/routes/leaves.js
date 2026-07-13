const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const {
  applyLeave,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave
} = require('../controllers/leaveController');

// Apply for leave (students and teachers)
router.post('/', protect, applyLeave);

// Get all leave applications
router.get('/', protect, getAllLeaves);

// Get leave by ID
router.get('/:id', protect, getLeaveById);

// Approve/Reject leave (teachers and admins)
router.put('/:id/status', protect, authorize('teacher', 'admin'), updateLeaveStatus);

// Delete leave application (only pending leaves)
router.delete('/:id', protect, deleteLeave);

module.exports = router;
