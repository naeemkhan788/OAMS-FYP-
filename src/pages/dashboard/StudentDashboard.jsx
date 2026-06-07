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

  // Student Data States
  const [myAttendance, setMyAttendance] = useState([]);
  const [myMarks, setMyMarks] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [notices, setNotices] = useState([]);

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

          // Set recent marks as activity
          const marks = data.data.recentMarks?.map((mark, idx) => ({
            id: idx + 1,
            type: 'marks',
            subject: mark.subject || 'Subject',
            date: mark.assessmentDate ? new Date(mark.assessmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            score: `${mark.marks || 0}/${mark.totalMarks || 100}`
          })) || [];
          setRecentActivity(marks.slice(0, 4));

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
      if (data.success) setMyAttendance(data.data?.attendance || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  // Fetch student's marks
  const fetchMyMarks = async () => {
    try {
      const data = await getMyMarks();
      if (data.success) setMyMarks(flattenMarks(data.data?.marks || []));
    } catch (err) {
      console.error('Error fetching marks:', err);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) setNotices(data.data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
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
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your academic overview — live from database</p>
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
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'attendance' ? 'bg-green-50' :
                    activity.type === 'marks' ? 'bg-blue-50' :
                    activity.type === 'fee' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    {activity.type === 'attendance' && '✓'}
                    {activity.type === 'marks' && '📝'}
                    {activity.type === 'fee' && '💰'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-900">{activity.subject}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.status && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {activity.status}
                    </span>
                  )}
                  {activity.score && (
                    <span className="text-sm font-medium text-blue-600">{activity.score}</span>
                  )}
                  {activity.amount && (
                    <span className="text-sm font-medium text-red-600">{activity.amount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
            className="flex flex-col items-center justify-center px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs">My Attendance</span>
          </button>
          <button 
            onClick={() => { setShowMyMarksModal(true); fetchMyMarks(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
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
            onClick={() => { setShowNoticesModal(true); fetchNotices(); }}
            className="flex flex-col items-center justify-center px-4 py-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-xs">Notices</span>
          </button>
          <button className="flex flex-col items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
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
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">My Marks</h2>
              <button onClick={() => setShowMyMarksModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {myMarks.length > 0 ? myMarks.map((mark, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 px-4">{mark.subject}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                        {mark.assessmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{mark.marksObtained}/{mark.maxMarks}</td>
                    <td className="py-3 px-4">{mark.assessmentDate ? new Date(mark.assessmentDate).toLocaleDateString() : '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-500">No marks records found</td></tr>
                )}
              </tbody>
            </table>
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
                <div key={idx} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-900">{notice.title}</h3>
                  <p className="text-sm text-yellow-800 mt-1">{notice.message}</p>
                  <p className="text-xs text-yellow-600 mt-2">{new Date(notice.createdAt).toLocaleDateString()}</p>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-8">No notices available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
