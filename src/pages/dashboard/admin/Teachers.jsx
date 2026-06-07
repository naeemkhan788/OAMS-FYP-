import { useState, useEffect } from 'react';
import { getUsers } from '../../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New teacher form state
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Science',
    specialization: '',
    experience: ''
  });

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true);
        const response = await getUsers();
        const allUsers = response.data.users || [];
        setTeachers(allUsers.filter((u) => u.role === 'teacher'));
      } catch (err) {
        setError(err.message || 'Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newTeacher.password !== newTeacher.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newTeacher.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: `${newTeacher.firstName} ${newTeacher.lastName}`,
          email: newTeacher.email,
          password: newTeacher.password,
          role: 'teacher',
          profile: {
            department: newTeacher.department,
            specialization: newTeacher.specialization,
            experience: newTeacher.experience
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Teacher added successfully!');
        setNewTeacher({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: 'Computer Science',
          specialization: '',
          experience: ''
        });
        setShowAddForm(false);
        loadTeachers(); // Refresh list
      } else {
        const errorMsg = data.message || data.errors?.map(e => e.msg).join(', ') || 'Failed to add teacher';
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const mappedTeachers = teachers.map((t) => ({
    id: t._id,
    name: t.name,
    email: t.email,
    department: t.profile?.department || 'N/A',
    specialization: t.profile?.specialization || 'N/A',
    experience: t.profile?.experience || 'N/A',
    classes: t.classes?.length || 0,
    students: t.classes ? t.classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0) : 0,
    rating: t.profile?.rating || 0,
    status: t.isActive ? 'active' : 'inactive',
    joinDate: t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : ''
  }));

  const filteredTeachers = mappedTeachers.filter((teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || teacher.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const stats = {
    total: mappedTeachers.length,
    active: mappedTeachers.filter((t) => t.status === 'active').length,
    onLeave: mappedTeachers.filter((t) => t.status === 'on-leave').length,
    avgRating: mappedTeachers.length ? (mappedTeachers.reduce((acc, t) => acc + t.rating, 0) / mappedTeachers.length).toFixed(1) : 0
  };

  if (loading) return <div className="p-6">Loading teachers...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Teacher Management</h1>
        <p className="text-gray-600">Manage faculty members and their assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-primary-900 mt-2">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.onLeave}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{stats.avgRating}</p>
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

      {/* Add Teacher Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add New Teacher'}
        </button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Add New Teacher</h2>
          <form onSubmit={handleAddTeacher} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newTeacher.firstName}
                  onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newTeacher.lastName}
                  onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newTeacher.confirmPassword}
                  onChange={(e) => setNewTeacher({ ...newTeacher, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newTeacher.department}
                  onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={newTeacher.specialization}
                  onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  type="text"
                  value={newTeacher.experience}
                  onChange={(e) => setNewTeacher({ ...newTeacher, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 5 years"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Teacher
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.specialization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.experience}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.classes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.students}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.rating}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
