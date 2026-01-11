import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, firebaseConfig } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth';
import { ref, get, set, remove, update, child } from 'firebase/database';
import { seedInitialData } from '../lib/seeder';
import { Settings, UserPlus, Trash2, Edit3, Save, X, ShieldCheck, PieChart, Users, Key, Eye, EyeOff, RefreshCw, Database } from 'lucide-react';
import type { User, VoucherLevel, Role } from '../types';

const AdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVoucher, setEditingVoucher] = useState<string | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [systemStatus, setSystemStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');
    const [seeding, setSeeding] = useState(false);

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
            const dbRef = ref(db);
            const [userSnap, voucherSnap] = await Promise.all([
                get(child(dbRef, 'Users')),
                get(child(dbRef, 'Voucher_Levels'))
            ]);

            const fetchedUsers: User[] = [];
            if (userSnap.exists()) {
                userSnap.forEach((child) => {
                    fetchedUsers.push({ id: child.key, ...child.val() });
                });
            }

            const fetchedVouchers: VoucherLevel[] = [];
            if (voucherSnap.exists()) {
                voucherSnap.forEach((child) => {
                    fetchedVouchers.push({ id: child.key, ...child.val() });
                });
            }

            setUsers(fetchedUsers);
            setVouchers(fetchedVouchers);
            setSystemStatus('connected');
        } catch (error: any) {
            setSystemStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProvisionLoading(true);
        const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, newUserEmail, newUserPassword);
            const uid = userCredential.user.uid;
            const userData = {
                id: uid,
                name: newUserName,
                email: newUserEmail.toLowerCase(),
                role: newUserRole,
                password: newUserPassword,
                createdAt: new Date().toISOString()
            };

            await set(ref(db, `Users/${uid}`), userData);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            await authSignOut(tempAuth);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProvisionLoading(false);
            await deleteApp(tempApp);
        }
    };

    const handleRemoveUser = async (id: string) => {
        if (confirm('Remove this user?')) {
            await remove(ref(db, `Users/${id}`));
            fetchData();
        }
    };

    if (loading) return <div className="admin-loading">Loading Realtime Database...</div>;

    return (
        <div className="admin-container">
            <nav className="admin-nav premium-gradient">
                <div className="admin-nav-content">
                    <div className="admin-brand">
                        <ShieldCheck size={28} className="text-secondary" />
                        <span>ACTVET Admin (Realtime)</span>
                    </div>
                    <div className="admin-actions">
                        <button onClick={async () => {
                            setSeeding(true);
                            await seedInitialData();
                            setSeeding(false);
                            fetchData();
                        }} className="admin-refresh-btn" style={{ background: '#4f46e5', color: 'white' }}>
                            <Database size={18} />
                        </button>
                        <button onClick={fetchData} className="admin-refresh-btn"><RefreshCw size={18} /></button>
                        <button onClick={logout} className="admin-logout-btn">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="admin-main-content">
                {users.length === 0 && (
                    <div style={{ background: '#4f46e5', color: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                        <h2>Database is Empty</h2>
                        <p>Click the purple database icon above to seed test accounts.</p>
                    </div>
                )}

                <section className="admin-card glass-card">
                    <h2>Enroll Personnel</h2>
                    <form onSubmit={handleAddUser} className="admin-user-form">
                        <input type="text" placeholder="Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                        <input type="email" placeholder="Email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                        <input type="text" placeholder="Password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                        <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)}>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <button type="submit" disabled={provisionLoading}>Provision User</button>
                    </form>
                </section>

                <div className="table-container">
                    <table className="admin-data-table">
                        <thead><tr><th>User</th><th>Role</th><th>Password</th><th>Actions</th></tr></thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name} ({user.email})</td>
                                    <td>{user.role}</td>
                                    <td>{user.password}</td>
                                    <td><button onClick={() => handleRemoveUser(user.id)}><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <style>{`
                .admin-container { padding: 2rem; background: #f8fafc; min-height: 100vh; }
                .admin-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #0f172a; color: white; border-radius: 12px; margin-bottom: 2rem; }
                .admin-actions { display: flex; gap: 1rem; }
                .admin-refresh-btn { padding: 0.5rem; border-radius: 8px; border: none; cursor: pointer; }
                .admin-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                .admin-user-form { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
                .admin-user-form input, .admin-user-form select { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; }
                .admin-user-form button { grid-column: span 2; padding: 1rem; background: #0f172a; color: white; border-radius: 8px; border: none; cursor: pointer; }
                .admin-data-table { width: 100%; margin-top: 2rem; border-collapse: collapse; }
                .admin-data-table th, .admin-data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
                .admin-loading { display: flex; justify-content: center; align-items: center; height: 100vh; font-weight: bold; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
