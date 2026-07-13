/**
 * Offline Indicator Component
 * Shows network status and sync queue status
 */

import { useState, useEffect } from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';
import offlineService from '../services/offlineService';

export default function OfflineIndicator() {
  const { isOnline, isOffline, syncStats } = useNetworkStatus();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide details when online and no pending items
  useEffect(() => {
    if (isOnline && syncStats.pending === 0) {
      const timeout = setTimeout(() => setShowDetails(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, syncStats.pending]);

  if (isOnline && syncStats.pending === 0) {
    return null; // Don't show if online and nothing pending
  }

  const handleSync = async () => {
    try {
      await offlineService.triggerSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Status Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border">
        {isOffline ? (
          <>
            {/* Offline Status */}
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Offline</span>
            {syncStats.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                {syncStats.pending} pending
              </span>
            )}
          </>
        ) : (
          <>
            {/* Online Status */}
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Online</span>

            {/* Syncing Status */}
            {syncStats.pending > 0 && (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-blue-700">Syncing...</span>
                </div>
              </>
            )}

            {/* Sync Completed */}
            {syncStats.pending === 0 && syncStats.completed > 0 && (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-xs text-green-600">✓ Synced</span>
              </>
            )}
          </>
        )}

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
          title="Show sync details"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={showDetails ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}
            />
          </svg>
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-3">
          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Network Status</p>
            <p className="text-sm mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></span>
              {isOnline ? 'Connected to internet' : 'No internet connection'}
            </p>
          </div>

          {/* Sync Queue Stats */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Sync Queue</p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600">Total pending:</span>
                <span className="font-medium">{syncStats.pending}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Synced:</span>
                <span className="font-medium text-green-600">{syncStats.completed}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium text-red-600">{syncStats.failed}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-gray-200 flex gap-2">
            {isOnline && syncStats.pending > 0 && (
              <button
                onClick={handleSync}
                className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors font-medium"
              >
                Sync Now
              </button>
            )}

            <button
              onClick={() => setShowDetails(false)}
              className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Info Message */}
          {isOffline && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
              ⚠️ Your changes will be saved offline and synced when you're back online.
            </div>
          )}

          {isOnline && syncStats.pending > 0 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              🔄 Automatically syncing your data...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
