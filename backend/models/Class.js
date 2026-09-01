const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    enum: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Social Sciences', 'English', 'Mathematics', 'Other'],
    default: 'Computer Science'
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['1', '2', '3', '4', '5', '6', '7', '8']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    uppercase: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subjects: [{
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    passMarks: {
      type: Number,
      default: 40
    }
  }],
  schedule: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }]
  },
  room: {
    type: String,
    required: [true, 'Room number is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
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

classSchema.virtual('studentCount', {
  ref: 'User',
  localField: 'students',
  foreignField: '_id',
  count: true
});

classSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
