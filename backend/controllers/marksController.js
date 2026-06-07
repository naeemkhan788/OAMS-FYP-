const Marks = require('../models/Marks');
const User = require('../models/User');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const isJsonDB = () => global.jsonDB !== undefined;

const addMarks = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { classId, subject, assessmentType, title, marksData } = req.body;
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
          message: 'Not authorized to add marks for this class'
        });
      }

      for (const markData of marksData) {
        const { studentId, marksObtained, maxMarks, remarks } = markData;

        if (!classDoc.students || !classDoc.students.includes(studentId)) {
          continue;
        }

        const percentage = maxMarks > 0 ? ((marksObtained / maxMarks) * 100).toFixed(2) : 0;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        const existingIndex = global.jsonDB.marks.findIndex(m =>
          m.student === studentId &&
          m.class === classId &&
          m.subject === subject &&
          m.assessmentType === assessmentType &&
          m.title === title
        );

        if (existingIndex !== -1) {
          global.jsonDB.marks[existingIndex].marksObtained = marksObtained;
          global.jsonDB.marks[existingIndex].maxMarks = maxMarks;
          global.jsonDB.marks[existingIndex].percentage = percentage;
          global.jsonDB.marks[existingIndex].grade = grade;
          global.jsonDB.marks[existingIndex].remarks = remarks;
          global.jsonDB.marks[existingIndex].gradedBy = teacherId;
          global.jsonDB.marks[existingIndex].isPublished = true;
          global.jsonDB.marks[existingIndex].publishedAt = new Date();
        } else {
          global.jsonDB.marks.push({
            _id: uuidv4(),
            student: studentId,
            class: classId,
            teacher: teacherId,
            subject,
            assessmentType,
            title,
            marksObtained,
            maxMarks,
            percentage,
            grade,
            remarks,
            gradedBy: teacherId,
            isPublished: true,
            publishedAt: new Date(),
            assessmentDate: new Date(),
            createdAt: new Date()
          });
        }
      }

      global.jsonDB.save();
      return res.status(200).json({
        success: true,
        message: 'Marks added successfully'
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
        message: 'Not authorized to add marks for this class'
      });
    }

    const marksPromises = [];

    for (const markData of marksData) {
      const { studentId, marksObtained, maxMarks, remarks } = markData;

      if (!classDoc.students.some(s => s._id.toString() === studentId)) {
        continue;
      }

      const existingMarks = await Marks.findOne({
        student: studentId,
        class: classId,
        subject,
        assessmentType,
        title
      });

      if (existingMarks) {
        existingMarks.marksObtained = marksObtained;
        existingMarks.maxMarks = maxMarks;
        existingMarks.remarks = remarks;
        existingMarks.gradedBy = teacherId;
        existingMarks.isPublished = true;
        existingMarks.publishedAt = new Date();
        marksPromises.push(existingMarks.save());
      } else {
        marksPromises.push(
          Marks.create({
            student: studentId,
            class: classId,
            teacher: teacherId,
            subject,
            assessmentType,
            title,
            marksObtained,
            maxMarks,
            remarks,
            gradedBy: teacherId,
            isPublished: true,
            publishedAt: new Date()
          })
        );
      }
    }

    await Promise.all(marksPromises);

    res.status(200).json({
      success: true,
      message: 'Marks added successfully'
    });
  } catch (error) {
    console.error('Add marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding marks'
    });
  }
};

const getMarksByClass = async (req, res) => {
  try {
    const { classId, subject, assessmentType } = req.query;
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
          message: 'Not authorized to view marks for this class'
        });
      }

      let marks = global.jsonDB.marks.filter(m => m.class === classId);
      if (subject) marks = marks.filter(m => m.subject === subject);
      if (assessmentType) marks = marks.filter(m => m.assessmentType === assessmentType);

      marks = marks.map(m => ({
        ...m,
        student: global.jsonDB.users.find(u => u._id === m.student)
      })).filter(m => m.student).sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

      const groupedMarks = {};
      marks.forEach(mark => {
        const key = `${mark.assessmentType}-${mark.title}`;
        if (!groupedMarks[key]) {
          groupedMarks[key] = {
            assessmentType: mark.assessmentType,
            title: mark.title,
            subject: mark.subject,
            maxMarks: mark.maxMarks,
            assessmentDate: mark.assessmentDate,
            isPublished: mark.isPublished,
            students: []
          };
        }
        groupedMarks[key].students.push({
          student: mark.student,
          marksObtained: mark.marksObtained,
          percentage: mark.percentage,
          grade: mark.grade,
          remarks: mark.remarks
        });
      });

      return res.status(200).json({
        success: true,
        data: {
          class: classDoc,
          assessments: Object.values(groupedMarks)
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
        message: 'Not authorized to view marks for this class'
      });
    }

    const query = { class: classId };
    if (subject) query.subject = subject;
    if (assessmentType) query.assessmentType = assessmentType;

    const marks = await Marks.find(query)
      .populate('student', 'name studentId email')
      .sort({ assessmentDate: -1, student: 1 });

    const groupedMarks = {};
    marks.forEach(mark => {
      const key = `${mark.assessmentType}-${mark.title}`;
      if (!groupedMarks[key]) {
        groupedMarks[key] = {
          assessmentType: mark.assessmentType,
          title: mark.title,
          subject: mark.subject,
          maxMarks: mark.maxMarks,
          assessmentDate: mark.assessmentDate,
          isPublished: mark.isPublished,
          students: []
        };
      }
      groupedMarks[key].students.push({
        student: mark.student,
        marksObtained: mark.marksObtained,
        percentage: mark.percentage,
        grade: mark.grade,
        remarks: mark.remarks
      });
    });

    res.status(200).json({
      success: true,
      data: {
        class: classDoc,
        assessments: Object.values(groupedMarks)
      }
    });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching marks'
    });
  }
};

