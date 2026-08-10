const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const { emitNotification, emitUnreadCount, emitUnreadCountsByPage } = require('../socket');

const isJsonDB = () => global.jsonDB !== undefined;

/**
 * Create a new notification
 */
const createNotification = async (data) => {
  try {
    const { senderRole, senderId, receiverRole, receiverId, type, page, title, message } = data;

    if (isJsonDB()) {
      if (!global.jsonDB.notifications) global.jsonDB.notifications = [];
      
      const notification = {
        _id: require('crypto').randomUUID(),
        senderRole,
        senderId,
        receiverRole,
        receiverId,
        type,
        page,
        title,
        message,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      global.jsonDB.notifications.push(notification);
      global.jsonDB.save();
      
      // Emit notification via Socket.IO
      emitNotification(receiverId, notification);
      
      return notification;
    }

    const notification = await Notification.create({
      senderRole,
      senderId,
      receiverRole,
      receiverId,
      type,
      page,
      title,
      message
    });
    
    // Emit notification via Socket.IO
    emitNotification(receiverId, notification);
    
    return notification;
  } catch (error) {
    console.error('[CREATE NOTIFICATION] Error:', error);
    throw error;
  }
};

/**
 * Get all notifications for current user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0, page: pageFilter } = req.query;

    if (isJsonDB()) {
      if (!global.jsonDB.notifications) global.jsonDB.notifications = [];
      
      let userNotifications = global.jsonDB.notifications.filter(n => n.receiverId === userId);
      
      if (pageFilter) {
        userNotifications = userNotifications.filter(n => n.page === pageFilter);
      }
      
      userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      userNotifications = userNotifications.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

      // Populate sender data
      const populatedNotifications = userNotifications.map(notice => {
        const sender = global.jsonDB.users.find(u => u._id === notice.senderId);
        return {
          ...notice,
          sender: sender ? { _id: sender._id, name: sender.name, email: sender.email } : null
        };
      });

      return res.status(200).json({ success: true, data: { notifications: populatedNotifications } });
    }

    const query = { receiverId: userId };
    if (pageFilter) {
      query.page = pageFilter;
    }

    const notifications = await Notification.find(query)
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({ success: true, data: { notifications } });
  } catch (error) {
    console.error('[GET NOTIFICATIONS] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching notifications' });
  }
};

/**
 * Get unread notification count for current user
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page: pageFilter } = req.query;

    if (isJsonDB()) {
      if (!global.jsonDB.notifications) global.jsonDB.notifications = [];
      
      let unreadCount = global.jsonDB.notifications.filter(n => 
        n.receiverId === userId && !n.isRead
      ).length;

      if (pageFilter) {
        unreadCount = global.jsonDB.notifications.filter(n => 
          n.receiverId === userId && !n.isRead && n.page === pageFilter
        ).length;
      }

      return res.status(200).json({ success: true, data: { count: unreadCount } });
    }

    const query = { receiverId: userId, isRead: false };
    if (pageFilter) {
      query.page = pageFilter;
    }

    const count = await Notification.countDocuments(query);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('[GET UNREAD COUNT] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching unread count' });
  }
};

/**
 * Get unread counts grouped by page for sidebar badges
 */
const getUnreadCountsByPage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isJsonDB()) {
      if (!global.jsonDB.notifications) global.jsonDB.notifications = [];
      
      const userNotifications = global.jsonDB.notifications.filter(n => 
        n.receiverId === userId && !n.isRead
      );
      
      const counts = {};
      userNotifications.forEach(n => {
        counts[n.page] = (counts[n.page] || 0) + 1;
      });

      return res.status(200).json({ success: true, data: { counts } });
    }

    const notifications = await Notification.aggregate([
      { $match: { receiverId: new mongoose.Types.ObjectId(userId), isRead: false } },
      { $group: { _id: '$page', count: { $sum: 1 } } }
    ]);

    const counts = {};
    notifications.forEach(n => {
      counts[n._id] = n.count;
    });

    res.status(200).json({ success: true, data: { counts } });
  } catch (error) {
    console.error('[GET UNREAD COUNTS BY PAGE] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching unread counts by page' });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isJsonDB()) {
      const notificationIndex = global.jsonDB.notifications.findIndex(n => n._id === id);
      if (notificationIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const notification = global.jsonDB.notifications[notificationIndex];
      
      if (notification.receiverId !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to mark this notification' });
      }

      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      notification.updatedAt = new Date().toISOString();
      global.jsonDB.save();

      // Emit updated unread count
      const unreadCount = global.jsonDB.notifications.filter(n => 
        n.receiverId === userId && !n.isRead
      ).length;
      emitUnreadCount(userId, unreadCount);

      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.receiverId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to mark this notification' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    // Emit updated unread count
    const unreadCount = await Notification.countDocuments({ receiverId: userId, isRead: false });
    emitUnreadCount(userId, unreadCount);

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('[MARK AS READ] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking notification as read' });
  }
};

/**
 * Mark all notifications as read for current user
 * Optionally filter by page
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page } = req.body;

    if (isJsonDB()) {
      if (!global.jsonDB.notifications) global.jsonDB.notifications = [];
      
      let markedCount = 0;
      global.jsonDB.notifications.forEach(notification => {
        if (notification.receiverId === userId && !notification.isRead) {
          if (!page || notification.page === page) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            notification.updatedAt = new Date().toISOString();
            markedCount++;
          }
        }
      });
      
      global.jsonDB.save();
      
      // Emit updated unread count
      const unreadCount = global.jsonDB.notifications.filter(n => 
        n.receiverId === userId && !n.isRead
      ).length;
      emitUnreadCount(userId, unreadCount);
      
      return res.status(200).json({ success: true, message: `${markedCount} notifications marked as read` });
    }

    const query = { receiverId: userId, isRead: false };
    if (page) {
      query.page = page;
    }

    const result = await Notification.updateMany(
      query,
      { isRead: true, readAt: new Date() }
    );

    // Emit updated unread count
    const unreadCount = await Notification.countDocuments({ receiverId: userId, isRead: false });
    emitUnreadCount(userId, unreadCount);

    res.status(200).json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
  } catch (error) {
    console.error('[MARK ALL AS READ] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while marking notifications as read' });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isJsonDB()) {
      const notificationIndex = global.jsonDB.notifications.findIndex(n => n._id === id);
      if (notificationIndex === -1) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const notification = global.jsonDB.notifications[notificationIndex];
      
      if (notification.receiverId !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
      }

      global.jsonDB.notifications.splice(notificationIndex, 1);
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Notification deleted' });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.receiverId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('[DELETE NOTIFICATION] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting notification' });
  }
};

/**
 * Create a test notification (for testing purposes)
 */
const createTestNotification = async (req, res) => {
  try {
    const { receiverId, page } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required' });
    }

    const notification = await createNotification({
      senderRole,
      senderId,
      receiverRole: 'admin',
      receiverId,
      type: 'test',
      page: page || 'dashboard',
      title: 'Test Notification',
      message: 'This is a test notification to verify the green dot badge system.'
    });

    res.status(201).json({ success: true, message: 'Test notification created', data: notification });
  } catch (error) {
    console.error('[CREATE TEST NOTIFICATION] Error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating test notification' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  getUnreadCountsByPage,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification // For testing purposes
};
