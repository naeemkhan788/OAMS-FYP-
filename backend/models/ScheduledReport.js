const mongoose = require('mongoose');

const scheduledReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    enum: ['attendance', 'academic', 'enrollment', 'faculty'],
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  schedule: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  cronExpression: {
    type: String,
    required: true
  },
  recipients: [{
    type: String,
    trim: true
  }],
  department: {
    type: String,
    default: 'all'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  lastRunAt: {
    type: Date
  },
  nextRunAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScheduledReport', scheduledReportSchema);
