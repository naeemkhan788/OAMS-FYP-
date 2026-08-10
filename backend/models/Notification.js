const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  senderRole: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverRole: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['notice', 'marks', 'attendance', 'assignment', 'quiz', 'presentation', 'paper', 'leave', 'general'],
    required: true
  },
  page: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ receiverId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ receiverId: 1, page: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
