const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantType: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  leaveType: {
    type: String,
    enum: ['medical', 'personal', 'family', 'academic', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  attachments: [{
    type: String
  }],
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
leaveSchema.index({ applicantId: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
