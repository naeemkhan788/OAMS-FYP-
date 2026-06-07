import { useState } from 'react';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: '📊', description: 'Student and teacher attendance statistics' },
    { id: 'academic', name: 'Academic Performance', icon: '📈', description: 'Student grades and GPA analysis' },
    { id: 'enrollment', name: 'Enrollment Report', icon: '👥', description: 'Student enrollment and demographics' },
    { id: 'faculty', name: 'Faculty Report', icon: '👨‍🏫', description: 'Teacher performance and workload' },
    { id: 'financial', name: 'Financial Report', icon: '💰', description: 'Fee collection and financial summary' },
    { id: 'infrastructure', name: 'Infrastructure', icon: '🏢', description: 'Classroom utilization and resources' },
  ];

  const periods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
  const departments = ['all', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English'];

  const recentReports = [
    {
      id: 1,
      name: 'Monthly Attendance Report',
      type: 'attendance',
      period: 'February 2024',
      generatedBy: 'Admin User',
      generatedAt: '2024-03-01 10:30 AM',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Academic Performance Q4 2023',
      type: 'academic',
      period: 'Q4 2023',
      generatedBy: 'Admin User',
      generatedAt: '2024-02-28 03:45 PM',
      size: '5.1 MB',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Student Enrollment Summary',
      type: 'enrollment',
      period: 'Spring 2024',
      generatedBy: 'Admin User',
      generatedAt: '2024-02-25 11:20 AM',
      size: '1.8 MB',
      status: 'completed'
    },
    {
      id: 4,
      name: 'Faculty Workload Analysis',
      type: 'faculty',
      period: 'February 2024',
      generatedBy: 'Admin User',
      generatedAt: '2024-02-20 02:15 PM',
      size: '3.2 MB',
      status: 'completed'
    },
  ];

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getReportIcon = (type) => {
    const report = reportTypes.find(r => r.id === type);
    return report ? report.icon : '📄';
  };

  const stats = {
    totalReports: 24,
    thisMonth: 8,
    processing: 2,
    totalSize: '45.6 MB'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and manage system reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-primary-900 mt-2">{stats.totalReports}</p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.thisMonth}</p>
              <p className="text-sm text-gray-500 mt-1">Generated</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.processing}</p>
              <p className="text-sm text-gray-500 mt-1">In queue</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{stats.totalSize}</p>
              <p className="text-sm text-gray-500 mt-1">Storage used</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <span className="text-xl">💾</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedReport === report.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{report.icon}</span>
                <div>
                  <h3 className="text-sm font-medium text-primary-900">{report.name}</h3>
                  <p className="text-xs text-gray-500">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {periods.map(period => (
                <option key={period} value={period}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Recent Reports</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getReportIcon(report.type)}</span>
                      <span className="text-sm font-medium text-primary-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.generatedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.generatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary-600 hover:text-primary-900 font-medium mr-3">
                      Download
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 font-medium mr-3">
                      View
                    </button>
                    <button className="text-red-600 hover:text-red-900 font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Schedule Reports
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Reports
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-primary-600 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Archive Reports
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-primary-600 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
