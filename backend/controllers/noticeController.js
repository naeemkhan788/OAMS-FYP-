const Notice = require('../models/Notice');
const Class = require('../models/Class');
const crypto = require('crypto');

const isJsonDB = () => global.jsonDB !== undefined;

const createNotice = async (req, res) => {
  try {
    const { title, message, classId, targetRole } = req.body;
    const createdBy = req.user.id;

    if (!title || !message || !classId) {
      return res.status(400).json({ success: false, message: 'Title, message, and class ID are required' });
    }

    if (isJsonDB()) {
      const classDoc = global.jsonDB.classes.find(c => c._id === classId);
      if (!classDoc) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      const newNotice = {
        _id: crypto.randomUUID(),
        title,
        message,
        classId,
        targetRole: targetRole || 'students',
        createdBy,
        createdAt: new Date().toISOString()
      };

      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      global.jsonDB.notices.push(newNotice);
      global.jsonDB.save();

      return res.status(201).json({ success: true, message: 'Notice sent successfully', data: { notice: newNotice } });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const newNotice = await Notice.create({
      title,
      message,
      classId,
      targetRole: targetRole || 'students',
      createdBy
    });

    res.status(201).json({ success: true, message: 'Notice sent successfully', data: { notice: newNotice } });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending notice' });
  }
};

const getNotices = async (req, res) => {
  try {
    const { classId } = req.query;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      let notices = global.jsonDB.notices;

      if (classId) {
        notices = notices.filter(n => n.classId === classId);
      }

      // Populate createdBy and class details
      const populatedNotices = notices.map(notice => {
        const creator = global.jsonDB.users.find(u => u._id === notice.createdBy);
        const cls = global.jsonDB.classes.find(c => c._id === notice.classId);
        return {
          ...notice,
          createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : null,
          class: cls ? { _id: cls._id, name: cls.name, code: cls.code } : null
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({ success: true, data: { notices: populatedNotices } });
    }

    let query = {};
    if (classId) {
      query.classId = classId;
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email')
      .populate('classId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { notices } });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching notices' });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (isJsonDB()) {
      if (!global.jsonDB.notices) global.jsonDB.notices = [];
      const noticeIndex = global.jsonDB.notices.findIndex(n => n._id === id);
      if (noticeIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      if (req.user.role !== 'admin' && global.jsonDB.notices[noticeIndex].createdBy !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this notice' });
      }

      global.jsonDB.notices.splice(noticeIndex, 1);
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Notice deleted successfully' });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (req.user.role !== 'admin' && notice.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notice' });
    }

    await notice.deleteOne();
    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting notice' });
  }
};

module.exports = {
  createNotice,
  getNotices,
  deleteNotice
};
