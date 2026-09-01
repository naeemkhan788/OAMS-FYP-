import { useState, useEffect } from 'react';
import { getClasses, getUsers } from '../../../utils/api';

const DEPARTMENTS = [
  'Computer Science'
];

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [teachers, setTeachers] = useState([]);
  
  // New class form state
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    semester: '1',
    department: 'Computer Science',
    section: 'A',
    room: '',
    capacity: '30',
    academicYear: new Date().getFullYear().toString(),
    teacher: '',
    startDate: '',
    startTime: '08:00',
    endTime: '14:00'
  });

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        const response = await getClasses();
        setClasses(response.data.classes || []);
      } catch (err) {
        setError(err.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await getUsers();
        const allUsers = response.data.users || [];
        const teacherList = allUsers.filter(u => u.role === 'teacher');
        setTeachers(teacherList);
      } catch (err) {
        console.error('Failed to load teachers:', err);
      }
    };

    loadTeachers();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newClass.teacher) {
      setError('Please select a teacher');
      return;
    }

    try {
      console.log('Creating class with semester:', newClass.semester, typeof newClass.semester);
      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newClass.name,
          code: newClass.code.toUpperCase(),
          semester: newClass.semester,
          department: newClass.department,
          section: newClass.section,
          teacher: newClass.teacher,
          room: newClass.room,
          capacity: parseInt(newClass.capacity),
          academicYear: newClass.academicYear,
          schedule: {
            startTime: newClass.startTime,
            endTime: newClass.endTime,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Class created successfully!');
        setNewClass({
          name: '',
          code: '',
          semester: '1',
          department: 'Computer Science',
          section: 'A',
          room: '',
          capacity: '30',
          academicYear: new Date().getFullYear().toString(),
          teacher: '',
          startDate: '',
          startTime: '08:00',
          endTime: '14:00'
        });
        setShowAddForm(false);
        // Refresh classes
        const response = await getClasses();
        setClasses(response.data.classes || []);
      } else {
        const errorMsg = data.message || data.errors?.map(e => `${e.path}: ${e.msg}`).join(', ') || 'Failed to create class';
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const mappedClasses = classes.map((c) => ({
    id: c._id,
    code: c.code,
    name: c.name,
    department: c.department || 'N/A',
    teacher: c.teacher?.name || 'N/A',
    teacherEmail: c.teacher?.email || 'N/A',
    students: c.students?.length || 0,
    capacity: c.capacity || 0,
    schedule: c.schedule ? `${c.schedule.days?.join(', ')} - ${c.schedule.startTime} to ${c.schedule.endTime}` : 'N/A',
    room: c.room || 'N/A',
    credits: c.credits || 0,
    status: c.isActive ? 'active' : 'completed',
    semester: c.academicYear || 'N/A',
    startDate: c.startDate || '',
    endDate: c.endDate || ''
  }));

  const statuses = ['all', 'active', 'completed', 'upcoming', 'cancelled'];

  const filteredClasses = mappedClasses.filter((class_) => {
    const matchesSearch = class_.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      class_.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      class_.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || class_.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mappedClasses.length,
    active: mappedClasses.filter((c) => c.status === 'active').length,
    completed: mappedClasses.filter((c) => c.status === 'completed').length,
    upcoming: mappedClasses.filter((c) => c.status === 'upcoming').length,
    totalStudents: mappedClasses.reduce((acc, c) => acc + (c.students || 0), 0),
    totalCapacity: mappedClasses.reduce((acc, c) => acc + (c.capacity || 0), 0)
  };

  if (loading) return <div className="p-6">Loading classes...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Class Management</h1>
        <p className="text-gray-600">Manage academic classes and schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Classes</p>
              <p className="text-xl font-bold text-primary-900 mt-1">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Active</p>
              <p className="text-xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-600 mt-1">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Upcoming</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{stats.upcoming}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-purple-600 mt-1">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Enrollment Rate</p>
              <p className="text-xl font-bold text-orange-600 mt-1">
                {stats.totalCapacity ? Math.round((stats.totalStudents / stats.totalCapacity) * 100) : 0}%
              </p>
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

      {/* Add Class Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add New Class'}
        </button>
      </div>

      {/* Add Class Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Add New Class</h2>
          <form onSubmit={handleCreateClass} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Mathematics 101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
                <input
                  type="text"
                  value={newClass.code}
                  onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., MATH101"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={newClass.department}
                onChange={(e) => setNewClass({ ...newClass, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={newClass.semester}
                  onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={newClass.section}
                  onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {['A','B','C','D','E','F'].map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  type="text"
                  value={newClass.room}
                  onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Room 101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={newClass.academicYear}
                  onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 2026"
                  required
                />
              </div>
            </div>
            
            {/* Calendar Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Start Date</label>
              <input
                type="date"
                value={newClass.startDate}
                onChange={(e) => setNewClass({ ...newClass, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            {/* 12-Hour Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newClass.startTime}
                  onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: 12-hour (e.g., 08:00 AM)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={newClass.endTime}
                  onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: 12-hour (e.g., 02:00 PM)</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Class
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
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.teacher}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.students}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.schedule}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
