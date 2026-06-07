import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Social Sciences',
  'English',
  'Mathematics',
  'Other'
];

const emptyClassForm = {
  name: '',
  code: '',
  semester: '',
  department: 'Computer Science',
  section: '',
  teacher: '',
  room: '',
  capacity: 20,
  academicYear: '2025-2026',
  startTime: '08:00',
  endTime: '14:00'
};

export default function AdminDashboard() {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'assign-teacher') {
      openAssignTeacherModal();
    }
  }, [location.search]);

  // Admin Management Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showViewUsersModal, setShowViewUsersModal] = useState(false);
  const [showViewClassesModal, setShowViewClassesModal] = useState(false);
  const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showViewAssignmentsModal, setShowViewAssignmentsModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  
  // Sidebar Navigation State
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'assign-teacher', 'assignments', 'users', 'classes'
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Admin Form States
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', recipients: 'all' });
  const [allUsers, setAllUsers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClassForAssign, setSelectedClassForAssign] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('Computer Science');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('1');
  const [editingClass, setEditingClass] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Add notification helper
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };

  useEffect(() => {
    const fetchAdminData = async () => {
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
          // Transform API data to dashboard format
          setStats([
            {
              title: 'Total Students',
              value: data.data.stats?.students || 0,
              change: `+${data.data.recentUsers?.filter(u => u.role === 'student').length || 0}`,
              changeType: 'positive',
              icon: '👥',
              color: 'bg-blue-50 text-blue-600 border-blue-200',
            },
            {
              title: 'Total Teachers',
              value: data.data.stats?.teachers || 0,
              change: `+${data.data.recentUsers?.filter(u => u.role === 'teacher').length || 0}`,
              changeType: 'positive',
              icon: '👨‍🏫',
              color: 'bg-green-50 text-green-600 border-green-200',
            },
            {
              title: 'Active Classes',
              value: data.data.stats?.totalClasses || 0,
              change: `${data.data.classStats?.length || 0} total`,
              changeType: 'positive',
              icon: '📚',
              color: 'bg-purple-50 text-purple-600 border-purple-200',
            },
            {
              title: 'Today Attendance',
              value: `${data.data.stats?.attendanceStats?.percentage || 0}%`,
              change: `${data.data.stats?.attendanceStats?.present || 0} present`,
              changeType: 'neutral',
              icon: '📊',
              color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            },
          ]);

          // Set recent users as activities
          const activities = data.data.recentUsers?.map((user, idx) => ({
            id: idx + 1,
            type: user.role,
            action: `New ${user.role} registered`,
            details: `${user.name} - ${user.email}`,
            time: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently',
            icon: user.role === 'teacher' ? '👨‍🏫' : user.role === 'student' ? '👥' : '👤'
          })) || [];
          setRecentActivities(activities.length > 0 ? activities : [{ id: 1, type: 'system', action: 'System ready', details: 'Dashboard loaded successfully', time: 'Now', icon: '⚙️' }]);

          // Set department stats (Computer Science department)
          const totalStudents = data.data.classStats?.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) || 0;
          const totalTeachers = new Set(data.data.classStats?.map(cls => cls.teacher?._id || cls.teacher).filter(Boolean)).size || 0;
          const totalClasses = data.data.classStats?.length || 0;
          
          const depts = totalClasses > 0 ? [{
            name: 'Computer Science',
            students: totalStudents,
            teachers: totalTeachers,
            classes: totalClasses,
            growth: 'Active'
          }] : [{ name: 'Computer Science', students: 0, teachers: 0, classes: 0, growth: '-' }];
          setDepartmentStats(depts);

          setUpcomingEvents([]);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

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
          { title: 'Total Students', value: data.data.stats?.students || 0, change: `${data.data.stats?.totalUsers || 0} total users`, changeType: 'positive', icon: '👥', color: 'bg-blue-50 text-blue-600 border-blue-200' },
          { title: 'Total Teachers', value: data.data.stats?.teachers || 0, change: `${data.data.stats?.admins || 0} admins`, changeType: 'positive', icon: '👨‍🏫', color: 'bg-green-50 text-green-600 border-green-200' },
          { title: 'Active Classes', value: data.data.stats?.totalClasses || 0, change: `${data.data.classStats?.length || 0} total`, changeType: 'positive', icon: '📚', color: 'bg-purple-50 text-purple-600 border-purple-200' },
          { title: 'Today Attendance', value: `${data.data.stats?.attendanceStats?.percentage || 0}%`, change: `${data.data.stats?.attendanceStats?.present || 0} present`, changeType: 'neutral', icon: '📊', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
        ]);
        
        // Update department stats on refresh (Computer Science)
        const totalStudents = data.data.classStats?.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) || 0;
        const totalTeachers = new Set(data.data.classStats?.map(cls => cls.teacher?._id || cls.teacher).filter(Boolean)).size || 0;
        const totalClasses = data.data.classStats?.length || 0;
        const depts = totalClasses > 0 ? [{
          name: 'Computer Science',
          students: totalStudents,
          teachers: totalTeachers,
          classes: totalClasses,
          growth: 'Active'
        }] : [{ name: 'Computer Science', students: 0, teachers: 0, classes: 0, growth: '-' }];
        setDepartmentStats(depts);
      }
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  // Admin: Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess('User added successfully!');
        setTimeout(() => {
          setShowAddUserModal(false);
          setSubmitSuccess(null);
          setUserForm({ name: '', email: '', password: '', role: 'student' });
          handleRefresh();
        }, 1500);
      } else {
        throw new Error(data.message || data.error || 'Failed to add user');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Admin: Add Class
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!classForm.teacher) {
      alert('Please select a teacher');
      return;
    }
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Format data for backend with schedule object
      const classData = {
        name: classForm.name,
        code: classForm.code.toUpperCase(),
        semester: parseInt(classForm.semester),
        department: classForm.department,
        section: classForm.section.toUpperCase(),
        teacher: classForm.teacher,
        room: classForm.room,
        capacity: parseInt(classForm.capacity) || 20,
        academicYear: classForm.academicYear,
        schedule: {
          startTime: classForm.startTime || '08:00',
          endTime: classForm.endTime || '14:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess('Class added successfully!');
        setTimeout(() => {
          setShowAddClassModal(false);
          setSubmitSuccess(null);
          setClassForm(emptyClassForm);
          handleRefresh();
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to add class');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Admin: Send Notice (Feature not available - no backend API)
  const handleSendNotice = async (e) => {
    e.preventDefault();
    alert('Notice feature coming soon! Backend API not implemented yet.');
    setShowSendNoticeModal(false);
  };

  // Fetch all users for viewing
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('Fetched users:', data);
      if (data.success) {
        const users = data.data?.users || data.data || [];
        setAllUsers(users);
        console.log('Users loaded:', users.length);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      alert('Error loading users: ' + err.message);
    }
  };

  // Fetch all classes for viewing
  const fetchAllClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        const classes = data.data?.classes || data.data || [];
        setAllClasses(classes);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  // Fetch all teachers
  const fetchAllTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('Users API response:', data);
      if (data.success) {
        const users = data.data?.users || data.data || [];
        console.log('All users:', users);
        const teachers = users.filter(u => u.role === 'teacher');
        console.log('Filtered teachers:', teachers);
        setAllTeachers(teachers);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        const users = data.data?.users || data.data || [];
        const students = users.filter(u => u.role === 'student');
        setAllStudents(students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Assign teacher to class
  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    console.log('handleAssignTeacher called - selectedClassForAssign:', selectedClassForAssign, 'selectedTeacher:', selectedTeacher);
    console.log('allClasses:', allClasses);
    console.log('allTeachers:', allTeachers);
    if (!selectedClassForAssign || !selectedTeacher) {
      alert('Please select both class and teacher');
      return;
    }
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Get class and teacher names for notification
      const selectedClassObj = allClasses.find(c => c._id === selectedClassForAssign);
      const selectedTeacherObj = allTeachers.find(t => t._id === selectedTeacher);
      const className = selectedClassObj?.name || 'Unknown Class';
      const teacherName = selectedTeacherObj?.name || 'Unknown Teacher';

      console.log('Assigning teacher:', { classId: selectedClassForAssign, teacherId: selectedTeacher, className, teacherName });
      console.log('Request body:', JSON.stringify({ teacher: selectedTeacher }));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes/${selectedClassForAssign}/assign-teacher`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacher: selectedTeacher })
      });
      const data = await response.json();
      console.log('Assign teacher response status:', response.status);
      console.log('Assign teacher response:', data);
      
      if (response.ok && data.success) {
        // Add notification for successful assignment
        addNotification(
          `✅ Teacher "${teacherName}" assigned to class "${className}" successfully!`,
          'success'
        );
        
        // Add teacher notification (simulated - in production this would be sent to teacher)
        addNotification(
          `📧 Notification sent to ${teacherName}: You have been assigned to teach ${className}`,
          'info'
        );
        
        setSubmitSuccess(`Teacher "${teacherName}" assigned to "${className}" successfully! Notification sent.`);
        // Refresh data immediately
        await fetchAllClasses();
        handleRefresh();
        setTimeout(() => {
          setShowAssignTeacherModal(false);
          setActiveView('dashboard'); // Return to dashboard
          setSubmitSuccess(null);
          setSelectedClassForAssign('');
          setSelectedTeacher('');
        }, 2500);
      } else {
        throw new Error(data.message || 'Failed to assign teacher');
      }
    } catch (err) {
      console.error('Assign teacher error:', err);
      addNotification(`❌ Failed to assign teacher: ${err.message}`, 'error');
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit class
  const handleEditClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const classData = {
        name: classForm.name,
        code: classForm.code.toUpperCase(),
        semester: parseInt(classForm.semester),
        department: classForm.department,
        section: classForm.section.toUpperCase(),
        teacher: classForm.teacher,
        room: classForm.room,
        capacity: parseInt(classForm.capacity) || 20,
        academicYear: classForm.academicYear,
        schedule: {
          startTime: classForm.startTime || '08:00',
          endTime: classForm.endTime || '14:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes/${editingClass._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess('Class updated successfully!');
        setTimeout(() => {
          setShowEditClassModal(false);
          setSubmitSuccess(null);
          setEditingClass(null);
          setClassForm(emptyClassForm);
          fetchAllClasses();
          handleRefresh();
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to update class');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = { ...userForm };
      if (!updateData.password) delete updateData.password; // Don't send empty password
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess('User updated successfully!');
        setTimeout(() => {
          setShowEditUserModal(false);
          setSubmitSuccess(null);
          setEditingUser(null);
          setUserForm({ name: '', email: '', role: 'student' });
          fetchAllUsers();
          handleRefresh();
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete user or class
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = deleteTarget.type === 'user' 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users/${deleteTarget.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/classes/${deleteTarget.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(`${deleteTarget.type === 'user' ? 'User' : 'Class'} deleted successfully!`);
        setTimeout(() => {
          setShowDeleteConfirmModal(false);
          setSubmitSuccess(null);
          setDeleteTarget(null);
          if (deleteTarget.type === 'user') fetchAllUsers();
          else fetchAllClasses();
          handleRefresh();
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Error: ' + err.message);
      setShowDeleteConfirmModal(false);
      setDeleteTarget(null);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open edit class modal
  const openEditClassModal = (cls) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name || '',
      code: cls.code || '',
      semester: cls.semester || cls.grade || '',
      department: cls.department || 'Computer Science',
      section: cls.section || '',
      teacher: cls.teacher?._id || cls.teacher || '',
      room: cls.room || '',
      capacity: cls.capacity || 20,
      academicYear: cls.academicYear || '2025-2026',
      startTime: cls.schedule?.startTime || '08:00',
      endTime: cls.schedule?.endTime || '14:00'
    });
    setShowEditClassModal(true);
  };

  // Open edit user modal
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student'
    });
    setShowEditUserModal(true);
  };

  // Open assign teacher modal
  const openAssignTeacherModal = () => {
    fetchAllClasses();
    fetchAllTeachers();
    setSelectedClassForAssign('');
    setSelectedTeacher('');
    setShowAssignTeacherModal(true);
  };

  // Open view assignments modal
  const openViewAssignmentsModal = () => {
    fetchAllClasses();
    fetchAllTeachers();
    setShowViewAssignmentsModal(true);
  };

  // Open delete confirmation
  const confirmDelete = (id, type, name) => {
    setDeleteTarget({ id, type, name });
    setShowDeleteConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'class': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'orientation': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sidebar menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'bg-blue-500' },
    { id: 'assign-teacher', label: 'Assign Teacher', icon: '👨‍🏫📚', color: 'bg-orange-500' },
    { id: 'assignments', label: 'View Assignments', icon: '📋', color: 'bg-green-500' },
    { id: 'users', label: 'Manage Users', icon: '👥', color: 'bg-purple-500' },
    { id: 'classes', label: 'Manage Classes', icon: '📚', color: 'bg-yellow-500' },
  ];

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">
                {activeView === 'dashboard' && '📊'}
                {activeView === 'assign-teacher' && '👨‍🏫'}
                {activeView === 'assignments' && '📋'}
                {activeView === 'users' && '👥'}
                {activeView === 'classes' && '📚'}
              </span>
              <h1 className="text-3xl font-bold text-slate-800">
                {activeView === 'dashboard' && 'Dashboard'}
                {activeView === 'assign-teacher' && 'Assign Teacher'}
                {activeView === 'assignments' && 'View Assignments'}
                {activeView === 'users' && 'Manage Users'}
                {activeView === 'classes' && 'Manage Classes'}
              </h1>
            </div>
            <p className="text-slate-500 ml-11">
              {activeView === 'dashboard' && 'Welcome back! Here is your system overview.'}
              {activeView === 'assign-teacher' && 'Select a class and assign a teacher to it.'}
              {activeView === 'assignments' && 'View all class-teacher assignments and statistics.'}
              {activeView === 'users' && 'Add, edit, and manage all system users.'}
              {activeView === 'classes' && 'Create and manage classes in the system.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setActiveView('dashboard')}
                className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:bg-gray-50 transition-all"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleRefresh}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{activity.icon}</span>
                <div>
                  <p className="font-medium text-primary-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(activity.type)}`}>
                  {activity.type}
                </span>
                <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Upcoming Events</h2>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-primary-900">{event.title}</p>
                <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.type)}`}>
                  {event.type}
                </span>
                <p className="text-sm text-gray-500 mt-1">{event.attendees} attendees</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Department Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Students</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Teachers</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Classes</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Growth</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-primary-900">{dept.name}</td>
                  <td className="py-3 px-4 text-gray-600">{dept.students}</td>
                  <td className="py-3 px-4 text-gray-600">{dept.teachers}</td>
                  <td className="py-3 px-4 text-gray-600">{dept.classes}</td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 font-medium">{dept.growth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">🎯 Assignment Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Assign Teacher to Class */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">👨‍🏫📚</span>
              <div>
                <h3 className="font-semibold text-orange-800">Assign Teacher</h3>
                <p className="text-xs text-orange-600">Link teacher to class</p>
              </div>
            </div>
            <button 
              onClick={openAssignTeacherModal}
              className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Open Assign Teacher
            </button>
          </div>

          {/* View Assignments */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📋</span>
              <div>
                <h3 className="font-semibold text-green-800">View Assignments</h3>
                <p className="text-xs text-green-600">See all class assignments</p>
              </div>
            </div>
            <button 
              onClick={openViewAssignmentsModal}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              View All Assignments
            </button>
          </div>

          {/* Quick Stats */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="font-semibold text-blue-800">Assignment Stats</h3>
                <p className="text-xs text-blue-600">Current assignments</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-bold text-blue-600">{allClasses.filter(c => c.teacher).length}</p>
                <p className="text-xs text-gray-600">Classes with Teachers</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-bold text-green-600">{allClasses.reduce((sum, c) => sum + (c.students?.length || 0), 0)}</p>
                <p className="text-xs text-gray-600">Students Assigned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Admin Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="p-4 bg-blue-50 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl mb-2 block">➕👤</span>
            <span className="text-sm font-medium text-blue-700">Add User</span>
          </button>
          <button 
            onClick={() => { setShowViewUsersModal(true); fetchAllUsers(); }}
            className="p-4 bg-green-50 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl mb-2 block">👥</span>
            <span className="text-sm font-medium text-green-700">View Users</span>
          </button>
          <button 
            onClick={() => { fetchAllTeachers(); setShowAddClassModal(true); }}
            className="p-4 bg-purple-50 rounded-xl shadow-sm border border-purple-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl mb-2 block">➕📚</span>
            <span className="text-sm font-medium text-purple-700">Add Class</span>
          </button>
          <button 
            onClick={() => { setShowViewClassesModal(true); fetchAllClasses(); }}
            className="p-4 bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl mb-2 block">📚</span>
            <span className="text-sm font-medium text-yellow-700">View Classes</span>
          </button>
          <button 
            onClick={openAssignTeacherModal}
            className="p-4 bg-orange-50 rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl mb-2 block">👨‍🏫📚</span>
            <span className="text-sm font-medium text-orange-700">Assign Teacher</span>
          </button>
          <button 
            onClick={() => alert('Notice feature coming soon!')}
            className="p-4 bg-red-50 rounded-xl shadow-sm border border-red-200 hover:shadow-md transition-shadow text-center opacity-50 cursor-not-allowed"
            disabled
          >
            <span className="text-2xl mb-2 block">📧</span>
            <span className="text-sm font-medium text-red-700">Send Notice</span>
          </button>
          <button 
            onClick={() => { setShowViewUsersModal(true); fetchAllUsers(); }}
            className="p-4 bg-indigo-50 rounded-xl shadow-sm border border-indigo-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl mb-2 block">✏️👤</span>
            <span className="text-sm font-medium text-indigo-700">Manage Users</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
            <span className="text-2xl mb-2 block">📊</span>
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
                  <p className="text-xs text-slate-500">Create a new account</p>
                </div>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <p className="text-green-600 font-semibold text-lg">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input 
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter full name" 
                    value={userForm.name} 
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input 
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    type="email"
                    placeholder="Enter email address" 
                    value={userForm.email} 
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <input 
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    type="password"
                    placeholder="Create a password (min 6 characters)" 
                    value={userForm.password} 
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
                    required 
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">User Role</label>
                  <select 
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    value={userForm.role} 
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})} 
                    required
                  >
                    <option value="student">🎓 Student</option>
                    <option value="teacher">👨‍🏫 Teacher</option>
                    <option value="admin">🔐 Admin</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={submitLoading || !userForm.name || !userForm.email || !userForm.password}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/30 transition-all"
                  >
                    {submitLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 7.962 7.962 7.962 7.962 0 01-7.962-7.962H0z"/>
                        </svg>
                        Adding User...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>➕</span> Add User
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Add New Class</h2>
              <button onClick={() => setShowAddClassModal(false)} className="text-gray-400 hover:text-gray-600">
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
              <form onSubmit={handleAddClass} className="space-y-3">
                <input
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Class Name"
                  value={classForm.name}
                  onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                  required
                />
                <input
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Class Code (e.g., CLS10A)"
                  value={classForm.code}
                  onChange={(e) => setClassForm({...classForm, code: e.target.value.toUpperCase()})}
                  required
                />
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={classForm.department}
                  onChange={(e) => setClassForm({...classForm, department: e.target.value})}
                  required
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={classForm.semester}
                    onChange={(e) => setClassForm({...classForm, semester: e.target.value})}
                    required
                  >
                    <option value="">Semester *</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={classForm.section}
                    onChange={(e) => setClassForm({...classForm, section: e.target.value})}
                    required
                  >
                    <option value="">Section *</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={classForm.teacher}
                  onChange={(e) => setClassForm({...classForm, teacher: e.target.value})}
                  required
                >
                  <option value="">-- Select Teacher * --</option>
                  {allTeachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
                {allTeachers.length === 0 && (
                  <p className="text-xs text-red-500">No teachers available. Add a teacher first.</p>
                )}
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Room (e.g., 101, A-12)" 
                  value={classForm.room} 
                  onChange={(e) => setClassForm({...classForm, room: e.target.value})} 
                  required 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="number"
                    min="1"
                    placeholder="Capacity" 
                    value={classForm.capacity} 
                    onChange={(e) => setClassForm({...classForm, capacity: e.target.value})} 
                    required 
                  />
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Academic Year (e.g., 2025-2026)" 
                    value={classForm.academicYear} 
                    onChange={(e) => setClassForm({...classForm, academicYear: e.target.value})} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="time"
                    placeholder="Start Time" 
                    value={classForm.startTime || '08:00'} 
                    onChange={(e) => setClassForm({...classForm, startTime: e.target.value})} 
                    required 
                  />
                  <input 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type="time"
                    placeholder="End Time" 
                    value={classForm.endTime || '14:00'} 
                    onChange={(e) => setClassForm({...classForm, endTime: e.target.value})} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading || allTeachers.length === 0}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Adding...' : 'Add Class'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Users Modal */}
      {showViewUsersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">All Users</h2>
                  <p className="text-sm text-slate-500">Total: {allUsers.length} users • {allUsers.filter(u => u.role === 'teacher').length} teachers • {allUsers.filter(u => u.role === 'student').length} students • {allUsers.filter(u => u.role === 'admin').length} admins</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchAllUsers}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm"
                >
                  🔄 Refresh
                </button>
                <button onClick={() => setShowViewUsersModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {allUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📭</span>
                </div>
                <p className="text-gray-500 text-lg">No users found</p>
                <p className="text-gray-400 text-sm mt-1">Click "Add User" to create your first user</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Joined</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{user.name}</td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'teacher' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'admin' && '🔐 '}
                            {user.role === 'teacher' && '👨‍🏫 '}
                            {user.role === 'student' && '🎓 '}
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openEditUserModal(user)}
                              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => confirmDelete(user._id, 'user', user.name)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Classes Modal */}
      {showViewClassesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">All Classes</h2>
              <button onClick={() => setShowViewClassesModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Section</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Teacher</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allClasses.map((cls, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{cls.name}</td>
                    <td className="py-3 px-4">{cls.code}</td>
                    <td className="py-3 px-4">{cls.semester || cls.grade}</td>
                    <td className="py-3 px-4">{cls.section}</td>
                    <td className="py-3 px-4">{cls.teacher?.name || 'Not Assigned'}</td>
                    <td className="py-3 px-4">{cls.students?.length || cls.studentCount || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openEditClassModal(cls)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => confirmDelete(cls._id, 'class', cls.name)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Assign Teacher to Class</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => { fetchAllClasses(); fetchAllTeachers(); }}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  title="Refresh Data"
                >
                  🔄 Refresh
                </button>
                <button onClick={() => setShowAssignTeacherModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAssignTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class <span className="text-gray-400">({allClasses.length} available)</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={selectedClassForAssign}
                    onChange={(e) => setSelectedClassForAssign(e.target.value)}
                    required
                  >
                    <option value="">-- Select a Class --</option>
                    {allClasses.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.code}) {(cls.semester || cls.grade) ? `- Semester ${cls.semester || cls.grade}` : ''} {cls.section ? `- Section ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                  {allClasses.length === 0 && (
                    <p className="text-xs text-orange-500 mt-1">No classes found. Add classes first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Teacher <span className="text-gray-400">({allTeachers.length} available)</span>
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                  >
                    <option value="">-- Select a Teacher --</option>
                    {allTeachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                  {allTeachers.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No teachers found. Add teachers first.</p>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading || allTeachers.length === 0 || allClasses.length === 0}
                  className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Assigning...' : 'Assign Teacher'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Assignments Modal */}
      {showViewAssignmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">📋 Class-Teacher Assignments</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => { fetchAllClasses(); fetchAllTeachers(); }}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  title="Refresh Data"
                >
                  🔄 Refresh
                </button>
                <button onClick={() => setShowViewAssignmentsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{allClasses.length}</p>
                <p className="text-xs text-gray-600">Total Classes</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600">{allClasses.filter(c => c.teacher).length}</p>
                <p className="text-xs text-gray-600">With Teacher</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-orange-600">{allClasses.filter(c => !c.teacher).length}</p>
                <p className="text-xs text-gray-600">Unassigned</p>
              </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 mb-2">Current Assignments</h3>
              {allClasses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No classes found.</p>
              ) : (
                allClasses.map(cls => {
                  const teacher = allTeachers.find(t => t._id === cls.teacher);
                  return (
                    <div key={cls._id} className={`p-3 rounded-lg border ${cls.teacher ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{cls.name}</p>
                          <p className="text-xs text-gray-500">Code: {cls.code} | Semester: {cls.semester || cls.grade}{cls.section}</p>
                        </div>
                        <div className="text-right">
                          {cls.teacher ? (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✅ Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              ⚠️ Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm">
                          <span className="font-medium">Teacher: </span>
                          {teacher ? (
                            <span className="text-green-700">{teacher.name} ({teacher.email})</span>
                          ) : (
                            <span className="text-orange-600">Not assigned</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Students: {cls.students?.length || 0} enrolled
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Teachers List */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Available Teachers ({allTeachers.length})</h3>
              {allTeachers.length === 0 ? (
                <p className="text-gray-500 text-sm">No teachers found. Add teachers first.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {allTeachers.map(teacher => {
                    const assignedClasses = allClasses.filter(c => c.teacher === teacher._id);
                    return (
                      <div key={teacher._id} className="p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-800">{teacher.name}</p>
                        <p className="text-xs text-gray-500">{assignedClasses.length} classes assigned</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowViewAssignmentsModal(false)}
              className="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Edit Class</h2>
              <button onClick={() => setShowEditClassModal(false)} className="text-gray-400 hover:text-gray-600">
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
              <form onSubmit={handleEditClass} className="space-y-4">
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Class Name" 
                  value={classForm.name}
                  onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                  required
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Class Code"
                  value={classForm.code}
                  onChange={(e) => setClassForm({...classForm, code: e.target.value})}
                  required
                />
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={classForm.department}
                  onChange={(e) => setClassForm({...classForm, department: e.target.value})}
                  required
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={classForm.semester}
                  onChange={(e) => setClassForm({...classForm, semester: e.target.value})}
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={classForm.section}
                  onChange={(e) => setClassForm({...classForm, section: e.target.value})}
                  required
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Room"
                  value={classForm.room}
                  onChange={(e) => setClassForm({...classForm, room: e.target.value})}
                  required
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Capacity"
                  type="number"
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({...classForm, capacity: e.target.value})}
                  required
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Academic Year (e.g., 2025-2026)"
                  value={classForm.academicYear}
                  onChange={(e) => setClassForm({...classForm, academicYear: e.target.value})}
                  required
                />
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Updating...' : 'Update Class'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Edit User</h2>
              <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-600">
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
              <form onSubmit={handleEditUser} className="space-y-4">
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Full Name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  required
                />
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  type="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  required
                />
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  <p><strong>Note:</strong> Password cannot be changed here. Use the password reset feature.</p>
                </div>
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {submitLoading ? 'Updating...' : 'Update User'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Confirm Delete</h2>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
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
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-red-500 text-5xl mb-4">⚠️</div>
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete this {deleteTarget?.type}?
                  </p>
                  <p className="text-lg font-semibold text-primary-900">{deleteTarget?.name}</p>
                  <p className="text-sm text-red-500 mt-2">This action cannot be undone!</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowDeleteConfirmModal(false)}
                    className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={submitLoading}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {submitLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
