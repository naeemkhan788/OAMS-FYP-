const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

const isJsonDB = () => global.jsonDB !== undefined;

const handleMongooseValidationError = (error, res) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      path: err.path,
      msg: err.message
    }));
    const message = errors.map(e => `${e.path}: ${e.msg}`).join(', ');
    return res.status(400).json({ success: false, message: `Validation failed: ${message}`, errors });
  }
  return null;
};

const createClass = async (req, res) => {
  try {
    console.log('CreateClass - Request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map(e => `${e.path}: ${e.msg}`).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${errorDetails}`, errors: errors.array() });
    }

    if (isJsonDB()) {
      const existingClass = global.jsonDB.classes.find(c => c.code === req.body.code);
      if (existingClass) {
        return res.status(400).json({ success: false, message: 'Class code already exists' });
      }

      const newClass = {
        _id: crypto.randomUUID(),
        ...req.body,
        students: req.body.students || [],
        createdAt: new Date().toISOString()
      };

      global.jsonDB.classes.push(newClass);
      global.jsonDB.save();
      return res.status(201).json({ success: true, message: 'Class created successfully', data: { class: newClass } });
    }

    const existingClass = await Class.findOne({ code: req.body.code });
    if (existingClass) {
      return res.status(400).json({ success: false, message: 'Class code already exists' });
    }

    const newClass = await Class.create(req.body);
    res.status(201).json({ success: true, message: 'Class created successfully', data: { class: newClass } });
  } catch (error) {
    console.error('Create class error:', error);
    const validationResponse = handleMongooseValidationError(error, res);
    if (validationResponse) return validationResponse;
    res.status(500).json({ success: false, message: 'Server error while creating class' });
  }
};

const getClasses = async (req, res) => {
  try {
    if (isJsonDB()) {
      let classes = global.jsonDB.classes;
      if (req.user.role === 'teacher') {
        classes = classes.filter(c => c.teacher === req.user.id);
      }

      // Populate teacher and students
      const populatedClasses = classes.map(cls => {
        const teacher = global.jsonDB.users.find(u => u._id === cls.teacher);
        const students = (cls.students || []).map(studentId => global.jsonDB.users.find(u => u._id === studentId)).filter(Boolean);
        return {
          ...cls,
          teacher: teacher ? { _id: teacher._id, name: teacher.name, email: teacher.email } : null,
          students: students.map(s => ({ _id: s._id, name: s.name, email: s.email }))
        };
      });

      return res.status(200).json({ success: true, data: { classes: populatedClasses } });
    }

    let query = {};
    if (req.user.role === 'teacher') {
      query.teacher = req.user.id;
    }
    const classes = await Class.find(query)
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email studentId');
    res.status(200).json({ success: true, data: { classes } });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching classes' });
  }
};

const getClassById = async (req, res) => {
  try {
    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === req.params.id);
      if (!classDoc) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      if (req.user.role === 'teacher' && classDoc.teacher !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const teacher = global.jsonDB.users.find(u => u._id === classDoc.teacher);
      const students = (classDoc.students || []).map(studentId => global.jsonDB.users.find(u => u._id === studentId)).filter(Boolean);

      const populatedClass = {
        ...classDoc,
        teacher: teacher ? { _id: teacher._id, name: teacher.name, email: teacher.email } : null,
        students: students.map(s => ({ _id: s._id, name: s.name, email: s.email }))
      };

      return res.status(200).json({ success: true, data: { class: populatedClass } });
    }

    const classDoc = await Class.findById(req.params.id)
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email studentId');

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (req.user.role === 'teacher' && classDoc.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: { class: classDoc } });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching class by ID' });
  }
};

const updateClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    if (isJsonDB()) {
      const classIndex = global.jsonDB.classes.findIndex(c => c._id === req.params.id);
      if (classIndex === -1) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      if (req.user.role === 'teacher' && global.jsonDB.classes[classIndex].teacher !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this class' });
      }

      Object.assign(global.jsonDB.classes[classIndex], req.body);
      global.jsonDB.save();
      return res.status(200).json({ success: true, message: 'Class updated successfully', data: { class: global.jsonDB.classes[classIndex] } });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (req.user.role === 'teacher' && classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this class' });
    }

    Object.assign(classDoc, req.body);
    await classDoc.save();

    res.status(200).json({ success: true, message: 'Class updated successfully', data: { class: classDoc } });
  } catch (error) {
    console.error('Update class error:', error);
    const validationResponse = handleMongooseValidationError(error, res);
    if (validationResponse) return validationResponse;
    res.status(500).json({ success: false, message: 'Server error while updating class' });
  }
};