const getStudentMarks = async (req, res) => {
  try {
    const { subject, assessmentType } = req.query;
    const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

    // JSON DB Mode
    if (isJsonDB()) {
      let marks = global.jsonDB.marks.filter(m => m.student === studentId);
      if (req.user.role === 'student') {
        marks = marks.filter(m => m.isPublished);
      }
      if (subject) marks = marks.filter(m => m.subject === subject);
      if (assessmentType) marks = marks.filter(m => m.assessmentType === assessmentType);

      marks = marks.map(m => ({
        ...m,
        class: global.jsonDB.classes.find(c => c._id === m.class),
        teacher: global.jsonDB.users.find(u => u._id === m.teacher)
      })).filter(m => m.class && m.teacher).sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

      const groupedMarks = {};
      marks.forEach(mark => {
        const key = mark.class._id;
        if (!groupedMarks[key]) {
          groupedMarks[key] = {
            class: mark.class,
            subjects: {}
          };
        }

        if (!groupedMarks[key].subjects[mark.subject]) {
          groupedMarks[key].subjects[mark.subject] = [];
        }

        groupedMarks[key].subjects[mark.subject].push({
          assessmentType: mark.assessmentType,
          title: mark.title,
          marksObtained: mark.marksObtained,
          maxMarks: mark.maxMarks,
          percentage: mark.percentage,
          grade: mark.grade,
          remarks: mark.remarks,
          assessmentDate: mark.assessmentDate,
          isPublished: mark.isPublished,
          teacher: mark.teacher
        });
      });

      const stats = calculateStudentStats(marks);

      return res.status(200).json({
        success: true,
        data: {
          marks: Object.values(groupedMarks),
          stats
        }
      });
    }

    // MongoDB Mode
    const query = { student: studentId };
    if (req.user.role === 'student') {
      query.isPublished = true;
    }
    if (subject) query.subject = subject;
    if (assessmentType) query.assessmentType = assessmentType;

    const marks = await Marks.find(query)
      .populate('class', 'name code grade section')
      .populate('teacher', 'name')
      .sort({ assessmentDate: -1 });

    const groupedMarks = {};
    marks.forEach(mark => {
      const key = mark.class._id.toString();
      if (!groupedMarks[key]) {
        groupedMarks[key] = {
          class: mark.class,
          subjects: {}
        };
      }

      if (!groupedMarks[key].subjects[mark.subject]) {
        groupedMarks[key].subjects[mark.subject] = [];
      }

      groupedMarks[key].subjects[mark.subject].push({
        assessmentType: mark.assessmentType,
        title: mark.title,
        marksObtained: mark.marksObtained,
        maxMarks: mark.maxMarks,
        percentage: mark.percentage,
        grade: mark.grade,
        remarks: mark.remarks,
        assessmentDate: mark.assessmentDate,
        isPublished: mark.isPublished,
        teacher: mark.teacher
      });
    });

    const stats = calculateStudentStats(marks);

    res.status(200).json({
      success: true,
      data: {
        marks: Object.values(groupedMarks),
        stats
      }
    });
  } catch (error) {
    console.error('Get student marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student marks'
    });
  }
};

const publishMarks = async (req, res) => {
  try {
    const { classId, subject, assessmentType, title } = req.body;
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
          message: 'Not authorized to publish marks for this class'
        });
      }

      global.jsonDB.marks.forEach(m => {
        if (m.class === classId && m.subject === subject && m.assessmentType === assessmentType && m.title === title) {
          m.isPublished = true;
          m.publishedAt = new Date();
        }
      });

      global.jsonDB.save();
      return res.status(200).json({
        success: true,
        message: 'Marks published successfully'
      });
    }

    // MongoDB Mode
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classDoc.teacher.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish marks for this class'
      });
    }

    await Marks.updateMany(
      {
        class: classId,
        subject,
        assessmentType,
        title
      },
      {
        isPublished: true,
        publishedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Marks published successfully'
    });
  } catch (error) {
    console.error('Publish marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing marks'
    });
  }
};

