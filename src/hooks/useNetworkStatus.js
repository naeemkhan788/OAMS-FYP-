/**
 * React Hook for Network Status
 * Provides real-time network status updates
 */

import { useState, useEffect } from 'react';
import offlineService from '../services/offlineService';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0
  });

  useEffect(() => {
    // Update sync stats
    const updateStats = async () => {
      try {
        const stats = await offlineService.getSyncStats();
        setSyncStats(stats);
      } catch (error) {
        console.error('Failed to get sync stats:', error);
      }
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 5000); // Update every 5 seconds

    // Subscribe to network status changes
    const unsubscribe = offlineService.onNetworkStatusChange((online) => {
      setIsOnline(online);
      updateStats(); // Update stats when status changes
    });

    return () => {
      clearInterval(statsInterval);
      unsubscribe();
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    syncStats
  };
};

export default useNetworkStatus;
