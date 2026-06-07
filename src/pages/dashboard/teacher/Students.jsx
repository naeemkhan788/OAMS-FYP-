import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Students() {
  const [activeTab, setActiveTab] = useState('my-students');
  const [classes, setClasses] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add new student form
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Assign student form
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch my classes
      const classesRes = await fetch(`${API_BASE}/classes/teacher/my-classes`, { headers: authHeaders() });
      const classesData = await classesRes.json();
      if (classesData.success) {
        setClasses(classesData.data.classes || []);
        if (classesData.data.classes?.length > 0 && !selectedClass) {
          setSelectedClass(classesData.data.classes[0]._id);
        }
      }

      // Fetch my students
      const studentsRes = await fetch(`${API_BASE}/classes/teacher/students`, { headers: authHeaders() });
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setMyStudents(studentsData.data.students || []);
      }

      // Fetch unassigned students
      const unassignedRes = await fetch(`${API_BASE}/users/unassigned-students`, { headers: authHeaders() });
      const unassignedData = await unassignedRes.json();
      if (unassignedData.success) {
        setUnassignedStudents(unassignedData.data.students || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          role: 'student'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Student added successfully!');
        setNewStudent({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
        fetchData(); // Refresh data
      } else {
        setError(data.message || 'Failed to add student');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedClass || !selectedStudent) {
      setError('Please select both class and student');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/classes/assign-student`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          studentId: selectedStudent,
          classId: selectedClass
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Student assigned to class successfully!');
        setSelectedStudent('');
        fetchData(); // Refresh data
      } else {
        setError(data.message || 'Failed to assign student');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Manage Students</h1>
        <p className="text-gray-600">Add new students and assign them to your classes</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Students</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{myStudents.length}</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Classes</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{classes.length}</p>
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unassigned Students</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{unassignedStudents.length}</p>
            </div>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('my-students')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my-students'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            My Students
          </button>
          <button
            onClick={() => setActiveTab('add-student')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'add-student'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Add New Student
          </button>
          <button
            onClick={() => setActiveTab('assign-student')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'assign-student'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Assign to Class
          </button>
        </div>
      </div>

      {/* My Students Tab */}
      {activeTab === 'my-students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">My Students</h2>
          {myStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No students assigned to your classes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentId || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Student Tab */}
      {activeTab === 'add-student' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Add New Student</h2>
          <form onSubmit={handleAddStudent} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Student
            </button>
          </form>
        </div>
      )}

      {/* Assign Student Tab */}
      {activeTab === 'assign-student' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Assign Student to Class</h2>
          {unassignedStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No unassigned students available.</p>
          ) : classes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">You don't have any classes. Please create a class first.</p>
          ) : (
            <form onSubmit={handleAssignStudent} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Choose a student...</option>
                  {unassignedStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code}) - Grade {cls.grade}{cls.section}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Assign Student to Class
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
