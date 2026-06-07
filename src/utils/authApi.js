const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: object}>} - Auth token and user data
 */
export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Login failed (${res.status})`);
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please make sure backend is running on port 5002.');
    }
    throw error;
  }
};

/**
 * Register new user
 * @param {object} userData - User registration data
 * @returns {Promise<{token: string, user: object}>} - Auth token and user data
 */
export const registerUser = async (userData) => {
  try {
    console.log('API call to:', `${API_BASE}/auth/register`);
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    console.log('API response:', res.status, data);

    if (!res.ok) {
      throw new Error(data.message || data.errors?.map(e => e.msg).join(', ') || `Registration failed (${res.status})`);
    }

    return data;
  } catch (error) {
    console.error('API error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please make sure backend is running on port 5002.');
    }
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise<object>} - User profile data
 */
export const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_BASE}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to get profile');
  }

  return data;
};

/**
 * Update user profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} - Updated user data
 */
export const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }

  return data;
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Response data
 */
export const changePassword = async (currentPassword, newPassword) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to change password');
  }

  return data;
};

/**
 * Logout user - clear local storage
 */
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get current user from localStorage
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Get auth token from localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token');
};
