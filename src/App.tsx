import React from 'react';
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
  const { currentUser, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Verifying Access...</p>
    </div>
  );

  if (!currentUser) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const HomeRedirect = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;

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

      <style>{`
        .loading-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%);
          color: white;
          gap: 1.5rem;
          font-family: 'Inter', sans-serif;
        }
        .loader {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.1);
          border-left-color: #fbbf24;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-screen p {
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-size: 0.85rem;
          color: #94a3b8;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AuthProvider>
  );
}

export default App;
