const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  getUnreadCountsByPage,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 * @query   page - Filter notifications by page (optional)
 * @query   limit - Number of notifications to return (default: 20)
 * @query   skip - Number of notifications to skip (default: 0)
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for current user
 * @access  Private
 * @query   page - Filter unread count by page (optional)
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   GET /api/notifications/unread-counts
 * @desc    Get all unread counts grouped by page for sidebar badges
 * @access  Private
 */
router.get('/unread-counts', getUnreadCountsByPage);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private
 * @body    page - Optional page filter to mark only specific page notifications as read
 */
router.patch('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

/**
 * @route   POST /api/notifications/test
 * @desc    Create a test notification (for testing green dot badge)
 * @access  Private
 */
router.post('/test', createTestNotification);

module.exports = router;
