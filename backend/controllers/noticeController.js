const Notice = require('../models/Notice');
const User = require('../models/User');
const Class = require('../models/Class');
const crypto = require('crypto');
const { createNotification } = require('./notificationController');

const isJsonDB = () => global.jsonDB !== undefined;

/**
 * Create a new notice (Admin only)
 */
const createNotice = async (req, res) => {
  try {
    console.log('[CREATE NOTICE] Request received');
    console.log('[CREATE NOTICE] User:', req.user);
    console.log('[CREATE NOTICE] Body:', req.body);
    
    const { title, message, targetType, targetTeacherId, classId, targetRole } = req.body;
    const createdBy = req.user.id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Notice title is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notice message is required' });
    }
    if (!targetType || (targetType !== 'all' && targetType !== 'teacher')) {
      return res.status(400).json({ success: false, message: 'Invalid target type. Must be "all" or "teacher"' });
    }
    if (targetType === 'teacher' && !targetTeacherId) {
      return res.status(400).json({ success: false, message: 'Target teacher ID is required when targetType is "teacher"' });
    }

    console.log('[CREATE NOTICE] Validation passed');
    console.log('[CREATE NOTICE] DB Mode:', isJsonDB() ? 'JSON DB' : 'MongoDB');

    if (isJsonDB()) {
      console.log('[CREATE NOTICE] Using JSON DB mode');
      // Validate teacher if specified
      if (targetType === 'teacher') {
        const teacher = global.jsonDB.users.find(u => u._id === targetTeacherId && u.role === 'teacher');
        if (!teacher) {
          return res.status(404).json({ success: false, message: 'Target teacher not found' });
        }
      }

      const newNotice = {
        _id: crypto.randomUUID(),
        title: title.trim(),
        message: message.trim(),
        targetType,
        targetTeacherId: targetType === 'teacher' ? targetTeacherId : null,
        classId: classId || null,
        targetRole: targetRole || 'teachers',
        createdBy,
        isRead: false,
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[CREATE NOTICE] New notice created:', newNotice);

      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      global.jsonDB.notices.push(newNotice);
      
      console.log('[CREATE NOTICE] Saving to JSON DB...');
      global.jsonDB.save();
      console.log('[CREATE NOTICE] JSON DB saved successfully');

      // Create notifications for students
      if (targetType === 'all') {
        const students = global.jsonDB.users.filter(u => u.role === 'student');
        for (const student of students) {
          await createNotification({
            senderRole: req.user.role,
            senderId: req.user.id,
            receiverRole: 'student',
            receiverId: student._id,
            type: 'notice',
            page: 'notices',
            title: title.trim(),
            message: message.trim()
          });
        }
      }

      return res.status(201).json({ success: true, message: 'Notice sent successfully', data: { notice: newNotice } });
    }

    // MongoDB Mode
    console.log('[CREATE NOTICE] Using MongoDB mode');
    // Validate teacher if specified
    if (targetType === 'teacher') {
      const teacher = await User.findOne({ _id: targetTeacherId, role: 'teacher' });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Target teacher not found' });
      }
    }

    console.log('[CREATE NOTICE] Creating notice in MongoDB...');
    const newNotice = await Notice.create({
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetTeacherId: targetType === 'teacher' ? targetTeacherId : null,
      classId: classId || null,
      targetRole: targetRole || 'teachers',
      createdBy,
      isRead: false,
      readBy: []
    });

    console.log('[CREATE NOTICE] Populating notice...');
    const populatedNotice = await Notice.findById(newNotice._id)
      .populate('createdBy', 'name email')
      .populate('targetTeacherId', 'name email');

    // Create notifications for students
    if (targetType === 'all') {
      const students = await User.find({ role: 'student' });
      for (const student of students) {
        await createNotification({
          senderRole: req.user.role,
          senderId: req.user.id,
          receiverRole: 'student',
          receiverId: student._id,
          type: 'notice',
          page: 'notices',
          title: title.trim(),
          message: message.trim()
        });
      }
    }

    console.log('[CREATE NOTICE] Sending response...');
    res.status(201).json({ success: true, message: 'Notice sent successfully', data: { notice: populatedNotice } });
  } catch (error) {
    console.error('[CREATE NOTICE] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending notice', error: error.message });
  }
};

