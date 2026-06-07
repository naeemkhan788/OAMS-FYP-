const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    required: [true, 'Status is required'],
    default: 'present'
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by is required']
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

attendanceSchema.index({ student: 1, date: 1, class: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ teacher: 1, date: 1 });

attendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.isModified('checkInTime')) {
    const classStartTime = new Date(this.checkInTime);
    classStartTime.setHours(8, 0, 0, 0); // Assuming 8:00 AM as start time
    
    if (this.checkInTime > classStartTime) {
      this.isLate = true;
      this.lateMinutes = Math.floor((this.checkInTime - classStartTime) / (1000 * 60));
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
