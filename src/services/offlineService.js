/**
 * Offline-First Data Management Service
 * Handles IndexedDB storage, sync queue, and offline data management
 */

const DB_NAME = 'offline_app_db';
const DB_VERSION = 3; // Incremented to force database recreation with proper structure
const SYNC_QUEUE_STORE = 'sync_queue';
const OFFLINE_DATA_STORE = 'offline_data';

class OfflineService {
  constructor() {
    this.db = null;
    this.networkStatusListeners = [];
    this.syncListeners = []; // Listeners for attendance sync progress
    this.isOnline = navigator.onLine;
    this.initNetworkListeners();
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncQueueStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
          syncQueueStore.createIndex('status', 'status', { unique: false });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Sync queue store created');
        }

        // Create offline data store
        if (!db.objectStoreNames.contains(OFFLINE_DATA_STORE)) {
          const offlineDataStore = db.createObjectStore(OFFLINE_DATA_STORE, { keyPath: 'id' });
          offlineDataStore.createIndex('type', 'type', { unique: false });
          offlineDataStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Offline data store created');
        }

        // Create attendance queue store
        if (!db.objectStoreNames.contains('attendance_queue')) {
          const attendanceQueue = db.createObjectStore('attendance_queue', { keyPath: 'uniqueId' });
          attendanceQueue.createIndex('isSynced', 'isSynced', { unique: false });
          attendanceQueue.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Attendance queue store created');
        }

