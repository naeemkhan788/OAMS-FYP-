const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Load models
const User = require('./models/User');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB Atlas');
    console.log('Seeding database...\n');

    // Clear existing data
    await User.deleteMany({});
    await Class.deleteMany({});
    await Attendance.deleteMany({});
    await Marks.deleteMany({});
    console.log('✅ Cleared existing collections');

    // 1. Create Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@oams.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Created: Admin User (admin@oams.com / admin123)');

    // 2. Create Teacher User
    const teacherUser = await User.create({
      name: 'Dr. Ahmad Khan',
      email: 'teacher@oams.com',
      password: 'teacher123',
      role: 'teacher',
      teacherId: 'T001',
      isActive: true
    });
    console.log('✅ Created: Teacher User (teacher@oams.com / teacher123)');

    // 3. Create Student Users
    const student1 = await User.create({
      name: 'Ali Hassan',
      email: 'student1@oams.com',
      password: 'student123',
      role: 'student',
      studentId: 'S001',
      isActive: true
    });
    console.log('✅ Created: Student 1 (student1@oams.com / student123)');

    const student2 = await User.create({
      name: 'Sara Ahmed',
      email: 'student2@oams.com',
      password: 'student123',
      role: 'student',
      studentId: 'S002',
      isActive: true
    });
    console.log('✅ Created: Student 2 (student2@oams.com / student123)');

    const student3 = await User.create({
      name: 'Usman Malik',
      email: 'student3@oams.com',
      password: 'student123',
      role: 'student',
      studentId: 'S003',
      isActive: true
    });
    console.log('✅ Created: Student 3 (student3@oams.com / student123)');

    // 4. Create Classes (matching the Class model schema)
    const class1 = await Class.create({
      name: '10th Grade A',
      code: 'CLASS10A',
      grade: 10,
      section: 'A',
      teacher: teacherUser._id,
      students: [student1._id, student2._id, student3._id],
      subjects: [
        { name: 'Mathematics', code: 'MATH', teacher: teacherUser._id },
        { name: 'Science', code: 'SCI', teacher: teacherUser._id },
        { name: 'English', code: 'ENG', teacher: teacherUser._id }
      ],
      schedule: {
        startTime: '08:00',
        endTime: '14:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      room: 'CS-Lab-1',
      capacity: 50,
      academicYear: '2025-2026',
      isActive: true
    });
    console.log('✅ Created: Class 10A');

    const class2 = await Class.create({
      name: '9th Grade B',
      code: 'CLASS9B',
      grade: 9,
      section: 'B',
      teacher: teacherUser._id,
      students: [student1._id],
      subjects: [
        { name: 'Physics', code: 'PHY', teacher: teacherUser._id },
        { name: 'Chemistry', code: 'CHEM', teacher: teacherUser._id }
      ],
      schedule: {
        startTime: '09:00',
        endTime: '15:00',
        days: ['Monday', 'Wednesday', 'Friday']
      },
      room: 'Room-202',
      capacity: 40,
      academicYear: '2025-2026',
      isActive: true
    });
    console.log('✅ Created: Class 9B');

    // Update students with class reference
    student1.class = class1._id;
    student2.class = class1._id;
    student3.class = class1._id;
    await Promise.all([student1.save(), student2.save(), student3.save()]);
    console.log('✅ Updated students with class references');

    // 5. Create Attendance Records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await Attendance.create({
      student: student1._id,
      class: class1._id,
      teacher: teacherUser._id,
      date: today,
      status: 'present',
      subject: 'Mathematics',
      checkInTime: new Date(),
      markedBy: teacherUser._id
    });
    await Attendance.create({
      student: student2._id,
      class: class1._id,
      teacher: teacherUser._id,
      date: today,
      status: 'present',
      subject: 'Mathematics',
      checkInTime: new Date(),
      markedBy: teacherUser._id
    });
    await Attendance.create({
      student: student3._id,
      class: class1._id,
      teacher: teacherUser._id,
      date: today,
      status: 'absent',
      subject: 'Mathematics',
      markedBy: teacherUser._id
    });
    await Attendance.create({
      student: student1._id,
      class: class1._id,
      teacher: teacherUser._id,
      date: yesterday,
      status: 'present',
      subject: 'Science',
      checkInTime: yesterday,
      markedBy: teacherUser._id
    });
    console.log('✅ Created: Attendance Records (4 records)');

    // 6. Create Marks Records
    await Marks.create({
      student: student1._id,
      class: class1._id,
      teacher: teacherUser._id,
      subject: 'Mathematics',
      assessmentType: 'quiz',
      title: 'Math Quiz 1',
      marksObtained: 45,
      maxMarks: 50,
      assessmentDate: today,
      gradedBy: teacherUser._id,
      isPublished: true
    });
    await Marks.create({
      student: student2._id,
      class: class1._id,
      teacher: teacherUser._id,
      subject: 'Mathematics',
      assessmentType: 'quiz',
      title: 'Math Quiz 1',
      marksObtained: 38,
      maxMarks: 50,
      assessmentDate: today,
      gradedBy: teacherUser._id,
      isPublished: true
    });
    await Marks.create({
      student: student3._id,
      class: class1._id,
      teacher: teacherUser._id,
      subject: 'Science',
      assessmentType: 'midterm',
      title: 'Science Midterm Exam',
      marksObtained: 72,
      maxMarks: 100,
      assessmentDate: yesterday,
      gradedBy: teacherUser._id,
      isPublished: true
    });
    await Marks.create({
      student: student1._id,
      class: class1._id,
      teacher: teacherUser._id,
      subject: 'English',
      assessmentType: 'assignment',
      title: 'English Essay',
      marksObtained: 85,
      maxMarks: 100,
      assessmentDate: yesterday,
      gradedBy: teacherUser._id,
      isPublished: false
    });
    console.log('✅ Created: Marks Records (4 records)');

    // Show all collections
    console.log('\n📊 DATABASE SUMMARY');
    console.log('================================');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documents`);
    }
    console.log(`   Total collections: ${collections.length}`);
    console.log('================================\n');

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Default Login Credentials:');
    console.log('   Admin:     admin@oams.com / admin123');
    console.log('   Teacher:   teacher@oams.com / teacher123');
    console.log('   Student 1: student1@oams.com / student123');
    console.log('   Student 2: student2@oams.com / student123');
    console.log('   Student 3: student3@oams.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();
