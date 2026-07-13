const Leave = require('../models/Leave');
const { validationResult } = require('express-validator');

const isJsonDB = () => global.jsonDB !== undefined;

// Helper function to calculate total days between dates
const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { leaveType, startDate, endDate, reason, classId, attachments } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Calculate total days
    const totalDays = calculateTotalDays(startDate, endDate);

    // Handle empty classId - convert to null
    const processedClassId = classId && classId.trim() !== '' ? classId : null;

    if (isJsonDB()) {
      // JSON DB Mode
      const leaveId = `LEAVE-${Date.now()}`;
      const leave = {
        _id: leaveId,
        applicantId: userId,
        applicantType: userRole === 'student' ? 'student' : 'teacher',
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalDays,
        reason,
        status: 'pending',
        approvedBy: null,
        approvedAt: null,
        remarks: '',
        attachments: attachments || [],
        classId: processedClassId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!global.jsonDB.leaves) global.jsonDB.leaves = [];
      global.jsonDB.leaves.push(leave);
      global.jsonDB.save();

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: leave
      });
    }

    // MongoDB Mode
    const leave = await Leave.create({
      applicantId: userId,
      applicantType: userRole === 'student' ? 'student' : 'teacher',
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      classId: processedClassId,
      attachments: attachments || []
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit leave application'
    });
  }
};

// Get all leave applications (for teachers/admins)
const getAllLeaves = async (req, res) => {
  try {
    const { status, applicantType, classId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    if (isJsonDB()) {
      // JSON DB Mode
      let leaves = global.jsonDB.leaves || [];

      // Filter based on role
      if (userRole === 'student') {
        leaves = leaves.filter(l => l.applicantId === userId);
      } else if (userRole === 'teacher') {
        // Teachers can see leaves from their classes
        if (classId) {
          leaves = leaves.filter(l => l.classId === classId);
        }
      }

      // Apply additional filters
      if (status) {
        leaves = leaves.filter(l => l.status === status);
      }
      if (applicantType) {
        leaves = leaves.filter(l => l.applicantType === applicantType);
      }

      // Populate user details
      const leavesWithUsers = leaves.map(leave => {
        const applicant = global.jsonDB.users.find(u => u._id === leave.applicantId);
        const approver = leave.approvedBy ? global.jsonDB.users.find(u => u._id === leave.approvedBy) : null;
        return {
          ...leave,
          applicant: applicant ? { name: applicant.name, email: applicant.email } : null,
          approvedBy: approver ? { name: approver.name, email: approver.email } : null
        };
      });

      return res.status(200).json({
        success: true,
        data: leavesWithUsers
      });
    }

    // MongoDB Mode
    let query = {};

    if (userRole === 'student') {
      query.applicantId = userId;
    } else if (userRole === 'teacher' && classId) {
      query.classId = classId;
    }

    if (status) query.status = status;
    if (applicantType) query.applicantType = applicantType;

    const leaves = await Leave.find(query)
      .populate('applicantId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('classId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave applications'
    });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      const leave = global.jsonDB.leaves?.find(l => l._id === id);
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave application not found'
        });
      }

      const applicant = global.jsonDB.users.find(u => u._id === leave.applicantId);
      const approver = leave.approvedBy ? global.jsonDB.users.find(u => u._id === leave.approvedBy) : null;

      return res.status(200).json({
        success: true,
        data: {
          ...leave,
          applicant: applicant ? { name: applicant.name, email: applicant.email } : null,
          approvedBy: approver ? { name: approver.name, email: approver.email } : null
        }
      });
    }

    const leave = await Leave.findById(id)
      .populate('applicantId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('classId', 'name code');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave application'
    });
  }
};

// Approve/Reject leave
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    if (isJsonDB()) {
      const leaveIndex = global.jsonDB.leaves?.findIndex(l => l._id === id);
      if (leaveIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Leave application not found'
        });
      }

      global.jsonDB.leaves[leaveIndex].status = status;
      global.jsonDB.leaves[leaveIndex].approvedBy = req.user.id;
      global.jsonDB.leaves[leaveIndex].approvedAt = new Date().toISOString();
      global.jsonDB.leaves[leaveIndex].remarks = remarks || '';
      global.jsonDB.leaves[leaveIndex].updatedAt = new Date().toISOString();
      global.jsonDB.save();

      return res.status(200).json({
        success: true,
        message: `Leave ${status} successfully`,
        data: global.jsonDB.leaves[leaveIndex]
      });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    leave.remarks = remarks || '';
    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      data: leave
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status'
    });
  }
};

// Delete leave application
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      const leaveIndex = global.jsonDB.leaves?.findIndex(l => l._id === id);
      if (leaveIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Leave application not found'
        });
      }

      // Only allow deletion if status is pending
      if (global.jsonDB.leaves[leaveIndex].status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete leave that has been processed'
        });
      }

      global.jsonDB.leaves.splice(leaveIndex, 1);
      global.jsonDB.save();

      return res.status(200).json({
        success: true,
        message: 'Leave application deleted successfully'
      });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete leave that has been processed'
      });
    }

    await Leave.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Leave application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave application'
    });
  }
};

// Check if student is on leave for a specific date
const checkLeaveForDate = async (studentId, date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (isJsonDB()) {
    const leaves = global.jsonDB.leaves?.filter(l => 
      l.applicantId === studentId && 
      l.status === 'approved' &&
      new Date(l.startDate) <= targetDate &&
      new Date(l.endDate) >= targetDate
    );
    return leaves.length > 0;
  }

  const leave = await Leave.findOne({
    applicantId: studentId,
    status: 'approved',
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate }
  });

  return !!leave;
};

module.exports = {
  applyLeave,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave,
  checkLeaveForDate
};