        // Create marks queue store
        if (!db.objectStoreNames.contains('marks_queue')) {
          const marksQueue = db.createObjectStore('marks_queue', { keyPath: 'uniqueId' });
          marksQueue.createIndex('isSynced', 'isSynced', { unique: false });
          marksQueue.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Marks queue store created');
        }
      };
    });
  }

  /**
   * Initialize network status listeners
   */
  initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('✅ Application is online');
      this.notifyNetworkStatusListeners(true);
      this.triggerSync();
      this.syncAttendance();
      this.syncMarks();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('❌ Application is offline');
      this.notifyNetworkStatusListeners(false);
    });
  }

  /**
   * Register a listener for network status changes
   */
  onNetworkStatusChange(callback) {
    this.networkStatusListeners.push(callback);
    return () => {
      this.networkStatusListeners = this.networkStatusListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  notifyNetworkStatusListeners(isOnline) {
    this.networkStatusListeners.forEach(callback => {
      callback(isOnline);
    });
  }

  /**
   * Add a request to the sync queue
   */
  async addToSyncQueue(request) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    const queueItem = {
      ...request,
      status: 'pending',
      timestamp: Date.now(),
      retries: 0,
      lastError: null
    };

    return new Promise((resolve, reject) => {
      const addRequest = store.add(queueItem);

      addRequest.onsuccess = () => {
        console.log('Request added to sync queue:', queueItem);
        resolve(addRequest.result); // Returns the ID
      };

      addRequest.onerror = () => {
        console.error('Failed to add request to sync queue:', addRequest.error);
        reject(addRequest.error);
      };
    });
  }

  /**
   * Get all pending requests from sync queue
   */
  async getPendingRequests() {
    if (!this.db) await this.initDB();

    try {
      const transaction = this.db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);

      // Always use getAll() + filter to avoid index parameter issues
      return new Promise((resolve, reject) => {
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result;
          const pendingItems = allItems.filter(item => item.status === 'pending');
          resolve(pendingItems);
        };

        getAllRequest.onerror = () => {
          console.error('Error getting all sync queue items:', getAllRequest.error);
          reject(getAllRequest.error);
        };
      });
    } catch (error) {
      console.error('Error in getPendingRequests:', error);
      return [];
    }
  }

  /**
   * Update sync queue item status
   */
  async updateSyncQueueItem(id, updates) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error(`Queue item ${id} not found`));
          return;
        }

        const updatedItem = { ...item, ...updates };
        const updateRequest = store.put(updatedItem);

        updateRequest.onsuccess = () => {
          console.log(`Queue item ${id} updated:`, updates);
          resolve(updatedItem);
        };

        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Remove item from sync queue
   */
  async removeSyncQueueItem(id) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        console.log(`Queue item ${id} deleted`);
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  }

  /**
   * Save offline data
   */
  async saveOfflineData(key, data) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([OFFLINE_DATA_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_DATA_STORE);

    const item = {
      id: key,
      data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const putRequest = store.put(item);

      putRequest.onsuccess = () => {
        console.log('Offline data saved:', key);
        resolve(item);
      };

      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    });
  }

  /**
   * Get offline data
   */
  async getOfflineData(key) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([OFFLINE_DATA_STORE], 'readonly');
    const store = transaction.objectStore(OFFLINE_DATA_STORE);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        resolve(getRequest.result);
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Clear offline data
   */
  async clearOfflineData(key) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([OFFLINE_DATA_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_DATA_STORE);

    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(key);

      deleteRequest.onsuccess = () => {
        console.log('Offline data cleared:', key);
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  }

  /**
   * Trigger sync of all pending requests
   */
  async triggerSync() {
    if (!this.isOnline) {
      console.log('Cannot sync: application is offline');
      return;
    }

    try {
      const pendingRequests = await this.getPendingRequests();
      console.log(`Found ${pendingRequests.length} pending requests to sync`);

      for (const request of pendingRequests) {
        await this.syncRequest(request);
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  /**
   * Sync a single request
   */
  async syncRequest(queueItem) {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
      const token = localStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add sync ID to prevent duplicates
      const bodyData = JSON.parse(queueItem.body || '{}');
      bodyData._syncId = queueItem.id;

      const response = await fetch(`${API_BASE}${queueItem.url}`, {
        method: queueItem.method,
        headers,
        body: JSON.stringify(bodyData)
      });

      const responseData = await response.json();

      if (response.ok) {
        await this.updateSyncQueueItem(queueItem.id, {
          status: 'completed',
          response: responseData
        });
        console.log(`✅ Successfully synced request ${queueItem.id}`);
      } else {
        throw new Error(responseData.message || 'Sync request failed');
      }
    } catch (error) {
      console.error(`Error syncing request ${queueItem.id}:`, error);

      // Increment retry count
      const retries = queueItem.retries + 1;
      const maxRetries = 5;

      if (retries < maxRetries) {
        await this.updateSyncQueueItem(queueItem.id, {
          status: 'pending',
          retries,
          lastError: error.message
        });
        console.log(`Retrying later (attempt ${retries}/${maxRetries})`);
      } else {
        await this.updateSyncQueueItem(queueItem.id, {
          status: 'failed',
          retries,
          lastError: error.message
        });
        console.error(`❌ Request ${queueItem.id} failed after ${maxRetries} retries`);
      }
    }
  }

  /**
   * Get sync statistics - includes sync_queue, attendance_queue, and marks_queue
   */
  async getSyncStats() {
    try {
      if (!this.db) await this.initDB();

      // Get sync queue stats
      const syncQueueStats = await this.getStoreStats(SYNC_QUEUE_STORE, 'status');

      // Get attendance queue stats
      const attendanceQueueStats = await this.getStoreStats('attendance_queue', 'isSynced', false);

      // Get marks queue stats
      const marksQueueStats = await this.getStoreStats('marks_queue', 'isSynced', false);

      // Combine stats
      const stats = {
        total: syncQueueStats.total + attendanceQueueStats.total + marksQueueStats.total,
        pending: syncQueueStats.pending + attendanceQueueStats.pending + marksQueueStats.pending,
        completed: syncQueueStats.completed + attendanceQueueStats.completed + marksQueueStats.completed,
        failed: syncQueueStats.failed + attendanceQueueStats.failed + marksQueueStats.failed
      };

      return stats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return { total: 0, pending: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * Helper to get stats from a specific store
   */
  async getStoreStats(storeName, indexName, filterValue) {
    if (!this.db) await this.initDB();

    // Check if store exists before trying to access it
    if (!this.db.objectStoreNames.contains(storeName)) {
      console.warn(`Store ${storeName} does not exist, returning empty stats`);
      return { total: 0, pending: 0, completed: 0, failed: 0 };
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result;

          if (indexName === 'status') {
            // For sync_queue - filter by status field
            const stats = {
              total: allItems.length,
              pending: allItems.filter(item => item.status === 'pending').length,
              completed: allItems.filter(item => item.status === 'completed').length,
              failed: allItems.filter(item => item.status === 'failed').length
            };
            resolve(stats);
          } else if (indexName === 'isSynced') {
            // For attendance_queue and marks_queue - filter by isSynced field
            const pending = allItems.filter(item => item.isSynced === filterValue).length;
            const stats = {
              total: allItems.length,
              pending: pending,
              completed: allItems.filter(item => item.isSynced === true).length,
              failed: 0
            };
            resolve(stats);
          } else {
            // No filtering
            resolve({
              total: allItems.length,
              pending: 0,
              completed: 0,
              failed: 0
            });
          }
        };

        getAllRequest.onerror = () => {
          console.error(`Error getting stats from ${storeName}:`, getAllRequest.error);
          resolve({ total: 0, pending: 0, completed: 0, failed: 0 });
        };
      } catch (error) {
        console.error(`Error in getStoreStats for ${storeName}:`, error);
        resolve({ total: 0, pending: 0, completed: 0, failed: 0 });
      }
    });
  }

  /**
   * Clear all sync queue items
   */
  async clearSyncQueue() {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log('Sync queue cleared');
        resolve();
      };

      clearRequest.onerror = () => {
        reject(clearRequest.error);
      };
    });
  }

  /**
   * Save an offline attendance record to the queue
   */
  async saveOfflineAttendance(record) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction(['attendance_queue'], 'readwrite');
    const store = transaction.objectStore('attendance_queue');

    const item = {
      ...record,
      isSynced: false,
      timestamp: record.timestamp || Date.now()
    };

    return new Promise((resolve, reject) => {
      const putRequest = store.put(item);

      putRequest.onsuccess = () => {
        console.log('Offline attendance record saved:', item);
        resolve(item);
      };

      putRequest.onerror = () => {
        console.error('Failed to save offline attendance record:', putRequest.error);
        reject(putRequest.error);
      };
    });
  }

  /**
   * Get all unsynced attendance records
   */
  async getUnsyncedAttendance() {
    if (!this.db) await this.initDB();

    try {
      const transaction = this.db.transaction(['attendance_queue'], 'readonly');
      const store = transaction.objectStore('attendance_queue');

      // Always use getAll() + filter to avoid index parameter issues
      return new Promise((resolve, reject) => {
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result;
          const unsyncedItems = allItems.filter(item => item.isSynced === false);
          resolve(unsyncedItems);
        };

        getAllRequest.onerror = () => {
          console.error('Error getting all attendance queue items:', getAllRequest.error);
          reject(getAllRequest.error);
        };
      });
    } catch (error) {
      console.error('Error in getUnsyncedAttendance:', error);
      return [];
    }
  }

  /**
   * Remove offline attendance record from queue
   */
  async removeOfflineAttendance(uniqueId) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction(['attendance_queue'], 'readwrite');
    const store = transaction.objectStore('attendance_queue');

    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(uniqueId);

      deleteRequest.onsuccess = () => {
        console.log(`Offline attendance ${uniqueId} removed from queue`);
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  }

  /**
   * Sync all unsynced attendance records to the backend API
   */
  async syncAttendance() {
    if (!this.isOnline) return;

    try {
      let unsynced = [];
      try {
        unsynced = await this.getUnsyncedAttendance();
      } catch (error) {
        console.error('Error getting unsynced attendance, using empty array:', error);
        unsynced = [];
      }

      if (unsynced.length === 0) {
        this.notifySyncListeners({ status: 'synced', count: 0 });
        return;
      }

      console.log(`🔄 Syncing ${unsynced.length} offline attendance records...`);
      this.notifySyncListeners({ status: 'syncing', count: unsynced.length });

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
      const token = localStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify(unsynced)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync response:', result);

        // Remove successfully processed records from the queue
        for (const record of unsynced) {
          try {
            await this.removeOfflineAttendance(record.uniqueId);
          } catch (error) {
            console.error('Error removing attendance record:', error);
          }
        }

        this.notifySyncListeners({ status: 'completed', count: unsynced.length });
        console.log('🎉 All offline attendance records synced successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Sync failed:', errorData.message || response.statusText);
        this.notifySyncListeners({ status: 'failed', error: errorData.message || 'Sync failed' });
      }
    } catch (error) {
      console.error('Error during attendance sync:', error);
      this.notifySyncListeners({ status: 'failed', error: error.message });
    }
  }

  /**
   * Subscribe to attendance sync status changes
   */
  onSyncStatusChange(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify sync listeners
   */
  notifySyncListeners(statusInfo) {
    this.syncListeners.forEach(callback => {
      callback(statusInfo);
    });
  }

  /**
   * Get current network status
   */
  getNetworkStatus() {
    return this.isOnline;
  }

  /**
   * Save an offline marks record to the queue
   */
  async saveOfflineMarks(record) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction(['marks_queue'], 'readwrite');
    const store = transaction.objectStore('marks_queue');

    const item = {
      ...record,
      isSynced: false,
      timestamp: record.timestamp || Date.now()
    };

    return new Promise((resolve, reject) => {
      const putRequest = store.put(item);

      putRequest.onsuccess = () => {
        console.log('Offline marks record saved:', item);
        resolve(item);
      };

      putRequest.onerror = () => {
        console.error('Failed to save offline marks record:', putRequest.error);
        reject(putRequest.error);
      };
    });
  }

  /**
   * Get all unsynced marks records
   */
  async getUnsyncedMarks() {
    if (!this.db) await this.initDB();

    try {
      const transaction = this.db.transaction(['marks_queue'], 'readonly');
      const store = transaction.objectStore('marks_queue');

      // Always use getAll() + filter to avoid index parameter issues
      return new Promise((resolve, reject) => {
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result;
          const unsyncedItems = allItems.filter(item => item.isSynced === false);
          resolve(unsyncedItems);
        };

        getAllRequest.onerror = () => {
          console.error('Error getting all marks queue items:', getAllRequest.error);
          reject(getAllRequest.error);
        };
      });
    } catch (error) {
      console.error('Error in getUnsyncedMarks:', error);
      return [];
    }
  }

  /**
   * Remove offline marks record from queue
   */
  async removeOfflineMarks(uniqueId) {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction(['marks_queue'], 'readwrite');
    const store = transaction.objectStore('marks_queue');

    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(uniqueId);

      deleteRequest.onsuccess = () => {
        console.log(`Offline marks ${uniqueId} removed from queue`);
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  }

  /**
   * Sync all unsynced marks records to the backend API
   */
  async syncMarks() {
    if (!this.isOnline) return;

    try {
      let unsynced = [];
      try {
        unsynced = await this.getUnsyncedMarks();
      } catch (error) {
        console.error('Error getting unsynced marks, using empty array:', error);
        unsynced = [];
      }

      if (unsynced.length === 0) {
        this.notifySyncListeners({ status: 'synced', count: 0 });
        return;
      }

      console.log(`🔄 Syncing ${unsynced.length} offline marks records...`);
      this.notifySyncListeners({ status: 'syncing', count: unsynced.length });

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
      const token = localStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const record of unsynced) {
        try {
          const response = await fetch(`${API_BASE}/marks/add`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              classId: record.classId,
              subject: record.subject,
              assessmentType: record.assessmentType,
              title: record.title,
              marksData: [{
                studentId: record.studentId,
                marksObtained: record.marksObtained,
                maxMarks: record.maxMarks,
                remarks: record.remarks || ''
              }]
            })
          });

          if (response.ok) {
            try {
              await this.removeOfflineMarks(record.uniqueId);
            } catch (error) {
              console.error('Error removing marks record:', error);
            }
            successCount++;
            console.log(`✅ Synced marks record: ${record.uniqueId}`);
          } else {
            errorCount++;
            console.error(`❌ Failed to sync marks record: ${record.uniqueId}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error syncing marks record ${record.uniqueId}:`, error);
        }
      }

      if (successCount > 0) {
        this.notifySyncListeners({ status: 'completed', count: successCount });
        console.log(`🎉 Synced ${successCount} marks records successfully`);
      }

      if (errorCount > 0) {
        this.notifySyncListeners({ status: 'partial', success: successCount, failed: errorCount });
        console.log(`⚠️ ${errorCount} marks records failed to sync`);
      }
    } catch (error) {
      console.error('Error during marks sync:', error);
      this.notifySyncListeners({ status: 'failed', error: error.message });
    }
  }
}

// Create singleton instance
const offlineService = new OfflineService();

// Initialize on first load
offlineService.initDB().catch(err => {
  console.error('Failed to initialize offline database:', err);
});

export default offlineService;
