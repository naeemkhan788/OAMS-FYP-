import { useState, useEffect } from 'react';
import Analytics from './Analytics';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [archivedReports, setArchivedReports] = useState([]);
  const [archiveFilterType, setArchiveFilterType] = useState('');
  const [archiveStartDate, setArchiveStartDate] = useState('');
  const [archiveEndDate, setArchiveEndDate] = useState('');
  const [scheduledReports, setScheduledReports] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    reportType: 'attendance',
    period: 'monthly',
    schedule: 'daily',
    recipients: '',
    department: 'all'
  });
  const [emailForm, setEmailForm] = useState({
    reportId: '',
    recipients: '',
    subject: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: '📊', description: 'Student and teacher attendance statistics' },
    { id: 'academic', name: 'Academic Performance', icon: '📈', description: 'Student grades and GPA analysis' },
    { id: 'enrollment', name: 'Enrollment Report', icon: '👥', description: 'Student enrollment and demographics' },
    { id: 'faculty', name: 'Faculty Report', icon: '👨‍🏫', description: 'Teacher performance and workload' },
  ];

  const periods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

  // Fetch recent reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/reports`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setRecentReports(data.data || []);
        } else {
          console.error('Failed to fetch reports:', data.message);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, []);

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

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      console.log('Generating report:', { selectedReport, selectedPeriod });

      switch (selectedReport) {
        case 'attendance':
          endpoint = `${API_BASE}/reports/attendance?period=${selectedPeriod}&department=Computer Science`;
          break;
        case 'academic':
          endpoint = `${API_BASE}/reports/marks?period=${selectedPeriod}&department=Computer Science`;
          break;
        case 'enrollment':
          endpoint = `${API_BASE}/reports/enrollment?department=Computer Science`;
          break;
        case 'faculty':
          endpoint = `${API_BASE}/reports/faculty?department=Computer Science`;
          break;
        default:
          setError('Report type not implemented yet');
          setIsGenerating(false);
          return;
      }

      console.log('Fetching from endpoint:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to generate report');
      }

      // Download the CSV file
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Report downloaded successfully');
      
      // Refresh the reports list
      const reportsResponse = await fetch(`${API_BASE}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reportsData = await reportsResponse.json();
      if (reportsData.success) {
        setRecentReports(reportsData.data || []);
      }

    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/reports/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download report');
      }

      // Get the filename from Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'report.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Error downloading report: ${err.message}`);
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/reports/${reportId}/view`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to view report');
      }

      // Get the blob and open in new tab
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error viewing report: ${err.message}`);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the reports list
        const updatedReports = recentReports.filter(r => r._id !== reportId);
        setRecentReports(updatedReports);
        alert('Report deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete report');
      }
    } catch (err) {
      alert(`Error deleting report: ${err.message}`);
    }
  };

  const handleArchiveReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/reports/${reportId}/archive`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const updatedReports = recentReports.filter(r => r._id !== reportId);
        setRecentReports(updatedReports);
        alert('Report archived successfully');
      } else {
        throw new Error(data.message || 'Failed to archive report');
      }
    } catch (err) {
      alert(`Error archiving report: ${err.message}`);
    }
  };

  const fetchArchivedReports = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE}/reports/archived`;
      const params = new URLSearchParams();
      
      if (archiveFilterType) params.append('type', archiveFilterType);
      if (archiveStartDate) params.append('startDate', archiveStartDate);
      if (archiveEndDate) params.append('endDate', archiveEndDate);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setArchivedReports(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching archived reports:', err);
    }
  };

  const handleUnarchiveReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/reports/${reportId}/unarchive`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const updatedArchived = archivedReports.filter(r => r._id !== reportId);
        setArchivedReports(updatedArchived);
        alert('Report unarchived successfully');
      } else {
        throw new Error(data.message || 'Failed to unarchive report');
      }
    } catch (err) {
      alert(`Error unarchiving report: ${err.message}`);
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/scheduled-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setScheduledReports(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching scheduled reports:', err);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/scheduled-reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...scheduleForm,
          recipients: scheduleForm.recipients.split(',').map(r => r.trim()).filter(r => r)
        })
      });

      const data = await response.json();
      if (data.success) {
        setScheduleForm({
          name: '',
          reportType: 'attendance',
          period: 'monthly',
          schedule: 'daily',
          recipients: '',
          department: 'all'
        });
        fetchScheduledReports();
        alert('Schedule created successfully');
      } else {
        throw new Error(data.message || 'Failed to create schedule');
      }
    } catch (err) {
      alert(`Error creating schedule: ${err.message}`);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/scheduled-reports/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const updated = scheduledReports.filter(s => s._id !== scheduleId);
        setScheduledReports(updated);
        alert('Schedule deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete schedule');
      }
    } catch (err) {
      alert(`Error deleting schedule: ${err.message}`);
    }
  };

  const handleToggleSchedule = async (scheduleId, enabled) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/scheduled-reports/${scheduleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !enabled })
      });

      const data = await response.json();
      if (data.success) {
        const updated = scheduledReports.map(s => 
          s._id === scheduleId ? { ...s, enabled: !enabled } : s
        );
        setScheduledReports(updated);
      } else {
        throw new Error(data.message || 'Failed to toggle schedule');
      }
    } catch (err) {
      alert(`Error toggling schedule: ${err.message}`);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSendingEmail(true);
    try {
      const token = localStorage.getItem('token');
      
      // Validate email addresses
      const emailList = emailForm.recipients.split(',').map(r => r.trim()).filter(r => r);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      if (emailList.length === 0) {
        throw new Error('At least one recipient email is required');
      }

      const response = await fetch(`${API_BASE}/reports/email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId: emailForm.reportId,
          recipients: emailList,
          subject: emailForm.subject || 'Report from OAMS'
        })
      });

      const data = await response.json();
      if (data.success) {
        setEmailForm({ reportId: '', recipients: '', subject: '' });
        setShowEmailModal(false);
        alert(`Report sent successfully to ${emailList.length} recipient(s)`);
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (err) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const stats = {
    totalReports: recentReports.length,
    thisMonth: recentReports.filter(r => {
      const reportDate = new Date(r.createdAt);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length,
    processing: recentReports.filter(r => r.status === 'processing').length,
    totalSize: `${recentReports.reduce((sum, r) => sum + parseFloat(r.fileSize) || 0, 0).toFixed(2)} MB`
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Recent Reports</h2>
        {loadingReports ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No reports generated yet. Generate a report to see it here.</p>
          </div>
        ) : (
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
                  <tr key={report._id} className="hover:bg-gray-50">
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
                      {report.generatedBy?.name || 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.fileSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDownloadReport(report._id)}
                        className="text-primary-600 hover:text-primary-900 font-medium mr-3"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleViewReport(report._id)}
                        className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleArchiveReport(report._id)}
                        className="text-purple-600 hover:text-purple-900 font-medium mr-3"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => { setShowScheduleModal(true); fetchScheduledReports(); }}
            className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Schedule Reports
          </button>
          <button 
            onClick={() => {
              setShowEmailModal(true);
              setEmailForm({ ...emailForm, reportId: recentReports[0] && recentReports[0]._id ? recentReports[0]._id : '' });
            }}
            className="flex items-center justify-center px-4 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Reports
          </button>
          <button 
            onClick={() => { setShowArchiveModal(true); fetchArchivedReports(); }}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Archive Reports
          </button>
          <button 
            onClick={() => setShowAnalytics(true)}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics Dashboard
          </button>
        </div>
      </div>

      {/* Schedule Reports Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-primary-900">📅 Schedule Reports</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Create Schedule Form */}
              <form onSubmit={handleCreateSchedule} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Create New Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Name</label>
                    <input
                      type="text"
                      value={scheduleForm.name}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Weekly Attendance Report"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                    <select
                      value={scheduleForm.reportType}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="attendance">Attendance</option>
                      <option value="academic">Academic Performance</option>
                      <option value="enrollment">Enrollment</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                    <select
                      value={scheduleForm.period}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Frequency</label>
                    <select
                      value={scheduleForm.schedule}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, schedule: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Every Day (8 AM)</option>
                      <option value="weekly">Every Monday (8 AM)</option>
                      <option value="monthly">1st of Month (8 AM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients (comma-separated emails)</label>
                    <input
                      type="text"
                      value={scheduleForm.recipients}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="admin@example.com, teacher@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Schedule
                </button>
              </form>

              {/* Scheduled Reports List */}
              <h3 className="text-lg font-semibold mb-4">Active Schedules</h3>
              <div className="space-y-3">
                {scheduledReports.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No scheduled reports found.</p>
                ) : (
                  scheduledReports.map((schedule) => (
                    <div key={schedule._id} className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{schedule.name}</p>
                        <p className="text-sm text-gray-600">
                          {schedule.reportType} • {schedule.period} • {schedule.schedule}
                        </p>
                        <p className="text-xs text-gray-500">
                          {schedule.recipients?.length || 0} recipient(s) • 
                          {schedule.enabled ? ' Enabled' : ' Disabled'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSchedule(schedule._id, schedule.enabled)}
                          className={`px-3 py-1 rounded-lg text-sm ${schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {schedule.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule._id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Reports Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-primary-900">📧 Email Report</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSendEmail}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Report</label>
                    <select
                      value={emailForm.reportId}
                      onChange={(e) => setEmailForm({ ...emailForm, reportId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Select a report...</option>
                      {recentReports.map((report) => (
                        <option key={report._id} value={report._id}>
                          {report.name} ({new Date(report.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients (comma-separated emails)</label>
                    <input
                      type="text"
                      value={emailForm.recipients}
                      onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="admin@example.com, teacher@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Report from OAMS"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    disabled={isSendingEmail}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-primary-900">📦 Archived Reports</h2>
              <button onClick={() => setShowArchiveModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={archiveFilterType}
                    onChange={(e) => setArchiveFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Types</option>
                    <option value="attendance">Attendance</option>
                    <option value="academic">Academic</option>
                    <option value="enrollment">Enrollment</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={archiveStartDate}
                    onChange={(e) => setArchiveStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={archiveEndDate}
                    onChange={(e) => setArchiveEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchArchivedReports}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Filter
                  </button>
                </div>
              </div>

              {/* Archived Reports Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archived At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {archivedReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No archived reports found.
                        </td>
                      </tr>
                    ) : (
                      archivedReports.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50">
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
                            {new Date(report.archivedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.fileSize}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDownloadReport(report._id)}
                              className="text-primary-600 hover:text-primary-900 font-medium mr-3"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleUnarchiveReport(report._id)}
                              className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report._id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-primary-900">📊 Analytics Dashboard</h2>
              <button onClick={() => setShowAnalytics(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <Analytics />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
