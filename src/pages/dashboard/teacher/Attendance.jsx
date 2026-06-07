import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch teacher's classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/classes/teacher/my-classes`, { headers: authHeaders() });
        const data = await res.json();
        console.log('Classes API response:', data);
        if (data.success && data.data) {
          const classList = data.data.classes || data.data || [];
          setClasses(classList);
          if (classList.length > 0) {
            setSelectedClass(classList[0]._id);
          }
        } else {
          console.error('Failed to fetch classes:', data.message);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE}/classes/${selectedClass}/students`, { headers: authHeaders() });
        const data = await res.json();
        console.log('Students API response:', data);
        if (data.success && data.data) {
          const studentsList = data.data.students || data.data || [];
          setStudents(studentsList);
        } else {
          console.error('Failed to fetch students:', data.message);
          setStudents([]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  // Fetch attendance history
  useEffect(() => {
    if (!selectedClass) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/attendance/class?classId=${selectedClass}&date=${selectedDate}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success && data.data) {
          const studentsWithAttendance = data.data.students || [];
          const hasSavedRecords = data.data.stats && data.data.stats.total > 0;

          // Pre-fill attendance state from existing records
          const existing = {};
          studentsWithAttendance.forEach(item => {
            const studentId = item.student?._id || item.student?.id || (typeof item.student === 'string' ? item.student : null);
            if (studentId) {
              existing[studentId] = item.attendance?.status || 'present';
            }
          });
          setAttendance(existing);

          // Build history summary
          if (hasSavedRecords) {
            const present = data.data.stats.present;
            const absent = data.data.stats.absent;
            const classInfo = classes.find(c => c._id === selectedClass);
            setAttendanceHistory([{
              date: selectedDate,
              class: classInfo?.code || classInfo?.name || 'Class',
              present,
              absent,
              percentage: data.data.stats.percentage
            }]);
          } else {
            setAttendanceHistory([]);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }
    };
    fetchHistory();
  }, [selectedClass, selectedDate, refreshTrigger]);

  const handleAttendanceChange = (studentId, status) => {
    if (!studentId) return;
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(student => {
      const studentId = student._id || student.id;
      if (studentId) {
        allPresent[studentId] = 'present';
      }
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    students.forEach(student => {
      const studentId = student._id || student.id;
      if (studentId) {
        allAbsent[studentId] = 'absent';
      }
    });
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    const classInfo = classes.find(c => c._id === selectedClass);
    const subject = classInfo?.subjects?.[0]?.name || classInfo?.name || 'General';

    const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status
    }));

    if (attendanceData.length === 0) {
      alert('Please mark attendance for at least one student');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          subject,
          attendanceData
        })
      });
      const data = await res.json();
      if (data.success) {
        const presentCount = attendanceData.filter(r => r.status === 'present').length;
        const absentCount = attendanceData.filter(r => r.status === 'absent').length;
        alert(`✅ Attendance saved successfully!\nPresent: ${presentCount}, Absent: ${absentCount}`);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(`Error: ${data.message || 'Failed to save attendance'}`);
      }
    } catch (err) {
      alert(`Error saving attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const presentCount = Object.values(attendance).filter(status => status === 'present').length;
    const absentCount = Object.values(attendance).filter(status => status === 'absent').length;
    const leaveCount = Object.values(attendance).filter(status => status === 'leave').length;
    const totalCount = presentCount + absentCount;
    const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;
    return { presentCount, absentCount, leaveCount, percentage };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Attendance Management</h1>
        <p className="text-gray-600">Mark and manage student attendance (Live Data)</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">-- Select a Class --</option>
              {classes.length === 0 && <option value="" disabled>No classes available</option>}
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.grade && cls.section ? `- ${cls.grade}${cls.section}` : ''} {cls.code ? `(${cls.code})` : ''}
                </option>
              ))}
            </select>
            {classes.length === 0 && !loading && (
              <p className="text-xs text-red-500 mt-1">No classes found. Please contact admin to assign you to a class.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={markAllPresent}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Present</p>
            <p className="text-2xl font-bold text-green-900">{stats.presentCount}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800">Absent</p>
            <p className="text-2xl font-bold text-red-900">{stats.absentCount}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800">Leave</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.leaveCount}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800">Attendance Rate</p>
            <p className="text-2xl font-bold text-blue-900">{stats.percentage}%</p>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-primary-900">Mark Attendance ({students.length} students)</h2>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No students found in this class.</p>
            <p className="text-sm mt-1">Add students to this class first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const studentId = student._id || student.id;
                  return (
                    <tr key={studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <img 
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-sm bg-slate-100" 
                          src={student.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=eae6ff&color=4f46e5&bold=true&size=128`} 
                          alt={student.name} 
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=eae6ff&color=4f46e5&bold=true&size=128`;
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId || studentId?.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAttendanceChange(studentId, 'present')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer ${
                              attendance[studentId] === 'present'
                                ? 'bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(studentId, 'absent')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer ${
                              attendance[studentId] === 'absent'
                                ? 'bg-rose-600 text-white border border-rose-700 hover:bg-rose-700'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(studentId, 'leave')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer ${
                              attendance[studentId] === 'leave'
                                ? 'bg-amber-500 text-white border border-amber-600 hover:bg-amber-600'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance History */}
      {attendanceHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Attendance for {selectedDate}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{record.present}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{record.absent}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                record.percentage >= 90 ? 'bg-green-500' :
                                record.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${record.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{record.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
