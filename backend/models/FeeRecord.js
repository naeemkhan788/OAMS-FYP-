const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  student: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true,
    default: 'Semester 1'
  },
  type: {
    type: String,
    required: true,
    enum: ['Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Examination Fee', 'Hostel Fee', 'Other'],
    default: 'Tuition Fee'
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  description: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Online Banking', 'Credit Card', 'Debit Card', 'Cash', 'Mobile Wallet', 'Bank Transfer'],
    default: 'Online Banking'
  },
  transactionId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
