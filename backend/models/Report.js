const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['attendance', 'academic', 'enrollment', 'faculty', 'financial', 'infrastructure'],
    required: true
  },
  period: {
    type: String,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'processing', 'failed'],
    default: 'completed'
  },
  department: {
    type: String,
    default: 'all'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
