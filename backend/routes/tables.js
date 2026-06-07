const express = require('express');
const router = express.Router();
const {
  getUsersTable,
  getClassesTable,
  getAttendanceTable,
  getMarksTable,
  getDashboardSummary,
  exportTableData
} = require('../controllers/tableViewController');
const { protect } = require('../middleware/auth'); // Fix auth import

// All table view endpoints require authentication
router.use(protect); // Fix auth usage

// ===== USERS TABLE ENDPOINTS =====
/**
 * GET /api/tables/users
 * Get paginated users table with optional filters
 * Query params: role, page, limit, search
 */
router.get('/users', getUsersTable);

// ===== CLASSES TABLE ENDPOINTS =====
/**
 * GET /api/tables/classes
 * Get paginated classes table with optional filters
 * Query params: page, limit, grade, section
 */
router.get('/classes', getClassesTable);

// ===== ATTENDANCE TABLE ENDPOINTS =====
/**
 * GET /api/tables/attendance
 * Get paginated attendance table with optional filters
 * Query params: classId, date, status, page, limit
 */
router.get('/attendance', getAttendanceTable);

// ===== MARKS TABLE ENDPOINTS =====
/**
 * GET /api/tables/marks
 * Get paginated marks table with optional filters
 * Query params: classId, subject, studentId, page, limit
 */
router.get('/marks', getMarksTable);

// ===== DASHBOARD SUMMARY =====
/**
 * GET /api/tables/dashboard-summary
 * Get dashboard summary with counts of all collections
 */
router.get('/dashboard-summary', getDashboardSummary);

// ===== EXPORT ENDPOINTS =====
/**
 * POST /api/tables/export/:tableType
 * Export specific table data
 * Params: tableType (users, classes, attendance, marks)
 * Body: optional filters object
 */
router.post('/export/:tableType', exportTableData);

module.exports = router;
