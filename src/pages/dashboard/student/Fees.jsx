import { useState, useEffect } from 'react';

export default function Fees() {
  const [feeRecords, setFeeRecords] = useState([]);
  const [summary, setSummary] = useState({ totalFees: 0, paidFees: 0, pendingFees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [processingAll, setProcessingAll] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('Online Banking');
  const [notification, setNotification] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/fees/student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee records');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setFeeRecords(data.data.fees || []);
        setSummary(data.data.summary || { totalFees: 0, paidFees: 0, pendingFees: 0 });
      }
    } catch (err) {
      console.error('Error fetching fees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = async (feeId) => {
    try {
      setProcessingId(feeId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/fees/${feeId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMethod: selectedMethod })
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Successfully paid ${data.data?.type || 'fee'}!` });
        fetchFees();
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({ type: 'error', message: data.message || 'Payment processing failed.' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error paying fee:', err);
      setNotification({ type: 'error', message: 'Network error during payment.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePayAllPending = async () => {
    if (summary.pendingFees === 0) {
      setNotification({ type: 'info', message: 'All your fees are already fully paid!' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    try {
      setProcessingAll(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/fees/pay-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMethod: selectedMethod })
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'All pending fees successfully paid!' });
        fetchFees();
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({ type: 'error', message: data.message || 'Bulk payment failed.' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error paying all fees:', err);
      setNotification({ type: 'error', message: 'Network error during bulk payment.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingAll(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">Paid</span>;
    if (status === 'pending') return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>;
    if (status === 'overdue') return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">Overdue</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
  };

  const getPaymentMethodIcon = (method) => {
    if (method === 'Online Banking' || method === 'Bank Transfer') return '🏦';
    if (method === 'Credit Card' || method === 'Debit Card') return '💳';
    if (method === 'Mobile Wallet') return '📱';
    if (method === 'Cash') return '💵';
    return '💰';
  };

  const completedPayments = feeRecords.filter(f => f.status === 'paid').sort((a, b) => new Date(b.paymentDate || b.updatedAt) - new Date(a.paymentDate || a.updatedAt));

  // Find next due date
  const pendingItems = feeRecords.filter(f => f.status !== 'paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nextDueItem = pendingItems.length > 0 ? pendingItems[0] : null;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header & Notifications */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight">Fee Management</h1>
          <p className="text-sm text-gray-600 mt-1">Real-time semester billing, payment processing, and electronic receipts</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Payment Gateway:</span>
          <span className="px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            University Pay Direct
          </span>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 
          notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' : 
          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{notification.type === 'success' ? '✨' : notification.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <p className="font-semibold text-sm">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white p-1">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-600">Syncing secure tuition records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center space-y-3">
          <p className="text-lg font-bold text-red-700">Failed to load fee information</p>
          <p className="text-sm text-red-600 max-w-md mx-auto">{error}</p>
          <button onClick={fetchFees} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm">Retry Connection</button>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-sm border border-blue-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Semester Ledger</p>
                <p className="text-4xl font-extrabold text-blue-950 mt-2">${summary.totalFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Total Assessed Fees</p>
              </div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                📋
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-sm border border-emerald-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Remitted</p>
                <p className="text-4xl font-extrabold text-emerald-950 mt-2">${summary.paidFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Successfully Processed</p>
              </div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                🎉
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl shadow-sm border border-amber-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-4xl font-extrabold text-amber-950 mt-2">${summary.pendingFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Current Payable Amount</p>
              </div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                ⏳
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-rose-50/30 rounded-2xl shadow-sm border border-rose-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Next Due Date</p>
                <p className="text-2xl font-extrabold text-rose-950 mt-2">
                  {nextDueItem ? new Date(nextDueItem.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Fully Paid'}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium truncate max-w-[140px]">{nextDueItem ? nextDueItem.type : 'No pending obligations'}</p>
              </div>
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                ⏰
              </div>
            </div>
          </div>

          {/* Payment Method Selector Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💳</span>
                <div>
                  <h3 className="text-sm font-bold text-primary-900">Select Preferred Payment Method</h3>
                  <p className="text-xs text-gray-500">Choose your gateway before processing payments below</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Online Banking', 'Credit Card', 'Debit Card', 'Mobile Wallet'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      selectedMethod === method
                        ? 'bg-primary-900 text-white shadow-md shadow-primary-900/20 ring-2 ring-primary-900/50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPaymentMethodIcon(method)} {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fee Structure Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 bg-gray-50/75 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-primary-900">Detailed Fee Structure & Billing Schedule</h2>
                <p className="text-xs text-gray-500 mt-0.5">Itemized university billing components for the active academic term</p>
              </div>
              <button 
                onClick={handlePayAllPending} 
                disabled={summary.pendingFees === 0 || processingAll}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-800 text-white text-xs font-bold rounded-xl shadow-md hover:from-primary-700 hover:to-primary-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingAll ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                    Processing Bulk...
                  </>
                ) : (
                  <>
                    <span>💳</span> Pay All Pending (${summary.pendingFees.toLocaleString()})
                  </>
                )}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-100/50 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Fee Component</th>
                    <th className="px-6 py-4">Semester</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action / Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {feeRecords.map((fee) => (
                    <tr key={fee._id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-primary-950">{fee.type}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{fee.description || 'University fee item'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-600">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg">{fee.semester}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-extrabold text-primary-900 text-base">
                        ${fee.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600 font-semibold">
                        {new Date(fee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(fee.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {fee.status !== 'paid' ? (
                          <button
                            onClick={() => handlePayFee(fee._id)}
                            disabled={processingId === fee._id}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            {processingId === fee._id ? (
                              <>
                                <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <span>⚡</span> Pay Now
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowReceiptModal(fee)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-primary-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span>🧾</span> View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                  <span>📜</span> Transaction Log & History
                </h2>
                <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-semibold font-mono">
                  {completedPayments.length} Completed
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-2">
                {completedPayments.length > 0 ? (
                  completedPayments.map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-4 bg-gray-50/75 hover:bg-gray-100/75 rounded-2xl border border-gray-200/80 transition-colors">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-11 h-11 bg-emerald-100/70 text-emerald-800 rounded-xl flex items-center justify-center text-xl shadow-sm">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary-900">{payment.type}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-medium">
                            <span className="font-mono">{new Date(payment.paymentDate || payment.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>•</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono text-[10px]">{payment.paymentMethod || 'Online Gateway'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold font-mono text-emerald-700">+${payment.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{payment.transactionId || 'TXN-VERIFIED'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 italic">
                    <span className="text-3xl mb-2">💸</span>
                    <p className="text-xs">No completed fee payments recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Support & Quick Links */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-48 h-48 bg-primary-800/30 rounded-full blur-2xl pointer-events-none"></div>
              
              <div>
                <div className="inline-block px-3 py-1 bg-primary-800 text-primary-200 rounded-lg text-xs font-bold uppercase tracking-wider mb-4 border border-primary-700">
                  Student Finance Desk
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Need Financial Aid or Installment Plans?</h2>
                <p className="text-primary-200 text-sm mt-3 leading-relaxed">
                  Our bursary office provides flexible payment structures, merit-based scholarships, and emergency grants. Apply through the student portal before semester census date.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-primary-800/50 backdrop-blur-sm p-3.5 rounded-xl border border-primary-700/60">
                    <p className="text-xs text-primary-300 font-semibold uppercase">Email Support</p>
                    <p className="text-xs font-bold mt-1 text-white font-mono truncate">bursar@university.edu</p>
                  </div>
                  <div className="bg-primary-800/50 backdrop-blur-sm p-3.5 rounded-xl border border-primary-700/60">
                    <p className="text-xs text-primary-300 font-semibold uppercase">Direct Hotline</p>
                    <p className="text-xs font-bold mt-1 text-white font-mono">+1 (800) 555-FEES</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-primary-800/80 flex flex-wrap gap-3">
                <button 
                  onClick={() => alert('Scholarship application portal opened.')}
                  className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-accent-500/20 transition-all flex items-center gap-2"
                >
                  <span>🎓</span> Apply for Scholarship
                </button>
                <button 
                  onClick={() => alert('Installment plan request submitted to bursar.')}
                  className="px-5 py-2.5 bg-primary-800 hover:bg-primary-700 text-white text-xs font-bold rounded-xl border border-primary-700 transition-all"
                >
                  Request Installment Plan
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-white text-center relative">
              <button 
                onClick={() => setShowReceiptModal(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors text-sm"
              >
                ✕
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center text-3xl mb-3 border border-white/30 shadow-inner">
                🏛️
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Official E-Receipt</h3>
              <p className="text-xs text-emerald-100 font-mono mt-1">University Office of Student Finance</p>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-5">
              <div className="text-center pb-5 border-b border-dashed border-gray-200">
                <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Amount Paid</p>
                <p className="text-4xl font-extrabold font-mono text-primary-950 mt-1">${showReceiptModal.amount.toLocaleString()}</p>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold uppercase mt-2">Paid in Full</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-gray-900">{showReceiptModal.transactionId || 'TXN-984310'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Fee Category:</span>
                  <span className="font-bold text-primary-900">{showReceiptModal.type}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Academic Semester:</span>
                  <span className="font-bold text-gray-800">{showReceiptModal.semester}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Payment Gateway:</span>
                  <span className="font-bold text-gray-800">{showReceiptModal.paymentMethod || 'Online Gateway'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Processed Timestamp:</span>
                  <span className="font-mono text-gray-800">{new Date(showReceiptModal.paymentDate || showReceiptModal.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-200/80">
                <p className="text-[11px] text-gray-500 font-medium">This is a system-generated electronic receipt valid for tax and academic verification purposes.</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-primary-900 hover:bg-primary-950 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>🖨️</span> Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
