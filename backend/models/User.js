const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^.+@.+\..+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: [true, 'Role is required'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      // Teachers default to pending, students and admins default to approved
      return this.role === 'teacher' ? 'pending' : 'approved';
    }
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    required: false  // Made optional for easier registration
  },
  teacherId: {
    type: String,
    unique: true,
    sparse: true,
    required: false  // Made optional for easier registration
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false  // Made optional for easier registration
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  profile: {
    phone: String,
    address: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    avatar: String,
    department: String,
    specialization: String,
    experience: String,
    rating: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
