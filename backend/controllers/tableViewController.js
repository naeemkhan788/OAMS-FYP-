const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { startOfDay, endOfDay } = require('date-fns');

// ===== USERS TABLE =====
const getUsersTable = async (req, res) => {
  try {
    const { role, page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .populate('class', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const tableData = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId || '-',
      teacherId: user.teacherId || '-',
      className: user.class?.name || '-',
      phone: user.phone || '-',
      address: user.address || '-',
      createdAt: user.createdAt,
      status: user.isActive !== false ? 'Active' : 'Inactive'
    }));

    res.status(200).json({
      success: true,
      message: 'Users table retrieved successfully',
      data: tableData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users table error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users table', error: error.message });
  }
};

// ===== CLASSES TABLE =====
const getClassesTable = async (req, res) => {
  try {
    const { page = 1, limit = 50, grade, section } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (grade) query.grade = parseInt(grade);
    if (section) query.section = section.toUpperCase();

    const total = await Class.countDocuments(query);
    const classes = await Class.find(query)
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email studentId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ grade: 1, section: 1 });

    const tableData = classes.map(cls => ({
      id: cls._id,
      name: cls.name,
      code: cls.code,
      grade: cls.grade,
      section: cls.section,
      teacher: cls.teacher?.name || '-',
      teacherEmail: cls.teacher?.email || '-',
      studentCount: cls.students?.length || 0,
      subjectCount: cls.subjects?.length || 0,
      createdAt: cls.createdAt,
      status: cls.isActive !== false ? 'Active' : 'Inactive'
    }));

    res.status(200).json({
      success: true,
      message: 'Classes table retrieved successfully',
      data: tableData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get classes table error:', error);
    res.status(500).json({ success: false, message: 'Error fetching classes table', error: error.message });
  }
};

// ===== ATTENDANCE TABLE =====
const getAttendanceTable = async (req, res) => {
  try {
    const { classId, date, status, page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (classId) query.class = classId;
    if (status) query.status = status;

    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: startOfDay(searchDate),
        $lte: endOfDay(searchDate)
      };
    }

    const total = await Attendance.countDocuments(query);
    const attendance = await Attendance.find(query)
      .populate('student', 'name email studentId class')
      .populate('class', 'name code')
      .populate('teacher', 'name email teacherId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, createdAt: -1 });

    const tableData = attendance.map(att => ({
      id: att._id,
      studentName: att.student?.name || '-',
      studentId: att.student?.studentId || '-',
      className: att.class?.name || '-',
      date: att.date,
      subject: att.subject || '-',
      status: att.status,
      checkInTime: att.checkInTime || '-',
      checkOutTime: att.checkOutTime || '-',
      isLate: att.isLate ? 'Yes' : 'No',
      lateMinutes: att.lateMinutes || '-',
      teacher: att.teacher?.name || '-',
      notes: att.notes || '-',
      markedAt: att.createdAt
    }));

    res.status(200).json({
      success: true,
      message: 'Attendance table retrieved successfully',
      data: tableData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      summary: {
        total,
        present: await Attendance.countDocuments({ ...query, status: 'present' }),
        absent: await Attendance.countDocuments({ ...query, status: 'absent' }),
        leave: await Attendance.countDocuments({ ...query, status: 'leave' })
      }
    });
  } catch (error) {
    console.error('Get attendance table error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance table', error: error.message });
  }
};

// ===== MARKS TABLE =====
const getMarksTable = async (req, res) => {
  try {
    const { classId, subject, studentId, page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (classId) query.class = classId;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (studentId) query.student = studentId;

    const total = await Marks.countDocuments(query);
    const marks = await Marks.find(query)
      .populate('student', 'name email studentId')
      .populate('class', 'name code')
      .populate('teacher', 'name email teacherId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ assessmentDate: -1 });

    const tableData = marks.map(mark => ({
      id: mark._id,
      studentName: mark.student?.name || '-',
      studentId: mark.student?.studentId || '-',
      className: mark.class?.name || '-',
      subject: mark.subject || '-',
      assessmentType: mark.assessmentType || '-',
      title: mark.title || '-',
      marksObtained: mark.marksObtained || 0,
      maxMarks: mark.maxMarks || 100,
      percentage: ((mark.marksObtained / mark.maxMarks) * 100).toFixed(2) + '%',
      grade: mark.grade || '-',
      teacher: mark.teacher?.name || '-',
      assessmentDate: mark.assessmentDate,
      remarks: mark.remarks || '-'
    }));

    res.status(200).json({
      success: true,
      message: 'Marks table retrieved successfully',
      data: tableData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get marks table error:', error);
    res.status(500).json({ success: false, message: 'Error fetching marks table', error: error.message });
  }
};

// ===== DASHBOARD SUMMARY TABLE =====
const getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalClasses = await Class.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    const totalMarks = await Marks.countDocuments();

    // Today's attendance
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todayAttendance = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd }
    }).distinct('student');

    const summaryData = [
      {
        metric: 'Total Users',
        value: totalUsers,
        type: 'users'
      },
      {
        metric: 'Total Students',
        value: totalStudents,
        type: 'students'
      },
      {
        metric: 'Total Teachers',
        value: totalTeachers,
        type: 'teachers'
      },
      {
        metric: 'Total Classes',
        value: totalClasses,
        type: 'classes'
      },
      {
        metric: 'Total Attendance Records',
        value: totalAttendance,
        type: 'attendance'
      },
      {
        metric: 'Total Marks Records',
        value: totalMarks,
        type: 'marks'
      },
      {
        metric: "Today's Attendance",
        value: todayAttendance.length,
        type: 'today'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: summaryData
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard summary', error: error.message });
  }
};

// ===== EXPORT TABLE DATA =====
const exportTableData = async (req, res) => {
  try {
    const { tableType } = req.params;
    const { filters } = req.body;

    let data = [];

    switch (tableType) {
      case 'users':
        data = await User.find(filters || {}).select('-password');
        break;
      case 'classes':
        data = await Class.find(filters || {}).populate('teacher students');
        break;
      case 'attendance':
        data = await Attendance.find(filters || {})
          .populate('student class teacher');
        break;
      case 'marks':
        data = await Marks.find(filters || {})
          .populate('student class teacher');
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid table type' });
    }

    res.status(200).json({
      success: true,
      message: `${tableType} data ready for export`,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Export table data error:', error);
    res.status(500).json({ success: false, message: 'Error exporting data', error: error.message });
  }
};

module.exports = {
  getUsersTable,
  getClassesTable,
  getAttendanceTable,
  getMarksTable,
  getDashboardSummary,
  exportTableData
};
