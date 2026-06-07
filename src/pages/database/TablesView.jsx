import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles/Tables.css';

const UsersTable = ({ data, loading }) => {
  if (loading) return <div className="loading">Loading users...</div>;
  if (!data || data.length === 0) return <div className="no-data">No users found</div>;

  return (
    <div className="table-container">
      <h3>Users Table</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Student ID</th>
            <th>Teacher ID</th>
            <th>Class</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
              <td>{user.studentId}</td>
              <td>{user.teacherId}</td>
              <td>{user.className}</td>
              <td><span className={`status ${user.status.toLowerCase()}`}>{user.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ClassesTable = ({ data, loading }) => {
  if (loading) return <div className="loading">Loading classes...</div>;
  if (!data || data.length === 0) return <div className="no-data">No classes found</div>;

  return (
    <div className="table-container">
      <h3>Classes Table</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Code</th>
            <th>Grade</th>
            <th>Section</th>
            <th>Teacher</th>
            <th>Students</th>
            <th>Subjects</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cls) => (
            <tr key={cls.id}>
              <td>{cls.name}</td>
              <td><strong>{cls.code}</strong></td>
              <td>{cls.grade}</td>
              <td>{cls.section}</td>
              <td>{cls.teacher}</td>
              <td className="center">{cls.studentCount}</td>
              <td className="center">{cls.subjectCount}</td>
              <td><span className={`status ${cls.status.toLowerCase()}`}>{cls.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AttendanceTable = ({ data, loading, summary }) => {
  if (loading) return <div className="loading">Loading attendance...</div>;
  if (!data || data.length === 0) return <div className="no-data">No attendance records found</div>;

  return (
    <div className="table-container">
      <h3>Attendance Table</h3>
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <span>Total: {summary.total}</span>
          </div>
          <div className="summary-card present">
            <span>Present: {summary.present}</span>
          </div>
          <div className="summary-card absent">
            <span>Absent: {summary.absent}</span>
          </div>
          <div className="summary-card leave">
            <span>Leave: {summary.leave}</span>
          </div>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Student ID</th>
            <th>Class</th>
            <th>Date</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Late</th>
            <th>Teacher</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.id}>
              <td>{record.studentName}</td>
              <td>{record.studentId}</td>
              <td>{record.className}</td>
              <td>{new Date(record.date).toLocaleDateString()}</td>
              <td>{record.subject}</td>
              <td>
                <span className={`status status-${record.status}`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </td>
              <td>{record.checkInTime === '-' ? '-' : new Date(record.checkInTime).toLocaleTimeString()}</td>
              <td>{record.checkOutTime === '-' ? '-' : new Date(record.checkOutTime).toLocaleTimeString()}</td>
              <td>{record.isLate === 'Yes' ? <strong>{record.lateMinutes} min</strong> : '-'}</td>
              <td>{record.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MarksTable = ({ data, loading }) => {
  if (loading) return <div className="loading">Loading marks...</div>;
  if (!data || data.length === 0) return <div className="no-data">No marks records found</div>;

  return (
    <div className="table-container">
      <h3>Marks Table</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Student ID</th>
            <th>Class</th>
            <th>Subject</th>
            <th>Assessment</th>
            <th>Title</th>
            <th>Obtained</th>
            <th>Max Marks</th>
            <th>Percentage</th>
            <th>Grade</th>
            <th>Teacher</th>
          </tr>
        </thead>
        <tbody>
          {data.map((mark) => (
            <tr key={mark.id}>
              <td>{mark.studentName}</td>
              <td>{mark.studentId}</td>
              <td>{mark.className}</td>
              <td>{mark.subject}</td>
              <td><span className="badge badge-info">{mark.assessmentType}</span></td>
              <td>{mark.title}</td>
              <td><strong>{mark.marksObtained}</strong></td>
              <td>{mark.maxMarks}</td>
              <td>
                <span className={`percentage ${parseFloat(mark.percentage) >= 70 ? 'high' : 'low'}`}>
                  {mark.percentage}
                </span>
              </td>
              <td><span className={`grade grade-${mark.grade.toUpperCase().replace('+', 'p')}`}>{mark.grade}</span></td>
              <td>{mark.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function TablesView() {
  const [usersData, setUsersData] = useState([]);
  const [classesData, setClassesData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState({
    users: false,
    classes: false,
    attendance: false,
    marks: false,
    summary: false
  });
  
  const [filters, setFilters] = useState({
    users: { role: '', page: 1, limit: 50 },
    classes: { grade: '', section: '', page: 1, limit: 50 },
    attendance: { classId: '', status: '', date: '', page: 1, limit: 100 },
    marks: { classId: '', subject: '', page: 1, limit: 100 }
  });

  const [summaryStats, setSummaryStats] = useState({});
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, summary: true }));
      const response = await api.get('/tables/dashboard-summary');
      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const fetchUsersTable = async (newFilters = null) => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const params = newFilters || filters.users;
      const response = await api.get('/tables/users', { params });
      if (response.data.success) {
        setUsersData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users table:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchClassesTable = async (newFilters = null) => {
    try {
      setLoading(prev => ({ ...prev, classes: true }));
      const params = newFilters || filters.classes;
      const response = await api.get('/tables/classes', { params });
      if (response.data.success) {
        setClassesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes table:', error);
    } finally {
      setLoading(prev => ({ ...prev, classes: false }));
    }
  };

  const fetchAttendanceTable = async (newFilters = null) => {
    try {
      setLoading(prev => ({ ...prev, attendance: true }));
      const params = newFilters || filters.attendance;
      const response = await api.get('/tables/attendance', { params });
      if (response.data.success) {
        setAttendanceData(response.data.data);
        setAttendanceSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching attendance table:', error);
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  };

  const fetchMarksTable = async (newFilters = null) => {
    try {
      setLoading(prev => ({ ...prev, marks: true }));
      const params = newFilters || filters.marks;
      const response = await api.get('/tables/marks', { params });
      if (response.data.success) {
        setMarksData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching marks table:', error);
    } finally {
      setLoading(prev => ({ ...prev, marks: false }));
    }
  };

  const handleFilterChange = (table, filterKey, value) => {
    const newFilter = { ...filters[table], [filterKey]: value, page: 1 };
    setFilters(prev => ({ ...prev, [table]: newFilter }));
  };

  const loadTableData = (table) => {
    switch (table) {
      case 'users':
        fetchUsersTable();
        break;
      case 'classes':
        fetchClassesTable();
        break;
      case 'attendance':
        fetchAttendanceTable();
        break;
      case 'marks':
        fetchMarksTable();
        break;
      default:
        break;
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-section">
      <h2>MongoDB Tables Dashboard</h2>
      {summaryData && (
        <div className="summary-grid">
          {summaryData.map((summary, idx) => (
            <div key={idx} className="summary-item">
              <h4>{summary.metric}</h4>
              <p className="value">{summary.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="tables-view">
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveTab('users'); loadTableData('users'); }}
        >
          Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('classes'); loadTableData('classes'); }}
        >
          Classes
        </button>
        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => { setActiveTab('attendance'); loadTableData('attendance'); }}
        >
          Attendance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => { setActiveTab('marks'); loadTableData('marks'); }}
        >
          Marks
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === 'dashboard' && renderDashboard()}

        {activeTab === 'users' && (
          <div>
            <div className="filters">
              <select 
                value={filters.users.role}
                onChange={(e) => handleFilterChange('users', 'role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <UsersTable data={usersData} loading={loading.users} />
          </div>
        )}

        {activeTab === 'classes' && (
          <div>
            <div className="filters">
              <select 
                value={filters.classes.grade}
                onChange={(e) => handleFilterChange('classes', 'grade', e.target.value)}
              >
                <option value="">All Grades</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>Grade {i+1}</option>
                ))}
              </select>
              <select 
                value={filters.classes.section}
                onChange={(e) => handleFilterChange('classes', 'section', e.target.value)}
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
            <ClassesTable data={classesData} loading={loading.classes} />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <div className="filters">
              <select 
                value={filters.attendance.status}
                onChange={(e) => handleFilterChange('attendance', 'status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
              <input 
                type="date"
                value={filters.attendance.date}
                onChange={(e) => handleFilterChange('attendance', 'date', e.target.value)}
              />
            </div>
            <AttendanceTable data={attendanceData} loading={loading.attendance} summary={attendanceSummary} />
          </div>
        )}

        {activeTab === 'marks' && (
          <div>
            <div className="filters">
              <input 
                type="text"
                placeholder="Search subject..."
                value={filters.marks.subject}
                onChange={(e) => handleFilterChange('marks', 'subject', e.target.value)}
              />
            </div>
            <MarksTable data={marksData} loading={loading.marks} />
          </div>
        )}
      </div>
    </div>
  );
}
