const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');
const { startOfDay, endOfDay, format, subDays } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

const isJsonDB = () => global.jsonDB !== undefined;

const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { classId, date, attendanceData, subject } = req.body;
    const teacherId = req.user.id;

    // JSON DB Mode
    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === classId);
      if (!classDoc) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      if (classDoc.teacher !== teacherId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to mark attendance for this class'
        });
      }

      const attendanceDate = new Date(date);
      let savedCount = 0;

      for (const studentData of attendanceData) {
        const { studentId, status, notes } = studentData;

        if (!classDoc.students || !classDoc.students.some(id => id.toString() === studentId.toString())) {
          continue;
        }

        savedCount++;
        const existingIndex = global.jsonDB.attendance.findIndex(a =>
          a.student === studentId &&
          a.class === classId &&
          new Date(a.date) >= startOfDay(attendanceDate) &&
          new Date(a.date) <= endOfDay(attendanceDate)
        );

        if (existingIndex !== -1) {
          global.jsonDB.attendance[existingIndex].status = status;
          global.jsonDB.attendance[existingIndex].subject = subject;
          global.jsonDB.attendance[existingIndex].notes = notes;
          global.jsonDB.attendance[existingIndex].markedBy = teacherId;
        } else {
          global.jsonDB.attendance.push({
            _id: uuidv4(),
            student: studentId,
            class: classId,
            teacher: teacherId,
            date: attendanceDate,
            status,
            subject,
            notes,
            markedBy: teacherId,
            checkInTime: status === 'present' ? new Date() : null,
            createdAt: new Date()
          });
        }
      }

      global.jsonDB.save();

      if (savedCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No attendance saved — ensure students are assigned to this class'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Attendance marked successfully',
        data: { savedCount }
      });
    }

    // MongoDB Mode
    const classDoc = await Class.findById(classId).populate('students');
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classDoc.teacher.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark attendance for this class'
      });
    }

    const attendanceDate = new Date(date);
    const attendancePromises = [];
    let savedCount = 0;

    for (const studentData of attendanceData) {
      const { studentId, status, notes } = studentData;

      if (!classDoc.students.some(s => s._id.toString() === studentId.toString())) {
        continue;
      }

      savedCount++;
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        class: classId,
        date: {
          $gte: startOfDay(attendanceDate),
          $lte: endOfDay(attendanceDate)
        }
      });

      if (existingAttendance) {
        existingAttendance.status = status;
        existingAttendance.subject = subject;
        existingAttendance.notes = notes;
        existingAttendance.markedBy = teacherId;
        attendancePromises.push(existingAttendance.save());
      } else {
        attendancePromises.push(
          Attendance.create({
            student: studentId,
            class: classId,
            teacher: teacherId,
            date: attendanceDate,
            status,
            subject,
            notes,
            markedBy: teacherId,
            checkInTime: status === 'present' ? new Date() : null
          })
        );
      }
    }

    await Promise.all(attendancePromises);

    if (savedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendance saved — ensure students are assigned to this class'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { savedCount }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance'
    });
  }
};

