/**
 * Sync Route Handler
 * Handles batch syncing of offline requests
 */

const router = require('express').Router();
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');

const isJsonDB = () => global.jsonDB !== undefined;

/**
 * POST /sync/queue
 * Handles syncing of a single queued request
 * This endpoint receives the actual API request that was queued during offline mode
 */
router.post('/sync/queue', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { url, method, body, _syncId } = req.body;

    if (!url || !method || !_syncId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: url, method, _syncId' 
      });
    }

    console.log(`⚙️ Processing sync request ${_syncId}: ${method} ${url}`);

    // Prevent duplicate submissions using syncId
    const syncKey = `sync_${_syncId}`;
    const cache = global.syncCache || {};

    if (cache[syncKey]) {
      console.log(`⚠️ Duplicate sync request detected: ${_syncId}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Request already processed',
        duplicate: true,
        data: cache[syncKey]
      });
    }

    // Parse the body
    let parsedBody = {};
    try {
      parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      console.error('Failed to parse sync body:', e);
    }

    // Route the request to the appropriate handler
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    const resource = urlParts[0];

    let result;

    try {
      switch (resource) {
        case 'users':
          result = await handleUserSync(method, urlParts, parsedBody, req.user);
          break;
        case 'classes':
          result = await handleClassSync(method, urlParts, parsedBody, req.user);
          break;
        case 'attendance':
          result = await handleAttendanceSync(method, urlParts, parsedBody, req.user);
          break;
        case 'marks':
          result = await handleMarksSync(method, urlParts, parsedBody, req.user);
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            message: `Unsupported resource for sync: ${resource}` 
          });
      }

      // Cache the result to prevent duplicates
      if (!global.syncCache) {
        global.syncCache = {};
      }
      global.syncCache[syncKey] = result;

      // Clear cache after 1 hour
      setTimeout(() => {
        delete global.syncCache[syncKey];
      }, 60 * 60 * 1000);

      console.log(`✅ Sync request ${_syncId} completed successfully`);

      res.status(200).json({
        success: true,
        message: 'Request synced successfully',
        data: result
      });
    } catch (error) {
      console.error(`❌ Error syncing request ${_syncId}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing sync request',
      error: error.message 
    });
  }
});

/**
 * Handle user-related sync operations
 */
async function handleUserSync(method, urlParts, body, authUser) {
  const userId = urlParts[1];

  if (method === 'PUT' && userId) {
    // Update user
    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      const updateData = { ...body };
      delete updateData.password;
      delete updateData._syncId;
      Object.assign(global.jsonDB.users[userIndex], updateData);
      global.jsonDB.save();
      return global.jsonDB.users[userIndex];
    } else {
      const updateData = { ...body };
      delete updateData.password;
      delete updateData._syncId;
      const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
      if (!user) throw new Error('User not found');
      return user;
    }
  } else if (method === 'DELETE' && userId) {
    // Delete user
    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      global.jsonDB.users.splice(userIndex, 1);
      global.jsonDB.save();
      return { message: 'User deleted successfully' };
    } else {
      await User.findByIdAndDelete(userId);
      return { message: 'User deleted successfully' };
    }
  }

  throw new Error('Invalid user sync operation');
}

/**
 * Handle class-related sync operations
 */
async function handleClassSync(method, urlParts, body, authUser) {
  const classId = urlParts[1];

  if (method === 'POST' && !classId) {
    // Create class
    body._syncId && delete body._syncId;
    if (isJsonDB()) {
      const newClass = { _id: Date.now().toString(), ...body };
      global.jsonDB.classes.push(newClass);
      global.jsonDB.save();
      return newClass;
    } else {
      const newClass = await Class.create(body);
      return newClass;
    }
  } else if (method === 'PUT' && classId) {
    // Update class
    body._syncId && delete body._syncId;
    if (isJsonDB()) {
      const classIndex = global.jsonDB.classes.findIndex(c => c._id === classId);
      if (classIndex === -1) {
        throw new Error('Class not found');
      }
      Object.assign(global.jsonDB.classes[classIndex], body);
      global.jsonDB.save();
      return global.jsonDB.classes[classIndex];
    } else {
      const updatedClass = await Class.findByIdAndUpdate(classId, body, { new: true });
      if (!updatedClass) throw new Error('Class not found');
      return updatedClass;
    }
  } else if (method === 'DELETE' && classId) {
    // Delete class
    if (isJsonDB()) {
      const classIndex = global.jsonDB.classes.findIndex(c => c._id === classId);
      if (classIndex === -1) {
        throw new Error('Class not found');
      }
      global.jsonDB.classes.splice(classIndex, 1);
      global.jsonDB.save();
      return { message: 'Class deleted successfully' };
    } else {
      await Class.findByIdAndDelete(classId);
      return { message: 'Class deleted successfully' };
    }
  }

  throw new Error('Invalid class sync operation');
}

/**
 * Handle attendance-related sync operations
 */
async function handleAttendanceSync(method, urlParts, body, authUser) {
  if (method === 'POST' && urlParts[1] === 'mark') {
    // Mark attendance
    body._syncId && delete body._syncId;
    if (isJsonDB()) {
      const newAttendance = { _id: Date.now().toString(), ...body };
      global.jsonDB.attendance.push(newAttendance);
      global.jsonDB.save();
      return newAttendance;
    } else {
      const attendance = await Attendance.create(body);
      return attendance;
    }
  }

  throw new Error('Invalid attendance sync operation');
}

/**
 * Handle marks-related sync operations
 */
async function handleMarksSync(method, urlParts, body, authUser) {
  if (method === 'POST' && urlParts[1] === 'add') {
    // Add marks
    body._syncId && delete body._syncId;
    if (isJsonDB()) {
      const newMarks = { _id: Date.now().toString(), ...body };
      global.jsonDB.marks.push(newMarks);
      global.jsonDB.save();
      return newMarks;
    } else {
      const marks = await Marks.create(body);
      return marks;
    }
  } else if (method === 'POST' && urlParts[1] === 'publish') {
    // Publish marks
    body._syncId && delete body._syncId;
    // Handle publish logic here
    return { message: 'Marks published successfully' };
  }

  throw new Error('Invalid marks sync operation');
}

/**
 * GET /sync/status
 * Get sync queue status
 */
router.get('/sync/status', async (req, res) => {
  try {
    // This would typically fetch from a database or cache
    // For now, return basic structure
    res.status(200).json({
      success: true,
      data: {
        isOnline: true, // This should be checked by client
        queueSize: 0,
        lastSync: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get sync status',
      error: error.message 
    });
  }
});

module.exports = router;