const deleteClass = async (req, res) => {
  try {
    if (isJsonDB()) {
      const classIndex = global.jsonDB.classes.findIndex(c => c._id === req.params.id);
      if (classIndex === -1) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      if (req.user.role !== 'admin' && (req.user.role !== 'teacher' || global.jsonDB.classes[classIndex].teacher !== req.user.id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this class' });
      }

      global.jsonDB.classes.splice(classIndex, 1);
      global.jsonDB.save();
      return res.status(200).json({ success: true, message: 'Class deleted successfully' });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (req.user.role !== 'admin' && (req.user.role !== 'teacher' || classDoc.teacher.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this class' });
    }

    await classDoc.deleteOne();

    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting class' });
  }
};

const getTeacherClasses = async (req, res) => {
  try {
    console.log('Get Teacher Classes - Logged in Teacher ID:', req.user.id);
    console.log('Get Teacher Classes - User Role:', req.user.role);
    if (isJsonDB()) {
      console.log('All classes with teacher assignments:', global.jsonDB.classes.map(c => ({ _id: c._id, name: c.name, teacher: c.teacher })));
      const classes = global.jsonDB.classes.filter(c => c.teacher === req.user.id);
      console.log('Filtered classes for this teacher:', classes);
      const populatedClasses = classes.map(cls => {
        const students = (cls.students || []).map(studentId => global.jsonDB.users.find(u => u._id === studentId)).filter(Boolean);
        return {
          ...cls,
          students: students.map(s => ({ _id: s._id, name: s.name, email: s.email }))
        };
      });
      return res.status(200).json({ success: true, data: { classes: populatedClasses } });
    }
    const classes = await Class.find({ teacher: req.user.id })
      .populate('students', 'name email studentId');
    res.status(200).json({ success: true, data: { classes } });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher classes' });
  }
};

const getTeacherStudents = async (req, res) => {
  try {
    console.log('[getTeacherStudents] Teacher ID:', req.user.id);
    console.log('[getTeacherStudents] User Role:', req.user.role);
    
    if (isJsonDB()) {
      console.log('[getTeacherStudents] Using JSON DB mode');
      console.log('[getTeacherStudents] All classes:', global.jsonDB.classes.map(c => ({ _id: c._id, name: c.name, teacher: c.teacher })));
      const classes = global.jsonDB.classes.filter(c => c.teacher === req.user.id);
      console.log('[getTeacherStudents] Classes for this teacher:', classes.length, classes.map(c => ({ _id: c._id, name: c.name, studentsCount: c.students?.length || 0 })));
      const studentIds = classes.flatMap(c => c.students || []);
      console.log('[getTeacherStudents] Student IDs:', studentIds);
      const students = studentIds.map(id => global.jsonDB.users.find(u => u._id === id)).filter(Boolean);
      console.log('[getTeacherStudents] Students found:', students.length);
      return res.status(200).json({ success: true, data: { students } });
    }
    
    console.log('[getTeacherStudents] Using MongoDB mode');
    const classes = await Class.find({ teacher: req.user.id });
    console.log('[getTeacherStudents] Classes for this teacher:', classes.length);
    const studentIds = classes.flatMap(c => c.students);
    console.log('[getTeacherStudents] Student IDs:', studentIds);
    const students = await User.find({ _id: { $in: studentIds } }).select('name email studentId');
    console.log('[getTeacherStudents] Students found:', students.length);
    res.status(200).json({ success: true, data: { students } });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher students' });
  }
};

const getClassStudents = async (req, res) => {
  try {
    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === req.params.id);
      if (!classDoc) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }
      const students = (classDoc.students || []).map(studentId => global.jsonDB.users.find(u => u._id === studentId)).filter(Boolean);
      return res.status(200).json({ success: true, data: { students } });
    }
    const classDoc = await Class.findById(req.params.id).populate('students', 'name email studentId');
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: { students: classDoc.students } });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching class students' });
  }
};

const assignStudentToClass = async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    if (isJsonDB()) {
      const classIndex = global.jsonDB.classes.findIndex(c => c._id === classId);
      if (classIndex === -1) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }
      if (!global.jsonDB.classes[classIndex].students) {
        global.jsonDB.classes[classIndex].students = [];
      }
      const alreadyAssigned = global.jsonDB.classes[classIndex].students.some(
        id => id.toString() === studentId.toString()
      );
      if (!alreadyAssigned) {
        global.jsonDB.classes[classIndex].students.push(studentId);
      }
      const userIndex = global.jsonDB.users.findIndex(u => u._id === studentId);
      if (userIndex !== -1) {
        global.jsonDB.users[userIndex].class = classId;
      }
      global.jsonDB.save();
      return res.status(200).json({ success: true, message: 'Student assigned to class successfully' });
    }
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    const alreadyAssigned = classDoc.students.some(id => id.toString() === studentId.toString());
    if (!alreadyAssigned) {
      classDoc.students.push(studentId);
      await classDoc.save();
    }
    await User.findByIdAndUpdate(studentId, { class: classId });
    res.status(200).json({ success: true, message: 'Student assigned to class successfully' });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({ success: false, message: 'Server error while assigning student' });
  }
};