/**
 * Get all notices for Admin
 */
const getAdminNotices = async (req, res) => {
  try {
    const { targetType, targetTeacherId } = req.query;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      let notices = global.jsonDB.notices;

      // Filter by target type
      if (targetType) {
        notices = notices.filter(n => n.targetType === targetType);
      }
      if (targetTeacherId) {
        notices = notices.filter(n => n.targetTeacherId === targetTeacherId);
      }

      // Populate data
      const populatedNotices = notices.map(notice => {
        const creator = global.jsonDB.users.find(u => u._id === notice.createdBy);
        const targetTeacher = notice.targetTeacherId ? global.jsonDB.users.find(u => u._id === notice.targetTeacherId) : null;
        return {
          ...notice,
          createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : null,
          targetTeacher: targetTeacher ? { _id: targetTeacher._id, name: targetTeacher.name, email: targetTeacher.email } : null
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({ success: true, data: { notices: populatedNotices } });
    }

    // MongoDB Mode
    const query = {};
    if (targetType) {
      query.targetType = targetType;
    }
    if (targetTeacherId) {
      query.targetTeacherId = targetTeacherId;
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email')
      .populate('targetTeacherId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { notices } });
  } catch (error) {
    console.error('Get admin notices error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching notices' });
  }
};

/**
 * Get notices for Teacher (their own + all teachers)
 */
const getTeacherNotices = async (req, res) => {
  try {
    const teacherId = req.user.id;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      
      // Get notices for all teachers or specifically for this teacher
      const notices = global.jsonDB.notices.filter(n => 
        n.targetRole === 'teachers' && 
        (n.targetType === 'all' || n.targetTeacherId === teacherId)
      );

      // Populate data
      const populatedNotices = notices.map(notice => {
        const creator = global.jsonDB.users.find(u => u._id === notice.createdBy);
        const isRead = notice.readBy && notice.readBy.includes(teacherId);
        return {
          ...notice,
          createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : null,
          isRead: isRead || false
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({ success: true, data: { notices: populatedNotices } });
    }

    // MongoDB Mode
    const notices = await Notice.find({
      targetRole: 'teachers',
      $or: [
        { targetType: 'all' },
        { targetTeacherId: teacherId }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('targetTeacherId', 'name email')
      .sort({ createdAt: -1 });

    // Check read status for each notice
    const noticesWithReadStatus = notices.map(notice => ({
      ...notice.toObject(),
      isRead: notice.readBy && notice.readBy.some(id => id.toString() === teacherId)
    }));

    res.status(200).json({ success: true, data: { notices: noticesWithReadStatus } });
  } catch (error) {
    console.error('Get teacher notices error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching notices' });
  }
};

/**
 * Mark notice as read by teacher
 */
const markNoticeAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    if (isJsonDB()) {
      const noticeIndex = global.jsonDB.notices.findIndex(n => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      const notice = global.jsonDB.notices[noticeIndex];
      
      // Check if notice is for this teacher
      if (notice.targetRole !== 'teachers' || 
          (notice.targetType === 'teacher' && notice.targetTeacherId !== teacherId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to mark this notice' });
      }

      if (!notice.readBy) notice.readBy = [];
      if (!notice.readBy.includes(teacherId)) {
        notice.readBy.push(teacherId);
      }
      notice.isRead = true;
      notice.updatedAt = new Date().toISOString();
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Notice marked as read' });
    }

    // MongoDB Mode
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Check if notice is for this teacher
    if (notice.targetRole !== 'teachers' || 
        (notice.targetType === 'teacher' && notice.targetTeacherId.toString() !== teacherId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to mark this notice' });
    }

    if (!notice.readBy.includes(teacherId)) {
      notice.readBy.push(teacherId);
    }
    notice.isRead = true;
    await notice.save();

    res.status(200).json({ success: true, message: 'Notice marked as read' });
  } catch (error) {
    console.error('Mark notice as read error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking notice as read' });
  }
};

/**
 * Mark all notices as read by teacher
 */
const markAllNoticesAsRead = async (req, res) => {
  try {
    const teacherId = req.user.id;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      
      let markedCount = 0;
      global.jsonDB.notices.forEach(notice => {
        if (notice.targetRole === 'teachers' && 
            (notice.targetType === 'all' || notice.targetTeacherId === teacherId)) {
          if (!notice.readBy) notice.readBy = [];
          if (!notice.readBy.includes(teacherId)) {
            notice.readBy.push(teacherId);
            markedCount++;
          }
          notice.isRead = true;
          notice.updatedAt = new Date().toISOString();
        }
      });
      
      global.jsonDB.save();
      return res.status(200).json({ success: true, message: `${markedCount} notices marked as read` });
    }

    // MongoDB Mode
    const result = await Notice.updateMany(
      {
        targetRole: 'teachers',
        $or: [
          { targetType: 'all' },
          { targetTeacherId: teacherId }
        ],
        readBy: { $ne: teacherId }
      },
      {
        $push: { readBy: teacherId },
        $set: { isRead: true }
      }
    );

    res.status(200).json({ success: true, message: `${result.modifiedCount} notices marked as read` });
  } catch (error) {
    console.error('Mark all notices as read error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking notices as read' });
  }
};

/**
 * Update notice (Admin only)
 */
const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, targetType, targetTeacherId } = req.body;

    if (isJsonDB()) {
      const noticeIndex = global.jsonDB.notices.findIndex(n => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      const notice = global.jsonDB.notices[noticeIndex];

      // Only admin can update
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update notice' });
      }

      if (title) notice.title = title.trim();
      if (message) notice.message = message.trim();
      if (targetType) notice.targetType = targetType;
      if (targetTeacherId !== undefined) notice.targetTeacherId = targetTeacherId;
      notice.updatedAt = new Date().toISOString();
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Notice updated successfully', data: { notice } });
    }

    // MongoDB Mode
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Only admin can update
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update notice' });
    }

    if (title) notice.title = title.trim();
    if (message) notice.message = message.trim();
    if (targetType) notice.targetType = targetType;
    if (targetTeacherId !== undefined) notice.targetTeacherId = targetTeacherId;
    await notice.save();

    const updatedNotice = await Notice.findById(id)
      .populate('createdBy', 'name email')
      .populate('targetTeacherId', 'name email');

    res.status(200).json({ success: true, message: 'Notice updated successfully', data: { notice: updatedNotice } });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating notice' });
  }
};

/**
 * Delete notice (Admin only)
 */
const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      const noticeIndex = global.jsonDB.notices.findIndex(n => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      // Only admin can delete
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to delete notice' });
      }

      global.jsonDB.notices.splice(noticeIndex, 1);
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Notice deleted successfully' });
    }

    // MongoDB Mode
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete notice' });
    }

    await notice.deleteOne();
    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting notice' });
  }
};

