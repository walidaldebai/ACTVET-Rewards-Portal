import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, get, child } from 'firebase/database';
import { Lock, ShieldAlert, ChevronRight, User, Mail } from 'lucide-react';
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
    // Only redirect if the current user matches the portal type
    // This allows a student to access the ?admin=true gate without being kicked back to /student
    if (currentUser) {
      if (isAdminPortal && currentUser.role === 'Admin') {
        navigate('/admin');
      } else if (!isAdminPortal && currentUser.role !== 'Admin') {
        navigate('/');
      }
    }
  }, [currentUser, navigate, isAdminPortal]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminPortal) {
      setLoading(true);
      // Explicitly sign out any existing student/teacher session to prevent identity overlap
      await auth.signOut();

      // Master credentials from user request
      if (username === 'walid@actvet.gov.ae' && password === 'walidisEPIC@1234567890') {
        setAdminUser({
          id: 'admin-walid',
          name: 'Walid (Master Admin)',
          email: 'walid@actvet.gov.ae',
          role: 'Admin'
        });
        navigate('/');
      } else {
        setError('Authentication failed. Institutional bypass declined.');
        setLoading(false);
      }
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === 'walid@actvet.gov.ae' && cleanPassword === 'walidisEPIC@1234567890') {
      setLoading(true);
      setAdminUser({
        id: 'admin-walid',
        name: 'Walid (Master Admin)',
        email: 'walid@actvet.gov.ae',
        role: 'Admin'
      });
      navigate('/');
      return;
    }

    if (!cleanEmail.endsWith('@actvet.gov.ae')) {
      setError('Access restricted to validated @actvet.gov.ae accounts only.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = userCredential.user;

      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `Users/${fbUser.uid}`));

      if (!snapshot.exists()) {
        await auth.signOut();
        setError('Entity not found in ACTVET Active Directory.');
        return;
      }

      navigate('/');
    } catch (err: any) {
      setError('Verification failed. Please review your institutional credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-fade-in">
        <div className="login-brand-panel premium-gradient">
          <div className="brand-decoration-1"></div>
          <div className="brand-decoration-2"></div>
          <div className="brand-content">
            <div className="logo-badge" style={{ padding: '10px' }}>
              <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '80px', height: 'auto' }} />
            </div>
            <h1>ATS Innovator Portal</h1>
            <p>{isAdminPortal ? 'Institutional Governance Console' : 'Excellence Rewards & Recognition System'}</p>

            <div className="brand-features">
              <div className="feature">
                <ShieldAlert size={18} />
                <span>Secured by Azure AD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="form-header">
            <h2>{isAdminPortal ? 'Admin Gate' : 'Member Login'}</h2>
            <p>Authenticate with your institutional identity</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {!isAdminPortal ? (
              <div className="form-group">
                <label><Mail size={14} /> Institutional Email</label>
                <div className="input-wrapper">
                  <input type="email" placeholder="name@actvet.gov.ae" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label><User size={14} /> Admin Identifier</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="walid@actvet.gov.ae" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="form-group">
              <label><Lock size={14} /> Password</label>
              <div className="input-wrapper">
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {error && (
              <div className="login-error-toast">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-submit-btn accent-gradient" disabled={loading}>
              {loading ? <div className="spinner"></div> : (
                <>
                  <span>Proceed to Dashboard</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>© 2026 ACTVET Institutional Technology</p>
          </div>
        </div>
      </div>

      <style>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9;
                    background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px);
                    background-size: 24px 24px;
                    padding: 2rem;
                }
                .login-container {
                    display: grid;
                    grid-template-columns: 400px 500px;
                    background: white;
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.2);
                }
                .login-brand-panel {
                    position: relative;
                    padding: 4rem 3rem;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    overflow: hidden;
                }
                .brand-decoration-1 {
                    position: absolute;
                    top: -100px;
                    left: -100px;
                    width: 300px;
                    height: 300px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                }
                .brand-decoration-2 {
                    position: absolute;
                    bottom: -50px;
                    right: -50px;
                    width: 200px;
                    height: 200px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 50%;
                }
                .brand-content { position: relative; z-index: 10; }
                .logo-badge {
                    width: 80px;
                    height: 80px;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                .brand-content h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; }
                .brand-content p { font-size: 1.1rem; opacity: 0.8; line-height: 1.5; margin-bottom: 3rem; }
                
                .feature { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; font-weight: 600; opacity: 0.7; }

                .login-form-panel { padding: 4rem 5rem; display: flex; flex-direction: column; }
                .form-header { margin-bottom: 3rem; }
                .form-header h2 { font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
                .form-header p { color: #64748b; font-weight: 500; }

                .login-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.85rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 0.5rem; }
                .input-wrapper input {
                    width: 100%;
                    padding: 1rem 1.25rem;
                    border-radius: 16px;
                    border: 2px solid #f1f5f9;
                    background: #f8fafc;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                .input-wrapper input:focus { border-color: #6366f1; background: white; box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.15); }

                .login-error-toast { background: #fef2f2; border: 1px solid #fee2e2; padding: 1rem; border-radius: 12px; color: #ef4444; font-size: 0.9rem; font-weight: 600; text-align: center; }

                .login-submit-btn {
                    margin-top: 1rem;
                    padding: 1.25rem;
                    border-radius: 18px;
                    color: white;
                    font-weight: 800;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    box-shadow: 0 20px 30px -10px rgba(99, 102, 241, 0.4);
                }
                .login-submit-btn:hover { transform: translateY(-3px); box-shadow: 0 25px 40px -10px rgba(99, 102, 241, 0.5); }
                
                .form-footer { margin-top: auto; padding-top: 3rem; text-align: center; font-size: 0.8rem; font-weight: 600; color: #94a3b8; }
                
                .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) { .login-container { grid-template-columns: 1fr; max-width: 450px; } .login-brand-panel { display: none; } .login-form-panel { padding: 3rem 2rem; } }
            `}</style>
    </div>
  );
};

export default Login;
