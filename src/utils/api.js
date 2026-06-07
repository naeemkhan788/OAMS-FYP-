const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchJson = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers
    },
    ...options
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message = payload?.message || res.statusText || 'API request failed';
    throw new Error(message);
  }

  return payload;
};

export const getUsers = () => fetchJson('/users');
export const getUserById = (id) => fetchJson(`/users/${id}`);
export const updateUser = (id, data) => fetchJson(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id) => fetchJson(`/users/${id}`, { method: 'DELETE' });

export const getClasses = () => fetchJson('/classes');
export const getClassById = (id) => fetchJson(`/classes/${id}`);
export const createClass = (data) => fetchJson('/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id, data) => fetchJson(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClass = (id) => fetchJson(`/classes/${id}`, { method: 'DELETE' });

export const getAttendanceByClass = (classId, date) => {
  const params = new URLSearchParams({ classId, date });
  return fetchJson(`/attendance/class?${params}`);
};

export const markAttendance = (payload) => fetchJson('/attendance/mark', { method: 'POST', body: JSON.stringify(payload) });

export const getMarksByClass = (classId, subject, assessmentType) => {
  const params = new URLSearchParams({ classId, subject, assessmentType });
  return fetchJson(`/marks/class?${params}`);
};

export const addMarks = (payload) => fetchJson('/marks/add', { method: 'POST', body: JSON.stringify(payload) });
export const publishMarks = (payload) => fetchJson('/marks/publish', { method: 'POST', body: JSON.stringify(payload) });

export const getMyAttendance = () => fetchJson('/attendance/student');
export const getMyMarks = () => fetchJson('/marks/student');
export const getMyClass = () => fetchJson('/classes/student/my-class');
