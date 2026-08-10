import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

let socket = null;

/**
 * Custom hook for managing notifications with Socket.IO real-time updates
 * Falls back to polling if Socket.IO is unavailable
 */
const useNotifications = ({ pollingInterval = 30000 } = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    if (!userId) {
      console.warn('[USE NOTIFICATIONS] No user ID found');
      return;
    }

    try {
      socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5002', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        console.log('[USE NOTIFICATIONS] Socket connected');
        setIsConnected(true);
        socket.emit('user:join', userId);
      });

      socket.on('disconnect', () => {
        console.log('[USE NOTIFICATIONS] Socket disconnected');
        setIsConnected(false);
      });

      socket.on('notification:new', (notification) => {
        console.log('[USE NOTIFICATIONS] New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        fetchUnreadCounts();
      });

      socket.on('notification:unread-count', ({ count }) => {
        console.log('[USE NOTIFICATIONS] Unread count updated:', count);
        setTotalUnread(count);
      });

      socket.on('notification:unread-counts', ({ counts }) => {
        console.log('[USE NOTIFICATIONS] Unread counts by page updated:', counts);
        setUnreadCounts(counts);
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        setTotalUnread(total);
      });

      socket.on('connect_error', (err) => {
        console.error('[USE NOTIFICATIONS] Socket connection error:', err);
        setIsConnected(false);
      });

    } catch (err) {
      console.error('[USE NOTIFICATIONS] Socket initialization error:', err);
      setError('Failed to connect to real-time notifications');
      setIsConnected(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // Fetch unread counts by page
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications/unread-counts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCounts(data.data.counts);
        const total = Object.values(data.data.counts).reduce((sum, count) => sum + count, 0);
        setTotalUnread(total);
      }
    } catch (err) {
      console.error('[USE NOTIFICATIONS] Error fetching unread counts:', err);
    }
  }, []);

  // Fetch notifications for a specific page
  const fetchNotificationsByPage = useCallback(async (page, limit = 20) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (err) {
      console.error('[USE NOTIFICATIONS] Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        ));
        await fetchUnreadCounts();
      }
    } catch (err) {
      console.error('[USE NOTIFICATIONS] Error marking notification as read:', err);
    }
  }, [fetchUnreadCounts]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (page) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(page ? { page } : {})
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        await fetchUnreadCounts();
      }
    } catch (err) {
      console.error('[USE NOTIFICATIONS] Error marking all as read:', err);
    }
  }, [fetchUnreadCounts]);

  // Mark notifications for a specific page as read
  const markPageAsRead = useCallback(async (page) => {
    await markAllAsRead(page);
  }, [markAllAsRead]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        await fetchUnreadCounts();
      }
    } catch (err) {
      console.error('[USE NOTIFICATIONS] Error deleting notification:', err);
    }
  }, [fetchUnreadCounts]);

  // Initial data fetch and polling fallback
  useEffect(() => {
    fetchUnreadCounts();

    // Polling fallback if Socket.IO is not connected
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchUnreadCounts();
      }, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchUnreadCounts, pollingInterval]);

  return {
    notifications,
    unreadCounts,
    totalUnread,
    isConnected,
    loading,
    error,
    fetchNotificationsByPage,
    fetchUnreadCounts,
    markAsRead,
    markAllAsRead,
    markPageAsRead,
    deleteNotification
  };
};

export default useNotifications;
