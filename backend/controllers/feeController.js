const FeeRecord = require('../models/FeeRecord');

const isJsonDB = () => global.jsonDB !== undefined;

// Helper to generate unique IDs in JSON DB mode
const generateId = () => 'FEE-' + Math.floor(1000000 + Math.random() * 9000000);

// @desc    Get all fees for logged in student
// @route   GET /api/fees/student
// @access  Private (Student)
exports.getStudentFees = async (req, res) => {
  try {
    const studentId = req.user.id ? req.user.id.toString() : req.user._id.toString();

    // JSON DB Mode
    if (isJsonDB()) {
      if (!global.jsonDB.feerecords) {
        global.jsonDB.feerecords = [];
      }

      let fees = global.jsonDB.feerecords.filter(f => f.student === studentId);

      // Check overdue status
      const now = new Date();
      let updated = false;
      fees.forEach(fee => {
        if (fee.status === 'pending' && new Date(fee.dueDate) < now) {
          fee.status = 'overdue';
          updated = true;
        }
      });

      if (updated) {
        global.jsonDB.save();
        fees = global.jsonDB.feerecords.filter(f => f.student === studentId);
      }

      // Sort by due date
      fees.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      const totalFees = fees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const paidFees = fees.filter(f => f.status === 'paid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const pendingFees = totalFees - paidFees;

      return res.status(200).json({
        success: true,
        data: {
          fees,
          summary: { totalFees, paidFees, pendingFees }
        }
      });
    }

    // MongoDB Mode
    let fees = await FeeRecord.find({ student: studentId }).sort({ dueDate: 1 });

    const now = new Date();
    let updated = false;
    for (const fee of fees) {
      if (fee.status === 'pending' && new Date(fee.dueDate) < now) {
        fee.status = 'overdue';
        await fee.save();
        updated = true;
      }
    }

    if (updated) {
      fees = await FeeRecord.find({ student: studentId }).sort({ dueDate: 1 });
    }

    const totalFees = fees.reduce((acc, curr) => acc + curr.amount, 0);
    const paidFees = fees.filter(f => f.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingFees = totalFees - paidFees;

    res.status(200).json({
      success: true,
      data: {
        fees,
        summary: { totalFees, paidFees, pendingFees }
      }
    });
  } catch (error) {
    console.error('Error in getStudentFees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fee records',
      error: error.message
    });
  }
};

// @desc    Pay specific fee
// @route   POST /api/fees/:id/pay
// @access  Private (Student)
exports.payFee = async (req, res) => {
  try {
    const studentId = req.user.id ? req.user.id.toString() : req.user._id.toString();
    const { paymentMethod } = req.body;

    // JSON DB Mode
    if (isJsonDB()) {
      if (!global.jsonDB.feerecords) global.jsonDB.feerecords = [];
      const feeIndex = global.jsonDB.feerecords.findIndex(f => f._id === req.params.id && f.student === studentId);

      if (feeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Fee record not found' });
      }

      if (global.jsonDB.feerecords[feeIndex].status === 'paid') {
        return res.status(400).json({ success: false, message: 'Fee is already paid' });
      }

      global.jsonDB.feerecords[feeIndex].status = 'paid';
      global.jsonDB.feerecords[feeIndex].paymentDate = new Date().toISOString();
      global.jsonDB.feerecords[feeIndex].paymentMethod = paymentMethod || 'Online Banking';
      global.jsonDB.feerecords[feeIndex].transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      global.jsonDB.save();

      return res.status(200).json({
        success: true,
        message: 'Fee paid successfully',
        data: global.jsonDB.feerecords[feeIndex]
      });
    }

    // MongoDB Mode
    const fee = await FeeRecord.findOne({ _id: req.params.id, student: studentId });

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fee is already paid' });
    }

    fee.status = 'paid';
    fee.paymentDate = new Date();
    fee.paymentMethod = paymentMethod || 'Online Banking';
    fee.transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    await fee.save();

    res.status(200).json({
      success: true,
      message: 'Fee paid successfully',
      data: fee
    });
  } catch (error) {
    console.error('Error in payFee:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

// @desc    Pay all pending fees
// @route   POST /api/fees/pay-all
// @access  Private (Student)
exports.payAllPendingFees = async (req, res) => {
  try {
    const studentId = req.user.id ? req.user.id.toString() : req.user._id.toString();
    const { paymentMethod } = req.body;

    // JSON DB Mode
    if (isJsonDB()) {
      if (!global.jsonDB.feerecords) global.jsonDB.feerecords = [];
      let pendingFound = false;

      global.jsonDB.feerecords.forEach(f => {
        if (f.student === studentId && (f.status === 'pending' || f.status === 'overdue')) {
          f.status = 'paid';
          f.paymentDate = new Date().toISOString();
          f.paymentMethod = paymentMethod || 'Online Banking';
          f.transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
          pendingFound = true;
        }
      });

      if (!pendingFound) {
        return res.status(400).json({ success: false, message: 'No pending fees to pay' });
      }

      global.jsonDB.save();
      const allFees = global.jsonDB.feerecords.filter(f => f.student === studentId).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      const totalFees = allFees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const paidFees = allFees.filter(f => f.status === 'paid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const pendingAmount = totalFees - paidFees;

      return res.status(200).json({
        success: true,
        message: 'All pending fees paid successfully',
        data: {
          fees: allFees,
          summary: { totalFees, paidFees, pendingFees: pendingAmount }
        }
      });
    }

    // MongoDB Mode
    const pendingFees = await FeeRecord.find({ student: studentId, status: { $in: ['pending', 'overdue'] } });

    if (pendingFees.length === 0) {
      return res.status(400).json({ success: false, message: 'No pending fees to pay' });
    }

    for (const fee of pendingFees) {
      fee.status = 'paid';
      fee.paymentDate = new Date();
      fee.paymentMethod = paymentMethod || 'Online Banking';
      fee.transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      await fee.save();
    }

    const allFees = await FeeRecord.find({ student: studentId }).sort({ dueDate: 1 });
    const totalFees = allFees.reduce((acc, curr) => acc + curr.amount, 0);
    const paidFees = allFees.filter(f => f.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = totalFees - paidFees;

    res.status(200).json({
      success: true,
      message: 'All pending fees paid successfully',
      data: {
        fees: allFees,
        summary: { totalFees, paidFees, pendingFees: pendingAmount }
      }
    });
  } catch (error) {
    console.error('Error in payAllPendingFees:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk payment processing failed',
      error: error.message
    });
  }
};

// ---------------- Admin Routes ---------------- //

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private (Admin)
exports.getAllFees = async (req, res) => {
  try {
    const { student } = req.query;

    if (isJsonDB()) {
      let fees = global.jsonDB.feerecords || [];
      if (student) {
        fees = fees.filter(f => f.student === student);
      }
      return res.status(200).json({ success: true, count: fees.length, data: fees });
    }

    const filter = student ? { student } : {};
    // Let's populate the student data if we want, but since they're string IDs we might just return them
    // The frontend will likely fetch users and map them.
    const fees = await FeeRecord.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: fees.length, data: fees });
  } catch (error) {
    console.error('Error in getAllFees:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve fees', error: error.message });
  }
};

// @desc    Create a fee record
// @route   POST /api/fees
// @access  Private (Admin)
exports.createFee = async (req, res) => {
  try {
    const { student, semester, type, amount, dueDate, description } = req.body;

    if (!student || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Please provide student, amount and dueDate' });
    }

    if (isJsonDB()) {
      if (!global.jsonDB.feerecords) global.jsonDB.feerecords = [];
      const newFee = {
        _id: generateId(),
        student,
        semester: semester || 'Semester 1',
        type: type || 'Tuition Fee',
        amount: Number(amount),
        dueDate: new Date(dueDate).toISOString(),
        status: 'pending',
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      global.jsonDB.feerecords.push(newFee);
      global.jsonDB.save();
      return res.status(201).json({ success: true, data: newFee });
    }

    const fee = await FeeRecord.create({
      student,
      semester,
      type,
      amount,
      dueDate,
      description
    });

    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    console.error('Error in createFee:', error);
    res.status(500).json({ success: false, message: 'Failed to create fee', error: error.message });
  }
};

// @desc    Update a fee record
// @route   PUT /api/fees/:id
// @access  Private (Admin)
exports.updateFee = async (req, res) => {
  try {
    const { amount, dueDate, status, type, semester, description } = req.body;

    if (isJsonDB()) {
      if (!global.jsonDB.feerecords) global.jsonDB.feerecords = [];
      const feeIndex = global.jsonDB.feerecords.findIndex(f => f._id === req.params.id);

      if (feeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Fee not found' });
      }

      const fee = global.jsonDB.feerecords[feeIndex];
      if (amount !== undefined) fee.amount = Number(amount);
      if (dueDate) fee.dueDate = new Date(dueDate).toISOString();
      if (status) fee.status = status;
      if (type) fee.type = type;
      if (semester) fee.semester = semester;
      if (description !== undefined) fee.description = description;
      fee.updatedAt = new Date().toISOString();

      if (status === 'paid' && !fee.paymentDate) {
         fee.paymentDate = new Date().toISOString();
         if (!fee.transactionId) fee.transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      }

      global.jsonDB.save();
      return res.status(200).json({ success: true, data: global.jsonDB.feerecords[feeIndex] });
    }

    let fee = await FeeRecord.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    if (amount !== undefined) fee.amount = amount;
    if (dueDate) fee.dueDate = dueDate;
    if (status) fee.status = status;
    if (type) fee.type = type;
    if (semester) fee.semester = semester;
    if (description !== undefined) fee.description = description;

    if (status === 'paid' && !fee.paymentDate) {
       fee.paymentDate = new Date();
       if (!fee.transactionId) fee.transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    }

    await fee.save();

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    console.error('Error in updateFee:', error);
    res.status(500).json({ success: false, message: 'Failed to update fee', error: error.message });
  }
};

// @desc    Delete a fee record
// @route   DELETE /api/fees/:id
// @access  Private (Admin)
exports.deleteFee = async (req, res) => {
  try {
    if (isJsonDB()) {
      if (!global.jsonDB.feerecords) global.jsonDB.feerecords = [];
      const feeIndex = global.jsonDB.feerecords.findIndex(f => f._id === req.params.id);

      if (feeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Fee not found' });
      }

      global.jsonDB.feerecords.splice(feeIndex, 1);
      global.jsonDB.save();
      return res.status(200).json({ success: true, data: {} });
    }

    const fee = await FeeRecord.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    await FeeRecord.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error in deleteFee:', error);
    res.status(500).json({ success: false, message: 'Failed to delete fee', error: error.message });
  }
};
