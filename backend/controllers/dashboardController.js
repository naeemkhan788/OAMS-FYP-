const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } = require('date-fns');
const mongoose = require('mongoose');

const isJsonDB = () => global.jsonDB !== undefined;

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // JSON DB Mode
    if (isJsonDB()) {
      const classes = global.jsonDB.classes.filter(c => c.teacher === teacherId);
      const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);

      const today = new Date();
      const todayAttendance = global.jsonDB.attendance.filter(a =>
        a.teacher === teacherId &&
        new Date(a.date) >= startOfDay(today) &&
        new Date(a.date) <= endOfDay(today)
      );

      const attendanceStats = {
        total: todayAttendance.length,
        present: todayAttendance.filter(a => a.status === 'present').length,
        absent: todayAttendance.filter(a => a.status === 'absent').length,
        leave: todayAttendance.filter(a => a.status === 'leave').length
      };

      attendanceStats.percentage = attendanceStats.total > 0 ?
        ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) : 0;

      const recentMarks = global.jsonDB.marks
        .filter(m => m.teacher === teacherId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const upcomingAssessments = global.jsonDB.marks
        .filter(m => m.teacher === teacherId && new Date(m.assessmentDate) >= today && !m.isPublished)
        .sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate))
        .slice(0, 5);

      const monthlyAttendance = global.jsonDB.attendance
        .filter(a => a.teacher === teacherId && new Date(a.date) >= startOfMonth(today) && new Date(a.date) <= endOfMonth(today))
        .reduce((acc, a) => {
          const dateKey = new Date(a.date).toISOString().split('T')[0];
          if (!acc[dateKey]) acc[dateKey] = { present: 0, absent: 0, leave: 0 };
          if (a.status === 'present') acc[dateKey].present++;
          if (a.status === 'absent') acc[dateKey].absent++;
          if (a.status === 'leave') acc[dateKey].leave++;
          return acc;
        }, {});

      const monthlyAttendanceArray = Object.entries(monthlyAttendance).map(([date, stats]) => ({
        _id: date,
        ...stats
      })).sort((a, b) => a._id.localeCompare(b._id));

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalClasses: classes.length,
            totalStudents,
            attendanceStats,
            pendingAssessments: upcomingAssessments.length
          },
          classes,
          recentMarks,
          upcomingAssessments,
          monthlyAttendance: monthlyAttendanceArray
        }
      });
    }

    // MongoDB Mode
    const classes = await Class.find({ teacher: teacherId })
      .populate('students', 'name studentId email')
      .select('name code grade section students');

    const totalStudents = classes.reduce((sum, cls) => sum + cls.students.length, 0);

    const today = new Date();
    const todayAttendance = await Attendance.find({
      teacher: teacherId,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });

    const attendanceStats = {
      total: todayAttendance.length,
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      leave: todayAttendance.filter(a => a.status === 'leave').length
    };

    attendanceStats.percentage = attendanceStats.total > 0 ?
      ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) : 0;

    const recentMarks = await Marks.find({ teacher: teacherId })
      .populate('student', 'name studentId')
      .populate('class', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    const upcomingAssessments = await Marks.find({
      teacher: teacherId,
      assessmentDate: { $gte: today },
      isPublished: false
    })
    .populate('class', 'name code')
    .sort({ assessmentDate: 1 })
    .limit(5);

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          teacher: new mongoose.Types.ObjectId(teacherId),
          date: {
            $gte: startOfMonth(today),
            $lte: endOfMonth(today)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalClasses: classes.length,
          totalStudents,
          attendanceStats,
          pendingAssessments: upcomingAssessments.length
        },
        classes,
        recentMarks,
        upcomingAssessments,
        monthlyAttendance
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher dashboard data'
    });
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // JSON DB Mode
    if (isJsonDB()) {
      const student = global.jsonDB.users.find(u => u._id === studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const today = new Date();
      const todayAttendance = global.jsonDB.attendance.find(a =>
        a.student === studentId &&
        new Date(a.date) >= startOfDay(today) &&
        new Date(a.date) <= endOfDay(today)
      );

      const last30Days = subDays(today, 30);
      const recentAttendance = global.jsonDB.attendance.filter(a =>
        a.student === studentId &&
        new Date(a.date) >= startOfDay(last30Days) &&
        new Date(a.date) <= endOfDay(today)
      ).map(a => {
        const classDoc = global.jsonDB.classes.find(c => c._id === a.class);
        const teacher = global.jsonDB.users.find(u => u._id === (classDoc?.teacher || a.teacher));
        return {
          ...a,
          class: classDoc,
          teacher: teacher
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      const attendanceStats = {
        total: recentAttendance.length,
        present: recentAttendance.filter(a => a.status === 'present').length,
        absent: recentAttendance.filter(a => a.status === 'absent').length,
        leave: recentAttendance.filter(a => a.status === 'leave').length
      };

      attendanceStats.percentage = attendanceStats.total > 0 ?
        ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) : 0;

      const recentMarks = global.jsonDB.marks
        .filter(m => m.student === studentId && m.isPublished)
        .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))
        .slice(0, 10)
        .map(mark => {
          const teacher = global.jsonDB.users.find(u => u._id === mark.teacher);
          return {
            ...mark,
            teacher: teacher ? { _id: teacher._id, name: teacher.name } : null
          };
        });

      const studentMarks = global.jsonDB.marks.filter(m => m.student === studentId && m.isPublished);
      const marksStats = studentMarks.length > 0 ? {
        averagePercentage: (studentMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / studentMarks.length).toFixed(2),
        totalAssessments: studentMarks.length,
        highestMark: Math.max(...studentMarks.map(m => m.percentage || 0)),
        lowestMark: Math.min(...studentMarks.map(m => m.percentage || 0))
      } : {
        averagePercentage: 0,
        totalAssessments: 0,
        highestMark: 0,
        lowestMark: 0
      };

      const gradeDistribution = studentMarks.reduce((acc, m) => {
        const grade = m.grade || 'N/A';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {});

      const monthlyAttendance = global.jsonDB.attendance
        .filter(a => a.student === studentId && new Date(a.date) >= startOfMonth(today) && new Date(a.date) <= endOfMonth(today))
        .reduce((acc, a) => {
          const dateKey = new Date(a.date).toISOString().split('T')[0];
          if (!acc[dateKey]) acc[dateKey] = { status: a.status };
          return acc;
        }, {});

      const monthlyAttendanceArray = Object.entries(monthlyAttendance).map(([date, data]) => ({
        _id: date,
        ...data
      })).sort((a, b) => a._id.localeCompare(b._id));

      return res.status(200).json({
        success: true,
        data: {
          student,
          todayAttendance,
          stats: {
            attendanceStats,
            marksStats,
          recentAttendance,
            gradeDistribution
          },
          recentMarks,
          monthlyAttendance: monthlyAttendanceArray
        }
      });
    }

    // MongoDB Mode
    let student = await User.findById(studentId)
      .populate('class', 'name code grade section teacher')
      .populate('class.teacher', 'name email');

    if (student && !student.class) {
      const fallbackClass = await Class.findOne({ students: studentId })
        .populate('teacher', 'name email');
      if (fallbackClass) {
        student = student.toObject();
        student.class = fallbackClass;
      }
    }

    const today = new Date();
    const todayAttendance = await Attendance.findOne({
      student: studentId,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });

    const last30Days = subDays(today, 30);
    const recentAttendance = await Attendance.find({
      student: studentId,
      date: {
        $gte: startOfDay(last30Days),
        $lte: endOfDay(today)
      }
    }).populate('class', 'name code teacher')
     .populate('teacher', 'name');

    const attendanceStats = {
      total: recentAttendance.length,
      present: recentAttendance.filter(a => a.status === 'present').length,
      absent: recentAttendance.filter(a => a.status === 'absent').length,
      leave: recentAttendance.filter(a => a.status === 'leave').length
    };

    attendanceStats.percentage = attendanceStats.total > 0 ?
      ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) : 0;

    const recentMarks = await Marks.find({
      student: studentId,
      isPublished: true
    })
    .populate('class', 'name code')
    .populate('teacher', 'name')
    .sort({ assessmentDate: -1 })
    .limit(10);

    const marksStats = await Marks.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId), isPublished: true } },
      {
        $group: {
          _id: null,
          averagePercentage: { $avg: '$percentage' },
          totalAssessments: { $sum: 1 },
          highestMark: { $max: '$percentage' },
          lowestMark: { $min: '$percentage' }
        }
      }
    ]);

    const gradeDistribution = await Marks.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId), isPublished: true } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: {
            $gte: startOfMonth(today),
            $lte: endOfMonth(today)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          status: { $first: '$status' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        student,
        todayAttendance,
        stats: {
          attendanceStats,
          marksStats: marksStats[0] || {
            averagePercentage: 0,
            totalAssessments: 0,
            highestMark: 0,
            lowestMark: 0
          },
          gradeDistribution
        },
        recentMarks,
        recentAttendance,
        monthlyAttendance
      }
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student dashboard data'
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    // JSON DB Mode
    if (isJsonDB()) {
      const totalUsers = global.jsonDB.users.filter(u => u.isActive !== false).length;
      const students = global.jsonDB.users.filter(u => u.role === 'student' && u.isActive !== false).length;
      const teachers = global.jsonDB.users.filter(u => u.role === 'teacher' && u.isActive !== false).length;
      const admins = global.jsonDB.users.filter(u => u.role === 'admin' && u.isActive !== false).length;
      const totalClasses = global.jsonDB.classes.filter(c => c.isActive !== false).length;

      const today = new Date();
      const todayAttendance = global.jsonDB.attendance.filter(a =>
        new Date(a.date) >= startOfDay(today) &&
        new Date(a.date) <= endOfDay(today)
      );

      const attendanceStats = {
        total: todayAttendance.length,
        present: todayAttendance.filter(a => a.status === 'present').length,
        absent: todayAttendance.filter(a => a.status === 'absent').length,
        leave: todayAttendance.filter(a => a.status === 'leave').length
      };

      attendanceStats.percentage = attendanceStats.total > 0 ?
        ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) : 0;

      const last30Days = subDays(today, 30);
      const monthlyAttendance = global.jsonDB.attendance
        .filter(a => new Date(a.date) >= startOfDay(last30Days) && new Date(a.date) <= endOfDay(today))
        .reduce((acc, a) => {
          const dateKey = new Date(a.date).toISOString().split('T')[0];
          if (!acc[dateKey]) acc[dateKey] = { present: 0, absent: 0, leave: 0 };
          if (a.status === 'present') acc[dateKey].present++;
          if (a.status === 'absent') acc[dateKey].absent++;
          if (a.status === 'leave') acc[dateKey].leave++;
          return acc;
        }, {});

      const monthlyAttendanceArray = Object.entries(monthlyAttendance).map(([date, stats]) => ({
        _id: date,
        ...stats
      })).sort((a, b) => a._id.localeCompare(b._id));

      const classStats = global.jsonDB.classes.map(c => ({
        name: c.name,
        code: c.code,
        grade: c.grade,
        section: c.section,
        studentCount: c.students?.length || 0
      })).sort((a, b) => (a.grade || 0) - (b.grade || 0) || (a.section || '').localeCompare(b.section || ''));

      const recentUsers = global.jsonDB.users
        .filter(u => u.isActive !== false)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(u => ({ name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));

      const gradeDistribution = global.jsonDB.marks
        .filter(m => m.isPublished)
        .reduce((acc, m) => {
          const grade = m.grade || 'N/A';
          acc[grade] = (acc[grade] || 0) + 1;
          return acc;
        }, {});

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalUsers,
            students,
            teachers,
            admins,
            totalClasses,
            attendanceStats
          },
          monthlyAttendance: monthlyAttendanceArray,
          classStats,
          recentUsers,
          gradeDistribution
        }
      });
    }

    // MongoDB Mode
    const totalUsers = await User.countDocuments({ isActive: true });
    const students = await User.countDocuments({ role: 'student', isActive: true });
    const teachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const admins = await User.countDocuments({ role: 'admin', isActive: true });
    const totalClasses = await Class.countDocuments({ isActive: true });

    const today = new Date();
    const todayAttendance = await Attendance.find({
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });

    const attendanceStats = {
      total: todayAttendance.length,
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      leave: todayAttendance.filter(a => a.status === 'leave').length
    };

    attendanceStats.percentage = attendanceStats.total > 0 ?
      ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) : 0;

    const last30Days = subDays(today, 30);
    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay(last30Days),
            $lte: endOfDay(today)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const classStats = await Class.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'students',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          grade: 1,
          section: 1,
          studentCount: { $size: '$studentDetails' }
        }
      },
      { $sort: { grade: 1, section: 1 } }
    ]);

    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const gradeDistribution = await Marks.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          students,
          teachers,
          admins,
          totalClasses,
          attendanceStats
        },
        monthlyAttendance,
        classStats,
        recentUsers,
        gradeDistribution
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin dashboard data'
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    switch (userRole) {
      case 'teacher':
        return getTeacherDashboard(req, res);
      case 'student':
        return getStudentDashboard(req, res);
      case 'admin':
        return getAdminDashboard(req, res);
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats'
    });
  }
};

module.exports = {
  getTeacherDashboard,
  getStudentDashboard,
  getAdminDashboard,
  getDashboardStats
};
