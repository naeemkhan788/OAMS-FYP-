const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const TeacherAttendance = require('../models/TeacherAttendance');
const { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');

const isJsonDB = () => global.jsonDB !== undefined;

const getAnalyticsData = async (req, res) => {
  try {
    console.log('Fetching analytics data');

    if (isJsonDB()) {
      // JSON DB Mode
      const totalStudents = global.jsonDB.users.filter(u => u.role === 'student').length;
      const totalTeachers = global.jsonDB.users.filter(u => u.role === 'teacher').length;
      const totalClasses = global.jsonDB.classes.length;

      const today = new Date();
      const todayAttendance = global.jsonDB.attendance.filter(a => 
        new Date(a.date) >= startOfDay(today) && new Date(a.date) <= endOfDay(today)
      );
      
      const attendanceStats = {
        total: todayAttendance.length,
        present: todayAttendance.filter(a => a.status === 'present').length,
        absent: todayAttendance.filter(a => a.status === 'absent').length,
        leave: todayAttendance.filter(a => a.status === 'leave').length
      };
      attendanceStats.percentage = attendanceStats.total > 0 
        ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) 
        : 0;

      // Last 30 days attendance trend
      const last30Days = subDays(today, 30);
      const attendanceTrend = global.jsonDB.attendance
        .filter(a => new Date(a.date) >= startOfDay(last30Days))
        .reduce((acc, a) => {
          const dateKey = new Date(a.date).toISOString().split('T')[0];
          if (!acc[dateKey]) acc[dateKey] = { present: 0, absent: 0, leave: 0, total: 0 };
          acc[dateKey].total++;
          if (a.status === 'present') acc[dateKey].present++;
          if (a.status === 'absent') acc[dateKey].absent++;
          if (a.status === 'leave') acc[dateKey].leave++;
          return acc;
        }, {});

      const attendanceTrendArray = Object.entries(attendanceTrend)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Class-wise attendance
      const classAttendance = global.jsonDB.classes.map(cls => {
        const classRecords = global.jsonDB.attendance.filter(a => a.class === cls._id);
        const present = classRecords.filter(a => a.status === 'present').length;
        return {
          className: cls.name,
          total: classRecords.length,
          present,
          percentage: classRecords.length > 0 ? ((present / classRecords.length) * 100).toFixed(2) : 0
        };
      });

      // Academic performance
      const allMarks = global.jsonDB.marks.filter(m => m.isPublished);
      const academicStats = allMarks.length > 0 ? {
        averagePercentage: (allMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / allMarks.length).toFixed(2),
        totalAssessments: allMarks.length,
        gradeDistribution: allMarks.reduce((acc, m) => {
          const grade = m.grade || 'N/A';
          acc[grade] = (acc[grade] || 0) + 1;
          return acc;
        }, {})
      } : {
        averagePercentage: 0,
        totalAssessments: 0,
        gradeDistribution: {}
      };

      // Teacher attendance
      const teacherAttendanceStats = global.jsonDB.teacherAttendance?.filter(ta => 
        new Date(ta.date) >= startOfDay(today) && new Date(ta.date) <= endOfDay(today)
      ) || [];
      
      const teacherStats = {
        total: teacherAttendanceStats.length,
        present: teacherAttendanceStats.filter(t => t.status === 'present').length,
        absent: teacherAttendanceStats.filter(t => t.status === 'absent').length,
        late: teacherAttendanceStats.filter(t => t.status === 'late').length,
        leave: teacherAttendanceStats.filter(t => t.status === 'leave').length
      };
      teacherStats.percentage = teacherStats.total > 0 
        ? ((teacherStats.present / teacherStats.total) * 100).toFixed(2) 
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalStudents,
            totalTeachers,
            totalClasses,
            attendancePercentage: attendanceStats.percentage
          },
          attendanceStats,
          attendanceTrend: attendanceTrendArray,
          classAttendance,
          academicStats,
          teacherStats
        }
      });
    }

    // MongoDB Mode
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClasses = await Class.countDocuments();

    const today = new Date();
    const todayAttendance = await Attendance.find({
      date: { $gte: startOfDay(today), $lte: endOfDay(today) }
    });

    const attendanceStats = {
      total: todayAttendance.length,
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      leave: todayAttendance.filter(a => a.status === 'leave').length
    };
    attendanceStats.percentage = attendanceStats.total > 0 
      ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2) 
      : 0;

    // Last 30 days attendance trend
    const last30Days = subDays(today, 30);
    const attendanceTrend = await Attendance.find({
      date: { $gte: startOfDay(last30Days) }
    }).sort({ date: 1 });

    const attendanceTrendGrouped = attendanceTrend.reduce((acc, a) => {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = { present: 0, absent: 0, leave: 0, total: 0 };
      acc[dateKey].total++;
      if (a.status === 'present') acc[dateKey].present++;
      if (a.status === 'absent') acc[dateKey].absent++;
      if (a.status === 'leave') acc[dateKey].leave++;
      return acc;
    }, {});

    const attendanceTrendArray = Object.entries(attendanceTrendGrouped)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Class-wise attendance
    const classes = await Class.find({});
    const classAttendance = await Promise.all(classes.map(async (cls) => {
      const classRecords = await Attendance.find({ class: cls._id });
      const present = classRecords.filter(a => a.status === 'present').length;
      return {
        className: cls.name,
        total: classRecords.length,
        present,
        percentage: classRecords.length > 0 ? ((present / classRecords.length) * 100).toFixed(2) : 0
      };
    }));

    // Academic performance
    const allMarks = await Marks.find({ isPublished: true });
    const academicStats = allMarks.length > 0 ? {
      averagePercentage: (allMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / allMarks.length).toFixed(2),
      totalAssessments: allMarks.length,
      gradeDistribution: allMarks.reduce((acc, m) => {
        const grade = m.grade || 'N/A';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {})
    } : {
      averagePercentage: 0,
      totalAssessments: 0,
      gradeDistribution: {}
    };

    // Teacher attendance
    const teacherAttendanceStats = await TeacherAttendance.find({
      date: { $gte: startOfDay(today), $lte: endOfDay(today) }
    });
    
    const teacherStats = {
      total: teacherAttendanceStats.length,
      present: teacherAttendanceStats.filter(t => t.status === 'present').length,
      absent: teacherAttendanceStats.filter(t => t.status === 'absent').length,
      late: teacherAttendanceStats.filter(t => t.status === 'late').length,
      leave: teacherAttendanceStats.filter(t => t.status === 'leave').length
    };
    teacherStats.percentage = teacherStats.total > 0 
      ? ((teacherStats.present / teacherStats.total) * 100).toFixed(2) 
      : 0;

    console.log('Analytics data fetched successfully (MongoDB)');
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalTeachers,
          totalClasses,
          attendancePercentage: attendanceStats.percentage
        },
        attendanceStats,
        attendanceTrend: attendanceTrendArray,
        classAttendance,
        academicStats,
        teacherStats
      }
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ success: false, message: `Failed to fetch analytics: ${error.message}` });
  }
};

module.exports = {
  getAnalyticsData
};
