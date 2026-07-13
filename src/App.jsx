import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './pages/auth/ProtectedRoute';
import OfflineIndicator from './components/OfflineIndicator';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import Attendance from './pages/dashboard/student/Attendance';
import Marks from './pages/dashboard/student/Marks';
import Progress from './pages/dashboard/student/Progress';
import Fees from './pages/dashboard/student/Fees';
import Leave from './pages/dashboard/student/Leave';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import TeacherAttendance from './pages/dashboard/teacher/Attendance';
import TeacherMarks from './pages/dashboard/teacher/Marks';
import Reviews from './pages/dashboard/teacher/Reviews';
import Classes from './pages/dashboard/teacher/Classes';
import TeacherStudents from './pages/dashboard/teacher/Students';
import LeaveManagement from './pages/dashboard/teacher/LeaveManagement';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminTeachers from './pages/dashboard/admin/Teachers';
import AdminStudents from './pages/dashboard/admin/Students';
import AdminClasses from './pages/dashboard/admin/Classes';
import AdminReports from './pages/dashboard/admin/Reports';
import AdminSettings from './pages/dashboard/admin/Settings';
import AdminFees from './pages/dashboard/admin/Fees';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
        </Route>
        <Route 
          path="/student/*" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="marks" element={<Marks />} />
          <Route path="progress" element={<Progress />} />
          <Route path="fees" element={<Fees />} />
          <Route path="leave" element={<Leave />} />
        </Route>
        <Route 
          path="/teacher/*" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="classes" element={<Classes />} />
          <Route path="leave-management" element={<LeaveManagement />} />
        </Route>
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      <OfflineIndicator />
    </>
  );
}

export default App;
