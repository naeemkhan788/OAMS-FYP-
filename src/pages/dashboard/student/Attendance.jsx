import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}`;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: authHeaders() });
        const data = await res.json();

        if (data.success && data.data) {
          const stats = data.data.stats;
          const attendanceStats = stats?.attendanceStats || {};
          
          // Build subject-wise attendance from available data
          const subjectData = [];
          
          if (attendanceStats.total > 0) {
            subjectData.push({
              subject: 'Overall',
              total: attendanceStats.total,
              present: attendanceStats.present || 0,
              absent: attendanceStats.absent || 0,
              leave: attendanceStats.leave || 0,
              percentage: parseFloat(attendanceStats.percentage) || 0
            });
          }
          
          // If we have monthly attendance data, add those too
          const monthly = data.data.monthlyAttendance || [];
          monthly.forEach(day => {
            const total = (day.present || 0) + (day.absent || 0) + (day.leave || 0);
            const pct = total > 0 ? ((day.present / total) * 100).toFixed(1) : 0;
            subjectData.push({
              subject: `Day: ${day._id}`,
              total,
              present: day.present || 0,
              absent: day.absent || 0,
              leave: day.leave || 0,
              percentage: parseFloat(pct)
            });
          });
          
          if (subjectData.length === 0) {
            subjectData.push({
              subject: 'No attendance records yet',
              total: 0, present: 0, absent: 0, leave: 0, percentage: 0
            });
          }
          
          setAttendanceData(subjectData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  const validData = attendanceData.filter(d => d.total > 0);
  const overallPercentage = validData.length > 0
    ? validData.reduce((acc, curr) => acc + curr.percentage, 0) / validData.length
    : 0;
  const totalClasses = attendanceData.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Attendance Report</h1>
        <p className="text-gray-600">Track your attendance across all subjects (Live Data)</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{overallPercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">Last 30 Days</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getAttendanceColor(overallPercentage)}`}>
              <span className="text-2xl font-bold">{overallPercentage.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">{totalClasses}</p>
              <p className="text-sm text-gray-500 mt-1">Attendance entries</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-xl font-bold text-primary-900 mt-2">{getAttendanceStatus(overallPercentage)}</p>
              <p className="text-sm text-gray-500 mt-1">Keep it up!</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getAttendanceColor(overallPercentage)}`}>
              {overallPercentage >= 90 ? '🌟' : overallPercentage >= 75 ? '👍' : '⚠️'}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Attendance Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((subject, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">{subject.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="text-green-600 font-medium">{subject.present}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="text-red-600 font-medium">{subject.absent}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="text-yellow-600 font-medium">{subject.leave}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 mr-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              subject.percentage >= 90 ? 'bg-green-500' :
                              subject.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${subject.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{subject.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(subject.percentage)}`}>
                      {getAttendanceStatus(subject.percentage)}
                    </span>
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
