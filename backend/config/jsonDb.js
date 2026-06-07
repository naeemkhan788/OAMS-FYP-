const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize users file with default admin
const initializeUsers = () => {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        _id: 'admin-001',
        name: 'Admin User',
        email: 'admin@oams.local',
        password: bcrypt.hashSync('Admin123', 10),
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        _id: 'teacher-001',
        name: 'Teacher User',
        email: 'teacher@oams.local',
        password: bcrypt.hashSync('Teacher123', 10),
        role: 'teacher',
        teacherId: 'TCH001',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        _id: 'student-001',
        name: 'Student User',
        email: 'student@oams.local',
        password: bcrypt.hashSync('Student123', 10),
        role: 'student',
        studentId: 'STU001',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    console.log('✅ JSON Database initialized with default users');
  }
};

// Read users from file
const readUsers = () => {
  initializeUsers();
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
};

// Write users to file
const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Register user
const register = async (userData) => {
  const users = readUsers();
  
  // Check if email exists
  if (users.find(u => u.email === userData.email)) {
    throw new Error('User already exists with this email');
  }
  
  const newUser = {
    _id: `user-${Date.now()}`,
    ...userData,
    password: bcrypt.hashSync(userData.password, 10),
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  users.push(newUser);
  writeUsers(users);
  
  const token = generateToken(newUser._id);
  
  return {
    user: { ...newUser, password: undefined },
    token
  };
};

// Login user
const login = async (email, password) => {
  const users = readUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  writeUsers(users);
  
  const token = generateToken(user._id);
  
  return {
    user: { ...user, password: undefined },
    token
  };
};

// Get user by ID
const getUserById = (id) => {
  const users = readUsers();
  const user = users.find(u => u._id === id);
  if (user) {
    return { ...user, password: undefined };
  }
  return null;
};

module.exports = {
  register,
  login,
  getUserById,
  initializeUsers
};