const calculateStudentStats = (marks) => {
  if (marks.length === 0) {
    return {
      totalAssessments: 0,
      averagePercentage: 0,
      gradeDistribution: {},
      subjectAverages: {}
    };
  }

  const totalPercentage = marks.reduce((sum, mark) => sum + mark.percentage, 0);
  const averagePercentage = (totalPercentage / marks.length).toFixed(2);

  const gradeDistribution = {};
  marks.forEach(mark => {
    gradeDistribution[mark.grade] = (gradeDistribution[mark.grade] || 0) + 1;
  });

  const subjectAverages = {};
  marks.forEach(mark => {
    if (!subjectAverages[mark.subject]) {
      subjectAverages[mark.subject] = {
        total: 0,
        count: 0,
        average: 0
      };
    }
    subjectAverages[mark.subject].total += mark.percentage;
    subjectAverages[mark.subject].count += 1;
  });

  Object.keys(subjectAverages).forEach(subject => {
    const data = subjectAverages[subject];
    data.average = (data.total / data.count).toFixed(2);
  });

  return {
    totalAssessments: marks.length,
    averagePercentage,
    gradeDistribution,
    subjectAverages
  };
};

const getMarksReport = async (req, res) => {
  try {
    const { classId, subject, startDate, endDate } = req.query;
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
          message: 'Not authorized to view marks for this class'
        });
      }

      let marks = global.jsonDB.marks.filter(m => m.class === classId);
      if (subject) marks = marks.filter(m => m.subject === subject);
      if (startDate && endDate) {
        marks = marks.filter(m => {
          const date = new Date(m.assessmentDate);
          return date >= new Date(startDate) && date <= new Date(endDate);
        });
      }

      marks = marks.map(m => ({
        ...m,
        student: global.jsonDB.users.find(u => u._id === m.student)
      })).filter(m => m.student).sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

      const report = (classDoc.students || []).map(studentId => {
        const student = global.jsonDB.users.find(u => u._id === studentId);
        if (!student) return null;

        const studentMarks = marks.filter(m => m.student === studentId);

        const stats = {
          totalAssessments: studentMarks.length,
          averagePercentage: studentMarks.length > 0 ?
            (studentMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / studentMarks.length).toFixed(2) : 0,
          gradeDistribution: {},
          highestMark: 0,
          lowestMark: 100
        };

        studentMarks.forEach(mark => {
          stats.gradeDistribution[mark.grade] = (stats.gradeDistribution[mark.grade] || 0) + 1;
          stats.highestMark = Math.max(stats.highestMark, mark.percentage || 0);
          stats.lowestMark = Math.min(stats.lowestMark, mark.percentage || 100);
        });

        return {
          student,
          stats,
          details: studentMarks
        };
      }).filter(Boolean);

      return res.status(200).json({
        success: true,
        data: {
          class: classDoc,
          period: { startDate, endDate },
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
        message: 'Not authorized to view marks for this class'
      });
    }

    const query = { class: classId };
    if (subject) query.subject = subject;
    if (startDate && endDate) {
      query.assessmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const marks = await Marks.find(query)
      .populate('student', 'name studentId email')
      .sort({ assessmentDate: -1, student: 1 });

    const report = classDoc.students.map(student => {
      const studentMarks = marks.filter(m =>
        m.student._id.toString() === student._id.toString()
      );

      const stats = {
        totalAssessments: studentMarks.length,
        averagePercentage: studentMarks.length > 0 ?
          (studentMarks.reduce((sum, m) => sum + m.percentage, 0) / studentMarks.length).toFixed(2) : 0,
        gradeDistribution: {},
        highestMark: 0,
        lowestMark: 100
      };

      studentMarks.forEach(mark => {
        stats.gradeDistribution[mark.grade] = (stats.gradeDistribution[mark.grade] || 0) + 1;
        stats.highestMark = Math.max(stats.highestMark, mark.percentage);
        stats.lowestMark = Math.min(stats.lowestMark, mark.percentage);
      });

      return {
        student,
        stats,
        details: studentMarks
      };
    });

    res.status(200).json({
      success: true,
      data: {
        class: classDoc,
        period: { startDate, endDate },
        report
      }
    });
  } catch (error) {
    console.error('Get marks report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating marks report'
    });
  }
};

const getTeacherMarks = async (req, res) => {
  try {
    if (isJsonDB()) {
      const marks = global.jsonDB.marks
        .filter(m => m.teacher === req.user.id)
        .map(m => ({
          ...m,
          student: global.jsonDB.users.find(u => u._id === m.student),
          class: global.jsonDB.classes.find(c => c._id === m.class)
        }))
        .filter(m => m.student && m.class)
        .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

      return res.status(200).json({ success: true, data: { marks } });
    }
    const marks = await Marks.find({ teacher: req.user.id })
      .populate('student', 'name studentId')
      .populate('class', 'name code')
      .sort({ assessmentDate: -1 });
    res.status(200).json({ success: true, data: { marks } });
  } catch (error) {
    console.error('Get teacher marks error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher marks' });
  }
};

module.exports = {
  addMarks,
  getMarksByClass,
  getStudentMarks,
  publishMarks,
  getMarksReport,
  getTeacherMarks
};
