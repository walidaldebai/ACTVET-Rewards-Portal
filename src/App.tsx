import React from 'react';
import './styles/App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { currentUser, loading, logout } = useAuth();
  const isAdminPortal = window.location.hostname.includes('admin-') || window.location.search.includes('admin=true');

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Verifying Access...</p>
    </div>
  );

  if (!currentUser) return <Navigate to="/login" />;

  // Block non-admins from the admin subdomain even if they bypass HomeRedirect
  if (isAdminPortal && currentUser.role !== 'Admin') {
    logout();
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const HomeRedirect = () => {
  const { currentUser, logout } = useAuth();
  const isAdminPortal = window.location.hostname.includes('admin-') || window.location.search.includes('admin=true');

  if (!currentUser) return <Navigate to="/login" />;

  // Enforce subdomain restrictions
  if (isAdminPortal && currentUser.role !== 'Admin') {
    // If a non-admin is on the admin portal, kick them out
    logout();
    return <Navigate to="/login" />;
  }

  if (!isAdminPortal && currentUser.role === 'Admin') {
    // Optional: Redirect admin to their dedicated domain if they land on the regular site
    // For now, just show them the admin dashboard or student view
    return <Navigate to="/admin" />;
  }

  switch (currentUser.role) {
    case 'Admin': return <Navigate to="/admin" />;
    case 'Teacher': return <Navigate to="/teacher" />;
    default: return <Navigate to="/student" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['Teacher', 'Admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
