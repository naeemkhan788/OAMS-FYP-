const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Report = require('../models/Report');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sendEmail, validateEmail } = require('../config/email');
const isJsonDB = () => global.jsonDB !== undefined;

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const generateAttendanceReport = async (req, res) => {
  try {
    const { period, department } = req.query;
    console.log('Generating attendance report with period:', period, 'department:', department);

    // Generate CSV
    let csv = 'Report Name,Date,Class,Student Name,Student Email,Status,Subject\n';
    csv += `Attendance Report,${new Date().toISOString().split('T')[0]},Period: ${period || 'All'},,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      console.log('Using JSON DB mode for attendance report');
      if (!global.jsonDB.attendance) global.jsonDB.attendance = [];
      
      global.jsonDB.attendance.forEach(record => {
        const className = global.jsonDB.classes?.find(c => c._id === record.class)?.name || 'N/A';
        const student = global.jsonDB.users?.find(u => u._id === record.student);
        const studentName = student?.name || 'N/A';
        const studentEmail = student?.email || 'N/A';
        const status = record.status || 'N/A';
        const subject = record.subject || 'N/A';
        const date = record.date || new Date().toISOString().split('T')[0];
        
        csv += `Attendance,${date},${className},${studentName},${studentEmail},${status},${subject}\n`;
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

      console.log('Attendance report generated successfully (JSON DB)');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    console.log('Using MongoDB mode for attendance report');
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

    console.log('Date filter:', dateFilter);

    // Fetch attendance records
    const attendanceRecords = await Attendance.find(dateFilter)
      .populate('student', 'name email')
      .populate('class', 'name code')
      .populate('teacher', 'name');

    console.log('Found', attendanceRecords.length, 'attendance records');

    attendanceRecords.forEach(record => {
      const className = record.class?.name || 'N/A';
      const studentName = record.student?.name || 'N/A';
      const studentEmail = record.student?.email || 'N/A';
      const status = record.status || 'N/A';
      const subject = record.subject || 'N/A';
      const date = record.date ? record.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      csv += `Attendance,${date},${className},${studentName},${studentEmail},${status},${subject}\n`;
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

    console.log('Attendance report generated successfully (MongoDB)');
    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ success: false, message: `Failed to generate report: ${error.message}` });
  }
};

const generateMarksReport = async (req, res) => {
  try {
    const { period, department } = req.query;
    console.log('Generating marks report with period:', period, 'department:', department);

    // Generate CSV
    let csv = 'Report Name,Date,Class,Subject,Student Name,Student Email,Marks Obtained,Max Marks,Grade\n';
    csv += `Marks Report,${new Date().toISOString().split('T')[0]},Period: ${period || 'All'},,,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      console.log('Using JSON DB mode for marks report');
      if (!global.jsonDB.marks) global.jsonDB.marks = [];
      
      global.jsonDB.marks.forEach(record => {
        const className = global.jsonDB.classes?.find(c => c._id === record.class)?.name || 'N/A';
        const subjectName = record.subject || 'N/A';
        const student = global.jsonDB.users?.find(u => u._id === record.student);
        const studentName = student?.name || 'N/A';
        const studentEmail = student?.email || 'N/A';
        const marksObtained = record.marksObtained || 0;
        const maxMarks = record.maxMarks || 0;
        const grade = record.grade || 'N/A';
        const date = record.assessmentDate || new Date().toISOString().split('T')[0];
        
        csv += `Marks,${date},${className},${subjectName},${studentName},${studentEmail},${marksObtained},${maxMarks},${grade}\n`;
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

      console.log('Marks report generated successfully (JSON DB)');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=marks_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    console.log('Using MongoDB mode for marks report');
    // Build date filter based on period
    const dateFilter = {};
    const now = new Date();
    if (period === 'daily') {
      dateFilter.assessmentDate = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
    } else if (period === 'weekly') {
      dateFilter.assessmentDate = { $gte: new Date(now.setDate(now.getDate() - 7)) };
    } else if (period === 'monthly') {
      dateFilter.assessmentDate = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    } else if (period === 'quarterly') {
      dateFilter.assessmentDate = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
    } else if (period === 'yearly') {
      dateFilter.assessmentDate = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
    }

    console.log('Date filter:', dateFilter);

    // Fetch marks records
    const marksRecords = await Marks.find(dateFilter)
      .populate('student', 'name email')
      .populate('class', 'name code')
      .populate('teacher', 'name');

    console.log('Found', marksRecords.length, 'marks records');

    marksRecords.forEach(record => {
      const className = record.class?.name || 'N/A';
      const subjectName = record.subject || 'N/A';
      const studentName = record.student?.name || 'N/A';
      const studentEmail = record.student?.email || 'N/A';
      const marksObtained = record.marksObtained || 0;
      const maxMarks = record.maxMarks || 0;
      const grade = record.grade || 'N/A';
      const date = record.assessmentDate ? record.assessmentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      csv += `Marks,${date},${className},${subjectName},${studentName},${studentEmail},${marksObtained},${maxMarks},${grade}\n`;
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

    console.log('Marks report generated successfully (MongoDB)');
    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating marks report:', error);
    res.status(500).json({ success: false, message: `Failed to generate report: ${error.message}` });
  }
};

const generateEnrollmentReport = async (req, res) => {
  try {
    console.log('Generating enrollment report');

    // Generate CSV
    let csv = 'Report Name,Generated Date,Student Name,Student Email,Department,Class,Enrollment Date\n';
    csv += `Enrollment Report,${new Date().toISOString().split('T')[0]},,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      console.log('Using JSON DB mode for enrollment report');
      if (!global.jsonDB.users) global.jsonDB.users = [];
      
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

      console.log('Enrollment report generated successfully (JSON DB)');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=enrollment_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    console.log('Using MongoDB mode for enrollment report');
    const students = await User.find({ role: 'student' }).select('name email profile class classes createdAt');

    console.log('Found', students.length, 'students');

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

    console.log('Enrollment report generated successfully (MongoDB)');
    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating enrollment report:', error);
    res.status(500).json({ success: false, message: `Failed to generate report: ${error.message}` });
  }
};

const generateFacultyReport = async (req, res) => {
  try {
    console.log('Generating faculty report');

    // Generate CSV
    let csv = 'Report Name,Generated Date,Teacher Name,Teacher Email,Department,Specialization,Experience,Classes Assigned,Join Date\n';
    csv += `Faculty Report,${new Date().toISOString().split('T')[0]},,,,,,\n\n`;

    if (isJsonDB()) {
      // JSON DB Mode
      console.log('Using JSON DB mode for faculty report');
      if (!global.jsonDB.users) global.jsonDB.users = [];
      
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

      console.log('Faculty report generated successfully (JSON DB)');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=faculty_report_${Date.now()}.csv`);
      res.send(csv);
      return;
    }

    // MongoDB Mode
    console.log('Using MongoDB mode for faculty report');
    const teachers = await User.find({ role: 'teacher' }).select('name email profile classes createdAt');

    console.log('Found', teachers.length, 'teachers');

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

    console.log('Faculty report generated successfully (MongoDB)');
    // Send the file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating faculty report:', error);
    res.status(500).json({ success: false, message: `Failed to generate report: ${error.message}` });
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

const archiveReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const report = global.jsonDB.reports?.find(r => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      report.isArchived = true;
      report.archivedAt = new Date().toISOString();
      global.jsonDB.save();

      res.status(200).json({ success: true, message: 'Report archived successfully', data: report });
      return;
    }

    // MongoDB Mode
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.isArchived = true;
    report.archivedAt = new Date();
    await report.save();

    res.status(200).json({ success: true, message: 'Report archived successfully', data: report });
  } catch (error) {
    console.error('Error archiving report:', error);
    res.status(500).json({ success: false, message: 'Failed to archive report' });
  }
};

const unarchiveReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const report = global.jsonDB.reports?.find(r => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      report.isArchived = false;
      report.archivedAt = null;
      global.jsonDB.save();

      res.status(200).json({ success: true, message: 'Report unarchived successfully', data: report });
      return;
    }

    // MongoDB Mode
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.isArchived = false;
    report.archivedAt = null;
    await report.save();

    res.status(200).json({ success: true, message: 'Report unarchived successfully', data: report });
  } catch (error) {
    console.error('Error unarchiving report:', error);
    res.status(500).json({ success: false, message: 'Failed to unarchive report' });
  }
};

