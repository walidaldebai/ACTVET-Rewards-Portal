import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, get, child } from 'firebase/database';
import { LogIn, ShieldAlert, BadgeCheck, Zap, Award, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, setAdminUser } = useAuth();

  const isAdminPortal = window.location.hostname.includes('admin-') || window.location.search.includes('admin=true');

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminPortal) {
      setLoading(true);
      if (username === 'walid@actvet.gov.ae' && password === 'walidisEPIC@1234567890') {
        setAdminUser({
          id: 'admin-walid',
          name: 'Walid (Master Admin)',
          email: 'walid@actvet.gov.ae',
          role: 'Admin'
        });
        navigate('/');
      } else {
        setError('Invalid Master Admin credentials.');
        setLoading(false);
      }
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail.endsWith('@actvet.gov.ae')) {
      setError('Access restricted to validated @actvet.gov.ae accounts only.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = userCredential.user;

      // Verify in Realtime Database
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `Users/${fbUser.uid}`));

      if (!snapshot.exists()) {
        await auth.signOut();
        setError('Access Denied: Your account is not registered in the Institutional Active Directory.');
        return;
      }

      navigate('/');
    } catch (err: any) {
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-root ${isAdminPortal ? 'admin-mode' : ''}`}>
      <div className="login-split">
        <div className="login-brand-side premium-gradient">
          <div className="brand-overlay"></div>
          <div className="brand-content-v2">
            <div className="login-logo-v2">
              {isAdminPortal ? <Lock size={48} className="logo-icon-v2" /> : <Award size={48} className="logo-icon-v2" />}
              <span>{isAdminPortal ? 'ACTVET ADMIN' : 'ACTVET'}</span>
            </div>
            <div className="marketing-text">
              <h1>{isAdminPortal ? 'System Governance' : 'Student Rewards'}</h1>
              <p>Secure institutional access portal for ACTVET personnel.</p>
            </div>
          </div>
        </div>

        <div className="login-form-side">
          <div className="form-wrapper">
            <div className="form-header-v2">
              <h2>{isAdminPortal ? 'Master Administrator' : 'Secure Access'}</h2>
              <p>Please authenticate to proceed</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              {!isAdminPortal ? (
                <div className="auth-group">
                  <label>Institutional Email</label>
                  <input type="email" placeholder="name@actvet.gov.ae" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              ) : (
                <div className="auth-group">
                  <label>Master Admin Username</label>
                  <input type="text" placeholder="Enter Admin Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
              )}

              <div className="auth-group">
                <label>Access Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {error && (
                <div className="auth-error animate-shake">
                  <ShieldAlert size={20} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className={`login-btn-v2 ${isAdminPortal ? 'btn-admin' : ''}`} disabled={loading}>
                {loading ? <div className="loader-v2"></div> : <span>Authenticate Access</span>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .login-root { min-height: 100vh; background: white; }
        .login-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
        .login-brand-side { position: relative; display: flex; align-items: center; justify-content: center; padding: 5rem; color: white; background: #0f172a; }
        .premium-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); }
        .login-form-side { display: flex; align-items: center; justify-content: center; padding: 4rem; background: #f8fafc; }
        .form-wrapper { width: 100%; max-width: 400px; }
        .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .auth-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .auth-group input { padding: 1rem; border-radius: 12px; border: 2px solid #e2e8f0; }
        .login-btn-v2 { padding: 1rem; border-radius: 12px; background: #0f172a; color: white; border: none; font-weight: bold; cursor: pointer; }
        .auth-error { color: #ef4444; font-size: 0.9rem; display: flex; gap: 0.5rem; }
        .loader-v2 { width: 20px; height: 20px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .login-split { grid-template-columns: 1fr; } .login-brand-side { display: none; } }
      `}</style>
    </div>
  );
};

export default Login;
