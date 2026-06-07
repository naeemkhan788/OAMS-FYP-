import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const [stats, setStats] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showMyStudentsModal, setShowMyStudentsModal] = useState(false);
  const [showAttendanceRecordsModal, setShowAttendanceRecordsModal] = useState(false);
  const [showMarksRecordsModal, setShowMarksRecordsModal] = useState(false);
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  
  // Additional modal states
  const [showStudentPerformanceModal, setShowStudentPerformanceModal] = useState(false);
  const [showClassStatsModal, setShowClassStatsModal] = useState(false);
  const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);
  
  const [selectedStudentForPerformance, setSelectedStudentForPerformance] = useState('');
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [classStats, setClassStats] = useState(null);
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', classId: '' });
  const [bulkAttendance, setBulkAttendance] = useState({ date: new Date().toISOString().split('T')[0], students: [] });
  
  // Data states for viewing
  const [myStudents, setMyStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);

  // Form states
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [marksData, setMarksData] = useState({ subject: '', marks: '', totalMarks: '100', assessmentType: 'assignment' });
  const [quizData, setQuizData] = useState({ subject: '', quizName: '', marks: '', totalMarks: '20' });
  const [attendanceData, setAttendanceData] = useState({ date: new Date().toISOString().split('T')[0], status: 'present' });
  const [examData, setExamData] = useState({ subject: '', examName: '', marks: '', totalMarks: '100', examDate: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        // Store classes data for forms
        const loadedClasses = data.data.classes || [];
        console.log('Teacher classes loaded:', loadedClasses.length, 'classes', loadedClasses);
        setClasses(loadedClasses);
        
        // Transform API data to dashboard format
        setStats([
          {
            title: 'Total Students',
            value: data.data.stats?.totalStudents || 0,
            change: `+${data.data.classes?.reduce((acc, cls) => acc + (cls.students?.length || 0), 0) || 0}`,
            changeType: 'positive',
            icon: '👥',
            color: 'bg-blue-50 text-blue-600 border-blue-200',
          },
          {
            title: 'Total Classes',
            value: data.data.stats?.totalClasses || 0,
            change: `${data.data.classes?.length || 0} active`,
            changeType: 'neutral',
            icon: '📚',
            color: 'bg-green-50 text-green-600 border-green-200',
          },
          {
            title: 'Today Attendance',
            value: `${data.data.stats?.attendanceStats?.percentage || 0}%`,
            change: `${data.data.stats?.attendanceStats?.present || 0} present`,
            changeType: 'positive',
            icon: '📊',
            color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          },
          {
            title: 'Pending Assessments',
            value: data.data.stats?.pendingAssessments || 0,
            change: 'to review',
            changeType: 'positive',
            icon: '⭐',
            color: 'bg-purple-50 text-purple-600 border-purple-200',
          },
        ]);

        // Transform classes to schedule format
        const classesSchedule = data.data.classes?.map((cls, idx) => ({
          id: idx + 1,
          subject: cls.name || 'Class',
          time: 'Scheduled',
          room: cls.code || 'Room TBD',
          type: 'Lecture',
          status: 'upcoming'
        })) || [];
        setTodaySchedule(classesSchedule);

        // Transform recent marks as reviews
        const reviews = data.data.recentMarks?.map((mark, idx) => ({
          id: idx + 1,
          student: mark.student?.name || 'Student',
          subject: mark.class?.name || 'Subject',
          rating: 4 + Math.floor(Math.random() * 2),
          comment: `Scored ${mark.marks || 0}/${mark.totalMarks || 100}`,
          date: mark.createdAt ? new Date(mark.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        })) || [];
        setRecentReviews(reviews.slice(0, 3));

        // Create tasks from upcoming assessments
        const tasks = data.data.upcomingAssessments?.map((assessment, idx) => ({
          id: idx + 1,
          title: `Review ${assessment.class?.name || 'Assessment'}`,
          subject: assessment.class?.name || 'Subject',
          due: assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString() : 'Soon',
          priority: idx === 0 ? 'high' : 'medium'
        })) || [];
        setPendingTasks(tasks.length > 0 ? tasks : [{ id: 1, title: 'No pending tasks', subject: '-', due: '-', priority: 'low' }]);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      const cls = classes.find(c => c._id === selectedClass);
      if (cls && cls.students) {
        setStudents(cls.students);
      }
    }
  }, [selectedClass, classes]);

  // Submit marks
  const handleSubmitMarks = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/marks/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass,
          subject: marksData.subject,
          assessmentType: marksData.assessmentType,
          title: `${marksData.subject} ${marksData.assessmentType}`,
          marksData: [{
            studentId: selectedStudent,
            marksObtained: parseFloat(marksData.marks),
            maxMarks: parseFloat(marksData.totalMarks),
            remarks: ''
          }]
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess('Marks added successfully!');
        setTimeout(() => {
          setShowMarksModal(false);
          setSubmitSuccess(null);
          setMarksData({ subject: '', marks: '', totalMarks: '100', assessmentType: 'assignment' });
          setSelectedStudent('');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to add marks');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit quiz marks
  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/marks/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass,
          subject: quizData.subject,
          assessmentType: 'quiz',
          title: quizData.quizName || `${quizData.subject} Quiz`,
          marksData: [{
            studentId: selectedStudent,
            marksObtained: parseFloat(quizData.marks),
            maxMarks: parseFloat(quizData.totalMarks),
            remarks: ''
          }]
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess('Quiz marks added successfully!');
        setTimeout(() => {
          setShowQuizModal(false);
          setSubmitSuccess(null);
          setQuizData({ subject: '', quizName: '', marks: '', totalMarks: '20' });
          setSelectedStudent('');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to add quiz marks');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit attendance
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Get class info for subject
      const classInfo = classes.find(c => c._id === selectedClass);
      const subject = classInfo?.subjects?.[0]?.name || classInfo?.name || 'General';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass,
          date: attendanceData.date,
          subject: subject,
          attendanceData: [{
            studentId: selectedStudent,
            status: attendanceData.status,
            notes: ''
          }]
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess('Attendance marked successfully!');
        setTimeout(() => {
          setShowAttendanceModal(false);
          setSubmitSuccess(null);
          setAttendanceData({ date: new Date().toISOString().split('T')[0], status: 'present' });
          setSelectedStudent('');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit exam marks
  const handleSubmitExam = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/marks/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass,
          subject: examData.subject,
          assessmentType: 'final',
          title: examData.examName || `${examData.subject} Exam`,
          marksData: [{
            studentId: selectedStudent,
            marksObtained: parseFloat(examData.marks),
            maxMarks: parseFloat(examData.totalMarks),
            remarks: ''
          }]
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess('Exam marks added successfully!');
        setTimeout(() => {
          setShowExamModal(false);
          setSubmitSuccess(null);
          setExamData({ subject: '', examName: '', marks: '', totalMarks: '100', examDate: '' });
          setSelectedStudent('');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to add exam marks');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Fetch all students for this teacher
  const fetchMyStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes/teacher/students`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setMyStudents(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/attendance/teacher`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  // Fetch marks records
  const fetchMarksRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/marks/teacher`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setMarksRecords(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    }
  };

  // Fetch unassigned students
  const fetchUnassignedStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users/unassigned-students`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('Unassigned students response:', data);
      if (data.success) {
        // Backend returns data.data.students array
        const students = data.data?.students || data.data || [];
        console.log('Setting unassigned students:', students.length, 'students');
        setUnassignedStudents(students);
      } else {
        console.error('Failed to fetch unassigned students:', data.message);
      }
    } catch (err) {
      console.error('Error fetching unassigned students:', err);
    }
  };

  // Assign student to class
  const handleAssignClass = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedClass) {
      alert('Please select both a student and a class');
      return;
    }
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Assigning student:', { studentId: selectedStudent, classId: selectedClass });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes/assign-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          classId: selectedClass
        })
      });

      const data = await response.json();
      console.log('Assign student response:', data);
      
      if (response.ok && data.success) {
        setSubmitSuccess('Student assigned to class successfully!');
        // Refresh dashboard data to show updated classes
        await fetchDashboardData();
        // Also refresh unassigned students list
        await fetchUnassignedStudents();
        setTimeout(() => {
          setShowAssignClassModal(false);
          setSubmitSuccess(null);
          setSelectedStudent('');
          setSelectedClass('');
        }, 1500);
      } else {
        throw new Error(data.message || `Failed to assign student (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Assign student error:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Fetch student performance data
  const fetchStudentPerformance = async (studentId) => {
    try {
      setPerformanceLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/marks/student/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setStudentPerformance(data.data || null);
      } else {
        setStudentPerformance(null);
      }
    } catch (err) {
      console.error('Error fetching student performance:', err);
      setStudentPerformance(null);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Fetch class statistics
  const fetchClassStats = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes/${classId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setClassStats(data.data || null);
      }
    } catch (err) {
      console.error('Error fetching class stats:', err);
    }
  };

  // Send notice to class
  const handleSendNotice = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...noticeForm,
          targetRole: 'students',
          classId: noticeForm.classId
        })
      });

      if (response.ok) {
        setSubmitSuccess('Notice sent successfully!');
        setTimeout(() => {
          setShowSendNoticeModal(false);
          setSubmitSuccess(null);
          setNoticeForm({ title: '', message: '', classId: '' });
        }, 1500);
      } else {
        throw new Error('Failed to send notice');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle bulk attendance
  const handleBulkAttendance = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/attendance/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass,
          date: bulkAttendance.date,
          attendance: bulkAttendance.students
        })
      });

      if (response.ok) {
        setSubmitSuccess('Bulk attendance marked successfully!');
        setTimeout(() => {
          setShowBulkAttendanceModal(false);
          setSubmitSuccess(null);
          setBulkAttendance({ date: new Date().toISOString().split('T')[0], students: [] });
        }, 1500);
      } else {
        throw new Error('Failed to mark bulk attendance');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setStats([
          { title: 'Total Students', value: data.data.stats?.totalStudents || 0, change: `${data.data.classes?.length || 0} classes`, changeType: 'positive', icon: '👥', color: 'bg-blue-50 text-blue-600 border-blue-200' },
          { title: 'Total Classes', value: data.data.stats?.totalClasses || 0, change: `${data.data.classes?.length || 0} active`, changeType: 'neutral', icon: '📚', color: 'bg-green-50 text-green-600 border-green-200' },
          { title: 'Today Attendance', value: `${data.data.stats?.attendanceStats?.percentage || 0}%`, change: `${data.data.stats?.attendanceStats?.present || 0} present`, changeType: 'positive', icon: '📊', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
          { title: 'Pending Assessments', value: data.data.stats?.pendingAssessments || 0, change: 'to review', changeType: 'positive', icon: '⭐', color: 'bg-purple-50 text-purple-600 border-purple-200' },
        ]);
      }
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-800';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your teaching overview — live from database</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {todaySchedule.map((class_) => (
              <div key={class_.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    class_.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-primary-900">{class_.subject}</p>
                    <p className="text-xs text-gray-500">{class_.time} • {class_.room}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    class_.type === 'Lecture' ? 'bg-blue-100 text-blue-800' :
                    class_.type === 'Lab' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {class_.type}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    class_.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {class_.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="border-l-4 border-primary-500 pl-4 py-2">
                <p className="text-sm font-medium text-primary-900">{task.title}</p>
                <p className="text-xs text-gray-500">{task.subject}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Due: {task.due}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Student Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Recent Student Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentReviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-primary-900">{review.student}</h3>
                <div className="flex">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{review.subject}</p>
              <p className="text-sm text-gray-600 mb-2">"{review.comment}"</p>
              <p className="text-xs text-gray-400">{review.date}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All Reviews →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Teacher Management</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4">
          <button 
            onClick={() => setShowAttendanceModal(true)}
            className="flex flex-col items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs">Mark Attendance</span>
          </button>
          <button 
            onClick={() => setShowMarksModal(true)}
            className="flex flex-col items-center justify-center px-4 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">Add Marks</span>
          </button>
          <button 
            onClick={() => setShowQuizModal(true)}
            className="flex flex-col items-center justify-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Quiz Marks</span>
          </button>
          <button 
            onClick={() => setShowExamModal(true)}
            className="flex flex-col items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">Exam Marks</span>
          </button>
          <button 
            onClick={() => { setShowMyStudentsModal(true); fetchMyStudents(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">My Students</span>
          </button>
          <button 
            onClick={() => { setShowAttendanceRecordsModal(true); fetchAttendanceRecords(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs">View Attendance</span>
          </button>
          <button 
            onClick={() => { setShowMarksRecordsModal(true); fetchMarksRecords(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">View Marks</span>
          </button>
          <button 
            onClick={() => { setShowAssignClassModal(true); fetchUnassignedStudents(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 3h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-xs">Assign Class</span>
          </button>
          <button 
            onClick={() => { 
              setShowStudentPerformanceModal(true); 
              fetchMyStudents(); 
              setSelectedStudentForPerformance(''); 
              setStudentPerformance(null); 
            }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Student Progress</span>
          </button>
          <button 
            onClick={() => { setShowClassStatsModal(true); fetchClassStats(selectedClass || classes[0]?._id); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-pink-50 text-pink-700 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <span className="text-xs">Class Stats</span>
          </button>
          <button 
            onClick={() => setShowBulkAttendanceModal(true)}
            className="flex flex-col items-center justify-center px-4 py-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">Bulk Attendance</span>
          </button>
          <button 
            onClick={() => setShowSendNoticeModal(true)}
            className="flex flex-col items-center justify-center px-4 py-3 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.156-4.803V5.882a1.76 1.76 0 013.417-.591l2.156 4.802zM19.765 5.882v12.357a1.76 1.76 0 01-3.417.592l-2.156-4.803V5.882a1.76 1.76 0 013.417-.591l2.156 4.802z" />
            </svg>
            <span className="text-xs">Send Notice</span>
          </button>
        </div>
      </div>

      {/* Marks Modal */}
      {showMarksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Add Assignment Marks</h2>
              <button onClick={() => setShowMarksModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitMarks} className="space-y-4">
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedClass} 
                  onChange={(e) => {
                    const classId = e.target.value;
                    setSelectedClass(classId);
                    const selectedClassData = classes.find(c => c._id === classId);
                    setStudents(selectedClassData?.students || []);
                    setSelectedStudent('');
                  }} 
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.name} {cls.grade && cls.section ? `- ${cls.grade}${cls.section}` : ''} ({cls.code || 'No Code'})</option>)}
                </select>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)} 
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => <option key={student._id} value={student._id}>{student.name}</option>)}
                </select>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Subject" 
                  value={marksData.subject} 
                  onChange={(e) => setMarksData({...marksData, subject: e.target.value})} 
                  required 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number" 
                    placeholder="Marks Obtained" 
                    value={marksData.marks} 
                    onChange={(e) => setMarksData({...marksData, marks: e.target.value})} 
                    required 
                  />
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number" 
                    placeholder="Total Marks" 
                    value={marksData.totalMarks} 
                    onChange={(e) => setMarksData({...marksData, totalMarks: e.target.value})} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Adding...' : 'Add Marks'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Add Quiz Marks</h2>
              <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuiz} className="space-y-4">
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedClass} 
                  onChange={(e) => {
                    const classId = e.target.value;
                    setSelectedClass(classId);
                    const selectedClassData = classes.find(c => c._id === classId);
                    setStudents(selectedClassData?.students || []);
                    setSelectedStudent('');
                  }} 
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.name} {cls.grade && cls.section ? `- ${cls.grade}${cls.section}` : ''} ({cls.code || 'No Code'})</option>)}
                </select>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)} 
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => <option key={student._id} value={student._id}>{student.name}</option>)}
                </select>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Subject" 
                  value={quizData.subject} 
                  onChange={(e) => setQuizData({...quizData, subject: e.target.value})} 
                  required 
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Quiz Name" 
                  value={quizData.quizName} 
                  onChange={(e) => setQuizData({...quizData, quizName: e.target.value})} 
                  required 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number" 
                    placeholder="Marks" 
                    value={quizData.marks} 
                    onChange={(e) => setQuizData({...quizData, marks: e.target.value})} 
                    required 
                  />
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number" 
                    placeholder="Total" 
                    value={quizData.totalMarks} 
                    onChange={(e) => setQuizData({...quizData, totalMarks: e.target.value})} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Adding...' : 'Add Quiz Marks'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Mark Attendance</h2>
              <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAttendance} className="space-y-4">
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedClass} 
                  onChange={(e) => {
                    const classId = e.target.value;
                    setSelectedClass(classId);
                    const selectedClassData = classes.find(c => c._id === classId);
                    setStudents(selectedClassData?.students || []);
                    setSelectedStudent('');
                  }} 
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.name} {cls.grade && cls.section ? `- ${cls.grade}${cls.section}` : ''} ({cls.code || 'No Code'})</option>)}
                </select>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)} 
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => <option key={student._id} value={student._id}>{student.name}</option>)}
                </select>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  type="date" 
                  value={attendanceData.date} 
                  onChange={(e) => setAttendanceData({...attendanceData, date: e.target.value})} 
                  required 
                />
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={attendanceData.status} 
                  onChange={(e) => setAttendanceData({...attendanceData, status: e.target.value})} 
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Marking...' : 'Mark Attendance'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Add Exam Marks</h2>
              <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitExam} className="space-y-4">
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedClass} 
                  onChange={(e) => {
                    const classId = e.target.value;
                    setSelectedClass(classId);
                    const selectedClassData = classes.find(c => c._id === classId);
                    setStudents(selectedClassData?.students || []);
                    setSelectedStudent('');
                  }} 
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.name} {cls.grade && cls.section ? `- ${cls.grade}${cls.section}` : ''} ({cls.code || 'No Code'})</option>)}
                </select>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)} 
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => <option key={student._id} value={student._id}>{student.name}</option>)}
                </select>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Subject" 
                  value={examData.subject} 
                  onChange={(e) => setExamData({...examData, subject: e.target.value})} 
                  required 
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Exam Name" 
                  value={examData.examName} 
                  onChange={(e) => setExamData({...examData, examName: e.target.value})} 
                  required 
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  type="date" 
                  placeholder="Exam Date" 
                  value={examData.examDate} 
                  onChange={(e) => setExamData({...examData, examDate: e.target.value})} 
                  required 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number" 
                    placeholder="Marks" 
                    value={examData.marks} 
                    onChange={(e) => setExamData({...examData, marks: e.target.value})} 
                    required 
                  />
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number" 
                    placeholder="Total" 
                    value={examData.totalMarks} 
                    onChange={(e) => setExamData({...examData, totalMarks: e.target.value})} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Adding...' : 'Add Exam Marks'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* My Students Modal */}
      {showMyStudentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">My Students</h2>
              <button onClick={() => setShowMyStudentsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Student ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Class</th>
                </tr>
              </thead>
              <tbody>
                {myStudents.length > 0 ? myStudents.map((student, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-4">{student.name}</td>
                    <td className="py-3 px-4">{student.email}</td>
                    <td className="py-3 px-4">{student.studentId || '-'}</td>
                    <td className="py-3 px-4">{student.class?.name || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-500">No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Records Modal */}
      {showAttendanceRecordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Attendance Records</h2>
              <button onClick={() => setShowAttendanceRecordsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Class</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length > 0 ? attendanceRecords.map((record, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{record.student?.name || '-'}</td>
                    <td className="py-3 px-4">{record.class?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-500">No attendance records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marks Records Modal */}
      {showMarksRecordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Marks Records</h2>
              <button onClick={() => setShowMarksRecordsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {marksRecords.length > 0 ? marksRecords.map((mark, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-4">{mark.student?.name || '-'}</td>
                    <td className="py-3 px-4">{mark.subject}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                        {mark.assessmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{mark.marks}/{mark.totalMarks}</td>
                    <td className="py-3 px-4">{mark.assessmentDate ? new Date(mark.assessmentDate).toLocaleDateString() : '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-500">No marks records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Student to Class Modal */}
      {showAssignClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Assign Student to Class</h2>
              <button onClick={() => setShowAssignClassModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAssignClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Student (Unassigned)</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={selectedStudent} 
                    onChange={(e) => setSelectedStudent(e.target.value)} 
                    required
                  >
                    <option value="">-- Select Student --</option>
                    {unassignedStudents.map((student) => (
                      <option key={student._id} value={student._id}>{student.name} ({student.email})</option>
                    ))}
                  </select>
                  {unassignedStudents.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">No unassigned students found</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)} 
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>{cls.name} - Semester {cls.grade}{cls.section ? ` Sec ${cls.section}` : ''}</option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">No classes found. Please contact admin to assign you to a class first.</p>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading || unassignedStudents.length === 0 || classes.length === 0}
                  className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Assigning...' : 
                    classes.length === 0 ? 'No Classes Available' : 
                    unassignedStudents.length === 0 ? 'No Students Available' : 
                    'Assign to Class'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Student Performance Modal */}
      {showStudentPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-primary-900">Student Progress & Performance</h2>
                <p className="text-xs text-gray-500 mt-1">Real-time academic evaluation and subject mastery</p>
              </div>
              <button onClick={() => setShowStudentPerformanceModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
              <select 
                className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 font-medium text-primary-900 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
                value={selectedStudentForPerformance} 
                onChange={(e) => {
                  setSelectedStudentForPerformance(e.target.value);
                  if (e.target.value) fetchStudentPerformance(e.target.value);
                }}
              >
                <option value="">-- Select Student --</option>
                {myStudents.map((student) => (
                  <option key={student._id} value={student._id}>{student.name} ({student.studentId || student.email})</option>
                ))}
              </select>
            </div>

            {performanceLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-sm font-medium text-gray-500">Retrieving live performance analytics...</p>
              </div>
            ) : studentPerformance && studentPerformance.stats ? (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Overall Average</p>
                      <p className="text-3xl font-bold text-indigo-950 mt-1">{studentPerformance.stats.averagePercentage || 0}%</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-2xl">
                      📈
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Assessments Completed</p>
                      <p className="text-3xl font-bold text-emerald-950 mt-1">{studentPerformance.stats.totalAssessments || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl">
                      📝
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Grade Breakdown</p>
                      <div className="flex gap-2.5 mt-1.5 text-xs font-bold text-purple-950">
                        <span>A/A+: {((studentPerformance.stats.gradeDistribution?.['A+'] || 0) + (studentPerformance.stats.gradeDistribution?.['A'] || 0))}</span>
                        <span>B/B+: {((studentPerformance.stats.gradeDistribution?.['B+'] || 0) + (studentPerformance.stats.gradeDistribution?.['B'] || 0))}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl">
                      🏆
                    </div>
                  </div>
                </div>

                {/* Subject Mastery Progress Bars */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-primary-900 mb-4 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-primary-600 mr-2.5"></span>
                    Subject Proficiency & Progress
                  </h3>
                  {Object.keys(studentPerformance.stats.subjectAverages || {}).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {Object.entries(studentPerformance.stats.subjectAverages || {}).map(([subj, data], idx) => {
                        const avg = Math.round(parseFloat(data.average || 0));
                        let colorClass = 'bg-red-500';
                        if (avg >= 80) colorClass = 'bg-emerald-500';
                        else if (avg >= 65) colorClass = 'bg-blue-500';
                        else if (avg >= 50) colorClass = 'bg-amber-500';

                        return (
                          <div key={idx} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-gray-800">{subj}</span>
                              <span className="text-xs font-bold text-gray-900">{avg}% ({data.count} items)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${avg}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No subject averages calculated yet.</p>
                  )}
                </div>

                {/* Detailed Assessment History */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-primary-900">Assessment History</h3>
                    <span className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 font-semibold font-mono">Live Sync</span>
                  </div>
                  {(() => {
                    const allAssessments = [];
                    (studentPerformance.marks || []).forEach(cls => {
                      Object.entries(cls.subjects || {}).forEach(([subjectName, list]) => {
                        list.forEach(m => {
                          allAssessments.push({
                            subject: subjectName,
                            title: m.title || m.assessmentType,
                            assessmentType: m.assessmentType,
                            marksObtained: m.marksObtained,
                            maxMarks: m.maxMarks,
                            percentage: m.percentage || ((m.marksObtained / m.maxMarks) * 100).toFixed(1),
                            grade: m.grade || '-',
                            date: new Date(m.assessmentDate).toLocaleDateString()
                          });
                        });
                      });
                    });

                    return allAssessments.length > 0 ? (
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/75 border-b border-gray-200 text-xs font-bold text-gray-700">
                              <th className="py-3 px-4">Subject</th>
                              <th className="py-3 px-4">Assessment</th>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4">Score</th>
                              <th className="py-3 px-4">Grade</th>
                              <th className="py-3 px-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                            {allAssessments.map((item, idx) => (
                              <tr key={idx} className="hover:bg-primary-50/40 transition-colors">
                                <td className="py-3 px-4 font-semibold text-gray-900">{item.subject}</td>
                                <td className="py-3 px-4">{item.title}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-medium capitalize">{item.assessmentType}</span>
                                </td>
                                <td className="py-3 px-4 font-mono font-semibold text-gray-900">{item.marksObtained}/{item.maxMarks} ({item.percentage}%)</td>
                                <td className="py-3 px-4"><span className="font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{item.grade}</span></td>
                                <td className="py-3 px-4 text-gray-500 font-mono">{item.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-gray-500 py-6 italic">No recorded assessments found for this student.</p>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-4xl">🎓</span>
                <p className="text-sm font-medium text-gray-600 mt-3">Select a student from the dropdown above to view dynamic progress & performance</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Class Statistics Modal */}
      {showClassStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Class Statistics</h2>
              <button onClick={() => setShowClassStatsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2"
                value={selectedClass} 
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  if (e.target.value) fetchClassStats(e.target.value);
                }}
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name} - {cls.grade}{cls.section}</option>
                ))}
              </select>
            </div>
            {classStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-pink-700">{classStats.totalStudents || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Marks</p>
                  <p className="text-2xl font-bold text-blue-700">{classStats.averageMarks?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-green-700">{classStats.attendanceRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-yellow-700">{classStats.passRate?.toFixed(1) || 0}%</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Select a class to view statistics</p>
            )}
          </div>
        </div>
      )}

      {/* Send Notice Modal */}
      {showSendNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Send Notice to Class</h2>
              <button onClick={() => setShowSendNoticeModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendNotice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={noticeForm.classId} 
                    onChange={(e) => setNoticeForm({...noticeForm, classId: e.target.value})} 
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>{cls.name} - {cls.grade}{cls.section}</option>
                    ))}
                  </select>
                </div>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Notice Title" 
                  value={noticeForm.title} 
                  onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})} 
                  required 
                />
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Message" 
                  rows="4"
                  value={noticeForm.message} 
                  onChange={(e) => setNoticeForm({...noticeForm, message: e.target.value})} 
                  required 
                />
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Sending...' : 'Send Notice'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {showBulkAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Bulk Attendance</h2>
              <button onClick={() => setShowBulkAttendanceModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleBulkAttendance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)} 
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>{cls.name} - {cls.grade}{cls.section}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={bulkAttendance.date} 
                      onChange={(e) => setBulkAttendance({...bulkAttendance, date: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">Mark attendance for all students in selected class</p>
                <button 
                  type="submit" 
                  disabled={submitLoading || !selectedClass}
                  className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Marking...' : 'Mark All Present'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
