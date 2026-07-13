/**
 * useOfflineAPI Hook
 * Provides convenient API methods with automatic offline queueing
 */

import { useState, useCallback } from 'react';
import useNetworkStatus from './useNetworkStatus';
import * as offlineAPI from '../utils/apiWithOffline';

export const useOfflineAPI = () => {
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isOnline,
    loading,
    error,
    
    // User operations
    getUsers: () => handleRequest(() => offlineAPI.getUsers()),
    getUserById: (id) => handleRequest(() => offlineAPI.getUserById(id)),
    updateUser: (id, data) => handleRequest(() => offlineAPI.updateUser(id, data)),
    deleteUser: (id) => handleRequest(() => offlineAPI.deleteUser(id)),

    // Class operations
    getClasses: () => handleRequest(() => offlineAPI.getClasses()),
    getClassById: (id) => handleRequest(() => offlineAPI.getClassById(id)),
    createClass: (data) => handleRequest(() => offlineAPI.createClass(data)),
    updateClass: (id, data) => handleRequest(() => offlineAPI.updateClass(id, data)),
    deleteClass: (id) => handleRequest(() => offlineAPI.deleteClass(id)),

    // Attendance operations
    getAttendanceByClass: (classId, date) => handleRequest(() => offlineAPI.getAttendanceByClass(classId, date)),
    markAttendance: (payload) => handleRequest(() => offlineAPI.markAttendance(payload)),
    getMyAttendance: () => handleRequest(() => offlineAPI.getMyAttendance()),

    // Marks operations
    getMarksByClass: (classId, subject, assessmentType) =>
      handleRequest(() => offlineAPI.getMarksByClass(classId, subject, assessmentType)),
    addMarks: (payload) => handleRequest(() => offlineAPI.addMarks(payload)),
    publishMarks: (payload) => handleRequest(() => offlineAPI.publishMarks(payload)),
    getMyMarks: () => handleRequest(() => offlineAPI.getMyMarks()),

    // Other operations
    getMyClass: () => handleRequest(() => offlineAPI.getMyClass()),
  };
};

export default useOfflineAPI;
