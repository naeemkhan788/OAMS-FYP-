import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available.
      </div>
    );
  }

  const { summary, attendanceStats, attendanceTrend, classAttendance, academicStats, teacherStats } = analyticsData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Real-time system analytics and metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-primary-900 mt-2">{summary.totalStudents}</p>
              <p className="text-sm text-gray-500 mt-1">Enrolled</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-primary-900 mt-2">{summary.totalTeachers}</p>
              <p className="text-sm text-gray-500 mt-1">Active</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-xl">👨‍🏫</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-primary-900 mt-2">{summary.totalClasses}</p>
              <p className="text-sm text-gray-500 mt-1">Created</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{summary.attendancePercentage}%</p>
              <p className="text-sm text-gray-500 mt-1">Today</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Today's Student Attendance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.leave}</p>
              <p className="text-sm text-gray-600">Leave</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Today's Teacher Attendance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{teacherStats.present}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{teacherStats.absent}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{teacherStats.late}</p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{teacherStats.leave}</p>
              <p className="text-sm text-gray-600">Leave</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Class-wise Attendance</h2>
        <div className="space-y-3">
          {classAttendance.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No class attendance data available.</p>
          ) : (
            classAttendance.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{cls.className}</p>
                  <p className="text-xs text-gray-500">{cls.present} / {cls.total} students present</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${cls.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{cls.percentage}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Academic Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Academic Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{academicStats.averagePercentage}%</p>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{academicStats.totalAssessments}</p>
            <p className="text-sm text-gray-600">Total Assessments</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {Object.keys(academicStats.gradeDistribution).length}
            </p>
            <p className="text-sm text-gray-600">Grade Types</p>
          </div>
        </div>
        {Object.keys(academicStats.gradeDistribution).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Grade Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(academicStats.gradeDistribution).map(([grade, count]) => (
                <span key={grade} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {grade}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">30-Day Attendance Trend</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {attendanceTrend.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No attendance trend data available.</p>
          ) : (
            attendanceTrend.slice(-10).map((trend, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 w-24">{trend.date}</span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${trend.total > 0 ? (trend.present / trend.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">
                    {trend.present}/{trend.total}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
