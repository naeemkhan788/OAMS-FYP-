const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeController');

const router = express.Router();

router.post('/', protect, authorize('teacher', 'admin'), createNotice);
router.get('/', protect, getNotices);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteNotice);

module.exports = router;
