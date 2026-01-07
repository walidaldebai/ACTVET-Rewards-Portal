import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
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

  // Detect if we are on the dedicated admin subdomain
  const isAdminPortal = window.location.hostname.includes('admin-');

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminPortal) {
      // MASTER ADMIN LOGIN LOGIC
      setLoading(true);
      if (username === 'Walid' && password === 'walidisEPIC@1234567890') {
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

    // REGULAR USER LOGIN LOGIC
    if (!email.toLowerCase().endsWith('@actvet.gov.ae')) {
      setError('Access restricted to validated @actvet.gov.ae accounts only.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Further role check happens in App.tsx / AuthContext
      navigate('/');
    } catch (err: any) {
      setError('Authentication failed. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-root ${isAdminPortal ? 'admin-mode' : ''}`}>
      <div className="login-split">
        {/* Left Side: Brand & Marketing */}
        <div className="login-brand-side premium-gradient">
          <div className="brand-overlay"></div>
          <div className="brand-content-v2">
            <div className="login-logo-v2">
              {isAdminPortal ? <Lock size={48} className="logo-icon-v2" /> : <Award size={48} className="logo-icon-v2" />}
              <span>{isAdminPortal ? 'ACTVET ADMIN' : 'ACTVET'}</span>
            </div>

            <div className="marketing-text">
              <h1>{isAdminPortal ? 'System Governance & Control' : 'The Future of Student Rewards'}</h1>
              <p>
                {isAdminPortal
                  ? 'Authorized administrator login. Access full system controls, user management, and rewards configuration.'
                  : 'Join the ecosystem that celebrates excellence, dedication, and academic achievement through tangible rewards.'}
              </p>
            </div>

            <div className="feature-badges">
              <div className="f-badge">
                <BadgeCheck size={20} />
                <span>{isAdminPortal ? 'Master Access' : 'Verified Governance'}</span>
              </div>
              <div className="f-badge">
                <Zap size={20} />
                <span>{isAdminPortal ? 'System Override' : 'Instant Redemptions'}</span>
              </div>
            </div>
          </div>

          <div className="login-decorative">
            <div className="circle c1"></div>
            <div className="circle c2"></div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="login-form-side">
          <div className="form-wrapper">
            <div className="form-header-v2">
              <h2>{isAdminPortal ? 'Master Administrator' : 'Secure Access'}</h2>
              <p>{isAdminPortal ? 'Identify via secure username protocol' : 'Enter your institutional credentials to proceed'}</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              {!isAdminPortal ? (
                <div className="auth-group">
                  <label>Institutional Email</label>
                  <div className="input-with-icon">
                    <input
                      type="email"
                      placeholder="name@actvet.gov.ae"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="auth-group">
                  <label>Master Admin Username</label>
                  <div className="input-with-icon">
                    <input
                      type="text"
                      placeholder="Enter Admin Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-group">
                <label>Access Password</label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="auth-error animate-shake">
                  <ShieldAlert size={20} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className={`login-btn-v2 ${isAdminPortal ? 'btn-admin' : ''}`} disabled={loading}>
                {loading ? (
                  <div className="loader-v2"></div>
                ) : (
                  <>
                    <span>{isAdminPortal ? 'Access Command Center' : 'Authenticate Access'}</span>
                    <LogIn size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer-v2">
              <p>{isAdminPortal ? 'MASTER CONSOLE • ACTVET GOVERNANCE v2.0' : 'Unauthorized access is strictly prohibited and monitored.'}</p>
              <div className="social-links-dummy">
                <span>Status: SECURE</span>
                <span className="dot">•</span>
                <span>ENC: AES-256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-root {
          min-height: 100vh;
          background: white;
          overflow: hidden;
        }
        .admin-mode .premium-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
        }
        .login-split {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          min-height: 100vh;
        }

        /* Left Side */
        .login-brand-side {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5rem;
          color: white;
          overflow: hidden;
        }
        .brand-overlay {
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=cover&q=80') center/cover;
          opacity: 0.1;
          mix-blend-mode: overlay;
        }
        .admin-mode .brand-overlay { opacity: 0.2; }
        .brand-content-v2 {
          position: relative;
          z-index: 10;
          max-width: 600px;
        }
        .login-logo-v2 {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: -1.5px;
          margin-bottom: 4rem;
        }
        .logo-icon-v2 { color: #fbbf24; }
        .admin-mode .logo-icon-v2 { color: #818cf8; }

        .marketing-text h1 { font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -2px; }
        .marketing-text p { font-size: 1.25rem; opacity: 0.8; line-height: 1.6; font-weight: 500; }

        .feature-badges { display: flex; gap: 1.5rem; margin-top: 3.5rem; }
        .f-badge { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.1); padding: 0.75rem 1.25rem; border-radius: 50px; font-weight: 700; font-size: 0.9rem; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }

        .login-decorative .circle { position: absolute; border-radius: 50%; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%); }
        .circle.c1 { width: 600px; height: 600px; top: -200px; left: -200px; }
        .circle.c2 { width: 400px; height: 400px; bottom: -100px; right: -100px; }

        /* Right Side */
        .login-form-side { display: flex; align-items: center; justify-content: center; padding: 4rem; background: #f8fafc; }
        .form-wrapper { width: 100%; max-width: 480px; }
        .form-header-v2 { margin-bottom: 3.5rem; }
        .form-header-v2 h2 { font-size: 2.4rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; margin-bottom: 0.5rem; }
        .form-header-v2 p { font-size: 1.1rem; color: #64748b; font-weight: 500; }

        .auth-form { display: flex; flex-direction: column; gap: 1.75rem; }
        .auth-group { display: flex; flex-direction: column; gap: 0.75rem; }
        .auth-group label { font-size: 0.9rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
        .auth-group input { width: 100%; padding: 1.1rem 1.5rem; border-radius: 18px; border: 2px solid #e2e8f0; background: white; font-size: 1rem; font-weight: 600; transition: all 0.3s ease; }
        .auth-group input:focus { outline: none; border-color: #0f172a; box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05); }

        .text-secondary { color: #6366f1 !important; }
        .admin-key-group input { border-color: #c7d2fe; background: #f5f3ff; }

        .auth-error { background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; padding: 1.25rem; border-radius: 18px; display: flex; align-items: flex-start; gap: 1rem; font-weight: 700; font-size: 0.9rem; line-height: 1.4; }
        
        .login-btn-v2 { width: 100%; padding: 1.25rem; border-radius: 18px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; gap: 1rem; font-weight: 800; font-size: 1.1rem; margin-top: 1rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; }
        .login-btn-v2:hover { background: #1e3a8a; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2); }
        .btn-admin { background: #4f46e5; }
        .btn-admin:hover { background: #4338ca; }
        .login-btn-v2:disabled { opacity: 0.7; transform: none; cursor: not-allowed; }

        .form-footer-v2 { margin-top: 4rem; text-align: center; }
        .form-footer-v2 p { font-size: 0.85rem; color: #94a3b8; font-weight: 600; margin-bottom: 1.5rem; }
        .social-links-dummy { display: flex; align-items: center; justify-content: center; gap: 1rem; font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

        .loader-v2 { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

        @media (max-width: 1024px) {
          .login-split { grid-template-columns: 1fr; }
          .login-brand-side { display: none; }
          .login-form-side { padding: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default Login;
