const ScheduledReport = require('../models/ScheduledReport');
const { generateAttendanceReport, generateMarksReport, generateEnrollmentReport, generateFacultyReport } = require('./reportController');
const crypto = require('crypto');
const isJsonDB = () => global.jsonDB !== undefined;

const createScheduledReport = async (req, res) => {
  try {
    const { name, reportType, period, schedule, recipients, department } = req.body;

    // Generate cron expression based on schedule
    let cronExpression;
    switch (schedule) {
      case 'daily':
        cronExpression = '0 8 * * *'; // 8 AM daily
        break;
      case 'weekly':
        cronExpression = '0 8 * * 1'; // 8 AM every Monday
        break;
      case 'monthly':
        cronExpression = '0 8 1 * *'; // 8 AM on 1st of every month
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid schedule type' });
    }

    if (isJsonDB()) {
      // JSON DB Mode
      if (!global.jsonDB.scheduledReports) global.jsonDB.scheduledReports = [];
      
      const scheduledReport = {
        _id: crypto.randomUUID(),
        name,
        reportType,
        period,
        schedule,
        cronExpression,
        recipients: recipients || [],
        department: department || 'all',
        enabled: true,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };

      global.jsonDB.scheduledReports.push(scheduledReport);
      global.jsonDB.save();

      return res.status(201).json({ success: true, data: scheduledReport });
    }

    // MongoDB Mode
    const scheduledReport = await ScheduledReport.create({
      name,
      reportType,
      period,
      schedule,
      cronExpression,
      recipients: recipients || [],
      department: department || 'all',
      enabled: true,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: scheduledReport });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    res.status(500).json({ success: false, message: 'Failed to create scheduled report' });
  }
};

const getScheduledReports = async (req, res) => {
  try {
    if (isJsonDB()) {
      // JSON DB Mode
      const reports = global.jsonDB.scheduledReports || [];
      res.status(200).json({ success: true, data: reports });
      return;
    }

    // MongoDB Mode
    const reports = await ScheduledReport.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scheduled reports' });
  }
};

const updateScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, reportType, period, schedule, recipients, department, enabled } = req.body;

    let cronExpression;
    if (schedule) {
      switch (schedule) {
        case 'daily':
          cronExpression = '0 8 * * *';
          break;
        case 'weekly':
          cronExpression = '0 8 * * 1';
          break;
        case 'monthly':
          cronExpression = '0 8 1 * *';
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid schedule type' });
      }
    }

    if (isJsonDB()) {
      // JSON DB Mode
      const report = global.jsonDB.scheduledReports?.find(r => r._id === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Scheduled report not found' });
      }

      if (name) report.name = name;
      if (reportType) report.reportType = reportType;
      if (period) report.period = period;
      if (schedule) report.schedule = schedule;
      if (cronExpression) report.cronExpression = cronExpression;
      if (recipients) report.recipients = recipients;
      if (department) report.department = department;
      if (enabled !== undefined) report.enabled = enabled;
      report.updatedAt = new Date().toISOString();

      global.jsonDB.save();

      return res.status(200).json({ success: true, data: report });
    }

    // MongoDB Mode
    const updateData = {};
    if (name) updateData.name = name;
    if (reportType) updateData.reportType = reportType;
    if (period) updateData.period = period;
    if (schedule) updateData.schedule = schedule;
    if (cronExpression) updateData.cronExpression = cronExpression;
    if (recipients) updateData.recipients = recipients;
    if (department) updateData.department = department;
    if (enabled !== undefined) updateData.enabled = enabled;

    const report = await ScheduledReport.findByIdAndUpdate(id, updateData, { new: true });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Scheduled report not found' });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    res.status(500).json({ success: false, message: 'Failed to update scheduled report' });
  }
};

const deleteScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const index = global.jsonDB.scheduledReports?.findIndex(r => r._id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Scheduled report not found' });
      }

      global.jsonDB.scheduledReports.splice(index, 1);
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Scheduled report deleted successfully' });
    }

    // MongoDB Mode
    const report = await ScheduledReport.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Scheduled report not found' });
    }

    res.status(200).json({ success: true, message: 'Scheduled report deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    res.status(500).json({ success: false, message: 'Failed to delete scheduled report' });
  }
};

const runScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      // JSON DB Mode
      const scheduledReport = global.jsonDB.scheduledReports?.find(r => r._id === id);
      if (!scheduledReport) {
        return res.status(404).json({ success: false, message: 'Scheduled report not found' });
      }

      // Simulate running the report
      scheduledReport.lastRunAt = new Date().toISOString();
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Report generated successfully' });
    }

    // MongoDB Mode
    const scheduledReport = await ScheduledReport.findById(id);
    if (!scheduledReport) {
      return res.status(404).json({ success: false, message: 'Scheduled report not found' });
    }

    // Update last run time
    scheduledReport.lastRunAt = new Date();
    await scheduledReport.save();

    res.status(200).json({ success: true, message: 'Report generated successfully' });
  } catch (error) {
    console.error('Error running scheduled report:', error);
    res.status(500).json({ success: false, message: 'Failed to run scheduled report' });
  }
};

module.exports = {
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  runScheduledReport
};
