import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Classes() {
  const [selectedView, setSelectedView] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Create class form state
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    semester: '1',
    section: 'A',
    room: '',
    capacity: '30',
    academicYear: new Date().getFullYear().toString(),
    schedule: {
      days: ['Monday'],
      startTime: '09:00',
      endTime: '10:00'
    }
  });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/classes`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setClasses(data.data.classes || data.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      console.log('Teacher creating class with semester:', newClass.semester, typeof newClass.semester);
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...newClass,
          teacher: user._id,
          capacity: parseInt(newClass.capacity)
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Class created successfully!');
        setNewClass({
          name: '',
          code: '',
          semester: '1',
          section: 'A',
          room: '',
          capacity: '30',
          academicYear: new Date().getFullYear().toString(),
          schedule: {
            days: ['Monday'],
            startTime: '09:00',
            endTime: '10:00'
          }
        });
        fetchClasses(); // Refresh classes
      } else {
        setError(data.message || 'Failed to create class');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'active' || status) return 'bg-green-100 text-green-800';
    if (status === 'completed') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getDayFromSchedule = (cls) => {
    return cls.schedule?.days || [];
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weeklySchedule = weekDays.map(day => ({
    day,
    classes: classes.filter(cls => getDayFromSchedule(cls).includes(day))
  }));

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0);
  const totalSubjects = classes.reduce((acc, cls) => acc + (cls.subjects?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">My Classes</h1>
        <p className="text-gray-600">Manage your classes and schedules (Live Data)</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{classes.length}</p>
              <p className="text-sm text-gray-500 mt-1">Active classes</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{totalStudents}</p>
              <p className="text-sm text-gray-500 mt-1">Across all classes</p>
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{totalSubjects}</p>
              <p className="text-sm text-gray-500 mt-1">Teaching subjects</p>
            </div>
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📖</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Academic Year</p>
              <p className="text-xl font-bold text-primary-900 mt-2">{classes[0]?.academicYear || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">Current year</p>
            </div>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📅</span>
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

      {/* View Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedView('schedule')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'schedule'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setSelectedView('classes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'classes'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Class List
          </button>
          <button
            onClick={() => setSelectedView('create')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'create'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            + Create Class
          </button>
        </div>
      </div>

      {/* Weekly Schedule View */}
      {selectedView === 'schedule' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Weekly Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weeklySchedule.map((day) => (
              <div key={day.day} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-primary-900 mb-3">{day.day}</h3>
                <div className="space-y-2">
                  {day.classes.length > 0 ? (
                    day.classes.map((cls) => (
                      <div key={cls._id} className="bg-primary-50 rounded p-2">
                        <p className="text-xs font-medium text-primary-900">{cls.code}</p>
                        <p className="text-xs text-gray-600">{cls.schedule?.startTime} - {cls.schedule?.endTime}</p>
                        <p className="text-xs text-gray-500">{cls.room}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No classes</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Class View */}
      {selectedView === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Create New Class</h2>
          <form onSubmit={handleCreateClass} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={newClass.semester}
                  onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => (
                    <option key={s} value={s}>{s} Semester</option>
                  ))}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newClass.schedule?.startTime || '09:00'}
                  onChange={(e) => setNewClass({ ...newClass, schedule: { ...newClass.schedule, startTime: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={newClass.schedule?.endTime || '10:00'}
                  onChange={(e) => setNewClass({ ...newClass, schedule: { ...newClass.schedule, endTime: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Class
            </button>
          </form>
        </div>
      )}

      {/* Class List View */}
      {selectedView === 'classes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Class List</h2>
          {classes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No classes assigned yet. Click "Create Class" to add one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((cls) => (
                    <tr key={cls._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">{cls.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.semester || cls.grade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.section}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.students?.length || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.room}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cls.schedule?.startTime} - {cls.schedule?.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cls.isActive)}`}>
                          {cls.isActive ? 'active' : 'inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
