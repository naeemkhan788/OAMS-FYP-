const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
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
    enum: ['present', 'absent', 'leave', 'late'],
    required: [true, 'Status is required'],
    default: 'present'
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
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
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

teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });
teacherAttendanceSchema.index({ date: 1 });

teacherAttendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.isModified('checkInTime')) {
    const workStartTime = new Date(this.checkInTime);
    workStartTime.setHours(9, 0, 0, 0); // Assuming 9:00 AM as work start time
    
    if (this.checkInTime > workStartTime) {
      this.isLate = true;
      this.lateMinutes = Math.floor((this.checkInTime - workStartTime) / (1000 * 60));
    }
  }
  next();
});

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