const getArchivedReports = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    if (isJsonDB()) {
      // JSON DB Mode
      let reports = global.jsonDB.reports?.filter(r => r.isArchived) || [];

      // Filter by type
      if (type) {
        reports = reports.filter(r => r.type === type);
      }

      // Filter by date range
      if (startDate) {
        reports = reports.filter(r => new Date(r.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        reports = reports.filter(r => new Date(r.createdAt) <= new Date(endDate));
      }

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
    const filter = { isArchived: true };

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const reports = await Report.find(filter)
      .populate('generatedBy', 'name email')
      .sort({ archivedAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching archived reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch archived reports' });
  }
};

const sendReportEmail = async (req, res) => {
  console.log('=== SEND REPORT EMAIL START ===');
  console.log('Request body:', { reportId: req.body.reportId, recipients: req.body.recipients, subject: req.body.subject });
  
  try {
    const { reportId, recipients, subject } = req.body;

    // Validate required fields
    if (!reportId) {
      console.error('Validation failed: Report ID is required');
      return res.status(400).json({ success: false, message: 'Report ID is required' });
    }

    if (!recipients || recipients.length === 0) {
      console.error('Validation failed: Recipients are required');
      return res.status(400).json({ success: false, message: 'Recipients are required' });
    }

    // Validate email addresses
    const invalidEmails = recipients.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      console.error('Validation failed: Invalid email addresses:', invalidEmails);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      });
    }

    console.log('Validation passed. Fetching report...');

    let report;
    let csvContent;
    let attachmentPath;

    if (isJsonDB()) {
      // JSON DB Mode
      report = global.jsonDB.reports?.find(r => r._id === reportId);
      if (!report) {
        console.error('Report not found in JSON DB:', reportId);
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      csvContent = report.csvContent;
      console.log('Report found in JSON DB:', report.name);
    } else {
      // MongoDB Mode
      report = await Report.findById(reportId);
      if (!report) {
        console.error('Report not found in MongoDB:', reportId);
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      attachmentPath = report.filePath;

      // Read file content
      if (!fs.existsSync(attachmentPath)) {
        console.error('Report file not found:', attachmentPath);
        return res.status(404).json({ success: false, message: 'Report file not found on server' });
      }

      csvContent = fs.readFileSync(attachmentPath, 'utf-8');
      console.log('Report file found:', attachmentPath);
    }

    console.log('Report details:', {
      name: report.name,
      type: report.type,
      size: csvContent.length
    });

    // Prepare email content
    const emailSubject = subject || `Report: ${report.name}`;
    const emailText = `Hello,

Please find the attached report: ${report.name}

Report Type: ${report.type}
Generated At: ${new Date(report.createdAt).toLocaleString()}

If you have any questions, please contact the administrator.

Best regards,
Online Attendance Management System`;

    // Prepare attachment
    const attachments = [];
    if (isJsonDB()) {
      // For JSON DB, create a temporary file
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const tempFilePath = path.join(tempDir, `${report.name.replace(/\s+/g, '_')}.csv`);
      fs.writeFileSync(tempFilePath, csvContent);
      attachments.push({
        filename: `${report.name}.csv`,
        path: tempFilePath
      });
      console.log('Created temporary file for attachment:', tempFilePath);
    } else {
      // For MongoDB, use the existing file
      attachments.push({
        filename: path.basename(attachmentPath),
        path: attachmentPath
      });
      console.log('Using existing file for attachment:', attachmentPath);
    }

    console.log('Sending email to recipients:', recipients);

    // Send email
    const emailResult = await sendEmail({
      to: recipients,
      subject: emailSubject,
      text: emailText,
      attachments: attachments
    });

    // Clean up temporary file if created
    if (isJsonDB() && attachments[0] && attachments[0].path) {
      try {
        fs.unlinkSync(attachments[0].path);
        console.log('Cleaned up temporary file:', attachments[0].path);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError.message);
      }
    }

    if (emailResult.success) {
      console.log('=== EMAIL SENT SUCCESSFULLY ===');
      console.log('Message ID:', emailResult.messageId);
      console.log('Accepted recipients:', emailResult.accepted.join(', '));
      res.status(200).json({ 
        success: true, 
        message: `Report sent successfully to ${recipients.length} recipient(s)`,
        messageId: emailResult.messageId,
        accepted: emailResult.accepted
      });
    } else {
      console.error('Email sending failed');
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('=== ERROR SENDING EMAIL ===');
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  deleteReport,
  archiveReport,
  unarchiveReport,
  getArchivedReports,
  sendReportEmail
};