/**
 * Get unread notice count for teacher
 */
const getUnreadCount = async (req, res) => {
  try {
    const teacherId = req.user.id;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      
      const unreadNotices = global.jsonDB.notices.filter(n => 
        n.targetRole === 'teachers' && 
        (n.targetType === 'all' || n.targetTeacherId === teacherId) &&
        (!n.readBy || !n.readBy.includes(teacherId))
      );

      return res.status(200).json({ success: true, data: { count: unreadNotices.length } });
    }

    // MongoDB Mode
    const count = await Notice.countDocuments({
      targetRole: 'teachers',
      $or: [
        { targetType: 'all' },
        { targetTeacherId: teacherId }
      ],
      readBy: { $ne: teacherId }
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching unread count' });
  }
};

/**
 * Create a notice for students (Teacher only)
 */
const createTeacherNotice = async (req, res) => {
  try {
    console.log('[TEACHER CREATE NOTICE] Request received');
    console.log('[TEACHER CREATE NOTICE] User:', req.user);
    console.log('[TEACHER CREATE NOTICE] Body:', req.body);
    
    const { title, message, classId, targetType } = req.body;
    const createdBy = req.user.id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Notice title is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notice message is required' });
    }

    // targetType can be 'all' (all students) or 'class' (specific class)
    if (!targetType || (targetType !== 'all' && targetType !== 'class')) {
      return res.status(400).json({ success: false, message: 'Invalid target type. Must be "all" or "class"' });
    }

    // If targeting a specific class, validate the class exists and teacher is assigned
    if (targetType === 'class') {
      if (!classId) {
        return res.status(400).json({ success: false, message: 'Class ID is required when targetType is "class"' });
      }

      if (isJsonDB()) {
        const targetClass = global.jsonDB.classes.find(c => c._id === classId);
        if (!targetClass) {
          return res.status(404).json({ success: false, message: 'Class not found' });
        }

        // Check if teacher is assigned to this class
        if (targetClass.teacher !== createdBy) {
          return res.status(403).json({ success: false, message: 'You are not assigned to this class' });
        }
      } else {
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
          return res.status(404).json({ success: false, message: 'Class not found' });
        }

        // Check if teacher is assigned to this class
        const classTeacherId = targetClass.teacher?._id?.toString() || targetClass.teacher?.toString();
        if (classTeacherId !== createdBy) {
          return res.status(403).json({ success: false, message: 'You are not assigned to this class' });
        }
      }
    }

    console.log('[TEACHER CREATE NOTICE] Validation passed');
    console.log('[TEACHER CREATE NOTICE] DB Mode:', isJsonDB() ? 'JSON DB' : 'MongoDB');

    if (isJsonDB()) {
      console.log('[TEACHER CREATE NOTICE] Using JSON DB mode');
      
      const newNotice = {
        _id: crypto.randomUUID(),
        title: title.trim(),
        message: message.trim(),
        targetType: targetType,
        classId: targetType === 'class' ? classId : null,
        targetRole: 'students',
        createdBy,
        isRead: false,
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[TEACHER CREATE NOTICE] New notice created:', newNotice);

      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      global.jsonDB.notices.push(newNotice);
      
      console.log('[TEACHER CREATE NOTICE] Saving to JSON DB...');
      global.jsonDB.save();
      console.log('[TEACHER CREATE NOTICE] JSON DB saved successfully');

      return res.status(201).json({ success: true, message: 'Notice sent to students successfully', data: { notice: newNotice } });
    }

    // MongoDB Mode
    console.log('[TEACHER CREATE NOTICE] Using MongoDB mode');
    
    const newNotice = await Notice.create({
      title: title.trim(),
      message: message.trim(),
      targetType: targetType,
      classId: targetType === 'class' ? classId : null,
      targetRole: 'students',
      createdBy,
      isRead: false,
      readBy: []
    });

    console.log('[TEACHER CREATE NOTICE] Populating notice...');
    const populatedNotice = await Notice.findById(newNotice._id)
      .populate('createdBy', 'name email')
      .populate('classId', 'name code');

    console.log('[TEACHER CREATE NOTICE] Sending response...');
    res.status(201).json({ success: true, message: 'Notice sent to students successfully', data: { notice: populatedNotice } });
  } catch (error) {
    console.error('[TEACHER CREATE NOTICE] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending notice', error: error.message });
  }
};

