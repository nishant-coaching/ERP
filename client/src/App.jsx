import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import ParentLayout from './layouts/ParentLayout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import FeesPage from './pages/admin/FeesPage';
import MarksPage from './pages/admin/MarksPage';
import TeacherReportPage from './pages/admin/TeacherReportPage';
import ReportsPage from './pages/admin/ReportsPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentFees from './pages/parent/ParentFees';
import ParentPerformance from './pages/parent/ParentPerformance';
import ParentNotifications from './pages/parent/ParentNotifications';
import ParentReports from './pages/parent/ParentReports';
import { useAuth } from './context/AuthContext';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/parent'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="teacher-report" element={<TeacherReportPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
      </Route>

      <Route
        path="/parent"
        element={
          <ProtectedRoute roles={['parent']}>
            <ParentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="performance" element={<ParentPerformance />} />
        <Route path="notifications" element={<ParentNotifications />} />
        <Route path="reports" element={<ParentReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
