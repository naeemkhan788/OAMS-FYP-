const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  assessmentType: {
    type: String,
    enum: ['quiz', 'assignment', 'midterm', 'final', 'practical', 'project', 'presentation', 'paper'],
    required: [true, 'Assessment type is required']
  },
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks obtained cannot be negative']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [1, 'Maximum marks must be at least 1']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  assessmentDate: {
    type: Date,
    required: [true, 'Assessment date is required'],
    default: Date.now
  },
  weight: {
    type: Number,
    default: 1,
    min: [0.1, 'Weight must be at least 0.1']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  submittedAt: {
    type: Date
  },
  gradedAt: {
    type: Date,
    default: Date.now
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Graded by is required']
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

marksSchema.index({ student: 1, class: 1, subject: 1, assessmentType: 1 });
marksSchema.index({ class: 1, subject: 1, assessmentType: 1 });
marksSchema.index({ teacher: 1, assessmentDate: 1 });

marksSchema.pre('save', function(next) {
  if (this.marksObtained !== undefined && this.maxMarks !== undefined) {
    this.percentage = (this.marksObtained / this.maxMarks) * 100;
    
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 85) this.grade = 'A';
    else if (this.percentage >= 75) this.grade = 'B+';
    else if (this.percentage >= 70) this.grade = 'B';
    else if (this.percentage >= 60) this.grade = 'C+';
    else if (this.percentage >= 55) this.grade = 'C';
    else if (this.percentage >= 50) this.grade = 'D+';
    else if (this.percentage >= 40) this.grade = 'D';
    else this.grade = 'F';
  }
  
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Marks', marksSchema);
