import { useState, useEffect } from 'react';
import { getUsers } from '../../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newFee, setNewFee] = useState({
    student: '',
    semester: 'Semester 1',
    type: 'Tuition Fee',
    amount: '',
    dueDate: '',
    description: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, feesRes] = await Promise.all([
        getUsers(),
        fetch(`${API_BASE}/fees`, { headers: authHeaders() }).then(res => res.json())
      ]);

      setStudents((usersRes.data.users || []).filter(u => u.role === 'student'));
      
      if (feesRes.success) {
        setFees(feesRes.data || []);
      } else {
        throw new Error(feesRes.message || 'Failed to fetch fees');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFee = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/fees`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newFee)
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Fee assigned successfully!');
        setNewFee({
          student: '',
          semester: 'Semester 1',
          type: 'Tuition Fee',
          amount: '',
          dueDate: '',
          description: ''
        });
        setShowAddForm(false);
        loadData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to assign fee');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/fees/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess('Fee deleted successfully!');
        loadData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to delete fee');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const mappedFees = fees.map((fee) => {
    const student = students.find(s => s._id === fee.student) || { name: 'Unknown Student', studentId: 'N/A', email: 'N/A' };
    return {
      ...fee,
      studentName: student.name,
      studentIdDisplay: student.studentId || 'N/A',
      studentEmail: student.email
    };
  });

  const filteredFees = mappedFees.filter((fee) => {
    const term = searchTerm.toLowerCase();
    return fee.studentName.toLowerCase().includes(term) ||
      fee.studentIdDisplay.toLowerCase().includes(term) ||
      fee.type.toLowerCase().includes(term);
  });

  const getStatusColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: mappedFees.length,
    paid: mappedFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0),
    pending: mappedFees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
  };

  if (loading) return <div className="p-6">Loading fees data...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Fee Management</h1>
        <p className="text-gray-600">Assign and monitor student fees</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Assigned Fees</p>
              <p className="text-xl font-bold text-primary-900 mt-1">${(stats.paid + stats.pending).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-lg">📋</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Collected</p>
              <p className="text-xl font-bold text-green-600 mt-1">${stats.paid.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Outstanding Balance</p>
              <p className="text-xl font-bold text-red-600 mt-1">${stats.pending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-lg">⏳</span>
            </div>
          </div>
        </div>
      </div>

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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search fees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Assign Fee'}
        </button>
      </div>

      {/* Add Fee Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Assign New Fee</h2>
          <form onSubmit={handleAddFee} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={newFee.student}
                  onChange={(e) => setNewFee({ ...newFee, student: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="" disabled>Select a student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.studentId || s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                <select
                  value={newFee.type}
                  onChange={(e) => setNewFee({ ...newFee, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {['Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Examination Fee', 'Hostel Fee', 'Other'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newFee.dueDate}
                  onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input
                  type="text"
                  placeholder="e.g., Semester 1"
                  value={newFee.semester}
                  onChange={(e) => setNewFee({ ...newFee, semester: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Assign Fee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFees.map((fee) => (
                <tr key={fee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-900">{fee.studentName}</div>
                    <div className="text-xs text-gray-500">{fee.studentIdDisplay}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{fee.type}</div>
                    <div className="text-xs text-gray-500">{fee.semester}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${fee.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(fee.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                      {fee.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleDeleteFee(fee._id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                    No fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
