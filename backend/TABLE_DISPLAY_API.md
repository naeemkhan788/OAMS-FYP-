# MongoDB Tables Display API Documentation

## Overview
This documentation provides complete information about the MongoDB table display endpoints that have been created for the Online Attendance Management System.

## Base URL
```
/api/tables
```

## Authentication
All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Users Table
**GET** `/api/tables/users`

Retrieve paginated list of all users with optional filters.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| role | string | No | Filter by role: `student`, `teacher`, or `admin` |
| page | number | No | Page number (default: 1) |
| limit | number | No | Records per page (default: 50) |
| search | string | No | Search by name, email, or ID |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/tables/users?role=student&page=1&limit=50" \
  -H "Authorization: Bearer your_token"
```

#### Response
```json
{
  "success": true,
  "message": "Users table retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "studentId": "STU001",
      "teacherId": null,
      "className": "Class 10-A",
      "phone": "+1234567890",
      "address": "123 Main St",
      "createdAt": "2024-01-15T10:30:00Z",
      "status": "Active"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

---

### 2. Classes Table
**GET** `/api/tables/classes`

Retrieve paginated list of all classes with optional filters.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Records per page (default: 50) |
| grade | number | No | Filter by grade (1-12) |
| section | string | No | Filter by section: `A`, `B`, `C`, `D`, `E`, or `F` |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/tables/classes?grade=10&section=A" \
  -H "Authorization: Bearer your_token"
```

#### Response
```json
{
  "success": true,
  "message": "Classes table retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Class 10-A",
      "code": "CLASS10A",
      "grade": 10,
      "section": "A",
      "teacher": "Mrs. Smith",
      "teacherEmail": "smith@example.com",
      "studentCount": 45,
      "subjectCount": 8,
      "createdAt": "2024-01-10T10:00:00Z",
      "status": "Active"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

---

### 3. Attendance Table
**GET** `/api/tables/attendance`

Retrieve paginated list of attendance records with optional filters.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| classId | string | No | Filter by class ID |
| date | string | No | Filter by date (YYYY-MM-DD format) |
| status | string | No | Filter by status: `present`, `absent`, or `leave` |
| page | number | No | Page number (default: 1) |
| limit | number | No | Records per page (default: 100) |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/tables/attendance?date=2024-01-15&status=present" \
  -H "Authorization: Bearer your_token"
```

#### Response
```json
{
  "success": true,
  "message": "Attendance table retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "studentName": "John Doe",
      "studentId": "STU001",
      "className": "Class 10-A",
      "date": "2024-01-15T00:00:00Z",
      "subject": "Mathematics",
      "status": "present",
      "checkInTime": "2024-01-15T09:00:00Z",
      "checkOutTime": "2024-01-15T13:00:00Z",
      "isLate": "No",
      "lateMinutes": "-",
      "teacher": "Mrs. Smith",
      "notes": "Regular attendance",
      "markedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 450,
    "page": 1,
    "limit": 100,
    "pages": 5
  },
  "summary": {
    "total": 450,
    "present": 425,
    "absent": 20,
    "leave": 5
  }
}
```

---

### 4. Marks Table
**GET** `/api/tables/marks`

Retrieve paginated list of marks/grades with optional filters.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| classId | string | No | Filter by class ID |
| subject | string | No | Filter by subject name |
| studentId | string | No | Filter by student ID |
| page | number | No | Page number (default: 1) |
| limit | number | No | Records per page (default: 100) |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/tables/marks?subject=Mathematics" \
  -H "Authorization: Bearer your_token"
```

#### Response
```json
{
  "success": true,
  "message": "Marks table retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439014",
      "studentName": "John Doe",
      "studentId": "STU001",
      "className": "Class 10-A",
      "subject": "Mathematics",
      "assessmentType": "final",
      "title": "Final Examination",
      "marksObtained": 85,
      "maxMarks": 100,
      "percentage": "85.00%",
      "grade": "A",
      "teacher": "Mr. Johnson",
      "assessmentDate": "2024-01-20T10:00:00Z",
      "remarks": "Excellent performance"
    }
  ],
  "pagination": {
    "total": 520,
    "page": 1,
    "limit": 100,
    "pages": 6
  }
}
```

---

### 5. Dashboard Summary
**GET** `/api/tables/dashboard-summary`

Retrieve summary statistics of all collections.

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/tables/dashboard-summary" \
  -H "Authorization: Bearer your_token"
```

#### Response
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": [
    {
      "metric": "Total Users",
      "value": 250,
      "type": "users"
    },
    {
      "metric": "Total Students",
      "value": 180,
      "type": "students"
    },
    {
      "metric": "Total Teachers",
      "value": 35,
      "type": "teachers"
    },
    {
      "metric": "Total Classes",
      "value": 12,
      "type": "classes"
    },
    {
      "metric": "Total Attendance Records",
      "value": 8500,
      "type": "attendance"
    },
    {
      "metric": "Total Marks Records",
      "value": 2400,
      "type": "marks"
    },
    {
      "metric": "Today's Attendance",
      "value": 145,
      "type": "today"
    }
  ]
}
```

---

### 6. Export Table Data
**POST** `/api/tables/export/:tableType`

Export complete data from a specific table.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tableType | string | Yes | Type of table: `users`, `classes`, `attendance`, or `marks` |

#### Request Body (Optional)
```json
{
  "filters": {
    "role": "student",
    "class": "607f1f77bcf86cd799439011"
  }
}
```

#### Example Request
```bash
curl -X POST "http://localhost:5000/api/tables/export/users" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"filters": {"role": "student"}}'
```

#### Response
```json
{
  "success": true,
  "message": "users data ready for export",
  "data": [...all users matching filters...],
  "count": 180
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid table type",
  "error": "error details"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error fetching users table",
  "error": "error details"
}
```

---

## Usage Examples

### JavaScript/Axios
```javascript
import axios from 'axios';

const token = 'your_jwt_token';

// Get Users
const getUsers = async () => {
  const response = await axios.get('/api/tables/users', {
    headers: { Authorization: `Bearer ${token}` },
    params: { role: 'student', page: 1, limit: 50 }
  });
  return response.data;
};

// Get Attendance Summary
const getAttendanceSummary = async (classId) => {
  const response = await axios.get('/api/tables/attendance', {
    headers: { Authorization: `Bearer ${token}` },
    params: { classId, date: '2024-01-15' }
  });
  return response.data;
};
```

### React Hook
```javascript
const [tables, setTables] = useState({
  users: [],
  classes: [],
  attendance: [],
  marks: []
});

const fetchTable = async (tableType, filters = {}) => {
  try {
    const response = await api.get(`/tables/${tableType}`, { params: filters });
    if (response.data.success) {
      setTables(prev => ({ ...prev, [tableType]: response.data.data }));
    }
  } catch (error) {
    console.error(`Error fetching ${tableType}:`, error);
  }
};
```

---

## Features

✅ **Pagination Support**: All endpoints support pagination with customizable page and limit
✅ **Advanced Filtering**: Filter by multiple criteria (role, status, date, grade, etc.)
✅ **Sorting**: Data is automatically sorted for optimal readability
✅ **Search Functionality**: Users table supports search by name, email, and ID
✅ **Summary Statistics**: Dashboard provides quick overview of all collections
✅ **Export Capability**: Download entire table data with optional filters
✅ **Real-time Data**: Always returns current data from MongoDB
✅ **Error Handling**: Comprehensive error messages and status codes

---

## Performance Tips

1. **Use appropriate pagination limits**: Don't request too many records at once
2. **Apply filters**: Use specific filters to reduce data volume
3. **Cache results**: Cache API responses on the frontend when possible
4. **Schedule exports**: Export large datasets during off-peak hours
5. **Monitor query performance**: Check database indexes for frequently filtered fields

---

## Database Collections

The system manages 4 main collections:

### 1. Users Collection
- Stores student, teacher, and admin user information
- Fields: name, email, role, studentId, teacherId, class, phone, address, isActive

### 2. Classes Collection
- Stores class information
- Fields: name, code, grade, section, teacher, students, subjects, schedule

### 3. Attendance Collection
- Stores daily attendance records
- Fields: student, class, teacher, date, status, subject, checkInTime, checkOutTime, notes

### 4. Marks Collection
- Stores assessment and grade information
- Fields: student, class, teacher, subject, assessmentType, title, marksObtained, maxMarks, grade, remarks

---

## Installation & Setup

1. **Backend Routes Added**: ✅ Routes automatically added to `/api/tables`
2. **Authentication**: All endpoints require valid JWT token
3. **Frontend Component**: TablesView.jsx component created at `src/pages/database/`
4. **Styling**: Complete CSS provided in `src/styles/Tables.css`

---

## Support

For issues or questions, contact the development team or check the backend logs.

Last Updated: 2024-01-15
Version: 1.0
