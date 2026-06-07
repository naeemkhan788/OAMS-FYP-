import { useState, useEffect } from 'react';
import { getUsers } from '../../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New student form state
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Science',
    year: '1st Year',
    semester: '1st'
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setStudents((response.data.users || []).filter(u => u.role === 'student'));
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newStudent.password !== newStudent.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newStudent.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: `${newStudent.firstName} ${newStudent.lastName}`,
          email: newStudent.email,
          password: newStudent.password,
          role: 'student',
          profile: {
            department: newStudent.department,
            year: newStudent.year,
            semester: newStudent.semester,
            gpa: 0,
            attendance: '0%'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Student added successfully!');
        setNewStudent({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: 'Computer Science',
          year: '1st Year',
          semester: '1st'
        });
        setShowAddForm(false);
        loadStudents(); // Refresh list
      } else {
        const errorMsg = data.message || data.errors?.map(e => e.msg).join(', ') || 'Failed to add student';
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const mappedStudents = students.map((s) => ({
    id: s._id,
    name: s.name,
    email: s.email,
    studentId: s.studentId || '',
    department: s.profile?.department || 'N/A',
    year: s.profile?.year || 'N/A',
    semester: s.profile?.semester || 'N/A',
    gpa: s.profile?.gpa || 0,
    attendance: s.profile?.attendance || '0%',
    status: s.isActive ? 'active' : 'inactive',
    joinDate: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : ''
  }));

  const departments = ['all', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English'];
  const years = ['all', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year'];

  const filteredStudents = mappedStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || student.department === selectedDepartment;
    const matchesYear = selectedYear === 'all' || student.year === selectedYear;
    return matchesSearch && matchesDepartment && matchesYear;
  });

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'graduating') return 'bg-blue-100 text-blue-800';
    if (status === 'probation') return 'bg-yellow-100 text-yellow-800';
    if (status === 'suspended') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getGpaColor = (gpa) => {
    if (gpa >= 3.7) return 'text-green-600';
    if (gpa >= 3.3) return 'text-blue-600';
    if (gpa >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceColor = (attendance) => {
    const percentage = parseInt(attendance, 10);
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    total: mappedStudents.length,
    active: mappedStudents.filter((s) => s.status === 'active').length,
    graduating: mappedStudents.filter((s) => s.status === 'graduating').length,
    probation: mappedStudents.filter((s) => s.status === 'probation').length,
    avgGpa: mappedStudents.length ? (mappedStudents.reduce((acc, s) => acc + Number(s.gpa || 0), 0) / mappedStudents.length).toFixed(2) : '0.00',
    avgAttendance: mappedStudents.length ? Math.round(mappedStudents.reduce((acc, s) => acc + Number((s.attendance || '0').replace('%', '')), 0) / mappedStudents.length) : 0
  };

  if (loading) return <div className="p-6">Loading students...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Student Management</h1>
        <p className="text-gray-600">Manage student records and academic information</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-primary-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Active</p>
              <p className="text-xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Graduating</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{stats.graduating}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-lg">🎓</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Probation</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{stats.probation}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Avg GPA</p>
              <p className="text-xl font-bold text-purple-600 mt-1">{stats.avgGpa}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Avg Attendance</p>
              <p className="text-xl font-bold text-orange-600 mt-1">{stats.avgAttendance}%</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add Student Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add New Student'}
        </button>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Add New Student</h2>
          <form onSubmit={handleAddStudent} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newStudent.confirmPassword}
                  onChange={(e) => setNewStudent({ ...newStudent, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newStudent.department}
                  onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={newStudent.year}
                  onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={newStudent.semester}
                  onChange={(e) => setNewStudent({ ...newStudent, semester: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="4th">4th</option>
                  <option value="5th">5th</option>
                  <option value="6th">6th</option>
                  <option value="7th">7th</option>
                  <option value="8th">8th</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Student
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.year}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getGpaColor(student.gpa)}`}>{student.gpa}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getAttendanceColor(student.attendance)}`}>{student.attendance}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
