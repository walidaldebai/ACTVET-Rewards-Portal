import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, firebaseConfig } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Settings, UserPlus, Trash2, Edit3, Save, X, ShieldCheck, PieChart, Users, Key, Eye, EyeOff } from 'lucide-react';
import type { User, VoucherLevel, Role } from '../types';

const AdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVoucher, setEditingVoucher] = useState<string | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [systemStatus, setSystemStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');

    // User Mgmt State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role>('Student');
    const [provisionLoading, setProvisionLoading] = useState(false);
    const [roleFilter, setRoleFilter] = useState<'All' | Role>('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setSystemStatus('syncing');
        try {
            const userSnap = await getDocs(collection(db, 'Users'));
            const voucherSnap = await getDocs(collection(db, 'Voucher_Levels'));

            setUsers(userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
            setVouchers(voucherSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoucherLevel)));
            setSystemStatus('connected');
        } catch (error) {
            console.error("Error fetching admin data:", error);
            setSystemStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Start: Account & Profile Provisioning...");

        if (!newUserEmail.endsWith('@actvet.gov.ae')) {
            alert('⚠️ Domain Violation\nInstitutional access only permitted for @actvet.gov.ae');
            return;
        }

        setProvisionLoading(true);

        // Initialize an isolated Firebase instance for user creation
        const tempAppName = `temp-provisioner-${Date.now()}`;
        let tempApp: any = null;

        try {
            tempApp = initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            console.log("1/2: Creating Firebase Auth Credentials...");

            // Create a timeout race to prevent infinite 'Processing' state
            const authPromise = createUserWithEmailAndPassword(tempAuth, newUserEmail, newUserPassword);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 10000));

            const userCredential: any = await Promise.race([authPromise, timeoutPromise]);
            const uid = userCredential.user.uid;

            console.log(`2/2: Mapping UID ${uid} to Firestore Profile...`);
            const userData = {
                id: uid,
                name: newUserName,
                email: newUserEmail,
                role: newUserRole,
                password: newUserPassword,
                grade: newUserRole === 'Student' ? 9 : null,
                points: newUserRole === 'Student' ? 0 : null,
                createdAt: new Date().toISOString(),
                status: 'Active'
            };

            await setDoc(doc(db, 'Users', uid), userData);

            console.log("Provisioning Protocol Complete.");

            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');

            await authSignOut(tempAuth);
            await fetchData();
            alert(`✅ SUCCESS\nAccount created for ${newUserName}.`);
        } catch (err: any) {
            console.error("Provisioning Error Details:", err);

            // FALLBACK: If Auth fails but Firestore is reachable, we might want to know
            if (err.message === 'Auth Timeout') {
                alert('❌ Connection Timeout\nThe server is taking too long to respond. Please check your internet connection or Firebase setup.');
            } else if (err.code === 'auth/email-already-in-use') {
                alert('❌ Task Failed: This email is already registered.');
            } else {
                alert(`❌ Error: ${err.message || 'Check browser console for details'}`);
            }
        } finally {
            setProvisionLoading(false);
            if (tempApp) {
                try {
                    await deleteApp(tempApp);
                } catch (e) {
                    console.error("Error deleting temp app:", e);
                }
            }
        }
    };

    const handleRemoveUser = async (id: string) => {
        if (confirm('Are you sure you want to remove this user? Access will be revoked immediately.')) {
            try {
                await deleteDoc(doc(db, 'Users', id));
                fetchData();
            } catch (error) {
                alert('Error removing user: ' + error);
            }
        }
    };

    const handleUpdateVoucher = async (id: string, updates: Partial<VoucherLevel>) => {
        try {
            await updateDoc(doc(db, 'Voucher_Levels', id), updates);
            setVouchers(vouchers.map(v => v.id === id ? { ...v, ...updates } : v));
        } catch (error) {
            alert('Error updating voucher: ' + error);
        }
    };

    if (loading) return <div className="admin-loading">Initializing Governance Console...</div>;

    return (
        <div className="admin-container">
            {/* Top Professional Header */}
            <nav className="admin-nav premium-gradient">
                <div className="admin-nav-content">
                    <div className="admin-brand">
                        <ShieldCheck size={28} className="text-secondary" />
                        <div className="brand-titles">
                            <span className="b-main">ACTVET Admin</span>
                            <span className="b-sub">Real-Time System Governance</span>
                        </div>
                    </div>
                    <div className="admin-actions">
                        <div className={`sys-status ${systemStatus}`}>
                            <div className="status-dot"></div>
                            <span>{systemStatus === 'connected' ? 'LIVE DATA SYNC' : systemStatus === 'syncing' ? 'SYNCING...' : 'CONNECTION REJECTED'}</span>
                        </div>
                        <button onClick={logout} className="admin-logout-btn">
                            <span>Secure Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="admin-main-content animate-fade-in">
                {/* Statistics Bar */}
                <div className="stats-row">
                    <div className="stat-card glass-card">
                        <div className="stat-icon blue"><Users size={24} /></div>
                        <div className="stat-info">
                            <span className="s-label">Total Users</span>
                            <span className="s-value">{users.length}</span>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon yellow"><Settings size={24} /></div>
                        <div className="stat-info">
                            <span className="s-label">Voucher Levels</span>
                            <span className="s-value">{vouchers.length}</span>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon green"><PieChart size={24} /></div>
                        <div className="stat-info">
                            <span className="s-label">System State</span>
                            <span className="s-value">READY</span>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon purple"><Key size={24} /></div>
                        <div className="stat-info">
                            <span className="s-label">Firestore</span>
                            <span className="s-value">CONNECTED</span>
                        </div>
                    </div>
                </div>

                <div className="admin-layout-grid">
                    {/* User Management Section */}
                    <section className="admin-card glass-card">
                        <div className="card-header-box">
                            <div className="h-left">
                                <UserPlus size={22} />
                                <h2>Enroll New Personnel</h2>
                            </div>
                        </div>

                        <form onSubmit={handleAddUser} className="admin-user-form">
                            <div className="input-group">
                                <label>Full Legal Name</label>
                                <input type="text" placeholder="John Doe" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Institutional Email</label>
                                <input type="email" placeholder="name@actvet.gov.ae" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Temporary Password</label>
                                <input type="text" placeholder="StartPwd2026!" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Assigned Role</label>
                                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)}>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher/Faculty</option>
                                    <option value="Admin">Administrator</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-admin-primary" disabled={provisionLoading}>
                                {provisionLoading ? 'Processing Access...' : 'Provision User'}
                            </button>
                        </form>

                        <div className="table-header-ctrl">
                            <div className="table-tabs">
                                <button className={`tab-item ${roleFilter === 'All' ? 'active' : ''}`} onClick={() => setRoleFilter('All')}>Overview</button>
                                <button className={`tab-item ${roleFilter === 'Student' ? 'active' : ''}`} onClick={() => setRoleFilter('Student')}>Students</button>
                                <button className={`tab-item ${roleFilter === 'Teacher' ? 'active' : ''}`} onClick={() => setRoleFilter('Teacher')}>Faculty</button>
                                <button className={`tab-item ${roleFilter === 'Admin' ? 'active' : ''}`} onClick={() => setRoleFilter('Admin')}>Admins</button>
                            </div>
                            <button className="text-btn" onClick={() => setShowPasswords(!showPasswords)}>
                                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
                            </button>
                        </div>

                        <div className="table-container">
                            <table className="admin-data-table">
                                <thead>
                                    <tr>
                                        <th>User Details</th>
                                        <th>Role</th>
                                        <th>Credential</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => roleFilter === 'All' || u.role === roleFilter).map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-list-cell">
                                                    <div className="u-init">{user.name.charAt(0)}</div>
                                                    <div className="u-info">
                                                        <span className="u-name">{user.name}</span>
                                                        <span className="u-email">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`admin-role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                                            </td>
                                            <td>
                                                <div className="pass-cell">
                                                    {showPasswords ? (
                                                        <span className="pass-plain">{user.password || 'N/A'}</span>
                                                    ) : (
                                                        <span className="pass-masked">••••••••</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <button className="row-action-btn red" onClick={() => handleRemoveUser(user.id)} title="Delete User">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Voucher Configuration Section */}
                    <section className="admin-card glass-card">
                        <div className="card-header-box">
                            <div className="h-left">
                                <Settings size={22} />
                                <h2>Global Voucher Config</h2>
                            </div>
                            <p className="header-hint">Adjust live voucher points and values.</p>
                        </div>

                        <div className="voucher-settings-list">
                            {vouchers.map(v => (
                                <div key={v.id} className={`voucher-config-row ${editingVoucher === v.id ? 'editing' : ''}`}>
                                    <div className="v-row-header">
                                        <div className="v-title-stack">
                                            {editingVoucher === v.id ? (
                                                <input className="edit-input" type="text" value={v.name} onChange={e => handleUpdateVoucher(v.id, { name: e.target.value })} />
                                            ) : (
                                                <span className="v-level-name">{v.name}</span>
                                            )}
                                            <span className="v-id">SEC: {v.id.substring(0, 8)}</span>
                                        </div>
                                        <div className="v-row-actions">
                                            {editingVoucher === v.id ? (
                                                <>
                                                    <button className="v-btn save" onClick={() => setEditingVoucher(null)}><Save size={18} /></button>
                                                    <button className="v-btn cancel" onClick={() => setEditingVoucher(null)}><X size={18} /></button>
                                                </>
                                            ) : (
                                                <button className="v-btn edit" onClick={() => setEditingVoucher(v.id)}><Edit3 size={18} /></button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="v-row-body">
                                        <div className="v-input-field">
                                            <label>Point Cost</label>
                                            <div className="input-with-label">
                                                <input
                                                    type="number"
                                                    disabled={editingVoucher !== v.id}
                                                    value={v.pointCost}
                                                    onChange={e => handleUpdateVoucher(v.id, { pointCost: Number(e.target.value) })}
                                                />
                                                <span>PTS</span>
                                            </div>
                                        </div>
                                        <div className="v-input-field">
                                            <label>Value</label>
                                            <div className="input-with-label">
                                                <input
                                                    type="number"
                                                    disabled={editingVoucher !== v.id}
                                                    value={v.valueAED}
                                                    onChange={e => handleUpdateVoucher(v.id, { valueAED: Number(e.target.value) })}
                                                />
                                                <span>AED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <style>{`
        .admin-container {
          min-height: 100vh;
          background: #f1f5f9;
        }

        /* Nav */
        .admin-nav {
          height: 90px;
          padding: 0 4rem;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .admin-nav-content { width: 100%; max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .admin-brand { display: flex; align-items: center; gap: 1.25rem; color: white; }
        .text-secondary { color: #fbbf24; }
        .brand-titles { display: flex; flex-direction: column; }
        .b-main { font-weight: 900; font-size: 1.4rem; letter-spacing: -0.5px; line-height: 1; }
        .b-sub { font-size: 0.75rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-top: 4px; }

        .admin-actions { display: flex; align-items: center; gap: 2.5rem; }
        .sys-status { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.15); padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.8rem; font-weight: 700; color: white; backdrop-filter: blur(10px); }
        .status-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; }
        .admin-logout-btn { background: rgba(255,255,255,1); color: #0f172a; padding: 0.7rem 1.4rem; border-radius: 12px; font-weight: 800; font-size: 0.85rem; transition: all 0.2s; }
        .admin-logout-btn:hover { background: #fee2e2; color: #ef4444; }

        /* Main Content */
        .admin-main-content { max-width: 1400px; margin: 0 auto; padding: 3rem 4rem; }

        /* Stats Row */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3.5rem; }
        .stat-card { padding: 1.5rem 2rem; border-radius: 20px; display: flex; align-items: center; gap: 1.5rem; border: 1px solid #e2e8f0; }
        .stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; }
        .stat-icon.blue { background: #3b82f6; }
        .stat-icon.yellow { background: #f59e0b; }
        .stat-icon.green { background: #10b981; }
        .stat-icon.purple { background: #8b5cf6; }
        .s-label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .s-value { font-size: 1.5rem; font-weight: 900; color: #0f172a; }

        /* Grid Layout */
        .admin-layout-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; }
        .admin-card { padding: 2.5rem; border-radius: 32px; background: white; border: 1px solid #e2e8f0; }
        .card-header-box { margin-bottom: 2.5rem; }
        .h-left { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        .h-left h2 { font-size: 1.6rem; font-weight: 900; color: #0f172a; }
        .header-hint { font-size: 0.95rem; color: #64748b; }

        /* Forms */
        .admin-user-form { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group.full { grid-column: span 2; }
        .input-group label { font-size: 0.85rem; font-weight: 700; color: #475569; }
        .admin-user-form input, .admin-user-form select { padding: 0.85rem 1.25rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; font-weight: 500; }
        .btn-admin-primary { grid-column: span 2; padding: 1.1rem; border-radius: 16px; background: #0f172a; color: white; font-weight: 800; font-size: 1rem; margin-top: 0.5rem; }

        /* Tables */
        .table-container { margin-top: 1rem; }
        .admin-data-table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
        .admin-data-table th { text-align: left; padding: 0.75rem 1.25rem; color: #94a3b8; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
        .admin-data-table td { padding: 1.25rem; background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .admin-data-table tr td:first-child { border-left: 1px solid #e2e8f0; border-radius: 16px 0 0 16px; }
        .admin-data-table tr td:last-child { border-right: 1px solid #e2e8f0; border-radius: 0 16px 16px 0; }

        .user-list-cell { display: flex; align-items: center; gap: 1rem; }
        .u-init { width: 38px; height: 38px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #475569; }
        .u-info { display: flex; flex-direction: column; }
        .u-name { font-weight: 700; font-size: 0.95rem; color: #1e293b; }
        .u-email { font-size: 0.75rem; color: #64748b; }
        
        .admin-role-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .admin-role-badge.student { background: #e0f2fe; color: #0369a1; }
        .admin-role-badge.teacher { background: #fef3c7; color: #92400e; }
        .admin-role-badge.admin { background: #ede9fe; color: #5b21b6; }

        .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: #10b981; }
        .status-indicator .dot.active { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }

        /* Voucher Config Rows */
        .voucher-settings-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .voucher-config-row { padding: 2rem; border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0; transition: all 0.3s ease; }
        .voucher-config-row.editing { border-color: #3b82f6; background: white; box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .v-row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .v-title-stack { display: flex; flex-direction: column; }
        .v-level-name { font-size: 1.3rem; font-weight: 800; color: #0f172a; }
        .v-id { font-size: 0.7rem; color: #94a3b8; font-weight: 700; }
        .v-row-actions { display: flex; gap: 0.5rem; }
        .v-btn { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .v-btn.edit { background: white; color: #64748b; border: 1px solid #e2e8f0; }
        .v-btn.save { background: #10b981; color: white; }
        .v-btn.cancel { background: #fee2e2; color: #ef4444; }

        .v-row-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .v-input-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .v-input-field label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
        .input-with-label { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; }
        .input-with-label input { border: none; outline: none; width: 100%; font-weight: 800; font-size: 1.1rem; color: #0f172a; }
        .input-with-label span { font-size: 0.8rem; font-weight: 800; color: #94a3b8; }
        .v-row-footer { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #3b82f6; cursor: pointer; }

        .admin-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #1e293b; background: #f1f5f9; font-size: 1.2rem; }
        .table-header-ctrl { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding: 0 1.25rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; }
        .table-tabs { display: flex; gap: 1rem; }
        .tab-item { background: none; border: none; padding: 0.5rem 1rem; font-weight: 800; font-size: 0.9rem; color: #94a3b8; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
        .tab-item:hover { background: #f1f5f9; color: #475569; }
        .tab-item.active { background: #e0f2fe; color: #0369a1; }

        .table-header-ctrl h3 { font-size: 1.2rem; font-weight: 900; color: #1e293b; }
        .text-btn { background: none; border: none; color: #3b82f6; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: opacity 0.2s; }
        .text-btn:hover { opacity: 0.7; }
        .sys-status.connected .status-dot { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
        .sys-status.syncing .status-dot { background: #3b82f6; animation: status-pulse 1.5s infinite; }
        .sys-status.error .status-dot { background: #ef4444; }
        .sys-status.error span { color: #ef4444; animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes status-pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

        .pass-cell { min-width: 120px; }
        .pass-plain { font-family: monospace; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 0.2rem 0.6rem; border-radius: 6px; }
        .pass-masked { color: #94a3b8; letter-spacing: 2px; }

        .btn-admin-primary:disabled { opacity: 0.6; cursor: wait; transform: none !important; }

        @media (max-width: 1280px) {
          .admin-nav { padding: 0 2rem; }
          .admin-main-content { padding: 2rem; }
          .stats-row { grid-template-columns: 1fr 1fr; }
          .admin-layout-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default AdminDashboard;