const getAttendanceByClass = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const teacherId = req.user.id;

    // JSON DB Mode
    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === classId);
      if (!classDoc) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      if (classDoc.teacher !== teacherId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view attendance for this class'
        });
      }

      const attendanceDate = new Date(date);
      const attendance = global.jsonDB.attendance.filter(a =>
        a.class === classId &&
        new Date(a.date) >= startOfDay(attendanceDate) &&
        new Date(a.date) <= endOfDay(attendanceDate)
      );

      const attendanceMap = {};
      attendance.forEach(record => {
        attendanceMap[record.student] = record;
      });

      const studentsWithAttendance = (classDoc.students || []).map(studentId => {
        const student = global.jsonDB.users.find(u => u._id === studentId);
        const attendanceRecord = attendanceMap[studentId];
        return {
          student: student,
          attendance: attendanceRecord || {
            status: 'present',
            subject: '',
            notes: ''
          }
        };
      });

      const stats = await getAttendanceStats(classId, attendanceDate);

      return res.status(200).json({
        success: true,
        data: {
          class: classDoc,
          date: attendanceDate,
          students: studentsWithAttendance,
          stats
        }
      });
    }

    // MongoDB Mode
    const classDoc = await Class.findById(classId).populate('students');
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classDoc.teacher.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view attendance for this class'
      });
    }

    const attendanceDate = new Date(date);
    const attendance = await Attendance.find({
      class: classId,
      date: {
        $gte: startOfDay(attendanceDate),
        $lte: endOfDay(attendanceDate)
      }
    }).populate('student', 'name studentId email');

    const attendanceMap = {};
    attendance.forEach(record => {
      attendanceMap[record.student._id.toString()] = record;
    });

    const studentsWithAttendance = classDoc.students.map(student => {
      const attendanceRecord = attendanceMap[student._id.toString()];
      return {
        student: student,
        attendance: attendanceRecord || {
          status: 'present',
          subject: '',
          notes: ''
        }
      };
    });

    const stats = await getAttendanceStats(classId, attendanceDate);

    res.status(200).json({
      success: true,
      data: {
        class: classDoc,
        date: attendanceDate,
        students: studentsWithAttendance,
        stats
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance'
    });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

    const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate) : new Date();

    // JSON DB Mode
    if (isJsonDB()) {
      const attendance = global.jsonDB.attendance
        .filter(a =>
          a.student === studentId &&
          new Date(a.date) >= startOfDay(start) &&
          new Date(a.date) <= endOfDay(end)
        )
        .map(a => ({
          ...a,
          class: global.jsonDB.classes.find(c => c._id === a.class)
        }))
        .filter(a => a.class)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const stats = await getStudentAttendanceStats(studentId, start, end);

      return res.status(200).json({
        success: true,
        data: {
          attendance,
          stats
        }
      });
    }

    // MongoDB Mode
    const attendance = await Attendance.find({
      student: studentId,
      date: {
        $gte: startOfDay(start),
        $lte: endOfDay(end)
      }
    }).populate('class', 'name code grade section')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    const stats = await getStudentAttendanceStats(studentId, start, end);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        stats
      }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student attendance'
    });
  }
};

const getAttendanceStats = async (classId, date) => {
  if (isJsonDB()) {
    const attendance = global.jsonDB.attendance.filter(a =>
      a.class === classId &&
      new Date(a.date) >= startOfDay(date) &&
      new Date(a.date) <= endOfDay(date)
    );

    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      leave: attendance.filter(a => a.status === 'leave').length,
      percentage: 0
    };

    if (stats.total > 0) {
      stats.percentage = ((stats.present / stats.total) * 100).toFixed(2);
    }

    return stats;
  }

  const attendance = await Attendance.find({
    class: classId,
    date: {
      $gte: startOfDay(date),
      $lte: endOfDay(date)
    }
  });

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    leave: attendance.filter(a => a.status === 'leave').length,
    percentage: 0
  };

  if (stats.total > 0) {
    stats.percentage = ((stats.present / stats.total) * 100).toFixed(2);
  }

  return stats;
};

const getStudentAttendanceStats = async (studentId, startDate, endDate) => {
  if (isJsonDB()) {
    const attendance = global.jsonDB.attendance.filter(a =>
      a.student === studentId &&
      new Date(a.date) >= startOfDay(startDate) &&
      new Date(a.date) <= endOfDay(endDate)
    );

    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      leave: attendance.filter(a => a.status === 'leave').length,
      percentage: 0
    };

    if (stats.total > 0) {
      stats.percentage = ((stats.present / stats.total) * 100).toFixed(2);
    }

    return stats;
  }

  const attendance = await Attendance.find({
    student: studentId,
    date: {
      $gte: startOfDay(startDate),
      $lte: endOfDay(endDate)
    }
  });

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    leave: attendance.filter(a => a.status === 'leave').length,
    percentage: 0
  };

  if (stats.total > 0) {
    stats.percentage = ((stats.present / stats.total) * 100).toFixed(2);
  }

  return stats;
};

const getAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const teacherId = req.user.id;

    // JSON DB Mode
    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === classId);
      if (!classDoc) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      if (classDoc.teacher !== teacherId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view attendance for this class'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const attendance = global.jsonDB.attendance.filter(a =>
        a.class === classId &&
        new Date(a.date) >= startOfDay(start) &&
        new Date(a.date) <= endOfDay(end)
      );

      const report = (classDoc.students || []).map(studentId => {
        const student = global.jsonDB.users.find(u => u._id === studentId);
        const studentAttendance = attendance.filter(a => a.student === studentId);

        const stats = {
          present: studentAttendance.filter(a => a.status === 'present').length,
          absent: studentAttendance.filter(a => a.status === 'absent').length,
          leave: studentAttendance.filter(a => a.status === 'leave').length,
          total: studentAttendance.length
        };

        stats.percentage = stats.total > 0 ?
          ((stats.present / stats.total) * 100).toFixed(2) : 0;

        return {
          student,
          stats,
          details: studentAttendance
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          class: classDoc,
          period: { startDate: start, endDate: end },
          report
        }
      });
    }

    // MongoDB Mode
    const classDoc = await Class.findById(classId).populate('students');
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classDoc.teacher.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view attendance for this class'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const attendance = await Attendance.find({
      class: classId,
      date: {
        $gte: startOfDay(start),
        $lte: endOfDay(end)
      }
    }).populate('student', 'name studentId');

    const report = classDoc.students.map(student => {
      const studentAttendance = attendance.filter(a =>
        a.student._id.toString() === student._id.toString()
      );

      const stats = {
        present: studentAttendance.filter(a => a.status === 'present').length,
        absent: studentAttendance.filter(a => a.status === 'absent').length,
        leave: studentAttendance.filter(a => a.status === 'leave').length,
        total: studentAttendance.length
      };

      stats.percentage = stats.total > 0 ?
        ((stats.present / stats.total) * 100).toFixed(2) : 0;

      return {
        student,
        stats,
        details: studentAttendance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        class: classDoc,
        period: { startDate: start, endDate: end },
        report
      }
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating attendance report'
    });
  }
};

const getTeacherAttendance = async (req, res) => {
  try {
    if (isJsonDB()) {
      const attendance = global.jsonDB.attendance
        .filter(a => a.teacher === req.user.id)
        .map(a => ({
          ...a,
          student: global.jsonDB.users.find(u => u._id === a.student),
          class: global.jsonDB.classes.find(c => c._id === a.class)
        }))
        .filter(a => a.student && a.class)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.status(200).json({ success: true, data: { attendance } });
    }
    const attendance = await Attendance.find({ teacher: req.user.id })
      .populate('student', 'name studentId')
      .populate('class', 'name code')
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: { attendance } });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher attendance' });
  }
};

