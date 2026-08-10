import { useState, useEffect } from 'react';
import { getUsers } from '../../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherNotes, setTeacherNotes] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState([]);

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

  // Attendance form state
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: '',
    checkInTime: '',
    checkOutTime: ''
  });

  // Notes form state
  const [noteForm, setNoteForm] = useState({
    note: ''
  });

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true);
        const response = await getUsers();
        const allUsers = response.data.users || [];
        setTeachers(allUsers.filter((u) => u.role === 'teacher' && u.status === 'approved'));
      } catch (err) {
        setError(err.message || 'Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };

    const loadPendingTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('[Teachers] Loading pending teachers from:', `${API_BASE}/users/pending-teachers`);
        const response = await fetch(`${API_BASE}/users/pending-teachers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('[Teachers] Pending teachers response:', data);
        if (data.success) {
          setPendingTeachers(data.data.teachers || []);
          console.log('[Teachers] Pending teachers loaded:', data.data.teachers?.length || 0);
        } else {
          console.error('[Teachers] Failed to load pending teachers:', data.message);
        }
      } catch (err) {
        console.error('[Teachers] Failed to load pending teachers:', err);
      }
    };

    loadTeachers();
    loadPendingTeachers();
  }, []);

  const handleApproveReject = async (teacherId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/users/${teacherId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Teacher ${status} successfully`);
        // Refresh both lists
        const teachersResponse = await getUsers();
        const allUsers = teachersResponse.data.users || [];
        setTeachers(allUsers.filter((u) => u.role === 'teacher'));
        const pendingResponse = await fetch(`${API_BASE}/users/pending-teachers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const pendingData = await pendingResponse.json();
        if (pendingData.success) {
          setPendingTeachers(pendingData.data.teachers || []);
        }
      } else {
        setError(data.message || 'Failed to update teacher status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update teacher status');
    }
  };

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

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTeacher) {
      setError('No teacher selected');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/teacher-attendance`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          teacherId: selectedTeacher._id,
          date: attendanceForm.date,
          status: attendanceForm.status,
          notes: attendanceForm.notes,
          checkInTime: attendanceForm.checkInTime || null,
          checkOutTime: attendanceForm.checkOutTime || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Teacher attendance marked successfully!');
        setAttendanceForm({
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          notes: '',
          checkInTime: '',
          checkOutTime: ''
        });
        setShowAttendanceForm(false);
        setSelectedTeacher(null);
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTeacher) {
      setError('No teacher selected');
      return;
    }

    if (!noteForm.note.trim()) {
      setError('Note cannot be empty');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/teacher-notes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          teacherId: selectedTeacher._id,
          note: noteForm.note
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Note added successfully!');
        setNoteForm({ note: '' });
        setShowNotesForm(false);
        loadTeacherNotes(selectedTeacher._id);
      } else {
        setError(data.message || 'Failed to add note');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTeacherNotes = async (teacherId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/teacher-notes/${teacherId}`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTeacherNotes(data.data);
      }
    } catch (err) {
      console.error('Failed to load teacher notes:', err);
    }
  };

  const loadTeacherAttendance = async (teacherId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/teacher-attendance?teacherId=${teacherId}`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTeacherAttendance(data.data);
      }
    } catch (err) {
      console.error('Failed to load teacher attendance:', err);
    }
  };

  const openAttendanceForm = (teacher) => {
    setSelectedTeacher(teacher);
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      notes: '',
      checkInTime: '',
      checkOutTime: ''
    });
    setShowAttendanceForm(true);
    setShowNotesForm(false);
  };

  const openNotesForm = (teacher) => {
    setSelectedTeacher(teacher);
    setNoteForm({ note: '' });
    setShowNotesForm(true);
    setShowAttendanceForm(false);
    loadTeacherNotes(teacher._id);
  };

  const closeForms = () => {
    setShowAttendanceForm(false);
    setShowNotesForm(false);
    setSelectedTeacher(null);
    setTeacherNotes([]);
    setTeacherAttendance([]);
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
    return matchesSearch;
  });

  const stats = {
    total: mappedTeachers.length,
    active: mappedTeachers.filter((t) => t.status === 'active').length,
    onLeave: mappedTeachers.filter((t) => t.status === 'on-leave').length,
    avgRating: mappedTeachers.length ? (mappedTeachers.reduce((acc, t) => acc + t.rating, 0) / mappedTeachers.length).toFixed(1) : 0,
    pending: pendingTeachers.length
  };

  if (loading) return <div className="p-6">Loading teachers...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Teacher Management</h1>
        <p className="text-gray-600">Manage faculty members and their assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{stats.pending}</p>
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

      {/* Pending Teachers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
        <h2 className="text-lg font-semibold text-orange-800 mb-4">Pending Teacher Approvals ({pendingTeachers.length})</h2>
        {pendingTeachers.length > 0 ? (
          <div className="space-y-4">
            {pendingTeachers.map((teacher) => (
              <div key={teacher._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="mb-3 sm:mb-0">
                  <p className="font-medium text-gray-900">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {teacher.profile?.department || 'No department'} • {teacher.profile?.specialization || 'No specialization'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveReject(teacher._id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproveReject(teacher._id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No pending teacher approvals at this time.</p>
            <p className="text-xs mt-1">Teachers who register will appear here for approval.</p>
          </div>
        )}
      </div>

      {/* Add Teacher Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add New Teacher'}
        </button>
      </div>

      {/* Attendance Form */}
      {showAttendanceForm && selectedTeacher && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Mark Attendance - {selectedTeacher.name}</h2>
            <button
              onClick={closeForms}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleMarkAttendance} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                <input
                  type="time"
                  value={attendanceForm.checkInTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
                <input
                  type="time"
                  value={attendanceForm.checkOutTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows="3"
                placeholder="Optional notes about attendance..."
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Mark Attendance
              </button>
              <button
                type="button"
                onClick={closeForms}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Form */}
      {showNotesForm && selectedTeacher && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Add Note - {selectedTeacher.name}</h2>
            <button
              onClick={closeForms}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleAddNote} className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={noteForm.note}
                onChange={(e) => setNoteForm({ note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows="4"
                placeholder="Enter your note for this teacher..."
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Note
              </button>
              <button
                type="button"
                onClick={closeForms}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Existing Notes */}
          {teacherNotes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Previous Notes</h3>
              <div className="space-y-3">
                {teacherNotes.map((note) => (
                  <div key={note._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800">{note.note}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Added by {note.addedBy?.name || 'Admin'} on {new Date(note.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openAttendanceForm(teachers.find(t => t._id === teacher.id))}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => openNotesForm(teachers.find(t => t._id === teacher.id))}
                        className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                      >
                        Notes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
