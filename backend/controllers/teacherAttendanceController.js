const TeacherAttendance = require('../models/TeacherAttendance');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const isJsonDB = () => global.jsonDB !== undefined;

/**
 * Mark attendance for teachers (Admin only)
 */
const markTeacherAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, attendanceData } = req.body;
    const adminId = req.user.id;

    // Ensure only admin can mark teacher attendance
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can mark teacher attendance'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    if (isJsonDB()) {
      if (!global.jsonDB.teacherAttendance) global.jsonDB.teacherAttendance = [];
      
      const results = [];
      
      for (const record of attendanceData) {
        const { teacherId, status, checkInTime, checkOutTime, notes } = record;
        
        // Check if attendance already exists for this teacher on this date
        const existingIndex = global.jsonDB.teacherAttendance.findIndex(
          a => a.teacher === teacherId && 
          new Date(a.date).toDateString() === attendanceDate.toDateString()
        );
        
        const attendanceRecord = {
          _id: require('crypto').randomUUID(),
          teacher: teacherId,
          date: attendanceDate.toISOString(),
          status,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
          notes: notes || '',
          markedBy: adminId,
          isLate: status === 'late',
          lateMinutes: status === 'late' ? 0 : 0,
          uniqueId: `${teacherId}-${attendanceDate.toISOString().split('T')[0]}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
          global.jsonDB.teacherAttendance[existingIndex] = attendanceRecord;
        } else {
          global.jsonDB.teacherAttendance.push(attendanceRecord);
        }
        
        results.push(attendanceRecord);
      }
      
      global.jsonDB.save();
      
      return res.status(200).json({
        success: true,
        message: 'Teacher attendance marked successfully',
        data: { attendance: results }
      });
    }

    // MongoDB Mode
    const results = [];
    
    for (const record of attendanceData) {
      const { teacherId, status, checkInTime, checkOutTime, notes } = record;
      
      // Check if attendance already exists for this teacher on this date
      const existingAttendance = await TeacherAttendance.findOne({
        teacher: teacherId,
        date: attendanceDate
      });
      
      if (existingAttendance) {
        existingAttendance.status = status;
        existingAttendance.checkInTime = checkInTime || null;
        existingAttendance.checkOutTime = checkOutTime || null;
        existingAttendance.notes = notes || '';
        existingAttendance.markedBy = adminId;
        existingAttendance.isLate = status === 'late';
        existingAttendance.updatedAt = new Date();
        await existingAttendance.save();
        results.push(existingAttendance);
      } else {
        const newAttendance = await TeacherAttendance.create({
          teacher: teacherId,
          date: attendanceDate,
          status,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
          notes: notes || '',
          markedBy: adminId,
          uniqueId: `${teacherId}-${attendanceDate.toISOString().split('T')[0]}`
        });
        results.push(newAttendance);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Teacher attendance marked successfully',
      data: { attendance: results }
    });
  } catch (error) {
    console.error('Mark teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while marking teacher attendance'
    });
  }
};

/**
 * Get teacher attendance for a specific date (Admin only)
 */
const getTeacherAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    if (isJsonDB()) {
      if (!global.jsonDB.teacherAttendance) global.jsonDB.teacherAttendance = [];
      
      const attendance = global.jsonDB.teacherAttendance.filter(
        a => new Date(a.date).toDateString() === attendanceDate.toDateString()
      );
      
      // Populate teacher data
      const populatedAttendance = attendance.map(att => {
        const teacher = global.jsonDB.users.find(u => u._id === att.teacher);
        const markedBy = global.jsonDB.users.find(u => u._id === att.markedBy);
        return {
          ...att,
          teacher: teacher ? { _id: teacher._id, name: teacher.name, email: teacher.email } : null,
          markedBy: markedBy ? { _id: markedBy._id, name: markedBy.name } : null
        };
      });
      
      return res.status(200).json({
        success: true,
        data: { attendance: populatedAttendance }
      });
    }

    // MongoDB Mode
    const attendance = await TeacherAttendance.find({ date: attendanceDate })
      .populate('teacher', 'name email')
      .populate('markedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { attendance }
    });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher attendance'
    });
  }
};

/**
 * Get teacher's own attendance (Teacher only)
 */
const getMyTeacherAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { startDate, endDate } = req.query;

    if (isJsonDB()) {
      if (!global.jsonDB.teacherAttendance) global.jsonDB.teacherAttendance = [];
      
      let attendance = global.jsonDB.teacherAttendance.filter(a => a.teacher === teacherId);
      
      if (startDate) {
        attendance = attendance.filter(a => new Date(a.date) >= new Date(startDate));
      }
      if (endDate) {
        attendance = attendance.filter(a => new Date(a.date) <= new Date(endDate));
      }
      
      attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Populate markedBy data
      const populatedAttendance = attendance.map(att => {
        const markedBy = global.jsonDB.users.find(u => u._id === att.markedBy);
        return {
          ...att,
          markedBy: markedBy ? { _id: markedBy._id, name: markedBy.name } : null
        };
      });
      
      return res.status(200).json({
        success: true,
        data: { attendance: populatedAttendance }
      });
    }

    // MongoDB Mode
    const query = { teacher: teacherId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendance = await TeacherAttendance.find(query)
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: { attendance }
    });
  } catch (error) {
    console.error('Get my teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your attendance'
    });
  }
};

/**
 * Get teacher attendance statistics (Admin only)
 */
const getTeacherAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (isJsonDB()) {
      if (!global.jsonDB.teacherAttendance) global.jsonDB.teacherAttendance = [];
      if (!global.jsonDB.users) global.jsonDB.users = [];
      
      let attendance = global.jsonDB.teacherAttendance;
      const teachers = global.jsonDB.users.filter(u => u.role === 'teacher');
      
      if (startDate) {
        attendance = attendance.filter(a => new Date(a.date) >= new Date(startDate));
      }
      if (endDate) {
        attendance = attendance.filter(a => new Date(a.date) <= new Date(endDate));
      }
      
      const totalTeachers = teachers.length;
      const present = attendance.filter(a => a.status === 'present').length;
      const absent = attendance.filter(a => a.status === 'absent').length;
      const late = attendance.filter(a => a.status === 'late').length;
      const leave = attendance.filter(a => a.status === 'leave').length;
      const totalRecords = attendance.length;
      const attendancePercentage = totalRecords > 0 ? ((present / totalRecords) * 100).toFixed(1) : 0;
      
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalTeachers,
            present,
            absent,
            late,
            leave,
            totalRecords,
            attendancePercentage: parseFloat(attendancePercentage)
          }
        }
      });
    }

    // MongoDB Mode
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const attendance = await TeacherAttendance.find(query);
    
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const leave = attendance.filter(a => a.status === 'leave').length;
    const totalRecords = attendance.length;
    const attendancePercentage = totalRecords > 0 ? ((present / totalRecords) * 100).toFixed(1) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTeachers,
          present,
          absent,
          late,
          leave,
          totalRecords,
          attendancePercentage: parseFloat(attendancePercentage)
        }
      }
    });
  } catch (error) {
    console.error('Get teacher attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher attendance statistics'
    });
  }
};

/**
 * Update teacher attendance (Admin only)
 */
const updateTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkInTime, checkOutTime, notes } = req.body;

    // Ensure only admin can update teacher attendance
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update teacher attendance'
      });
    }

    if (isJsonDB()) {
      const index = global.jsonDB.teacherAttendance.findIndex(a => a._id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }
      
      global.jsonDB.teacherAttendance[index].status = status;
      global.jsonDB.teacherAttendance[index].checkInTime = checkInTime || null;
      global.jsonDB.teacherAttendance[index].checkOutTime = checkOutTime || null;
      global.jsonDB.teacherAttendance[index].notes = notes || '';
      global.jsonDB.teacherAttendance[index].isLate = status === 'late';
      global.jsonDB.teacherAttendance[index].updatedAt = new Date().toISOString();
      
      global.jsonDB.save();
      
      return res.status(200).json({
        success: true,
        message: 'Teacher attendance updated successfully'
      });
    }

    // MongoDB Mode
    const attendance = await TeacherAttendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    attendance.status = status;
    attendance.checkInTime = checkInTime || null;
    attendance.checkOutTime = checkOutTime || null;
    attendance.notes = notes || '';
    attendance.isLate = status === 'late';
    attendance.updatedAt = new Date();
    
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: 'Teacher attendance updated successfully'
    });
  } catch (error) {
    console.error('Update teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating teacher attendance'
    });
  }
};

/**
 * Delete teacher attendance (Admin only)
 */
const deleteTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure only admin can delete teacher attendance
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete teacher attendance'
      });
    }

    if (isJsonDB()) {
      const index = global.jsonDB.teacherAttendance.findIndex(a => a._id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }
      
      global.jsonDB.teacherAttendance.splice(index, 1);
      global.jsonDB.save();
      
      return res.status(200).json({
        success: true,
        message: 'Teacher attendance deleted successfully'
      });
    }

    // MongoDB Mode
    const attendance = await TeacherAttendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    await attendance.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Teacher attendance deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting teacher attendance'
    });
  }
};

/**
 * Get all teachers for attendance marking (Admin only)
 */
const getAllTeachers = async (req, res) => {
  try {
    if (isJsonDB()) {
      if (!global.jsonDB.users) global.jsonDB.users = [];
      
      const teachers = global.jsonDB.users.filter(u => u.role === 'teacher');
      
      return res.status(200).json({
        success: true,
        data: { teachers }
      });
    }

    // MongoDB Mode
    const teachers = await User.find({ role: 'teacher' })
      .select('_id name email status')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: { teachers }
    });
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teachers'
    });
  }
};

module.exports = {
  markTeacherAttendance,
  getTeacherAttendanceByDate,
  getMyTeacherAttendance,
  getTeacherAttendanceStats,
  updateTeacherAttendance,
  deleteTeacherAttendance,
  getAllTeachers
};
