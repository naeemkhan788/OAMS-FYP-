const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Attendance.deleteMany({}),
      Marks.deleteMany({})
    ]);

    console.log('Creating users...');
    const [adminUser, teacherUser, studentUser1, studentUser2] = await Promise.all([
      User.create({
        name: 'Admin User',
        email: 'admin@oams.local',
        password: 'Admin123',
        role: 'admin'
      }),
      User.create({
        name: 'Teacher One',
        email: 'teacher@oams.local',
        password: 'Teacher123',
        role: 'teacher',
        teacherId: 'T001'
      }),
      User.create({
        name: 'Student One',
        email: 'student1@oams.local',
        password: 'Student123',
        role: 'student',
        studentId: 'S001'
      }),
      User.create({
        name: 'Student Two',
        email: 'student2@oams.local',
        password: 'Student123',
        role: 'student',
        studentId: 'S002'
      })
    ]);

    console.log('Creating class...');
    const classDoc = await Class.create({
      name: '10th Grade A',
      code: 'CLASS10A',
      grade: 10,
      section: 'A',
      teacher: teacherUser._id,
      students: [studentUser1._id, studentUser2._id],
      subjects: [
        { name: 'Math', code: 'MATH', teacher: teacherUser._id },
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

    studentUser1.class = classDoc._id;
    studentUser2.class = classDoc._id;
    await Promise.all([studentUser1.save(), studentUser2.save()]);

    console.log('Creating attendance entries...');
    const attendanceEntries = [
      {
        student: studentUser1._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        date: new Date(),
        status: 'present',
        subject: 'Math',
        checkInTime: new Date(new Date().setHours(8, 5, 0, 0)),
        markedBy: teacherUser._id
      },
      {
        student: studentUser2._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        date: new Date(),
        status: 'absent',
        subject: 'Math',
        markedBy: teacherUser._id
      }
    ];

    await Attendance.insertMany(attendanceEntries);

    console.log('Creating marks entries...');
    const marksEntries = [
      {
        student: studentUser1._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        subject: 'Math',
        assessmentType: 'quiz',
        title: 'Math Quiz 1',
        marksObtained: 45,
        maxMarks: 50,
        assessmentDate: new Date(),
        gradedBy: teacherUser._id,
        isPublished: true
      },
      {
        student: studentUser2._id,
        class: classDoc._id,
        teacher: teacherUser._id,
        subject: 'Math',
        assessmentType: 'quiz',
        title: 'Math Quiz 1',
        marksObtained: 38,
        maxMarks: 50,
        assessmentDate: new Date(),
        gradedBy: teacherUser._id,
        isPublished: true
      }
    ];

    await Marks.insertMany(marksEntries);

    console.log('Seeding complete!');
    console.log('Admin credentials -> email: admin@oams.local, password: Admin123');
    console.log('Teacher credentials -> email: teacher@oams.local, password: Teacher123');
    console.log('Student credentials -> email: student1@oams.local, password: Student123 (and student2@...)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
