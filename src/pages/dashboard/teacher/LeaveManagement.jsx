import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, statusFilter, typeFilter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/leaves`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(l => l.applicantType === typeFilter);
    }
    
    setFilteredLeaves(filtered);
  };

  const handleAction = (leave, actionType) => {
    setSelectedLeave(leave);
    setAction(actionType);
    setRemarks('');
    setShowModal(true);
  };

  const submitAction = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/${selectedLeave._id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status: action,
          remarks
        })
      });
      const data = await res.json();

      if (data.success) {
        alert(`Leave ${action} successfully`);
        setShowModal(false);
        fetchLeaves();
      } else {
        alert(data.message || `Failed to ${action} leave`);
      }
    } catch (err) {
      alert(`Failed to ${action} leave: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'medical':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-purple-100 text-purple-800';
      case 'family':
        return 'bg-pink-100 text-pink-800';
      case 'academic':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No leave applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {leave.applicant?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {leave.applicant?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {leave.applicantType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.totalDays}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(leave, 'approved')}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(leave, 'rejected')}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {leave.status !== 'pending' && leave.remarks && (
                        <span className="text-xs text-gray-500">
                          {leave.remarks}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'approved' ? 'Approve Leave' : 'Reject Leave'}
            </h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Applicant:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedLeave.applicant?.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Leave Type:</span>
                <span className="ml-2 text-sm text-gray-900 capitalize">{selectedLeave.leaveType}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Duration:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()} ({selectedLeave.totalDays} days)
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Reason:</span>
                <p className="mt-1 text-sm text-gray-900">{selectedLeave.reason}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add any remarks..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitAction}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? 'Processing...' : (action === 'approved' ? 'Approve' : 'Reject')}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
