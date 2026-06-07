const User = require('../models/User');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');

const isJsonDB = () => global.jsonDB !== undefined;

const getUsers = async (req, res) => {
  try {
    if (isJsonDB()) {
      const users = global.jsonDB.users.map(({ password, ...user }) => user);
      return res.status(200).json({ success: true, data: { users } });
    }
    const users = await User.find({}).select('-password');
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (isJsonDB()) {
      const user = global.jsonDB.users.find(u => u._id === userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ success: true, data: { user: userWithoutPassword } });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const userId = req.params.id;
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updateData = { ...req.body };
    delete updateData.password;
    if (updateData.role && req.user.role !== 'admin') delete updateData.role;

    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      Object.assign(global.jsonDB.users[userIndex], updateData);
      global.jsonDB.save();
      const { password, ...userWithoutPassword } = global.jsonDB.users[userIndex];
      return res.status(200).json({ success: true, message: 'User updated successfully', data: { user: userWithoutPassword } });
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User updated successfully', data: { user } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      global.jsonDB.users.splice(userIndex, 1);
      global.jsonDB.save();
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting user' });
  }
};

const getUnassignedStudents = async (req, res) => {
  try {
    if (isJsonDB()) {
      const assignedStudentIds = new Set(
        global.jsonDB.classes.flatMap(c => c.students || [])
      );
      const unassigned = global.jsonDB.users
        .filter(u => u.role === 'student' && !assignedStudentIds.has(u._id))
        .map(({ password, ...user }) => user);
      return res.status(200).json({ success: true, data: { students: unassigned } });
    }

    const classes = await Class.find({}).select('students');
    const assignedStudentIds = new Set(
      classes.flatMap(c => c.students.map(s => s.toString()))
    );
    const unassigned = await User.find({
      role: 'student',
      _id: { $nin: Array.from(assignedStudentIds) }
    }).select('-password');
    res.status(200).json({ success: true, data: { students: unassigned } });
  } catch (error) {
    console.error('Get unassigned students error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching unassigned students' });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, getUnassignedStudents };