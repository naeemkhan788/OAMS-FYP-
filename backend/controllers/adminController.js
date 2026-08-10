const User = require('../models/User');
const TeacherAttendance = require('../models/TeacherAttendance');
const { sendTeacherApprovalEmail } = require('../utils/email');
const { startOfDay, endOfDay } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

const isJsonDB = () => global.jsonDB !== undefined;

/**
 * Get all pending teacher registrations
 * Admin only endpoint
 */
const getPendingTeachers = async (req, res) => {
  try {
    if (isJsonDB()) {
      const pendingTeachers = global.jsonDB.users.filter(
        u => u.role === 'teacher' && u.status === 'pending'
      );

      return res.status(200).json({
        success: true,
        count: pendingTeachers.length,
        data: pendingTeachers.map(teacher => ({
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          status: teacher.status,
          isVerified: teacher.isVerified,
          createdAt: teacher.createdAt
        }))
      });
    }

    // MongoDB Mode
    const pendingTeachers = await User.find({
      role: 'teacher',
      status: 'pending'
    }).select('-password');

    res.status(200).json({
      success: true,
      count: pendingTeachers.length,
      data: pendingTeachers
    });
  } catch (error) {
    console.error('Error fetching pending teachers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending teachers'
    });
  }
};

/**
 * Approve a teacher registration
 * Admin only endpoint
 */
const approveTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      const teacherIndex = global.jsonDB.users.findIndex(
        u => u._id === id && u.role === 'teacher'
      );

      if (teacherIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      const teacher = global.jsonDB.users[teacherIndex];
      teacher.status = 'approved';
      global.jsonDB.save();

      // Send approval email
      await sendTeacherApprovalEmail(teacher.email, teacher.name, 'approved');

      return res.status(200).json({
        success: true,
        message: 'Teacher approved successfully',
        data: {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          status: teacher.status
        }
      });
    }

    // MongoDB Mode
    const teacher = await User.findOne({ _id: id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    teacher.status = 'approved';
    await teacher.save();

    // Send approval email
    await sendTeacherApprovalEmail(teacher.email, teacher.name, 'approved');

    res.status(200).json({
      success: true,
      message: 'Teacher approved successfully',
      data: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        status: teacher.status
      }
    });
  } catch (error) {
    console.error('Error approving teacher:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve teacher'
    });
  }
};

/**
 * Reject a teacher registration
 * Admin only endpoint
 */
const rejectTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (isJsonDB()) {
      const teacherIndex = global.jsonDB.users.findIndex(
        u => u._id === id && u.role === 'teacher'
      );

      if (teacherIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      const teacher = global.jsonDB.users[teacherIndex];
      teacher.status = 'rejected';
      teacher.remarks = remarks || '';
      global.jsonDB.save();

      // Send rejection email
      await sendTeacherApprovalEmail(teacher.email, teacher.name, 'rejected');

      return res.status(200).json({
        success: true,
        message: 'Teacher rejected successfully',
        data: {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          status: teacher.status
        }
      });
    }

    // MongoDB Mode
    const teacher = await User.findOne({ _id: id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    teacher.status = 'rejected';
    teacher.remarks = remarks || '';
    await teacher.save();

    // Send rejection email
    await sendTeacherApprovalEmail(teacher.email, teacher.name, 'rejected');

    res.status(200).json({
      success: true,
      message: 'Teacher rejected successfully',
      data: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        status: teacher.status
      }
    });
  } catch (error) {
    console.error('Error rejecting teacher:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject teacher'
    });
  }
};

/**
 * Get all teachers (for admin view)
 * Admin only endpoint
 */
const getAllTeachers = async (req, res) => {
  try {
    if (isJsonDB()) {
      const teachers = global.jsonDB.users.filter(u => u.role === 'teacher');

      return res.status(200).json({
        success: true,
        count: teachers.length,
        data: teachers.map(teacher => ({
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          status: teacher.status,
          isVerified: teacher.isVerified,
          createdAt: teacher.createdAt
        }))
      });
    }

    // MongoDB Mode
    const teachers = await User.find({ role: 'teacher' }).select('-password');

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teachers'
    });
  }
};

/**
 * Mark teacher attendance
 * Admin only endpoint
 */
const markTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, date, status, notes, checkInTime, checkOutTime } = req.body;
    const adminId = req.user.id;

    if (!teacherId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID, date, and status are required'
      });
    }

    const attendanceDate = new Date(date);

    if (isJsonDB()) {
      const teacher = global.jsonDB.users.find(u => u._id === teacherId && u.role === 'teacher');
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check for existing attendance record
      const existingIndex = global.jsonDB.teacherAttendance?.findIndex(a =>
        a.teacher === teacherId &&
        new Date(a.date) >= startOfDay(attendanceDate) &&
        new Date(a.date) <= endOfDay(attendanceDate)
      );

      if (existingIndex !== -1) {
        // Update existing record
        global.jsonDB.teacherAttendance[existingIndex].status = status;
        global.jsonDB.teacherAttendance[existingIndex].notes = notes;
        global.jsonDB.teacherAttendance[existingIndex].checkInTime = checkInTime ? new Date(checkInTime) : global.jsonDB.teacherAttendance[existingIndex].checkInTime;
        global.jsonDB.teacherAttendance[existingIndex].checkOutTime = checkOutTime ? new Date(checkOutTime) : global.jsonDB.teacherAttendance[existingIndex].checkOutTime;
        global.jsonDB.teacherAttendance[existingIndex].markedBy = adminId;
        global.jsonDB.teacherAttendance[existingIndex].updatedAt = new Date();
        global.jsonDB.save();

        return res.status(200).json({
          success: true,
          message: 'Teacher attendance updated successfully',
          data: global.jsonDB.teacherAttendance[existingIndex]
        });
      }

      // Create new record
      if (!global.jsonDB.teacherAttendance) {
        global.jsonDB.teacherAttendance = [];
      }

      const newAttendance = {
        _id: uuidv4(),
        teacher: teacherId,
        date: attendanceDate,
        status,
        notes,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        markedBy: adminId,
        isLate: false,
        lateMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check if late
      if (newAttendance.checkInTime) {
        const workStartTime = new Date(newAttendance.checkInTime);
        workStartTime.setHours(9, 0, 0, 0);
        if (newAttendance.checkInTime > workStartTime) {
          newAttendance.isLate = true;
          newAttendance.lateMinutes = Math.floor((newAttendance.checkInTime - workStartTime) / (1000 * 60));
        }
      }

      global.jsonDB.teacherAttendance.push(newAttendance);
      global.jsonDB.save();

      return res.status(200).json({
        success: true,
        message: 'Teacher attendance marked successfully',
        data: newAttendance
      });
    }

    // MongoDB Mode
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check for existing attendance record
    const existingAttendance = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: {
        $gte: startOfDay(attendanceDate),
        $lte: endOfDay(attendanceDate)
      }
    });

    if (existingAttendance) {
      // Update existing record
      existingAttendance.status = status;
      existingAttendance.notes = notes;
      if (checkInTime) existingAttendance.checkInTime = new Date(checkInTime);
      if (checkOutTime) existingAttendance.checkOutTime = new Date(checkOutTime);
      existingAttendance.markedBy = adminId;
      await existingAttendance.save();

      return res.status(200).json({
        success: true,
        message: 'Teacher attendance updated successfully',
        data: existingAttendance
      });
    }

    // Create new record
    const newAttendance = await TeacherAttendance.create({
      teacher: teacherId,
      date: attendanceDate,
      status,
      notes,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      markedBy: adminId
    });

    res.status(200).json({
      success: true,
      message: 'Teacher attendance marked successfully',
      data: newAttendance
    });
  } catch (error) {
    console.error('Error marking teacher attendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark teacher attendance'
    });
  }
};

/**
 * Get teacher attendance records
 * Admin only endpoint
 */
const getTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, startDate, endDate } = req.query;

    if (isJsonDB()) {
      let attendance = global.jsonDB.teacherAttendance || [];

      if (teacherId) {
        attendance = attendance.filter(a => a.teacher === teacherId);
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        attendance = attendance.filter(a =>
          new Date(a.date) >= startOfDay(start) &&
          new Date(a.date) <= endOfDay(end)
        );
      }

      // Populate teacher data
      attendance = attendance.map(a => ({
        ...a,
        teacher: global.jsonDB.users.find(u => u._id === a.teacher)
      })).filter(a => a.teacher);

      return res.status(200).json({
        success: true,
        count: attendance.length,
        data: attendance
      });
    }

    // MongoDB Mode
    const query = {};
    if (teacherId) {
      query.teacher = teacherId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate))
      };
    }

    const attendance = await TeacherAttendance.find(query)
      .populate('teacher', 'name email')
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teacher attendance'
    });
  }
};

/**
 * Add note to teacher
 * Admin only endpoint
 */
const addTeacherNote = async (req, res) => {
  try {
    const { teacherId, note } = req.body;
    const adminId = req.user.id;

    if (!teacherId || !note) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and note are required'
      });
    }

    if (isJsonDB()) {
      const teacherIndex = global.jsonDB.users.findIndex(
        u => u._id === teacherId && u.role === 'teacher'
      );

      if (teacherIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      const teacher = global.jsonDB.users[teacherIndex];
      
      // Initialize notes array if it doesn't exist
      if (!teacher.adminNotes) {
        teacher.adminNotes = [];
      }

      // Add new note
      teacher.adminNotes.push({
        _id: uuidv4(),
        note,
        addedBy: adminId,
        addedAt: new Date()
      });

      global.jsonDB.save();

      return res.status(200).json({
        success: true,
        message: 'Note added successfully',
        data: {
          teacherId: teacher._id,
          teacherName: teacher.name,
          note: teacher.adminNotes[teacher.adminNotes.length - 1]
        }
      });
    }

    // MongoDB Mode
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Initialize notes array if it doesn't exist
    if (!teacher.adminNotes) {
      teacher.adminNotes = [];
    }

    // Add new note
    teacher.adminNotes.push({
      note,
      addedBy: adminId,
      addedAt: new Date()
    });

    await teacher.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: {
        teacherId: teacher._id,
        teacherName: teacher.name,
        note: teacher.adminNotes[teacher.adminNotes.length - 1]
      }
    });
  } catch (error) {
    console.error('Error adding teacher note:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add note'
    });
  }
};

/**
 * Get teacher notes
 * Admin only endpoint
 */
const getTeacherNotes = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (isJsonDB()) {
      const teacher = global.jsonDB.users.find(
        u => u._id === teacherId && u.role === 'teacher'
      );

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      const notes = teacher.adminNotes || [];

      // Populate addedBy data
      const populatedNotes = notes.map(note => ({
        ...note,
        addedBy: global.jsonDB.users.find(u => u._id === note.addedBy)
      }));

      return res.status(200).json({
        success: true,
        count: populatedNotes.length,
        data: populatedNotes
      });
    }

    // MongoDB Mode
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
      .populate('adminNotes.addedBy', 'name email');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const notes = teacher.adminNotes || [];

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching teacher notes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teacher notes'
    });
  }
};

module.exports = {
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getAllTeachers,
  markTeacherAttendance,
  getTeacherAttendance,
  addTeacherNote,
  getTeacherNotes
};
