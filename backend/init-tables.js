#!/usr/bin/env node
/**
 * Initialize Database Tables Script
 * Creates all collections and adds sample data to make them visible
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Import models
const User = require('./models/User');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');

const initTables = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDB();
    
    console.log('\n📊 Checking existing collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    if (collections.length === 0) {
      console.log('\n🆕 No collections found. Creating all tables...\n');
      
      // Create sample admin user
      console.log('Creating users table...');
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@oams.local',
        password: 'Admin123',
        role: 'admin'
      });
      console.log('✅ Users table created');
      
      // Create sample teacher
      const teacherUser = await User.create({
        name: 'Teacher One',
        email: 'teacher@oams.local',
        password: 'Teacher123',
        role: 'teacher',
        teacherId: 'T001'
      });
      console.log('✅ Teacher created');
      
      // Create sample students
      const student1 = await User.create({
        name: 'Student One',
        email: 'student1@oams.local',
        password: 'Student123',
        role: 'student',
        studentId: 'S001'
      });
      const student2 = await User.create({
        name: 'Student Two',
        email: 'student2@oams.local',
        password: 'Student123',
        role: 'student',
        studentId: 'S002'
      });
      console.log('✅ Students created');
      
      // Create sample class
      console.log('Creating classes table...');
      const classDoc = await Class.create({
        name: '10th Grade A',
        code: 'CLASS10A',
        grade: 10,
        section: 'A',
        teacher: teacherUser._id,
        students: [student1._id, student2._id],
        subjects: [
          { name: 'Mathematics', code: 'MATH', teacher: teacherUser._id },
          { name: 'Science', code: 'SCI', teacher: teacherUser._id }
        ],
        schedule: {
          startTime: '08:00',
          endTime: '14:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        room: '101',
        capacity: 50,
        academicYear: '2025-2026'
      });
      console.log('✅ Classes table created');
      
      // Update students with class reference
      student1.class = classDoc._id;
      student2.class = classDoc._id;
      await Promise.all([student1.save(), student2.save()]);
      
      // Create attendance records
      console.log('Creating attendance table...');
      await Attendance.create({
        student: student1._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        date: new Date(),
        status: 'present',
        subject: 'Mathematics',
        checkInTime: new Date(),
        markedBy: teacherUser._id
      });
      await Attendance.create({
        student: student2._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        date: new Date(),
        status: 'present',
        subject: 'Mathematics',
        checkInTime: new Date(),
        markedBy: teacherUser._id
      });
      console.log('✅ Attendance table created');
      
      // Create marks records
      console.log('Creating marks table...');
      await Marks.create({
        student: student1._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        assessmentType: 'quiz',
        title: 'Math Quiz 1',
        marksObtained: 45,
        maxMarks: 50,
        assessmentDate: new Date(),
        gradedBy: teacherUser._id,
        isPublished: true
      });
      await Marks.create({
        student: student2._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        subject: 'Mathematics',
        assessmentType: 'quiz',
        title: 'Math Quiz 1',
        marksObtained: 38,
        maxMarks: 50,
        assessmentDate: new Date(),
        gradedBy: teacherUser._id,
        isPublished: true
      });
      console.log('✅ Marks table created');
      
      console.log('\n🎉 All tables created successfully!');
      
    } else {
      console.log('\n✅ Collections already exist:');
      collections.forEach((col, i) => {
        console.log(`   ${i + 1}. ${col.name}`);
      });
    }
    
    // Display final collections
    console.log('\n📊 FINAL TABLES IN DATABASE:');
    console.log('================================');
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    finalCollections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name}`);
    });
    console.log(`   Total: ${finalCollections.length} tables`);
    console.log('================================\n');
    
    // Display login credentials
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('======================');
    console.log('Admin:    admin@oams.local / Admin123');
    console.log('Teacher:  teacher@oams.local / Teacher123');
    console.log('Student:  student1@oams.local / Student123');
    console.log('Student:  student2@oams.local / Student123');
    console.log('======================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

initTables();
