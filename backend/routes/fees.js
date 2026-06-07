const express = require('express');
const router = express.Router();
const { getStudentFees, payFee, payAllPendingFees, getAllFees, createFee, updateFee, deleteFee } = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student routes
router.get('/student', authorize('student'), getStudentFees);
router.post('/:id/pay', authorize('student'), payFee);
router.post('/pay-all', authorize('student'), payAllPendingFees);

// Admin routes
router.get('/', authorize('admin'), getAllFees);
router.post('/', authorize('admin'), createFee);
router.put('/:id', authorize('admin'), updateFee);
router.delete('/:id', authorize('admin'), deleteFee);

module.exports = router;
