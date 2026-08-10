const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://atifkhan35667she_db_user:Atifkhan1122@cluster0oa.s5jn8lc.mongodb.net/OAMS_db?retryWrites=true&w=majority&appName=Cluster0oaclcls';

async function seedAtlas() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 60000
  });

  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas!');

    const db = client.db('OAMS_db');

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Current Collections:');
    collections.forEach((col, i) => console.log(`   ${i + 1}. ${col.name}`));

    // 1. Create Users Collection with Data
    console.log('\n📁 Creating/Updating users collection...');
    await db.collection('users').deleteMany({});
    const users = [
      {
        name: 'System Administrator',
        email: 'admin@oams.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dr. Ahmad Khan',
        email: 'teacher@oams.com',
        password: await bcrypt.hash('teacher123', 10),
        role: 'teacher',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ali Hassan',
        email: 'student@oams.com',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('users').insertMany(users);
    console.log('✅ Inserted 3 users');

    // 2. Create Classes Collection
    console.log('\n📁 Creating classes collection...');
    await db.collection('classes').deleteMany({});
    const classes = [
      {
        name: 'BS Computer Science - 3rd Semester',
        code: 'BS-CS-3A',
        department: 'Computer Science',
        batch: '2023',
        semester: '3rd',
        section: 'A',
        totalStudents: 45,
        roomNumber: 'CS-Lab-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('classes').insertMany(classes);
    console.log('✅ Inserted 1 class');

    // 3. Create Attendance Collection
    console.log('\n📁 Creating attendance collection...');
    await db.collection('attendances').deleteMany({});
    const attendance = [
      {
        studentEmail: 'student@oams.com',
        classCode: 'BS-CS-3A',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: 'On time',
        createdAt: new Date()
      }
    ];
    await db.collection('attendances').insertMany(attendance);
    console.log('✅ Inserted 1 attendance record');

    // 4. Create Marks Collection
    console.log('\n📁 Creating marks collection...');
    await db.collection('marks').deleteMany({});
    const marks = [
      {
        studentEmail: 'student@oams.com',
        subject: 'Data Structures',
        examType: 'midterm',
        marks: 85,
        totalMarks: 100,
        grade: 'A',
        status: 'passed',
        createdAt: new Date()
      }
    ];
    await db.collection('marks').insertMany(marks);
    console.log('✅ Inserted 1 marks record');

    // 5. Create Subjects Collection
    console.log('\n📁 Creating subjects collection...');
    await db.collection('subjects').deleteMany({});
    const subjects = [
      { name: 'Data Structures & Algorithms', code: 'CS-301', creditHours: 3, department: 'Computer Science' },
      { name: 'Database Management Systems', code: 'CS-302', creditHours: 3, department: 'Computer Science' },
      { name: 'Object Oriented Programming', code: 'CS-303', creditHours: 3, department: 'Computer Science' },
      { name: 'Computer Networks', code: 'CS-304', creditHours: 3, department: 'Computer Science' },
      { name: 'Web Development', code: 'CS-305', creditHours: 3, department: 'Computer Science' }
    ];
    await db.collection('subjects').insertMany(subjects);
    console.log('✅ Inserted 5 subjects');

    // 6. Create Departments Collection
    console.log('\n📁 Creating departments collection...');
    await db.collection('departments').deleteMany({});
    const departments = [
      {
        name: 'Computer Science',
        code: 'CS',
        totalTeachers: 12,
        totalStudents: 350,
        establishedYear: 2005,
        isActive: true
      },
      {
        name: 'Software Engineering',
        code: 'SE',
        totalTeachers: 8,
        totalStudents: 280,
        establishedYear: 2010,
        isActive: true
      }
    ];
    await db.collection('departments').insertMany(departments);
    console.log('✅ Inserted 2 departments');

    // 7. Create Announcements Collection
    console.log('\n📁 Creating announcements collection...');
    await db.collection('announcements').deleteMany({});
    const announcements = [
      {
        title: 'Midterm Exam Schedule',
        content: 'Midterm exams will start from 15th of next month.',
        type: 'exam',
        priority: 'high',
        postedBy: 'admin@oams.com',
        postedAt: new Date(),
        isActive: true
      }
    ];
    await db.collection('announcements').insertMany(announcements);
    console.log('✅ Inserted 1 announcement');

    // Summary
    console.log('\n📊 FINAL DATABASE SUMMARY');
    console.log('================================');
    const finalCollections = await db.listCollections().toArray();
    for (const col of finalCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documents`);
    }
    console.log(`   Total Collections: ${finalCollections.length}`);
    console.log('================================');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin:    admin@oams.com / admin123');
    console.log('   Teacher:  teacher@oams.com / teacher123');
    console.log('   Student:  student@oams.com / student123');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify IP whitelist in Atlas (Network Access)');
    console.log('   3. Confirm password is correct');
    console.log('   4. Try using mobile hotspot if WiFi blocks MongoDB');
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedAtlas();