const markBulkAttendance = async (req, res) => {
  try {
    const { classId, date, attendance, subject } = req.body;
    const teacherId = req.user.id;

    if (!classId || !date) {
      return res.status(400).json({ success: false, message: 'Class ID and date are required' });
    }

    const attendanceDate = new Date(date);

    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === classId);
      if (!classDoc) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      if (classDoc.teacher !== teacherId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to mark attendance for this class' });
      }

      const attendanceList = (attendance && attendance.length > 0)
        ? attendance
        : (classDoc.students || []).map(studentId => ({
            studentId,
            status: 'present',
            notes: 'Marked via bulk attendance'
          }));

      for (const studentData of attendanceList) {
        const { studentId, status, notes } = studentData;

        if (!classDoc.students || !classDoc.students.includes(studentId)) {
          continue;
        }

        const existingIndex = global.jsonDB.attendance.findIndex(a =>
          a.student === studentId &&
          a.class === classId &&
          new Date(a.date) >= startOfDay(attendanceDate) &&
          new Date(a.date) <= endOfDay(attendanceDate)
        );

        if (existingIndex !== -1) {
          global.jsonDB.attendance[existingIndex].status = status || 'present';
          if (subject) global.jsonDB.attendance[existingIndex].subject = subject;
          if (notes) global.jsonDB.attendance[existingIndex].notes = notes;
          global.jsonDB.attendance[existingIndex].markedBy = teacherId;
        } else {
          global.jsonDB.attendance.push({
            _id: uuidv4(),
            student: studentId,
            class: classId,
            teacher: teacherId,
            date: attendanceDate,
            status: status || 'present',
            subject: subject || 'General',
            notes: notes || 'Marked via bulk attendance',
            markedBy: teacherId,
            checkInTime: new Date(),
            createdAt: new Date()
          });
        }
      }

      global.jsonDB.save();
      return res.status(200).json({ success: true, message: 'Bulk attendance marked successfully' });
    }

    const classDoc = await Class.findById(classId).populate('students');
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classDoc.teacher.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to mark attendance for this class' });
    }

    const attendanceList = (attendance && attendance.length > 0)
      ? attendance
      : classDoc.students.map(s => ({
          studentId: s._id.toString(),
          status: 'present',
          notes: 'Marked via bulk attendance'
        }));

    const attendancePromises = [];

    for (const studentData of attendanceList) {
      const { studentId, status, notes } = studentData;

      if (!classDoc.students.some(s => s._id.toString() === studentId)) {
        continue;
      }

      const existingAttendance = await Attendance.findOne({
        student: studentId,
        class: classId,
        date: {
          $gte: startOfDay(attendanceDate),
          $lte: endOfDay(attendanceDate)
        }
      });

      if (existingAttendance) {
        existingAttendance.status = status || 'present';
        if (subject) existingAttendance.subject = subject;
        if (notes) existingAttendance.notes = notes;
        existingAttendance.markedBy = teacherId;
        attendancePromises.push(existingAttendance.save());
      } else {
        attendancePromises.push(
          Attendance.create({
            student: studentId,
            class: classId,
            teacher: teacherId,
            date: attendanceDate,
            status: status || 'present',
            subject: subject || 'General',
            notes: notes || 'Marked via bulk attendance',
            markedBy: teacherId,
            checkInTime: new Date()
          })
        );
      }
    }

    await Promise.all(attendancePromises);

    res.status(200).json({ success: true, message: 'Bulk attendance marked successfully' });
  } catch (error) {
    console.error('Mark bulk attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking bulk attendance' });
  }
};

