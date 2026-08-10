const mongoose = require('mongoose');
const { exec } = require('child_process');
const fs = require('fs');

// Ensure all known models are loaded before creating collections in a fresh DB.
require('../models/User');
require('../models/Class');
require('../models/Attendance');
require('../models/Marks');
require('../models/Notice');
require('../models/Report');
require('../models/Leave');

// Import admin seeding function
const seedAdminAccount = require('../scripts/seedAdmin');

const startLocalMongod = async () => {
  try {
    console.log('MongoDB not found. Please install MongoDB Community Server:');
    console.log('1. Download from: https://www.mongodb.com/try/download/community');
    console.log('2. Install MongoDB Community Server (Windows MSI)');
    console.log('3. Start MongoDB service: net start MongoDB');
    console.log('4. Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
    console.log('\nQuick fix - Use MongoDB Atlas (recommended):');
    console.log('1. Create free account: https://www.mongodb.com/cloud/atlas');
    console.log('2. Create cluster (M0 Sandbox)');
    console.log('3. Get connection string and update .env file');

    process.exit(1);
  } catch (error) {
    console.error('Error starting local MongoDB:', error.message);
    process.exit(1);
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      process.exit(1);
    }

    console.log('⚡ Connecting to live MongoDB Atlas database...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    console.log(`📂 Database Name: ${conn.connection.name}`);
    console.log('================================================================\n');
    
    // Ensure JSON DB mode is completely disabled
    global.jsonDB = undefined;
    
    // Seed admin account after successful MongoDB connection
    await seedAdminAccount();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('\n⚡ Fallback to local JSON file storage mode...');

    const path = require('path');
    const fs = require('fs');
    const dataDir = path.join(__dirname, '..', 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const jsonDB = {
      users: [],
      classes: [],
      attendance: [],
      marks: [],
      notices: [],
      reports: [],
      leaves: []
    };

    const dbPath = path.join(dataDir, 'oams.json');

    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      Object.assign(jsonDB, data);
      if (!jsonDB.notices) jsonDB.notices = [];
      if (!jsonDB.reports) jsonDB.reports = [];
      if (!jsonDB.leaves) jsonDB.leaves = [];
    }

    jsonDB.save = () => {
      fs.writeFileSync(dbPath, JSON.stringify(jsonDB, null, 2));
    };

    global.jsonDB = jsonDB;
    jsonDB.save();

    console.log(`✅ Fallback JSON DB Connected: ${dbPath}`);
    console.log(`📊 Users: ${jsonDB.users.length}, Classes: ${jsonDB.classes.length}`);
    console.log('================================================================\n');
    
    // Seed admin account for JSON DB mode
    await seedAdminAccount();
  }
};

module.exports = connectDB;
