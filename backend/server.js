const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/database');
const { initializeSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const marksRoutes = require('./routes/marks');
const dashboardRoutes = require('./routes/dashboard');
const classRoutes = require('./routes/classes');
const userRoutes = require('./routes/users');
const tableRoutes = require('./routes/tables');
const noticeRoutes = require('./routes/notices');
const syncRoutes = require('./routes/sync');
const reportRoutes = require('./routes/reports');
const leaveRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const teacherAttendanceRoutes = require('./routes/teacherAttendance');
const analyticsRoutes = require('./routes/analytics');
const scheduledReportsRoutes = require('./routes/scheduledReports');
const contactRoutes = require('./routes/contact');

const app = express();

// Connect to MongoDB Atlas
connectDB();

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scheduled-reports', scheduledReportsRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API to view all collections
app.get('/api/tables', async (req, res) => {
  try {
    if (global.jsonDB) {
      const tableInfo = {
        users: { totalRecords: global.jsonDB.users.length },
        classes: { totalRecords: global.jsonDB.classes.length },
        attendance: { totalRecords: global.jsonDB.attendance.length },
        marks: { totalRecords: global.jsonDB.marks.length }
      };
      return res.status(200).json({
        success: true,
        message: 'Database collections retrieved',
        data: tableInfo,
        totalTables: 4
      });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const tableInfo = {};
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      tableInfo[col.name] = { totalRecords: count };
    }
    res.status(200).json({
      success: true,
      message: 'Database collections retrieved',
      data: tableInfo,
      totalTables: collections.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: error.message
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize Socket.IO
initializeSocket(server);

process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection: ${err}`);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err}`);
  process.exit(1);
});

module.exports = app;
