import { useState, useEffect } from 'react';

export default function CreateNotice() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all',
    targetTeacherId: '',
    targetRole: 'teachers'
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data.users.filter(user => user.role === 'teacher'));
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log('[FRONTEND] Submitting notice form');
    console.log('[FRONTEND] Form data:', formData);

    try {
      const token = localStorage.getItem('token');
      console.log('[FRONTEND] Token exists:', !!token);
      
      const payload = {
        title: formData.title,
        message: formData.message,
        targetType: formData.targetType,
        targetRole: formData.targetRole
      };

      if (formData.targetType === 'teacher' && formData.targetTeacherId) {
        payload.targetTeacherId = formData.targetTeacherId;
      }

      console.log('[FRONTEND] Payload:', payload);
      console.log('[FRONTEND] API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices`);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/notices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('[FRONTEND] Response status:', response.status);
      console.log('[FRONTEND] Response ok:', response.ok);

      const data = await response.json();
      console.log('[FRONTEND] Response data:', data);
      
      if (data.success) {
        setSuccess('Notice sent successfully to teachers!');
        setFormData({
          title: '',
          message: '',
          targetType: 'all',
          targetTeacherId: '',
          targetRole: 'teachers'
        });
      } else {
        setError(data.message || 'Failed to send notice');
      }
    } catch (err) {
      console.error('[FRONTEND] Error:', err);
      setError(err.message || 'Failed to send notice');
    } finally {
      console.log('[FRONTEND] Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Send Notice to Teachers</h1>
        <p className="text-gray-600">Create and send notices to teachers</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Notice Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notice Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter notice title"
              required
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notice Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter notice message"
              required
              maxLength={1000}
              rows={4}
            />
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To *
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={formData.targetType === 'all'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetTeacherId: '' })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">All Teachers</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="teacher"
                  checked={formData.targetType === 'teacher'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Specific Teacher</span>
              </label>
            </div>
          </div>

          {/* Teacher Selection */}
          {formData.targetType === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher *
              </label>
              <select
                value={formData.targetTeacherId}
                onChange={(e) => setFormData({ ...formData, targetTeacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Notice'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>Note:</strong> Notices will be visible to teachers in their dashboard. 
          Teachers can mark notices as read after viewing them.
        </p>
      </div>
    </div>
  );
}
