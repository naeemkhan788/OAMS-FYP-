const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');
const crypto = require('crypto');

const isJsonDB = () => global.jsonDB !== undefined;

const register = async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map(err => `${err.path}: ${err.msg}`).join(', ');
      console.log('Validation errors:', errorDetails);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${errorDetails}`,
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // JSON DB Mode
    if (isJsonDB()) {
      const existingUser = global.jsonDB.users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const userId = crypto.randomUUID();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        _id: userId,
        name,
        email,
        password: hashedPassword,
        role: role || 'student',
        isActive: true,
        profile: req.body.profile || {},
        createdAt: new Date().toISOString()
      };

      global.jsonDB.users.push(newUser);
      global.jsonDB.save();
      console.log('New user registered:', newUser.name, 'Role:', newUser.role);

      const token = generateToken(userId);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          _id: userId,
          name,
          email,
          role: role || 'student'
        }
      });
    }

    // MongoDB Mode
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate Unique ID based on role
    let studentId, teacherId;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    if (role === 'teacher') {
      teacherId = `T-${randomSuffix}`;
    } else if (role === 'student' || !role) {
      studentId = `S-${randomSuffix}`;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      studentId,
      teacherId,
      profile: req.body.profile || {}
    });

    const token = generateToken(user._id);
    console.log('New user registered:', user.name, 'Role:', user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

const login = async (req, res) => {
  console.log('[LOGIN] Attempt:', { email: req.body?.email });
  console.log('[LOGIN] DB Mode:', isJsonDB() ? 'JSON DB' : 'MongoDB');

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      console.log('[LOGIN] Validation failed:', errorMessages);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${errorMessages}`,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // JSON DB Mode
    if (isJsonDB()) {
      console.log('[LOGIN] Using JSON DB mode');
      console.log('[LOGIN] Available users:', global.jsonDB.users.map(u => ({ email: u.email, id: u._id })));
      
      const user = global.jsonDB.users.find(u => u.email === email);
      if (!user) {
        console.log('[LOGIN] User not found:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log('[LOGIN] User found in JSON DB:', user._id);
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('[LOGIN] Password comparison result:', isMatch);
      
      if (!isMatch) {
        console.log('[LOGIN] Password mismatch (JSON DB):', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      global.jsonDB.save();

      const token = generateToken(user._id);
      console.log('[LOGIN] Success (JSON DB):', email);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // MongoDB Mode
    console.log('[LOGIN] Using MongoDB mode');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('[LOGIN] User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('[LOGIN] User found in MongoDB:', user._id);

    // Use bcrypt.compare directly for reliability
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('[LOGIN] Password mismatch (MongoDB):', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    console.log('[LOGIN] Success (MongoDB):', email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    if (isJsonDB()) {
      const user = global.jsonDB.users.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            createdAt: user.createdAt
          }
        }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === req.user.id);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { name, profile } = req.body;
      if (name) global.jsonDB.users[userIndex].name = name;
      if (profile) {
        global.jsonDB.users[userIndex].profile = { ...global.jsonDB.users[userIndex].profile, ...profile };
      }

      global.jsonDB.save();
      const { password, ...userWithoutPassword } = global.jsonDB.users[userIndex];

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userWithoutPassword }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, profile } = req.body;
    if (name) user.name = name;
    if (profile) user.profile = { ...user.profile.toObject(), ...profile };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    if (isJsonDB()) {
      const userIndex = global.jsonDB.users.findIndex(u => u._id === req.user.id);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(currentPassword, global.jsonDB.users[userIndex].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid current password' });
      }

      global.jsonDB.users[userIndex].password = await bcrypt.hash(newPassword, 10);
      global.jsonDB.save();

      return res.status(200).json({ success: true, message: 'Password changed successfully' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error while changing password' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
