import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD } from '../lib/firebase';
import { ref, get, child, set } from 'firebase/database';
import { Lock, ShieldAlert, ChevronRight, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

interface BrandPanelProps {}

const BrandPanel: React.FC<BrandPanelProps> = () => (
  <div className="brand-panel">
    <div className="brand-mesh"></div>
    <div className="brand-content animate-slide-up">
      <div className="logo-wrapper">
        <img src="/ats_logo.png" alt="ATS Logo" className="ats-logo-lg" />
      </div>
      <div className="brand-text">
        <h1>ATS Innovator<br /><span className="text-highlight">Portal</span></h1>
        <p>The institutional platform for excellence, recognition, and governance.</p>
      </div>

      <div className="brand-badges">
        <div className="badge-item">
          <ShieldAlert size={20} />
          <span>Secure Access</span>
        </div>
        <div className="badge-item">
          <User size={20} />
          <span>Identity Verified</span>
        </div>
      </div>
    </div>
  </div>
);

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
      const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
      if (isAdminPortal && isAdmin) {
        navigate('/admin');
      } else if (!isAdminPortal && !isAdmin) {
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

      // Master credentials from env/lib
      if (username === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
        try {
          // Attempt to sign in to Firebase for database access
          const userCredential = await signInWithEmailAndPassword(auth, username, password);
          
          // Ensure the user exists in the DB with Super Admin role
          const dbRef = ref(db);
          const snapshot = await get(child(dbRef, `Users/${userCredential.user.uid}`));
          if (!snapshot.exists()) {
            await set(ref(db, `Users/${userCredential.user.uid}`), {
              id: userCredential.user.uid,
              name: 'Walid (Master Admin)',
              email: MASTER_ADMIN_EMAIL,
              role: 'Super Admin',
              status: 'Active',
              createdAt: new Date().toISOString()
            });
          }
          
          setAdminUser({
            id: userCredential.user.uid,
            name: 'Walid (Master Admin)',
            email: MASTER_ADMIN_EMAIL,
            role: 'Super Admin'
          });
          navigate('/');
        } catch (e: any) {
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            try {
              // Create the master admin account if it doesn't exist in Firebase Auth
              const userCredential = await createUserWithEmailAndPassword(auth, username, password);
              await set(ref(db, `Users/${userCredential.user.uid}`), {
                id: userCredential.user.uid,
                name: 'Walid (Master Admin)',
                email: MASTER_ADMIN_EMAIL,
                role: 'Super Admin',
                status: 'Active',
                createdAt: new Date().toISOString()
              });
              
              setAdminUser({
                id: userCredential.user.uid,
                name: 'Walid (Master Admin)',
                email: MASTER_ADMIN_EMAIL,
                role: 'Super Admin'
              });
              navigate('/');
            } catch (createErr: any) {
              console.error("Master Admin: Failed to create account:", createErr);
              setError("Critical failure: Could not provision master account. " + createErr.message);
            }
          } else {
            console.error("Master Admin: Firebase Auth failed:", e.message);
            setError("Authentication failed: " + e.message);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setError('Authentication failed. Institutional bypass declined.');
        setLoading(false);
      }
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === MASTER_ADMIN_EMAIL && cleanPassword === MASTER_ADMIN_PASSWORD) {
      setLoading(true);
      try {
        // Attempt to sign in to Firebase for database access
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Ensure the user exists in the DB with Admin role
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `Users/${userCredential.user.uid}`));
        if (!snapshot.exists()) {
          await set(ref(db, `Users/${userCredential.user.uid}`), {
            id: userCredential.user.uid,
            name: 'Walid (Master Admin)',
              email: MASTER_ADMIN_EMAIL,
              role: 'Admin',
              status: 'Active',
              createdAt: new Date().toISOString()
            });
          }
          
          setAdminUser({
            id: userCredential.user.uid,
            name: 'Walid (Master Admin)',
            email: MASTER_ADMIN_EMAIL,
            role: 'Admin'
          });
        navigate('/');
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          try {
            // Create the master admin account if it doesn't exist in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            await set(ref(db, `Users/${userCredential.user.uid}`), {
              id: userCredential.user.uid,
              name: 'Walid (Master Admin)',
              email: MASTER_ADMIN_EMAIL,
              role: 'Super Admin',
              status: 'Active',
              createdAt: new Date().toISOString()
            });

            setAdminUser({
              id: userCredential.user.uid,
              name: 'Walid (Master Admin)',
              email: MASTER_ADMIN_EMAIL,
              role: 'Super Admin'
            });
            navigate('/');
          } catch (createErr: any) {
            console.error("Master Admin: Failed to create account:", createErr);
            setError("Critical failure: " + createErr.message);
          }
        } else {
          console.error("Master Admin: Firebase Auth failed:", e.message);
          setError("Authentication failed: " + e.message);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!cleanEmail.endsWith('@actvet.gov.ae')) {
      setError('Access restricted to validated @actvet.gov.ae accounts only.');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (signInErr: any) {
        // Auto-provision Staff account if it matches seeded credentials but doesn't exist in Auth
        if (cleanEmail === 'staff@actvet.gov.ae' && cleanPassword === 'StaffPass123!') {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          await set(ref(db, `Users/${userCredential.user.uid}`), {
            id: userCredential.user.uid,
            name: 'Staff',
            email: 'staff@actvet.gov.ae',
            role: 'Staff',
            status: 'Active',
            createdAt: new Date().toISOString()
          });
        } else {
          throw signInErr;
        }
      }
      
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
    <div className="login-container">
      <BrandPanel />

      {/* Right Login Form */}
      <div className="form-panel">
        <div className="form-content animate-fade-in">
          <div className="form-header">
            <h2>{isAdminPortal ? 'Governance Console' : 'Sign In'}</h2>
            <p>{isAdminPortal ? 'Authorized administrative personnel only.' : 'Access your dashboard with your institutional ID.'}</p>
          </div>

          {error && (
            <div className="error-banner">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            {!isAdminPortal ? (
              <div className="input-group">
                <label>Institutional Email</label>
                <div className="input-field">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="student@actvet.gov.ae"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="input-group">
                <label>Admin Identifier</label>
                <div className="input-field">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="admin.user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Password</label>
              <div className="input-field">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? <span className="loader"></span> : (
                <>
                  <span>Authenticate Access</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>Protected by ATS Institutional Governance Protocols.</p>
            <p className="version">v2.4.0 (Stable)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
