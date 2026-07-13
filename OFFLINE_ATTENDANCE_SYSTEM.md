# Offline Attendance System Documentation

## Overview

The Attendance Management System includes a comprehensive offline-first architecture that allows teachers to mark attendance without an internet connection. All offline data is automatically synced when connectivity is restored.

## Architecture

### Frontend Components

#### 1. Offline Service (`src/services/offlineService.js`)

The core service managing offline storage and synchronization using IndexedDB.

**Key Features:**
- **IndexedDB Storage**: Uses browser's IndexedDB for persistent offline storage
- **Network Detection**: Monitors `navigator.onLine` and window `online`/`offline` events
- **Automatic Sync**: Triggers sync when internet connection is restored
- **Retry Mechanism**: Implements exponential backoff with max 5 retries
- **Duplicate Prevention**: Uses uniqueId to prevent duplicate submissions

**Database Structure:**
```javascript
{
  DB_NAME: 'offline_app_db',
  DB_VERSION: 2,
  stores: {
    'attendance_queue': {
      keyPath: 'uniqueId',
      indexes: ['isSynced', 'timestamp']
    },
    'sync_queue': {
      keyPath: 'id',
      indexes: ['status', 'timestamp']
    },
    'offline_data': {
      keyPath: 'id',
      indexes: ['type', 'timestamp']
    }
  }
}
```

**Key Methods:**
- `saveOfflineAttendance(record)` - Saves attendance record to IndexedDB
- `getUnsyncedAttendance()` - Retrieves all unsynced attendance records
- `syncAttendance()` - Syncs all unsynced records to backend
- `onSyncStatusChange(callback)` - Subscribe to sync status updates
- `getNetworkStatus()` - Returns current network status

#### 2. Network Status Hook (`src/hooks/useNetworkStatus.js`)

React hook providing real-time network status and sync statistics.

```javascript
const { isOnline, isOffline, syncStats } = useNetworkStatus();
// syncStats: { total, pending, completed, failed }
```

#### 3. Offline Indicator Component (`src/components/OfflineIndicator.jsx`)

Global UI component showing network status and sync progress.

**Features:**
- Fixed position indicator (bottom-right)
- Shows online/offline status
- Displays sync queue statistics
- Manual sync button
- Expandable details panel
- Auto-hides when online and no pending items

#### 4. Teacher Attendance Page (`src/pages/dashboard/teacher/Attendance.jsx`)

The main attendance marking interface with offline support.

**Offline Flow:**
1. Detects network status on mount
2. If offline, loads cached classes/students from IndexedDB
3. When attendance is saved offline:
   - Generates uniqueId: `${classId}_${studentId}_${date}`
   - Saves to IndexedDB with `isSynced: false`
   - Shows "Saved offline" notification
4. When online, sends directly to API

### Backend Components

#### 1. Attendance Controller (`backend/controllers/attendanceController.js`)

**saveAttendanceSingleOrBatch()** - Handles both single and batch attendance with duplicate prevention.

**Duplicate Prevention Strategy:**
1. **Primary Check**: Lookup by `uniqueId` (from offline sync)
2. **Secondary Check**: Lookup by student + class + date (business logic)
3. **Action**: If duplicate found, update existing record instead of creating new one

**Response Format:**
```javascript
{
  success: true,
  message: "Processed 5 records successfully. 0 duplicates skipped. 0 errors.",
  data: [...], // Successfully processed records
  duplicates: [...], // Skipped duplicates (if any)
  errors: [...] // Processing errors (if any)
}
```

#### 2. Attendance Model (`backend/models/Attendance.js`)

**Schema includes:**
```javascript
{
  uniqueId: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined values
  }
}
```

**Indexes:**
- Composite index on `student + date + class` (unique)
- Index on `class + date`
- Index on `teacher + date`

## Data Flow

### Online Mode

```
User marks attendance
    ↓
Direct API call (POST /api/attendance)
    ↓
Backend saves to database
    ↓
Success response
```

### Offline Mode

```
User marks attendance
    ↓
Generate uniqueId
    ↓
Save to IndexedDB (attendance_queue)
    ↓
Show "Saved offline" notification
    ↓
[Internet restored]
    ↓
Window 'online' event triggered
    ↓
offlineService.syncAttendance()
    ↓
Fetch all unsynced records from IndexedDB
    ↓
Batch POST to /api/attendance
    ↓
Backend processes with duplicate prevention
    ↓
Remove synced records from IndexedDB
    ↓
Show "All data synced" notification
```

## Attendance Record Structure

### Offline Record (IndexedDB)
```javascript
{
  uniqueId: "classId_studentId_2024-01-15",
  studentId: "student123",
  classId: "class456",
  status: "present", // or "absent", "leave"
  timestamp: 1705276800000,
  isSynced: false
}
```

