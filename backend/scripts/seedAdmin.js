const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Database Seeding Script for Admin Account
 * 
 * This script automatically creates the first admin account if none exists.
 * It runs when the server starts and ensures there's always at least one admin.
 * 
 * Default Admin Credentials:
 * Email: admin@oams.com
 * Password: Admin@123
 */

/**
 * Seed the admin account
 * Checks if an admin exists, and creates one if not
 * If admin exists but has corrupted password (double-hashed), it will be recreated
 */
const seedAdmin = async () => {
  try {
    console.log('🔍 Checking for existing admin account...');

    // Check if an admin already exists in the database
    const existingAdmin = await User.findOne({ role: 'admin' }).select('+password');

    if (existingAdmin) {
      console.log('✅ Admin already exists. Verifying password integrity...');

      // Test if the admin password works with the default password
      const defaultPassword = 'chair@1960';
      const isPasswordValid = await bcrypt.compare(defaultPassword, existingAdmin.password);

      if (isPasswordValid) {
        console.log('✅ Admin password is valid. Skipping admin creation.');
        console.log(`   Admin Email: ${existingAdmin.email}`);
        return;
      } else {
        console.log('⚠️  Admin password is corrupted (likely double-hashed). Recreating admin...');
        // Delete the corrupted admin
        await User.deleteOne({ role: 'admin' });
        console.log('🗑️  Corrupted admin deleted. Creating fresh admin...');
      }
    }

    console.log('⚠️  No admin found. Creating default admin account...');

    // Create the admin user with all required fields
    // Note: Password will be hashed automatically by User model pre-save middleware
    const admin = await User.create({
      name: 'System Admin',
      firstName: 'System',
      lastName: 'Admin',
      email: 'zeb9504972@gmail.com',
      password: 'chair@1960',
      role: 'admin',
      status: 'approved',
      isVerified: true,
      isActive: true,
      profile: {
        phone: '',
        address: '',
        department: 'CS Administration',
        specialization: 'MS in Computer Science'
      }
    });

    console.log('✅ Admin created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Verified: ${admin.isVerified}`);
    console.log('⚠️  Please change the default password after first login for security.');

  } catch (error) {
    console.error('❌ Error seeding admin account:', error.message);
    
    // Handle specific error cases
    if (error.code === 11000) {
      console.error('❌ Duplicate key error - admin email might already exist');
    } else if (error.name === 'ValidationError') {
      console.error('❌ Validation error - check admin data structure');
    } else {
      console.error('❌ Unexpected error during admin seeding');
    }
    
    // Don't throw error to prevent server startup failure
    // The system can still function without admin seeding
  }
};

/**
 * Seed admin for JSON DB mode
 * This function handles admin creation when using JSON file storage
 * If admin exists but has corrupted password, it will be recreated
 */
const seedAdminJSON = async () => {
  try {
    console.log('🔍 Checking for existing admin account in JSON DB...');

    // Check if JSON DB is available
    if (!global.jsonDB || !global.jsonDB.users) {
      console.log('⚠️  JSON DB not initialized. Skipping admin seeding.');
      return;
    }

    // Check if admin already exists in JSON DB
    const existingAdmin = global.jsonDB.users.find(u => u.role === 'admin');

    if (existingAdmin) {
      console.log('✅ Admin already exists in JSON DB. Verifying password integrity...');

      // Test if the admin password works with the default password
      const defaultPassword = 'Admin@123';
      const isPasswordValid = await bcrypt.compare(defaultPassword, existingAdmin.password);

      if (isPasswordValid) {
        console.log('✅ Admin password is valid. Skipping admin creation.');
        console.log(`   Admin Email: ${existingAdmin.email}`);
        return;
      } else {
        console.log('⚠️  Admin password is corrupted (likely double-hashed). Recreating admin...');
        // Delete the corrupted admin
        global.jsonDB.users = global.jsonDB.users.filter(u => u.role !== 'admin');
        global.jsonDB.save();
        console.log('🗑️  Corrupted admin deleted. Creating fresh admin...');
      }
    }

    console.log('⚠️  No admin found in JSON DB. Creating default admin account...');

    // Hash the default password (JSON DB doesn't have pre-save middleware)
    const defaultPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create admin user
    const admin = {
      _id: `ADMIN-${Date.now()}`,
      name: 'System Admin',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@oams.com',
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      isVerified: true,
      isActive: true,
      profile: {
        phone: '',
        address: '',
        department: 'Administration',
        specialization: 'System Administration'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add admin to JSON DB
    global.jsonDB.users.push(admin);
    global.jsonDB.save();

    console.log('✅ Admin created successfully in JSON DB!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Verified: ${admin.isVerified}`);
    console.log('⚠️  Please change the default password after first login for security.');

  } catch (error) {
    console.error('❌ Error seeding admin account in JSON DB:', error.message);
    // Don't throw error to prevent server startup failure
  }
};

/**
 * Main seeding function that determines which mode to use
 */
const seedAdminAccount = async () => {
  try {
    // Determine if we're using JSON DB or MongoDB
    if (global.jsonDB !== undefined) {
      await seedAdminJSON();
    } else {
      await seedAdmin();
    }
  } catch (error) {
    console.error('❌ Error in seedAdminAccount:', error);
  }
};

module.exports = seedAdminAccount;
