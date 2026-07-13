const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Report = require('../models/Report');
const fs = require('fs');
const path = require('path');
const isJsonDB = () => global.jsonDB !== undefined;

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const generateAttendanceReport = async (req, res) => {
  try {
    const { period, department } = req.query;

    // Generate CSV
    let csv = 'Report Name,Date,Class,Student Name,Student Email,Status\n';
    csv += `Attendance Report,${new Date().toISOString().split('T')[0]},Period: ${period || 'All'},,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      global.jsonDB.attendance.forEach(record => {
        const className = global.jsonDB.classes.find(c => c._id === record.classId)?.name || 'N/A';
        const date = record.date || new Date().toISOString().split('T')[0];
        
        if (record.students) {
          record.students.forEach(studentRecord => {
            const student = global.jsonDB.users.find(u => u._id === studentRecord.student);
            const studentName = student?.name || 'N/A';
            const studentEmail = student?.email || 'N/A';
            const status = studentRecord.status || 'N/A';
            csv += `Attendance,${date},${className},${studentName},${studentEmail},${status}\n`;
          });
        }
      });

      // Save report to JSON DB
      const reportId = crypto.randomUUID();
      const report = {
        _id: reportId,
        name: 'Monthly Attendance Report',
        type: 'attendance',
        period: period || 'All',
        generatedBy: req.user.id,
        csvContent: csv,
        fileSize: `${(csv.length / 1024).toFixed(2)} KB`,
        status: 'completed',
        department: department || 'all',
        createdAt: new Date().toISOString()
      };

      if (!global.jsonDB.reports) global.jsonDB.reports = [];
      global.jsonDB.reports.push(report);
      global.jsonDB.save();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    // Build date filter based on period
    const dateFilter = {};
    const now = new Date();
    if (period === 'daily') {
      dateFilter.date = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
    } else if (period === 'weekly') {
      dateFilter.date = { $gte: new Date(now.setDate(now.getDate() - 7)) };
    } else if (period === 'monthly') {
      dateFilter.date = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    } else if (period === 'quarterly') {
      dateFilter.date = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
    } else if (period === 'yearly') {
      dateFilter.date = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
    }

    // Fetch attendance records
    const attendanceRecords = await Attendance.find(dateFilter)
      .populate('classId', 'name code')
      .populate('students.student', 'name email');

    attendanceRecords.forEach(record => {
      const className = record.classId?.name || 'N/A';
      const date = record.date || new Date().toISOString().split('T')[0];
      
      if (record.students) {
        record.students.forEach(studentRecord => {
          const studentName = studentRecord.student?.name || 'N/A';
          const studentEmail = studentRecord.student?.email || 'N/A';
          const status = studentRecord.status || 'N/A';
          csv += `Attendance,${date},${className},${studentName},${studentEmail},${status}\n`;
        });
      }
    });

    // Save file to disk
    const fileName = `attendance_report_${Date.now()}.csv`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, csv);

    // Save report metadata to database
    const report = await Report.create({
      name: 'Monthly Attendance Report',
      type: 'attendance',
      period: period || 'All',
      generatedBy: req.user.id,
      fileName,
      filePath,
      fileSize: `${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`,
      status: 'completed',
      department: department || 'all'
    });

    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const generateMarksReport = async (req, res) => {
  try {
    const { period, department } = req.query;

    // Generate CSV
    let csv = 'Report Name,Date,Class,Subject,Student Name,Student Email,Marks Obtained,Max Marks\n';
    csv += `Marks Report,${new Date().toISOString().split('T')[0]},Period: ${period || 'All'},,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      global.jsonDB.marks.forEach(record => {
        const className = global.jsonDB.classes.find(c => c._id === record.classId)?.name || 'N/A';
        const subjectName = record.subject || 'N/A';
        const date = record.createdAt || new Date().toISOString().split('T')[0];
        
        if (record.students) {
          record.students.forEach(studentRecord => {
            const student = global.jsonDB.users.find(u => u._id === studentRecord.student);
            const studentName = student?.name || 'N/A';
            const studentEmail = student?.email || 'N/A';
            const marksObtained = studentRecord.marksObtained || 0;
            const maxMarks = studentRecord.maxMarks || 0;
            csv += `Marks,${date},${className},${subjectName},${studentName},${studentEmail},${marksObtained},${maxMarks}\n`;
          });
        }
      });

      // Save report to JSON DB
      const reportId = crypto.randomUUID();
      const report = {
        _id: reportId,
        name: 'Academic Performance Report',
        type: 'academic',
        period: period || 'All',
        generatedBy: req.user.id,
        csvContent: csv,
        fileSize: `${(csv.length / 1024).toFixed(2)} KB`,
        status: 'completed',
        department: department || 'all',
        createdAt: new Date().toISOString()
      };

      if (!global.jsonDB.reports) global.jsonDB.reports = [];
      global.jsonDB.reports.push(report);
      global.jsonDB.save();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=marks_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    // Build date filter based on period
    const dateFilter = {};
    const now = new Date();
    if (period === 'daily') {
      dateFilter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
    } else if (period === 'weekly') {
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
    } else if (period === 'monthly') {
      dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    } else if (period === 'quarterly') {
      dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
    } else if (period === 'yearly') {
      dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
    }

    // Fetch marks records
    const marksRecords = await Marks.find(dateFilter)
      .populate('classId', 'name code')
      .populate('subject', 'name')
      .populate('students.student', 'name email');

    marksRecords.forEach(record => {
      const className = record.classId?.name || 'N/A';
      const subjectName = record.subject?.name || 'N/A';
      const date = record.createdAt ? record.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      if (record.students) {
        record.students.forEach(studentRecord => {
          const studentName = studentRecord.student?.name || 'N/A';
          const studentEmail = studentRecord.student?.email || 'N/A';
          const marksObtained = studentRecord.marksObtained || 0;
          const maxMarks = studentRecord.maxMarks || 0;
          csv += `Marks,${date},${className},${subjectName},${studentName},${studentEmail},${marksObtained},${maxMarks}\n`;
        });
      }
    });

    // Save file to disk
    const fileName = `marks_report_${Date.now()}.csv`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, csv);

    // Save report metadata to database
    const report = await Report.create({
      name: 'Academic Performance Report',
      type: 'academic',
      period: period || 'All',
      generatedBy: req.user.id,
      fileName,
      filePath,
      fileSize: `${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`,
      status: 'completed',
      department: department || 'all'
    });

    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating marks report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const generateEnrollmentReport = async (req, res) => {
  try {
    // Generate CSV
    let csv = 'Report Name,Generated Date,Student Name,Student Email,Department,Class,Enrollment Date\n';
    csv += `Enrollment Report,${new Date().toISOString().split('T')[0]},,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      global.jsonDB.users.filter(u => u.role === 'student').forEach(student => {
        const name = student.name || 'N/A';
        const email = student.email || 'N/A';
        const department = student.profile?.department || 'N/A';
        const className = student.class || 'N/A';
        const enrollmentDate = student.createdAt || 'N/A';
        csv += `Enrollment,${new Date().toISOString().split('T')[0]},${name},${email},${department},${className},${enrollmentDate}\n`;
      });

      // Save report to JSON DB
      const reportId = crypto.randomUUID();
      const report = {
        _id: reportId,
        name: 'Student Enrollment Summary',
        type: 'enrollment',
        period: 'Current',
        generatedBy: req.user.id,
        csvContent: csv,
        fileSize: `${(csv.length / 1024).toFixed(2)} KB`,
        status: 'completed',
        department: 'all',
        createdAt: new Date().toISOString()
      };

      if (!global.jsonDB.reports) global.jsonDB.reports = [];
      global.jsonDB.reports.push(report);
      global.jsonDB.save();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=enrollment_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    const students = await User.find({ role: 'student' }).select('name email profile class classes createdAt');
    const classes = await Class.find({}).select('name code students');

    students.forEach(student => {
      const name = student.name || 'N/A';
      const email = student.email || 'N/A';
      const department = student.profile?.department || 'N/A';
      const className = student.class?.name || 'N/A';
      const enrollmentDate = student.createdAt ? student.createdAt.toISOString().split('T')[0] : 'N/A';
      csv += `Enrollment,${new Date().toISOString().split('T')[0]},${name},${email},${department},${className},${enrollmentDate}\n`;
    });

    // Save file to disk
    const fileName = `enrollment_report_${Date.now()}.csv`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, csv);

    // Save report metadata to database
    const report = await Report.create({
      name: 'Student Enrollment Summary',
      type: 'enrollment',
      period: 'Current',
      generatedBy: req.user.id,
      fileName,
      filePath,
      fileSize: `${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`,
      status: 'completed',
      department: 'all'
    });

    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating enrollment report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const generateFacultyReport = async (req, res) => {
  try {
    // Generate CSV
    let csv = 'Report Name,Generated Date,Teacher Name,Teacher Email,Department,Specialization,Experience,Classes Assigned,Join Date\n';
    csv += `Faculty Report,${new Date().toISOString().split('T')[0]},,,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      global.jsonDB.users.filter(u => u.role === 'teacher').forEach(teacher => {
        const name = teacher.name || 'N/A';
        const email = teacher.email || 'N/A';
        const department = teacher.profile?.department || 'N/A';
        const specialization = teacher.profile?.specialization || 'N/A';
        const experience = teacher.profile?.experience || 'N/A';
        const classesCount = teacher.classes?.length || 0;
        const joinDate = teacher.createdAt || 'N/A';
        csv += `Faculty,${new Date().toISOString().split('T')[0]},${name},${email},${department},${specialization},${experience},${classesCount},${joinDate}\n`;
      });

      // Save report to JSON DB
      const reportId = crypto.randomUUID();
      const report = {
        _id: reportId,
        name: 'Faculty Workload Analysis',
        type: 'faculty',
        period: 'Current',
        generatedBy: req.user.id,
        csvContent: csv,
        fileSize: `${(csv.length / 1024).toFixed(2)} KB`,
        status: 'completed',
        department: 'all',
        createdAt: new Date().toISOString()
      };

      if (!global.jsonDB.reports) global.jsonDB.reports = [];
      global.jsonDB.reports.push(report);
      global.jsonDB.save();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=faculty_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    const teachers = await User.find({ role: 'teacher' }).select('name email profile classes createdAt');

    teachers.forEach(teacher => {
      const name = teacher.name || 'N/A';
      const email = teacher.email || 'N/A';
      const department = teacher.profile?.department || 'N/A';
      const specialization = teacher.profile?.specialization || 'N/A';
      const experience = teacher.profile?.experience || 'N/A';
      const classesCount = teacher.classes?.length || 0;
      const joinDate = teacher.createdAt ? teacher.createdAt.toISOString().split('T')[0] : 'N/A';
      csv += `Faculty,${new Date().toISOString().split('T')[0]},${name},${email},${department},${specialization},${experience},${classesCount},${joinDate}\n`;
    });

    // Save file to disk
    const fileName = `faculty_report_${Date.now()}.csv`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, csv);

    // Save report metadata to database
    const report = await Report.create({
      name: 'Faculty Workload Analysis',
      type: 'faculty',
      period: 'Current',
      generatedBy: req.user.id,
      fileName,
      filePath,
      fileSize: `${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`,
      status: 'completed',
      department: 'all'
    });

    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating faculty report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const getAllReports = async (req, res) => {
  try {
    if (isJsonDB()) {
      // JSON DB Mode
      const reports = global.jsonDB.reports || [];
      const reportsWithUser = reports.map(report => {
        const user = global.jsonDB.users.find(u => u._id === report.generatedBy);
        return {
          ...report,
          generatedBy: user ? { name: user.name, email: user.email } : { name: 'Admin', email: 'admin@example.com' }
        };
      });
      res.status(200).json({ success: true, data: reportsWithUser });
      return;
    }

    // MongoDB Mode
    const reports = await Report.find()
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const report = global.jsonDB.reports?.find(r => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      if (!report.csvContent) {
        return res.status(404).json({ success: false, message: 'Report content not found' });
      }

      // Send the CSV content
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${report.type}_report_${id}.csv`);
      res.send(report.csvContent);
      return;
    }

    // MongoDB Mode
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check if file exists
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on server' });
    }

    // Send the file
    res.download(report.filePath, report.fileName);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, message: 'Failed to download report' });
  }
};

const viewReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const report = global.jsonDB.reports?.find(r => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      if (!report.csvContent) {
        return res.status(404).json({ success: false, message: 'Report content not found' });
      }

      // Send the CSV content for viewing
      res.setHeader('Content-Type', 'text/csv');
      res.send(report.csvContent);
      return;
    }

    // MongoDB Mode
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check if file exists
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on server' });
    }

    // Send the file for viewing (inline)
    res.sendFile(report.filePath);
  } catch (error) {
    console.error('Error viewing report:', error);
    res.status(500).json({ success: false, message: 'Failed to view report' });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const reportIndex = global.jsonDB.reports?.findIndex(r => r._id === id);
      if (reportIndex === -1) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      // Remove report from array
      global.jsonDB.reports.splice(reportIndex, 1);
      global.jsonDB.save();

      res.status(200).json({ success: true, message: 'Report deleted successfully' });
      return;
    }

    // MongoDB Mode
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Delete file from disk
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    // Delete report from database
    await Report.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
};

module.exports = {
  generateAttendanceReport,
  generateMarksReport,
  generateEnrollmentReport,
  generateFacultyReport,
  getAllReports,
  downloadReport,
  viewReport,
  deleteReport
};
