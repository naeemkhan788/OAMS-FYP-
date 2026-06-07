const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Table definitions
const TABLES = {
  USERS: 'users.json',
  CLASSES: 'classes.json',
  TEACHERS: 'teachers.json',
  STUDENTS: 'students.json',
  SUBJECTS: 'subjects.json',
  DEPARTMENTS: 'departments.json',
  ATTENDANCE: 'attendance.json',
  MARKS: 'marks.json',
  TIMETABLE: 'timetable.json',
  ANNOUNCEMENTS: 'announcements.json',
  FEE_RECORDS: 'feeRecords.json',
  LEAVE_APPLICATIONS: 'leaveApplications.json'
};

// Initialize all tables with sample data
const initializeAllTables = () => {
  console.log('📊 Initializing Database Tables...\n');

  // 1. USERS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.USERS))) {
    const users = [
      {
        _id: 'USR-001',
        name: 'System Admin',
        email: 'admin@oams.local',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        phone: '+92-300-1234567',
        address: 'Admin Office, University Campus',
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'USR-002',
        name: 'Dr. Ahmad Khan',
        email: 'teacher@oams.local',
        password: bcrypt.hashSync('teacher123', 10),
        role: 'teacher',
        teacherId: 'TCH-001',
        department: 'Computer Science',
        designation: 'Associate Professor',
        phone: '+92-301-2345678',
        isActive: true,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'USR-003',
        name: 'Ali Hassan',
        email: 'student@oams.local',
        password: bcrypt.hashSync('student123', 10),
        role: 'student',
        studentId: 'STU-001',
        rollNumber: 'CS-2023-001',
        classId: 'CLS-001',
        department: 'Computer Science',
        batch: '2023',
        semester: '3rd',
        phone: '+92-302-3456789',
        isActive: true,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.USERS), JSON.stringify(users, null, 2));
    console.log('✅ Table: users (3 records)');
  }

  // 2. CLASSES TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.CLASSES))) {
    const classes = [
      {
        _id: 'CLS-001',
        name: 'BS Computer Science - 3rd Semester',
        code: 'BS-CS-3A',
        department: 'Computer Science',
        batch: '2023',
        semester: '3rd',
        section: 'A',
        totalStudents: 45,
        classTeacherId: 'TCH-001',
        subjects: ['SUB-001', 'SUB-002', 'SUB-003', 'SUB-004', 'SUB-005'],
        roomNumber: 'CS-Lab-1',
        schedule: 'Morning (8:30 AM - 2:30 PM)',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'CLS-002',
        name: 'BS Computer Science - 3rd Semester',
        code: 'BS-CS-3B',
        department: 'Computer Science',
        batch: '2023',
        semester: '3rd',
        section: 'B',
        totalStudents: 42,
        classTeacherId: 'TCH-002',
        subjects: ['SUB-001', 'SUB-002', 'SUB-003', 'SUB-004', 'SUB-005'],
        roomNumber: 'CS-Lab-2',
        schedule: 'Afternoon (2:30 PM - 8:30 PM)',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.CLASSES), JSON.stringify(classes, null, 2));
    console.log('✅ Table: classes (2 records)');
  }

  // 3. TEACHERS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.TEACHERS))) {
    const teachers = [
      {
        _id: 'TCH-001',
        userId: 'USR-002',
        teacherId: 'TCH-001',
        name: 'Dr. Ahmad Khan',
        email: 'teacher@oams.local',
        department: 'Computer Science',
        designation: 'Associate Professor',
        specialization: 'Software Engineering',
        qualification: 'PhD Computer Science',
        experience: '10 years',
        subjects: ['SUB-001', 'SUB-002'],
        assignedClasses: ['CLS-001'],
        phone: '+92-301-2345678',
        joinDate: '2018-08-15',
        salary: 120000,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.TEACHERS), JSON.stringify(teachers, null, 2));
    console.log('✅ Table: teachers (1 record)');
  }

  // 4. STUDENTS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.STUDENTS))) {
    const students = [
      {
        _id: 'STU-001',
        userId: 'USR-003',
        studentId: 'STU-001',
        rollNumber: 'CS-2023-001',
        name: 'Ali Hassan',
        email: 'student@oams.local',
        fatherName: 'Hassan Ahmed',
        department: 'Computer Science',
        batch: '2023',
        semester: '3rd',
        classId: 'CLS-001',
        section: 'A',
        dateOfBirth: '2002-05-15',
        gender: 'male',
        phone: '+92-302-3456789',
        address: 'House #123, Street 4, University Town',
        admissionDate: '2023-09-01',
        feeStatus: 'paid',
        attendancePercentage: 85,
        cgpa: 3.5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.STUDENTS), JSON.stringify(students, null, 2));
    console.log('✅ Table: students (1 record)');
  }

  // 5. SUBJECTS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.SUBJECTS))) {
    const subjects = [
      {
        _id: 'SUB-001',
        name: 'Data Structures & Algorithms',
        code: 'CS-301',
        department: 'Computer Science',
        creditHours: 3,
        theoryMarks: 60,
        practicalMarks: 40,
        totalMarks: 100,
        semester: '3rd',
        assignedTeacherId: 'TCH-001',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'SUB-002',
        name: 'Database Management Systems',
        code: 'CS-302',
        department: 'Computer Science',
        creditHours: 3,
        theoryMarks: 60,
        practicalMarks: 40,
        totalMarks: 100,
        semester: '3rd',
        assignedTeacherId: 'TCH-001',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'SUB-003',
        name: 'Object Oriented Programming',
        code: 'CS-303',
        department: 'Computer Science',
        creditHours: 3,
        theoryMarks: 60,
        practicalMarks: 40,
        totalMarks: 100,
        semester: '3rd',
        assignedTeacherId: 'TCH-002',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'SUB-004',
        name: 'Computer Networks',
        code: 'CS-304',
        department: 'Computer Science',
        creditHours: 3,
        theoryMarks: 60,
        practicalMarks: 40,
        totalMarks: 100,
        semester: '3rd',
        assignedTeacherId: 'TCH-003',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'SUB-005',
        name: 'Web Development',
        code: 'CS-305',
        department: 'Computer Science',
        creditHours: 3,
        theoryMarks: 50,
        practicalMarks: 50,
        totalMarks: 100,
        semester: '3rd',
        assignedTeacherId: 'TCH-004',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.SUBJECTS), JSON.stringify(subjects, null, 2));
    console.log('✅ Table: subjects (5 records)');
  }

  // 6. DEPARTMENTS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.DEPARTMENTS))) {
    const departments = [
      {
        _id: 'DEPT-001',
        name: 'Computer Science',
        code: 'CS',
        hodId: 'TCH-005',
        totalTeachers: 12,
        totalStudents: 350,
        totalClasses: 8,
        establishedYear: 2005,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'DEPT-002',
        name: 'Software Engineering',
        code: 'SE',
        hodId: 'TCH-006',
        totalTeachers: 8,
        totalStudents: 280,
        totalClasses: 6,
        establishedYear: 2010,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.DEPARTMENTS), JSON.stringify(departments, null, 2));
    console.log('✅ Table: departments (2 records)');
  }

  // 7. ATTENDANCE TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.ATTENDANCE))) {
    const attendance = [
      {
        _id: 'ATT-001',
        studentId: 'STU-001',
        classId: 'CLS-001',
        subjectId: 'SUB-001',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        markedBy: 'TCH-001',
        markedAt: new Date().toISOString(),
        remarks: 'On time',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'ATT-002',
        studentId: 'STU-001',
        classId: 'CLS-001',
        subjectId: 'SUB-002',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        markedBy: 'TCH-001',
        markedAt: new Date().toISOString(),
        remarks: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.ATTENDANCE), JSON.stringify(attendance, null, 2));
    console.log('✅ Table: attendance (2 records)');
  }

  // 8. MARKS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.MARKS))) {
    const marks = [
      {
        _id: 'MRK-001',
        studentId: 'STU-001',
        subjectId: 'SUB-001',
        classId: 'CLS-001',
        examType: 'midterm',
        theoryMarks: 45,
        practicalMarks: 35,
        totalMarks: 80,
        maxMarks: 100,
        grade: 'A',
        gpa: 3.7,
        status: 'passed',
        remarks: 'Excellent performance',
        enteredBy: 'TCH-001',
        enteredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'MRK-002',
        studentId: 'STU-001',
        subjectId: 'SUB-002',
        classId: 'CLS-001',
        examType: 'midterm',
        theoryMarks: 42,
        practicalMarks: 38,
        totalMarks: 80,
        maxMarks: 100,
        grade: 'A',
        gpa: 3.7,
        status: 'passed',
        remarks: '',
        enteredBy: 'TCH-001',
        enteredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.MARKS), JSON.stringify(marks, null, 2));
    console.log('✅ Table: marks (2 records)');
  }

  // 9. TIMETABLE TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.TIMETABLE))) {
    const timetable = [
      {
        _id: 'TT-001',
        classId: 'CLS-001',
        subjectId: 'SUB-001',
        teacherId: 'TCH-001',
        day: 'Monday',
        startTime: '08:30',
        endTime: '10:00',
        roomNumber: 'CS-Lab-1',
        isLab: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'TT-002',
        classId: 'CLS-001',
        subjectId: 'SUB-002',
        teacherId: 'TCH-001',
        day: 'Monday',
        startTime: '10:00',
        endTime: '11:30',
        roomNumber: 'CS-Lab-2',
        isLab: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.TIMETABLE), JSON.stringify(timetable, null, 2));
    console.log('✅ Table: timetable (2 records)');
  }

  // 10. ANNOUNCEMENTS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.ANNOUNCEMENTS))) {
    const announcements = [
      {
        _id: 'ANN-001',
        title: 'Midterm Exam Schedule',
        content: 'Midterm exams will start from 15th of next month. Please check your schedules.',
        type: 'exam',
        priority: 'high',
        targetAudience: 'all',
        postedBy: 'USR-001',
        postedAt: new Date().toISOString(),
        expiresAt: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'ANN-002',
        title: 'Fee Submission Deadline',
        content: 'Last date for fee submission is 30th of this month.',
        type: 'fee',
        priority: 'high',
        targetAudience: 'students',
        postedBy: 'USR-001',
        postedAt: new Date().toISOString(),
        expiresAt: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.ANNOUNCEMENTS), JSON.stringify(announcements, null, 2));
    console.log('✅ Table: announcements (2 records)');
  }

  // 11. FEE RECORDS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.FEE_RECORDS))) {
    const feeRecords = [
      {
        _id: 'FEE-001',
        studentId: 'STU-001',
        semester: '3rd',
        totalAmount: 45000,
        paidAmount: 45000,
        dueAmount: 0,
        paymentStatus: 'paid',
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        transactionId: 'TXN-001-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.FEE_RECORDS), JSON.stringify(feeRecords, null, 2));
    console.log('✅ Table: feeRecords (1 record)');
  }

  // 12. LEAVE APPLICATIONS TABLE
  if (!fs.existsSync(path.join(DATA_DIR, TABLES.LEAVE_APPLICATIONS))) {
    const leaveApps = [
      {
        _id: 'LEAVE-001',
        applicantId: 'STU-001',
        applicantType: 'student',
        leaveType: 'medical',
        startDate: '2024-04-15',
        endDate: '2024-04-17',
        totalDays: 3,
        reason: 'Fever and flu',
        status: 'pending',
        appliedAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null,
        remarks: '',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(path.join(DATA_DIR, TABLES.LEAVE_APPLICATIONS), JSON.stringify(leaveApps, null, 2));
    console.log('✅ Table: leaveApplications (1 record)');
  }

  // Display Summary
  console.log('\n📊 DATABASE TABLES SUMMARY');
  console.log('================================');
  Object.keys(TABLES).forEach((table, index) => {
    const filePath = path.join(DATA_DIR, TABLES[table]);
    let count = 0;
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      count = Array.isArray(data) ? data.length : 0;
    }
    console.log(`   ${index + 1}. ${table.toLowerCase()} (${count} records)`);
  });
  console.log(`   Total: ${Object.keys(TABLES).length} tables`);
  console.log('================================\n');
};

// Generic CRUD Operations
const db = {
  // Read all records from a table
  findAll: (tableName) => {
    const filePath = path.join(DATA_DIR, TABLES[tableName.toUpperCase()]);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  },

  // Find one record by query
  findOne: (tableName, query) => {
    const records = db.findAll(tableName);
    return records.find(record => {
      for (let key in query) {
        if (record[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Find multiple records by query
  find: (tableName, query) => {
    const records = db.findAll(tableName);
    return records.filter(record => {
      for (let key in query) {
        if (record[key] !== query[key]) return false;
      }
      return true;
    });
  },

  // Insert new record
  insert: (tableName, data) => {
    const filePath = path.join(DATA_DIR, TABLES[tableName.toUpperCase()]);
    const records = db.findAll(tableName);
    records.push({
      ...data,
      _id: data._id || `${tableName.substring(0, 3).toUpperCase()}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
    return data;
  },

  // Update record
  update: (tableName, query, data) => {
    const filePath = path.join(DATA_DIR, TABLES[tableName.toUpperCase()]);
    const records = db.findAll(tableName);
    const index = records.findIndex(record => {
      for (let key in query) {
        if (record[key] !== query[key]) return false;
      }
      return true;
    });
    if (index !== -1) {
      records[index] = { ...records[index], ...data, updatedAt: new Date().toISOString() };
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
      return records[index];
    }
    return null;
  },

  // Delete record
  delete: (tableName, query) => {
    const filePath = path.join(DATA_DIR, TABLES[tableName.toUpperCase()]);
    let records = db.findAll(tableName);
    const initialLength = records.length;
    records = records.filter(record => {
      for (let key in query) {
        if (record[key] === query[key]) return false;
      }
      return true;
    });
    if (records.length < initialLength) {
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
      return true;
    }
    return false;
  },

  // Get table info
  getTableInfo: () => {
    const info = {};
    Object.keys(TABLES).forEach(table => {
      const filePath = path.join(DATA_DIR, TABLES[table]);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        info[table.toLowerCase()] = {
          totalRecords: Array.isArray(data) ? data.length : 0,
          fileSize: fs.statSync(filePath).size
        };
      }
    });
    return info;
  }
};

module.exports = {
  initializeAllTables,
  db,
  TABLES
};