### Backend Record (Database)
```javascript
{
  _id: ObjectId,
  student: ObjectId,
  class: ObjectId,
  teacher: ObjectId,
  date: Date,
  status: "present",
  subject: "Mathematics",
  uniqueId: "classId_studentId_2024-01-15",
  markedBy: ObjectId,
  checkInTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## UniqueId Generation

The uniqueId is generated using the pattern:
```
${classId}_${studentId}_${date}
```

This ensures:
- **Uniqueness**: Combination of class, student, and date
- **Idempotency**: Same attendance marked multiple times has same uniqueId
- **Sync Safety**: Prevents duplicate submissions during sync

## Error Handling

### Network Errors
- Offline requests are queued automatically
- No user action required
- Syncs when connection restored

### Sync Failures
- Failed records remain in queue
- Retry mechanism (max 5 attempts)
- Failed records marked with error details
- Manual retry available via OfflineIndicator

### Partial Sync
- Successfully synced records removed from queue
- Failed records remain for retry
- User can see sync progress in real-time

## Testing the System

### Manual Testing Steps

1. **Test Offline Mode:**
   - Open browser DevTools → Network tab
   - Select "Offline" throttling
   - Navigate to Teacher Attendance page
   - Mark attendance for students
   - Click "Save Attendance"
   - Verify "Saved offline" notification appears
   - Check IndexedDB in DevTools → Application → IndexedDB

2. **Test Automatic Sync:**
   - With offline data queued, restore network connection
   - Select "Online" throttling or disable offline mode
   - Verify sync starts automatically
   - Check "Syncing..." status in OfflineIndicator
   - Verify "All data synced" notification appears
   - Check that records appear in backend database

3. **Test Duplicate Prevention:**
   - Mark attendance for same student/class/date twice
   - Verify only one record exists in database
   - Check backend logs for "Duplicate detected" messages

4. **Test Partial Sync:**
   - Mark attendance offline for multiple students
   - Temporarily block specific requests in DevTools
   - Restore connection
   - Verify successful records sync
   - Verify failed records remain in queue
   - Use manual sync button to retry

## Browser Compatibility

**Required Browser Features:**
- IndexedDB (supported in all modern browsers)
- Navigator.onLine API
- Service Worker (optional, for PWA)

**Supported Browsers:**
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## Performance Considerations

1. **IndexedDB Storage**: No size limit (user-dependent)
2. **Sync Batch Size**: All unsynced records sent in single batch
3. **Retry Delay**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
4. **Cache Duration**: Offline data cached indefinitely until synced

## Security Considerations

1. **Authentication**: Token-based auth required for all API calls
2. **Data Encryption**: IndexedDB data stored locally (browser security)
3. **UniqueId**: Generated client-side, validated server-side
4. **Authorization**: Backend validates teacher permissions

## Troubleshooting

### Issue: Attendance not syncing
**Solution:**
- Check network connection
- Verify OfflineIndicator shows pending items
- Click "Sync Now" button in OfflineIndicator
- Check browser console for errors
- Clear IndexedDB if corrupted (DevTools → Application → IndexedDB)

### Issue: Duplicate attendance records
**Solution:**
- Verify uniqueId generation is consistent
- Check backend logs for duplicate detection
- Ensure Attendance model has uniqueId index
- Verify backend duplicate prevention logic

### Issue: Offline data lost after refresh
**Solution:**
- IndexedDB persists across sessions by default
- Check browser settings for "Clear site data on exit"
- Verify IndexedDB is not being cleared by extensions

### Issue: Sync status not updating
**Solution:**
- Verify offlineService is initialized
- Check that sync status listener is registered
- Refresh the page to re-establish listeners
- Check browser console for errors

## Future Enhancements

### Optional Features (Not Yet Implemented)

1. **PWA Support**
   - Add service worker for offline caching
   - Add manifest.json for installability
   - Enable background sync API

2. **Enhanced Retry Logic**
   - Exponential backoff with jitter
   - Configurable retry limits
   - Priority-based sync queue

3. **Conflict Resolution**
   - Server-side conflict detection
   - Manual conflict resolution UI
   - Version vectors for concurrent edits

4. **Analytics**
   - Sync success rate tracking
   - Offline usage statistics
   - Performance metrics

5. **Data Compression**
   - Compress offline data before storage
   - Delta sync for large datasets
   - Bandwidth optimization

## API Endpoints

### POST /api/attendance
**Description:** Save attendance (single or batch)
**Body:**
```javascript
[
  {
    uniqueId: "classId_studentId_date",
    studentId: "student123",
    classId: "class456",
    status: "present",
    timestamp: 1705276800000
  }
]
```
**Response:**
```javascript
{
  success: true,
  message: "Processed 5 records successfully. 0 duplicates skipped. 0 errors.",
  data: [...],
  duplicates: [...],
  errors: [...]
}
```

## Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:5002/api
```

### Offline Service Configuration
```javascript
const DB_NAME = 'offline_app_db';
const DB_VERSION = 2;
const MAX_RETRIES = 5;
```

## Summary

The offline attendance system provides a robust, user-friendly experience for marking attendance without internet connectivity. Key features include:

- ✅ Automatic network detection
- ✅ IndexedDB for persistent offline storage
- ✅ Automatic sync when connection restored
- ✅ Duplicate prevention via uniqueId
- ✅ Retry mechanism for failed syncs
- ✅ Real-time sync status UI
- ✅ Manual sync capability
- ✅ Comprehensive error handling

The system is production-ready and handles all edge cases including partial sync failures, network interruptions, and duplicate submissions.