const getStudentClass = async (req, res) => {
  try {
    const studentId = req.user.id;

    if (isJsonDB()) {
      const user = global.jsonDB.users.find(u => u._id === studentId);
      let classDoc = user?.class
        ? global.jsonDB.classes.find(c => c._id === user.class)
        : null;

      if (!classDoc) {
        classDoc = global.jsonDB.classes.find(c =>
          (c.students || []).some(id => id.toString() === studentId.toString())
        );
      }

      if (!classDoc) {
        return res.status(200).json({ success: true, data: { class: null } });
      }

      const teacher = global.jsonDB.users.find(u => u._id === classDoc.teacher);
      return res.status(200).json({
        success: true,
        data: {
          class: {
            ...classDoc,
            teacher: teacher
              ? { _id: teacher._id, name: teacher.name, email: teacher.email }
              : null
          }
        }
      });
    }

    let classDoc = await Class.findOne({ students: studentId })
      .populate('teacher', 'name email');

    if (!classDoc) {
      const user = await User.findById(studentId).populate({
        path: 'class',
        populate: { path: 'teacher', select: 'name email' }
      });
      classDoc = user?.class || null;
    }

    res.status(200).json({ success: true, data: { class: classDoc } });
  } catch (error) {
    console.error('Get student class error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching student class' });
  }
};

const assignTeacher = async (req, res) => {
  try {
    const { teacher } = req.body;
    console.log('Assign Teacher - Request body:', req.body);
    console.log('Assign Teacher - Class ID from params:', req.params.id);
    console.log('Assign Teacher - Teacher ID:', teacher);
    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
    }
    if (isJsonDB()) {
      console.log('All classes before assignment:', global.jsonDB.classes.map(c => ({ _id: c._id, name: c.name, teacher: c.teacher })));
      const classIndex = global.jsonDB.classes.findIndex(c => c._id === req.params.id);
      console.log('Class index:', classIndex);
      if (classIndex === -1) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }
      console.log('Class before assignment:', global.jsonDB.classes[classIndex]);
      global.jsonDB.classes[classIndex].teacher = teacher;
      console.log('Class after assignment:', global.jsonDB.classes[classIndex]);
      global.jsonDB.save();
      console.log('All classes after assignment:', global.jsonDB.classes.map(c => ({ _id: c._id, name: c.name, teacher: c.teacher })));
      return res.status(200).json({ success: true, message: 'Teacher assigned to class successfully' });
    }
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    classDoc.teacher = teacher;
    await classDoc.save();
    res.status(200).json({ success: true, message: 'Teacher assigned to class successfully' });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ success: false, message: 'Server error while assigning teacher' });
  }
};

const getClassStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === id);
      if (!classDoc) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      const totalStudents = classDoc.students ? classDoc.students.length : 0;

      const classAttendance = global.jsonDB.attendance.filter(a => a.class === id);
      let attendanceRate = 100;
      if (classAttendance.length > 0) {
        const present = classAttendance.filter(a => a.status === 'present').length;
        attendanceRate = parseFloat(((present / classAttendance.length) * 100).toFixed(1));
      }

      const classMarks = global.jsonDB.marks.filter(m => m.class === id);
      let averageMarks = 0;
      let passRate = 100;

      if (classMarks.length > 0) {
        let totalPct = 0;
        let passed = 0;

        classMarks.forEach(m => {
          const pct = parseFloat(m.percentage || 0);
          totalPct += pct;
          if (pct >= 50 || m.grade !== 'F') passed++;
        });

        averageMarks = parseFloat((totalPct / classMarks.length).toFixed(1));
        passRate = parseFloat(((passed / classMarks.length) * 100).toFixed(1));
      }

      return res.status(200).json({
        success: true,
        data: {
          totalStudents,
          averageMarks,
          attendanceRate,
          passRate
        }
      });
    }

    const classDoc = await Class.findById(id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const totalStudents = classDoc.students ? classDoc.students.length : 0;

    const attendances = await Attendance.find({ class: id });
    let attendanceRate = 100;
    if (attendances.length > 0) {
      const present = attendances.filter(a => a.status === 'present').length;
      attendanceRate = parseFloat(((present / attendances.length) * 100).toFixed(1));
    }

    const markDocs = await Marks.find({ class: id });
    let averageMarks = 0;
    let passRate = 100;

    if (markDocs.length > 0) {
      let totalPct = 0;
      let passed = 0;

      markDocs.forEach(m => {
        const pct = m.percentage || 0;
        totalPct += pct;
        if (pct >= 50 || m.grade !== 'F') passed++;
      });

      averageMarks = parseFloat((totalPct / markDocs.length).toFixed(1));
      passRate = parseFloat(((passed / markDocs.length) * 100).toFixed(1));
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        averageMarks,
        attendanceRate,
        passRate
      }
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({ success: false, message: 'Server error while calculating class stats' });
  }
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getTeacherClasses,
  getTeacherStudents,
  assignStudentToClass,
  getStudentClass,
  getClassStudents,
  assignTeacher,
  getClassStats
};
