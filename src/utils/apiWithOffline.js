/**
 * Enhanced API Utilities with Offline Support
 * Automatically queues requests when offline and syncs when online
 */

import offlineService from '../services/offlineService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch with offline support
 * If offline, queues the request; if online, makes immediate request
 */
export const fetchWithOfflineSupport = async (path, options = {}) => {
  const isOnline = offlineService.getNetworkStatus();

  if (!isOnline) {
    // Queue the request for later sync
    console.log('⏳ Application is offline, queueing request:', path);
    
    const request = {
      url: path,
      method: options.method || 'GET',
      body: options.body,
      headers: options.headers || {},
      priority: options.priority || 'normal',
      metadata: {
        operationType: options.operationType || 'unknown',
        description: options.description || ''
      }
    };

    try {
      const queueId = await offlineService.addToSyncQueue(request);
      
      // Return a pending response
      return {
        success: true,
        queued: true,
        queueId,
        message: 'Request queued for sync when online',
        data: options.cachedData || null
      };
    } catch (error) {
      console.error('Failed to queue request:', error);
      throw new Error('Failed to queue offline request');
    }
  }

  // Online - make the request normally
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

/**
 * GET request with offline support
 */
export const getWithOfflineSupport = (path, options = {}) => {
  return fetchWithOfflineSupport(path, {
    method: 'GET',
    operationType: 'read',
    ...options
  });
};

/**
 * POST request with offline support
 */
export const postWithOfflineSupport = (path, data, options = {}) => {
  return fetchWithOfflineSupport(path, {
    method: 'POST',
    body: JSON.stringify(data),
    operationType: 'create',
    ...options
  });
};

/**
 * PUT request with offline support
 */
export const putWithOfflineSupport = (path, data, options = {}) => {
  return fetchWithOfflineSupport(path, {
    method: 'PUT',
    body: JSON.stringify(data),
    operationType: 'update',
    ...options
  });
};

/**
 * DELETE request with offline support
 */
export const deleteWithOfflineSupport = (path, options = {}) => {
  return fetchWithOfflineSupport(path, {
    method: 'DELETE',
    operationType: 'delete',
    ...options
  });
};

// ============================================
// USER API FUNCTIONS
// ============================================

export const getUsers = () => getWithOfflineSupport('/users');
export const getUserById = (id) => getWithOfflineSupport(`/users/${id}`);
export const updateUser = (id, data) => putWithOfflineSupport(`/users/${id}`, data, {
  description: `Updating user ${id}`
});
export const deleteUser = (id) => deleteWithOfflineSupport(`/users/${id}`, {
  description: `Deleting user ${id}`
});

// ============================================
// CLASS API FUNCTIONS
// ============================================

export const getClasses = () => getWithOfflineSupport('/classes');
export const getClassById = (id) => getWithOfflineSupport(`/classes/${id}`);
export const createClass = (data) => postWithOfflineSupport('/classes', data, {
  description: `Creating class: ${data.name}`
});
export const updateClass = (id, data) => putWithOfflineSupport(`/classes/${id}`, data, {
  description: `Updating class ${id}`
});
export const deleteClass = (id) => deleteWithOfflineSupport(`/classes/${id}`, {
  description: `Deleting class ${id}`
});

// ============================================
// ATTENDANCE API FUNCTIONS
// ============================================

export const getAttendanceByClass = (classId, date) => {
  const params = new URLSearchParams({ classId, date });
  return getWithOfflineSupport(`/attendance/class?${params}`);
};

export const markAttendance = (payload) => postWithOfflineSupport('/attendance/mark', payload, {
  description: `Marking attendance for ${payload.students?.length} student(s)`
});

export const getMyAttendance = () => getWithOfflineSupport('/attendance/student');

// ============================================
// MARKS API FUNCTIONS
// ============================================

export const getMarksByClass = (classId, subject, assessmentType) => {
  const params = new URLSearchParams({ classId, subject, assessmentType });
  return getWithOfflineSupport(`/marks/class?${params}`);
};

export const addMarks = (payload) => postWithOfflineSupport('/marks/add', payload, {
  description: `Adding marks for ${payload.students?.length} student(s)`
});

export const publishMarks = (payload) => postWithOfflineSupport('/marks/publish', payload, {
  description: `Publishing marks`
});

export const getMyMarks = () => getWithOfflineSupport('/marks/student');

// ============================================
// MISCELLANEOUS API FUNCTIONS
// ============================================

export const getMyClass = () => getWithOfflineSupport('/classes/student/my-class');

// ============================================
// ORIGINAL fetchJson (for backwards compatibility)
// ============================================

export const fetchJson = fetchWithOfflineSupport;
