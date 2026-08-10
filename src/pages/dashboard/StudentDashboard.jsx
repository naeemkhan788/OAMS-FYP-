import { useState, useEffect } from 'react';
import { getMyAttendance, getMyMarks, getMyClass } from '../../utils/api';

const flattenMarks = (groupedMarks = []) => {
  const rows = [];
  groupedMarks.forEach((classGroup) => {
    Object.entries(classGroup.subjects || {}).forEach(([subjectName, assessments]) => {
      assessments.forEach((mark) => {
        rows.push({
          subject: subjectName,
          assessmentType: mark.assessmentType,
          title: mark.title,
          marksObtained: mark.marksObtained,
          maxMarks: mark.maxMarks,
          assessmentDate: mark.assessmentDate,
          grade: mark.grade
        });
      });
    });
  });
  return rows;
};

export default function StudentDashboard() {
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student Modal States
  const [showMyAttendanceModal, setShowMyAttendanceModal] = useState(false);
  const [showMyMarksModal, setShowMyMarksModal] = useState(false);
  const [showMyClassModal, setShowMyClassModal] = useState(false);
  const [showNoticesModal, setShowNoticesModal] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Student Data States
  const [myAttendance, setMyAttendance] = useState([]);
  const [myMarks, setMyMarks] = useState([]);
  const [aggregatedMarks, setAggregatedMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [myClass, setMyClass] = useState(null);
  const [notices, setNotices] = useState([]);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
  const [hasNewAttendance, setHasNewAttendance] = useState(false);
  const [hasNewMarks, setHasNewMarks] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
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
          const attendancePct = data.data.stats?.attendanceStats?.percentage || 0;
          const avgMarks = data.data.stats?.marksStats?.averagePercentage || 0;
          
          setStats([
            {
              title: 'Overall Attendance',
              value: `${attendancePct}%`,
              change: '+2.3%',
              changeType: 'positive',
              icon: '📊',
              color: 'bg-green-50 text-green-600 border-green-200',
            },
            {
              title: 'Average Marks',
              value: avgMarks.toFixed(1),
              change: '+5.1%',
              changeType: 'positive',
              icon: '📈',
              color: 'bg-blue-50 text-blue-600 border-blue-200',
            },
            {
              title: 'Total Assessments',
              value: data.data.stats?.marksStats?.totalAssessments || 0,
              change: '+3',
              changeType: 'positive',
              icon: '📝',
              color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            },
            {
              title: 'Grade',
              value: data.data.stats?.gradeDistribution?.[0]?._id || 'N/A',
              change: 'Current',
              changeType: 'neutral',
              icon: '🎓',
              color: 'bg-purple-50 text-purple-600 border-purple-200',
            },
          ]);

          // Set recent marks as activity - individual records with teacher info
          const marks = data.data.recentMarks?.map((mark, idx) => ({
            id: mark._id || `mark-${idx}`,
            date: mark.assessmentDate || mark.publishedAt || mark.createdAt || new Date().toISOString(),
            teacher: mark.teacher?.name || mark.teacherName || 'Unknown',
            activityType: mark.assessmentType || 'Assignment',
            maxMarks: mark.maxMarks || 0,
            obtainedMarks: mark.marksObtained || 0,
            subject: mark.subject || 'Subject',
            title: mark.title || 'Assessment',
            createdAt: mark.createdAt,
            updatedAt: mark.updatedAt,
            publishedAt: mark.publishedAt
          })) || [];

          // Add recent attendance to activity
          const attendance = data.data.recentAttendance?.map((record, idx) => ({
            id: record._id || `attendance-${idx}`,
            date: record.date || new Date().toISOString(),
            teacher: record.teacher?.name || record.class?.teacher?.name || 'Unknown',
            activityType: 'Attendance',
            maxMarks: 1,
            obtainedMarks: record.status === 'present' ? 1 : 0,
            subject: record.class?.name || 'Class',
            status: record.status || 'present',
            createdAt: record.createdAt
          })) || [];

          // Combine and sort by date (most recent first)
          const combinedActivity = [...marks, ...attendance].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );

          setRecentActivity(combinedActivity.slice(0, 10));

          // No mock data - only show real events
          setUpcomingEvents([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch student's attendance records
  const fetchMyAttendance = async () => {
    try {
      const data = await getMyAttendance();
      if (data.success) {
        setMyAttendance(data.data?.attendance || []);
        // Check for new attendance (recent records within last 24 hours)
        const recentAttendance = (data.data?.attendance || []).filter(
          record => new Date(record.date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        setHasNewAttendance(recentAttendance.length > 0);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  // Fetch student's marks
  const fetchMyMarks = async () => {
    try {
      const data = await getMyMarks();
      if (data.success) {
        setMyMarks(flattenMarks(data.data?.marks || []));
        // Check for new marks (recent assessments within last 24 hours)
        const recentMarks = flattenMarks(data.data?.marks || []).filter(
          mark => new Date(mark.assessmentDate) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        setHasNewMarks(recentMarks.length > 0);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    }
  };

  // Fetch aggregated marks for student
  const fetchAggregatedMarks = async () => {
    try {
      setMarksLoading(true);
      const token = localStorage.getItem('token');
      console.log('[StudentDashboard] Fetching aggregated marks...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/marks/aggregated/student`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('[StudentDashboard] Aggregated marks response:', data);
      if (data.success) {
        setAggregatedMarks(data.data.marks || []);
        console.log('[StudentDashboard] Aggregated marks loaded:', (data.data.marks || []).length);
      } else {
        console.error('[StudentDashboard] Failed to fetch aggregated marks:', data.message);
        setAggregatedMarks([]);
      }
    } catch (err) {
      console.error('[StudentDashboard] Error fetching aggregated marks:', err);
      setAggregatedMarks([]);
    } finally {
      setMarksLoading(false);
    }
  };

  // Fetch student's class info
  const fetchMyClass = async () => {
    try {
      const data = await getMyClass();
      if (data.success) setMyClass(data.data?.class || null);
    } catch (err) {
      console.error('Error fetching class:', err);
    }
  };

  // Fetch notices
  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices/student`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setNotices(data.data.notices || []);
        // Calculate unread count
        const unreadCount = (data.data.notices || []).filter(n => !n.isRead).length;
        setUnreadNoticeCount(unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    }
  };

  // Mark all notices as read when opening modal
  const markAllNoticesAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadNotices = notices.filter(n => !n.isRead);
      
      for (const notice of unreadNotices) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices/${notice._id}/student-read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }
      
      // Refresh notices after marking
      await fetchNotices();
    } catch (err) {
      console.error('Error marking notices as read:', err);
    }
  };

  // Download student report
  const handleDownloadReport = async () => {
    try {
      // Fetch attendance and marks data
      await Promise.all([fetchMyAttendance(), fetchMyMarks()]);
      
      // Generate CSV content
      let csv = 'Student Report\n';
      csv += `Generated Date,${new Date().toISOString().split('T')[0]}\n\n`;
      
      // Attendance section
      csv += '=== ATTENDANCE RECORDS ===\n';
      csv += 'Date,Class,Status\n';
      if (myAttendance.length > 0) {
        myAttendance.forEach(record => {
          const date = record.date ? new Date(record.date).toLocaleDateString() : '-';
          const className = record.class?.name || '-';
          const status = record.status || '-';
          csv += `${date},${className},${status}\n`;
        });
      } else {
        csv += 'No attendance records\n';
      }
      
      csv += '\n';
      
      // Marks section
      csv += '=== MARKS RECORDS ===\n';
      csv += 'Subject,Assessment Type,Marks Obtained,Max Marks,Date\n';
      if (myMarks.length > 0) {
        myMarks.forEach(mark => {
          const subject = mark.subject || '-';
          const type = mark.assessmentType || '-';
          const marksObtained = mark.marksObtained || 0;
          const maxMarks = mark.maxMarks || 0;
          const date = mark.assessmentDate ? new Date(mark.assessmentDate).toLocaleDateString() : '-';
          csv += `${subject},${type},${marksObtained},${maxMarks},${date}\n`;
        });
      } else {
        csv += 'No marks records\n';
      }
      
      // Download the CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Report downloaded successfully!');
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
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
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your academic overview — live from database</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => { setShowNotificationsPanel(true); fetchNotifications(); }}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors relative"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNoticeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNoticeCount}
              </span>
            )}
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
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Date</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Teacher</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Activity Type</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Max Marks</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Obtained Marks</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity) => {
                    const formattedDate = new Date(activity.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });
                    
                    // Determine status
                    let status = 'Viewed';
                    const now = new Date();
                    const activityDate = new Date(activity.date);
                    const hoursSince = (now - activityDate) / (1000 * 60 * 60);
                    
                    if (hoursSince < 24) {
                      status = 'New';
                    } else if (hoursSince < 48) {
                      status = 'Updated';
                    }
                    
                    return (
                      <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-600">{formattedDate}</td>
                        <td className="py-3 px-3 font-medium text-gray-800">{activity.teacher}</td>
                        <td className="py-3 px-3 text-gray-600 capitalize">{activity.activityType}</td>
                        <td className="py-3 px-3 text-center text-gray-600">{activity.maxMarks}</td>
                        <td className="py-3 px-3 text-center font-medium text-gray-800">{activity.obtainedMarks}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'New' ? 'bg-green-100 text-green-800' :
                            status === 'Updated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No recent marks activity found.</div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="border-l-4 border-primary-500 pl-4 py-2">
                <p className="text-sm font-medium text-primary-900">{event.title}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs text-gray-500">{event.date}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    event.type === 'exam' ? 'bg-red-100 text-red-800' :
                    event.type === 'lab' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Student Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => { setShowMyAttendanceModal(true); fetchMyAttendance(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors relative"
          >
            {hasNewAttendance && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center"></span>
            )}
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs">My Attendance</span>
          </button>
          <button 
            onClick={() => { setShowMyMarksModal(true); fetchAggregatedMarks(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors relative"
          >
            {hasNewMarks && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center"></span>
            )}
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">My Marks</span>
          </button>
          <button 
            onClick={() => { setShowMyClassModal(true); fetchMyClass(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">My Class</span>
          </button>
          <button 
            onClick={() => { setShowNoticesModal(true); fetchNotices(); markAllNoticesAsRead(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors relative"
          >
            {unreadNoticeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNoticeCount}
              </span>
            )}
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-xs">Notices</span>
          </button>
          <button 
            onClick={handleDownloadReport}
            className="flex flex-col items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">Download Report</span>
          </button>
          <button className="flex flex-col items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Get Help</span>
          </button>
        </div>
      </div>

      {/* My Attendance Modal */}
      {showMyAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">My Attendance Records</h2>
              <button onClick={() => setShowMyAttendanceModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Class</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.length > 0 ? myAttendance.map((record, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{record.class?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="py-8 text-center text-gray-500">No attendance records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Marks Modal */}
      {showMyMarksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">My Marks Summary</h2>
              <button onClick={() => setShowMyMarksModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {marksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : aggregatedMarks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Assignment</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Quiz</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Presentation</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Paper</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Attendance</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Total Obtained</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Total Max</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Percentage</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedMarks.map((mark, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium">{mark.subject}</td>
                        <td className="py-3 px-3 text-center">
                          {mark.assignment?.obtained > 0 || mark.assignment?.max > 0 
                            ? `${mark.assignment.obtained}/${mark.assignment.max}` 
                            : '0/0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {mark.quiz?.obtained > 0 || mark.quiz?.max > 0 
                            ? `${mark.quiz.obtained}/${mark.quiz.max}` 
                            : '0/0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {mark.presentation?.obtained > 0 || mark.presentation?.max > 0 
                            ? `${mark.presentation.obtained}/${mark.presentation.max}` 
                            : '0/0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {mark.paper?.obtained > 0 || mark.paper?.max > 0 
                            ? `${mark.paper.obtained}/${mark.paper.max}` 
                            : '0/0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {mark.attendance?.obtained > 0 || mark.attendance?.max > 0 
                            ? `${mark.attendance.obtained}/${mark.attendance.max}` 
                            : '0/0'}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">{mark.totalObtained || 0}</td>
                        <td className="py-3 px-3 text-center">{mark.totalMax || 0}</td>
                        <td className="py-3 px-3 text-center font-semibold">{mark.percentage || '0'}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            mark.grade === 'A+' || mark.grade === 'A' ? 'bg-green-100 text-green-700' :
                            mark.grade === 'B+' || mark.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            mark.grade === 'C+' || mark.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            mark.grade === 'D+' || mark.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {mark.grade || 'F'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No marks records found</div>
            )}
          </div>
        </div>
      )}

      {/* My Class Modal */}
      {showMyClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">My Class Information</h2>
              <button onClick={() => setShowMyClassModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {myClass ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Class Name</p>
                  <p className="text-lg font-medium text-purple-900">{myClass.name}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Class Code</p>
                  <p className="text-lg font-medium text-blue-900">{myClass.code}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Semester & Section</p>
                  <p className="text-lg font-medium text-green-900">{myClass.semester || myClass.grade} - {myClass.section}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Teacher</p>
                  <p className="text-lg font-medium text-yellow-900">{myClass.teacher?.name || 'Not assigned'}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No class information available</p>
            )}
          </div>
        </div>
      )}

      {/* Notices Modal */}
      {showNoticesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Notices & Announcements</h2>
              <button onClick={() => setShowNoticesModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {notices.length > 0 ? notices.map((notice, idx) => (
                <div key={notice._id || idx} className={`p-4 border rounded-lg ${notice.isRead ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-yellow-900">{notice.title}</h3>
                        {!notice.isRead && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">New</span>}
                      </div>
                      <p className="text-sm text-yellow-800 mt-1">{notice.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-yellow-600">
                        <span>From: {notice.createdBy?.name || 'Teacher'}</span>
                        {notice.class && <span>Class: {notice.class.name} ({notice.class.code})</span>}
                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!notice.isRead && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices/${notice._id}/student-read`, {
                              method: 'PATCH',
                              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                            });
                            fetchNotices();
                          } catch (err) {
                            console.error('Error marking notice as read:', err);
                          }
                        }}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-8">No notices available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotificationsPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden mt-16 mr-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-primary-900">Notifications</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
                <button onClick={() => setShowNotificationsPanel(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {notifications.length > 0 ? notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    notification.isRead ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      !notification.isRead ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          notification.type === 'notice' ? 'bg-yellow-100 text-yellow-800' :
                          notification.type === 'marks' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'assignment' ? 'bg-purple-100 text-purple-800' :
                          notification.type === 'attendance' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                        {!notification.isRead && <span className="text-xs text-green-600 font-medium">New</span>}
                      </div>
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>From: {notification.sender?.name || 'Teacher'}</span>
                        {notification.class && <span>Class: {notification.class.name}</span>}
                        <span>{new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
