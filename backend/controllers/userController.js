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

    // Validate role change: prevent changing to the same role
    if (updateData.role) {
      let currentUser;
      if (isJsonDB()) {
        currentUser = global.jsonDB.users.find(u => u._id === userId);
      } else {
        currentUser = await User.findById(userId).select('role');
      }
      
      if (currentUser && updateData.role === currentUser.role) {
        return res.status(400).json({ 
          success: false, 
          message: `User is already a ${currentUser.role}. Please select a different role.` 
        });
      }
    }

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

const getPendingTeachers = async (req, res) => {
  try {
    if (isJsonDB()) {
      const pendingTeachers = global.jsonDB.users
        .filter(u => u.role === 'teacher' && u.status === 'pending')
        .map(({ password, ...user }) => user);
      return res.status(200).json({ success: true, data: { teachers: pendingTeachers } });
    }

    const pendingTeachers = await User.find({
      role: 'teacher',
      status: 'pending'
    }).select('-password');
    res.status(200).json({ success: true, data: { teachers: pendingTeachers } });
  } catch (error) {
    console.error('Get pending teachers error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching pending teachers' });
  }
};

const approveRejectTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected' });
    }

    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === id);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (global.jsonDB.users[userIndex].role !== 'teacher') {
        return res.status(400).json({ success: false, message: 'User is not a teacher' });
      }
      global.jsonDB.users[userIndex].status = status;
      global.jsonDB.save();
      const { password, ...userWithoutPassword } = global.jsonDB.users[userIndex];
      return res.status(200).json({ success: true, message: `Teacher ${status} successfully`, data: { user: userWithoutPassword } });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'User is not a teacher' });
    }
    user.status = status;
    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.status(200).json({ success: true, message: `Teacher ${status} successfully`, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Approve/reject teacher error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating teacher status' });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, getUnassignedStudents, getPendingTeachers, approveRejectTeacher };