/**
 * Get notices for Students
 */
const getStudentNotices = async (req, res) => {
  try {
    console.log('[GET STUDENT NOTICES] Request received');
    console.log('[GET STUDENT NOTICES] User:', req.user);
    
    const studentId = req.user.id;

    if (isJsonDB()) {
      console.log('[GET STUDENT NOTICES] Using JSON DB mode');
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      
      // Get the student's class
      const student = global.jsonDB.users.find(u => u._id === studentId);
      const studentClassId = student?.class || null;
      console.log('[GET STUDENT NOTICES] Student classId:', studentClassId);

      // Get notices for all students or specifically for this student's class
      const notices = global.jsonDB.notices.filter(n => 
        n.targetRole === 'students' && 
        (n.targetType === 'all' || n.classId === studentClassId)
      );
      console.log('[GET STUDENT NOTICES] Notices found:', notices.length);

      // Populate data
      const populatedNotices = notices.map(notice => {
        const creator = global.jsonDB.users.find(u => u._id === notice.createdBy);
        const targetClass = notice.classId ? global.jsonDB.classes.find(c => c._id === notice.classId) : null;
        const isRead = notice.readBy && notice.readBy.includes(studentId);
        return {
          ...notice,
          createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : null,
          class: targetClass ? { _id: targetClass._id, name: targetClass.name, code: targetClass.code } : null,
          isRead: isRead || false
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({ success: true, data: { notices: populatedNotices } });
    }

    // MongoDB Mode
    console.log('[GET STUDENT NOTICES] Using MongoDB mode');
    const student = await User.findById(studentId);
    const studentClassId = student?.class || null;
    console.log('[GET STUDENT NOTICES] Student:', student);
    console.log('[GET STUDENT NOTICES] Student classId:', studentClassId);

    const query = {
      targetRole: 'students',
      $or: [
        { targetType: 'all' },
        { classId: studentClassId }
      ]
    };
    console.log('[GET STUDENT NOTICES] Query:', JSON.stringify(query, null, 2));

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email')
      .populate('classId', 'name code')
      .sort({ createdAt: -1 });

    console.log('[GET STUDENT NOTICES] Notices found:', notices.length);
    console.log('[GET STUDENT NOTICES] Notices:', notices.map(n => ({
      _id: n._id,
      title: n.title,
      targetRole: n.targetRole,
      targetType: n.targetType,
      classId: n.classId
    })));

    // Check read status for each notice
    const noticesWithReadStatus = notices.map(notice => ({
      ...notice.toObject(),
      isRead: notice.readBy && notice.readBy.some(id => id.toString() === studentId)
    }));

    res.status(200).json({ success: true, data: { notices: noticesWithReadStatus } });
  } catch (error) {
    console.error('[GET STUDENT NOTICES] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching notices' });
  }
};

/**
 * Mark student notice as read
 */
const markStudentNoticeAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    if (isJsonDB()) {
      const noticeIndex = global.jsonDB.notices.findIndex(n => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      const notice = global.jsonDB.notices[noticeIndex];
      
      // Check if notice is for students
      if (notice.targetRole !== 'students') {
        return res.status(403).json({ success: false, message: 'Not authorized to mark this notice' });
      }

      if (!notice.readBy) notice.readBy = [];
      if (!notice.readBy.includes(studentId)) {
        notice.readBy.push(studentId);
      }
      notice.isRead = true;
      notice.updatedAt = new Date().toISOString();
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Notice marked as read' });
    }

    // MongoDB Mode
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Check if notice is for students
    if (notice.targetRole !== 'students') {
      return res.status(403).json({ success: false, message: 'Not authorized to mark this notice' });
    }

    if (!notice.readBy.includes(studentId)) {
      notice.readBy.push(studentId);
    }
    notice.isRead = true;
    await notice.save();

    res.status(200).json({ success: true, message: 'Notice marked as read' });
  } catch (error) {
    console.error('Mark student notice as read error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking notice as read' });
  }
};

module.exports = {
  createNotice,
  createTeacherNotice,
  getAdminNotices,
  getTeacherNotices,
  getStudentNotices,
  markNoticeAsRead,
  markStudentNoticeAsRead,
  markAllNoticesAsRead,
  updateNotice,
  deleteNotice,
  getUnreadCount
};