const saveAttendanceSingleOrBatch = async (req, res) => {
  try {
    const teacherId = req.user.id;
    let records = [];

    if (Array.isArray(req.body)) {
      records = req.body;
    } else if (req.body.attendanceData && Array.isArray(req.body.attendanceData)) {
      const { classId, date, subject, attendanceData } = req.body;
      const timestamp = date ? new Date(date).getTime() : Date.now();
      records = attendanceData.map(item => ({
        uniqueId: item.uniqueId || `${classId}_${item.studentId}_${new Date(timestamp).toISOString().split('T')[0]}`,
        studentId: item.studentId,
        classId: classId,
        status: item.status,
        timestamp: timestamp,
        notes: item.notes
      }));
    } else if (req.body && typeof req.body === 'object') {
      records = [req.body];
    }

    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance records provided' });
    }

    const results = [];
    const errors = [];
    const duplicates = [];

    const processRecord = async (record) => {
      const { uniqueId, studentId, classId, status, timestamp, notes } = record;

      if (!studentId || !classId || !status) {
        throw new Error('studentId, classId, and status are required');
      }

      const attendanceDate = timestamp ? new Date(timestamp) : new Date();

      let classDoc;
      if (isJsonDB()) {
        classDoc = global.jsonDB.classes.find(c => c._id === classId);
      } else {
        classDoc = await Class.findById(classId);
      }

      if (!classDoc) {
        throw new Error(`Class ${classId} not found`);
      }

      const subject = classDoc.subjects?.[0]?.name || classDoc.name || 'General';

      // Check for duplicate by uniqueId first (offline sync prevention)
      if (uniqueId) {
        let existing;
        if (isJsonDB()) {
          existing = global.jsonDB.attendance.find(a => a.uniqueId === uniqueId);
        } else {
          existing = await Attendance.findOne({ uniqueId });
        }

        if (existing) {
          console.log(`Duplicate detected by uniqueId: ${uniqueId}, skipping`);
          duplicates.push({ uniqueId, existingId: existing._id || existing.id });
          return { duplicate: true, uniqueId, existingId: existing._id || existing.id };
        }
      }

      // Check for duplicate by student, class, and date (business logic duplicate)
      let existingByDate;
      if (isJsonDB()) {
        existingByDate = global.jsonDB.attendance.find(a =>
          a.student === studentId &&
          a.class === classId &&
          new Date(a.date) >= startOfDay(attendanceDate) &&
          new Date(a.date) <= endOfDay(attendanceDate)
        );
      } else {
        existingByDate = await Attendance.findOne({
          student: studentId,
          class: classId,
          date: {
            $gte: startOfDay(attendanceDate),
            $lte: endOfDay(attendanceDate)
          }
        });
      }

      if (existingByDate) {
        // Update existing record instead of creating duplicate
        if (isJsonDB()) {
          existingByDate.status = status;
          if (uniqueId) existingByDate.uniqueId = uniqueId;
          existingByDate.notes = notes || existingByDate.notes;
          existingByDate.subject = subject;
          existingByDate.markedBy = teacherId;
          global.jsonDB.save();
        } else {
          existingByDate.status = status;
          if (uniqueId) existingByDate.uniqueId = uniqueId;
          existingByDate.notes = notes || existingByDate.notes;
          existingByDate.subject = subject;
          existingByDate.markedBy = teacherId;
          await existingByDate.save();
        }
        console.log(`Updated existing attendance for student ${studentId} in class ${classId} on ${attendanceDate.toISOString().split('T')[0]}`);
        return existingByDate;
      }

      // Create new record
      if (isJsonDB()) {
        const newRecord = {
          _id: uuidv4(),
          student: studentId,
          class: classId,
          teacher: teacherId,
          date: attendanceDate,
          status,
          subject,
          markedBy: teacherId,
          uniqueId,
          checkInTime: status === 'present' ? new Date() : null,
          createdAt: new Date()
        };
        global.jsonDB.attendance.push(newRecord);
        global.jsonDB.save();
        console.log(`Created new attendance record with uniqueId: ${uniqueId}`);
        return newRecord;
      } else {
        const newRecord = await Attendance.create({
          student: studentId,
          class: classId,
          teacher: teacherId,
          date: attendanceDate,
          status,
          subject,
          markedBy: teacherId,
          uniqueId,
          checkInTime: status === 'present' ? new Date() : null
        });
        console.log(`Created new attendance record with uniqueId: ${uniqueId}`);
        return newRecord;
      }
    };

    for (const record of records) {
      try {
        const result = await processRecord(record);
        if (!result.duplicate) {
          results.push(result);
        }
      } catch (err) {
        errors.push({ record, error: err.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process attendance records',
        errors
      });
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${results.length} records successfully. ${duplicates.length} duplicates skipped. ${errors.length} errors.`,
      data: results,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving attendance'
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByClass,
  getStudentAttendance,
  getAttendanceReport,
  getTeacherAttendance,
  markBulkAttendance,
  saveAttendanceSingleOrBatch
};
