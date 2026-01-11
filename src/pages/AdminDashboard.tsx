import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, firebaseConfig } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth';
import { ref, set, remove, update, onValue } from 'firebase/database';
import { seedInitialData } from '../lib/seeder';
import {
    Database,
    RefreshCw,
    Trash2,
    UserPlus,
    Search,
    LogOut,
    Users,
    Award,
    Activity,
    Trophy,
    GraduationCap,
    LayoutDashboard,
    BarChart3,
    CheckSquare,
    ChevronRight,
    Plus,
    School
} from 'lucide-react';
import type { User, Role, Grade, CampusClass } from '../types';

const AdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'faculty' | 'classes' | 'analytics'>('overview');

    // New User Form State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role>('Student');
    const [newUserSubject, setNewUserSubject] = useState('');
    const [newUserGrade, setNewUserGrade] = useState<Grade>(11);
    const [newUserClassId, setNewUserClassId] = useState(''); // Synced with dynamic classes
    const [provisionLoading, setProvisionLoading] = useState(false);

    // Dynamic Class Creation State
    const [newClassName, setNewClassName] = useState('');
    const [newClassGrade, setNewClassGrade] = useState<Grade>(11);

    // Teacher Management State
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        console.log("Initializing Admin Dashboard Data Sync...");

        // Listen for Users
        const usersRef = ref(db, 'Users');
        const usersUnsubscribe = onValue(usersRef, (snapshot) => {
            console.log("Users updated in Realtime DB");
            const fetchedUsers: User[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((userSnap) => {
                    fetchedUsers.push({ id: userSnap.key!, ...userSnap.val() });
                });
            }
            setUsers(fetchedUsers);
            setLoading(false);
        });

        // Listen for Classes
        const classesRef = ref(db, 'Classes');
        const classesUnsubscribe = onValue(classesRef, (snapshot) => {
            console.log("Classes updated:", snapshot.val());
            const fetchedClasses: CampusClass[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((classSnap) => {
                    fetchedClasses.push({ id: classSnap.key!, ...classSnap.val() });
                });
            }

            const sortedClasses = fetchedClasses.sort((a, b) => (a.grade - b.grade) || a.name.localeCompare(b.name));
            setClasses(sortedClasses);

            // Auto-select first class for provisioning if none selected
            if (sortedClasses.length > 0) {
                setNewUserClassId(prev => prev || sortedClasses[0].id);
            }
        });

        return () => {
            console.log("Cleaning up Admin listeners...");
            usersUnsubscribe();
            classesUnsubscribe();
        };
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProvisionLoading(true);
        const tempApp = initializeApp(firebaseConfig, `admin-prov-${Date.now()}`);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, newUserEmail, newUserPassword);
            const uid = userCredential.user.uid;
            const userData: any = {
                id: uid,
                name: newUserName,
                email: newUserEmail.toLowerCase(),
                role: newUserRole,
                password: newUserPassword,
                status: 'Active',
                createdAt: new Date().toISOString()
            };

            if (newUserRole === 'Teacher') {
                userData.subject = newUserSubject;
                userData.assignedClasses = [];
            } else if (newUserRole === 'Student') {
                userData.grade = newUserGrade;
                userData.classId = newUserClassId;
                userData.points = 0;
            }

            await set(ref(db, `Users/${uid}`), userData);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            await authSignOut(tempAuth);
            alert('🚀 Personnel profile provisioned successfully.');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProvisionLoading(false);
            await deleteApp(tempApp);
        }
    };

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName) {
            alert('Selection required.');
            return;
        }

        const classId = `${newClassGrade}-${newClassName}`;
        const classRef = ref(db, `Classes/${classId}`);

        try {
            await set(classRef, {
                grade: newClassGrade,
                name: newClassName
            });
            setNewClassName('');
            alert('🏫 Institutional class created.');
        } catch (err: any) {
            console.error("Class Creation Error:", err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('permission_denied')) {
                alert('🚨 Permission Denied: Please update your Firebase Realtime Database Rules to allow writing to the "Classes" node.');
            } else {
                alert(`❌ Failed to create class: ${err.message || 'Unknown Error'}`);
            }
        }
    };

    const handleRemoveClass = async (id: string) => {
        if (confirm(`Abolish Class ${id}? This will disconnect students and faculty assignments.`)) {
            await remove(ref(db, `Classes/${id}`));
        }
    };

    const handleRemoveUser = async (id: string) => {
        if (confirm('Permanently de-provision this profile? Access will be revoked immediately.')) {
            await remove(ref(db, `Users/${id}`));
        }
    };

    const runSeed = async () => {
        if (confirm('CRITICAL: Re-build institutional dataset? Existing test accounts may be duplicated.')) {
            setSeeding(true);
            await seedInitialData();
            setSeeding(false);
        }
    };

    const toggleClassAssignment = async (teacherId: string, classId: string) => {
        const teacher = users.find(u => u.id === teacherId);
        if (!teacher) return;

        const currentClasses = teacher.assignedClasses || [];
        const newClasses = currentClasses.includes(classId)
            ? currentClasses.filter(c => c !== classId)
            : [...currentClasses, classId];

        try {
            await update(ref(db, `Users/${teacherId}`), { assignedClasses: newClasses });
        } catch (error) {
            alert('Failed to update class assignment.');
        }
    };

    const getClassRankings = () => {
        const classStats: Record<string, { id: string, total: number, count: number }> = {};
        users.filter(u => u.role === 'Student').forEach(s => {
            if (!s.classId) return;
            if (!classStats[s.classId]) classStats[s.classId] = { id: s.classId, total: 0, count: 0 };
            classStats[s.classId].total += (s.points || 0);
            classStats[s.classId].count += 1;
        });
        return Object.values(classStats).sort((a, b) => (b.total / (b.count || 1)) - (a.total / (a.count || 1)));
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="admin-loader-screen">
            <div className="spinner-large"></div>
            <span>Accessing Institutional Core...</span>
        </div>
    );

    const selectedTeacher = users.find(u => u.id === selectedTeacherId);

    return (
        <div className="admin-app">
            <aside className="a-sidebar glass-card">
                <div className="a-sidebar-head">
                    <div className="a-logo">
                        <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '100%', height: 'auto' }} />
                    </div>
                    <div className="a-brand">
                        <span className="a-main">ATS Innovator Portal</span>
                        <span className="a-sub">GOVERNANCE ENGINE</span>
                    </div>
                </div>

                <nav className="a-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        <LayoutDashboard size={18} />
                        <span>Command Center</span>
                    </button>
                    <button className={activeTab === 'directory' ? 'active' : ''} onClick={() => setActiveTab('directory')}>
                        <Users size={18} />
                        <span>User Registry</span>
                    </button>
                    <button className={activeTab === 'faculty' ? 'active' : ''} onClick={() => setActiveTab('faculty')}>
                        <GraduationCap size={18} />
                        <span>Faculty Manager</span>
                    </button>
                    <button className={activeTab === 'classes' ? 'active' : ''} onClick={() => setActiveTab('classes')}>
                        <School size={18} />
                        <span>Campus Classes</span>
                    </button>
                    <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
                        <BarChart3 size={18} />
                        <span>Analytics</span>
                    </button>
                    <button onClick={runSeed} className={seeding ? 'spin' : ''}>
                        <Database size={18} />
                        <span>Rebuild Data</span>
                    </button>
                </nav>

                <div className="a-sidebar-foot">
                    <button onClick={logout} className="p-logout-btn">
                        <LogOut size={18} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            <main className="a-workspace animate-fade-in">
                <header className="a-header">
                    <div className="a-h-titles">
                        <h1>{activeTab === 'overview' ? 'ATS Command Center' : activeTab === 'classes' ? 'Class Architecture' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                        <p>Welcome, ATS Innovator. Monitoring {users.length} authenticated entities.</p>
                    </div>
                    <div className="a-sync">
                        <RefreshCw size={14} className="spin-slow" />
                        <span>SECURE LINK ACTIVE</span>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="a-dashboard-grid animate-fade-in">
                        <section className="a-card welcome-card premium-gradient span-2">
                            <div className="w-content">
                                <h2>System Health: Optimal</h2>
                                <p>All database clusters are synchronized. Active sessions: {Math.floor(users.length * 0.4)} users.</p>
                                <div className="w-stats">
                                    <div className="w-stat">
                                        <span className="w-val">{users.filter(u => u.role === 'Student').length}</span>
                                        <span className="w-lbl">STUDENTS</span>
                                    </div>
                                    <div className="w-divider"></div>
                                    <div className="w-stat">
                                        <span className="w-val">{users.filter(u => u.role === 'Teacher').length}</span>
                                        <span className="w-lbl">FACULTY</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="a-card glass-card">
                            <div className="a-card-head">
                                <UserPlus className="text-blue" />
                                <h2>Provision User</h2>
                            </div>
                            <form onSubmit={handleAddUser} className="a-form">
                                <input type="text" placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                                <input type="email" placeholder="Institutional Email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                                <div className="f-row">
                                    <input type="text" placeholder="Access Code" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)}>
                                        <option value="Student">Student</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                {newUserRole === 'Teacher' && (
                                    <input type="text" placeholder="Subject" value={newUserSubject} onChange={e => setNewUserSubject(e.target.value)} required />
                                )}
                                {newUserRole === 'Student' && (
                                    <div className="f-row">
                                        <select value={newUserGrade} onChange={e => {
                                            const grade = Number(e.target.value) as Grade;
                                            setNewUserGrade(grade);
                                            // Reset class selection when grade changes
                                            const firstForGrade = classes.find(c => c.grade === grade);
                                            setNewUserClassId(firstForGrade ? firstForGrade.id : '');
                                        }}>
                                            <option value={9}>G9</option><option value={10}>G10</option><option value={11}>G11</option><option value={12}>G12</option>
                                        </select>
                                        <select value={newUserClassId} onChange={e => setNewUserClassId(e.target.value)} required>
                                            <option value="" disabled>Select Section</option>
                                            {classes.filter(c => c.grade === newUserGrade).map(c => (
                                                <option key={c.id} value={c.id}>S{c.name} (Grade {c.grade})</option>
                                            ))}
                                            {classes.filter(c => c.grade === newUserGrade).length === 0 && (
                                                <option value="" disabled>No classes for G{newUserGrade}</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                                <button type="submit" className="a-submit-btn accent-gradient" disabled={provisionLoading}>
                                    {provisionLoading ? 'Provisioning...' : 'Activate Entity'}
                                </button>
                            </form>
                        </section>

                        <section className="a-card glass-card span-all">
                            <div className="a-card-head">
                                <Activity className="text-purple" />
                                <h2>Recent System Activity</h2>
                            </div>
                            <div className="a-table-container">
                                <table className="a-table">
                                    <thead><tr><th>User</th><th>Role</th><th>Institutional Email / Access</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {users.slice(0, 5).map(user => (
                                            <tr key={user.id}>
                                                <td><div className="u-cell"><div className={`u-avatar ${user.role.toLowerCase()}`}>{user.name.charAt(0)}</div><div>{user.name}</div></div></td>
                                                <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                                                <td className="text-mono">
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>{user.email}</span>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, letterSpacing: '0.1em' }}>PASS: {user.password || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td><button onClick={() => handleRemoveUser(user.id)} className="a-delete-btn"><Trash2 size={14} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'directory' && (
                    <div className="a-directory animate-fade-in">
                        <div className="a-section-head">
                            <h2>User Registry</h2>
                            <div className="a-search glass-card">
                                <Search size={18} />
                                <input type="text" placeholder="Filter entities..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="p-students-table-wrapper glass-card">
                            <table className="a-table">
                                <thead><tr><th>Entity</th><th>Institutional Access</th><th>Access Code</th><th>Role</th><th>UID</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td><div className="u-cell"><div className={`u-avatar ${user.role.toLowerCase()}`}>{user.name.charAt(0)}</div><strong>{user.name}</strong></div></td>
                                            <td>{user.email}</td>
                                            <td className="text-mono" style={{ fontWeight: 700 }}>{user.password || 'N/A'}</td>
                                            <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                                            <td className="text-mono">{user.id.substring(0, 8)}</td>
                                            <td><button onClick={() => handleRemoveUser(user.id)} className="a-delete-btn"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'faculty' && (
                    <div className="a-faculty-grid animate-fade-in">
                        <section className="a-card glass-card">
                            <div className="a-card-head">
                                <GraduationCap className="text-blue" />
                                <h2>Faculty List</h2>
                            </div>
                            <div className="a-faculty-list">
                                {users.filter(u => u.role === 'Teacher').map(teacher => (
                                    <div key={teacher.id} className={`f-item ${selectedTeacherId === teacher.id ? 'active' : ''}`} onClick={() => setSelectedTeacherId(teacher.id)}>
                                        <div className="f-avatar">{teacher.name.charAt(0)}</div>
                                        <div className="f-info">
                                            <strong>{teacher.name}</strong>
                                            <span>{teacher.subject}</span>
                                        </div>
                                        <ChevronRight size={18} className="f-chevron" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="a-card glass-card">
                            <div className="a-card-head">
                                <CheckSquare className="text-purple" />
                                <h2>Class Assignments</h2>
                            </div>
                            {selectedTeacher ? (
                                <div className="assignment-manager">
                                    <div className="manager-header">
                                        <h3>Assign classes to {selectedTeacher.name}</h3>
                                        <p>Teachers can only validate tasks for students in assigned classes.</p>
                                    </div>
                                    <div className="class-checklist">
                                        {classes.map(cls => (
                                            <label key={cls.id} className="checklist-item glass-card">
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedTeacher.assignedClasses || []).includes(cls.id)}
                                                    onChange={() => toggleClassAssignment(selectedTeacher.id, cls.id)}
                                                />
                                                <div className="checkbox-custom"></div>
                                                <span>Class {cls.id}</span>
                                            </label>
                                        ))}
                                        {classes.length === 0 && (
                                            <p className="no-data">No campus classes defined. Go to "Campus Classes" tab to add them.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="a-empty-state">
                                    <GraduationCap size={48} />
                                    <p>Select a teacher to manage class assignments.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div className="a-classes-section animate-fade-in">
                        <div className="a-dashboard-grid">
                            <section className="a-card glass-card">
                                <div className="a-card-head">
                                    <Plus className="text-blue" />
                                    <h2>Create New Class</h2>
                                </div>
                                <form onSubmit={handleAddClass} className="a-form">
                                    <div className="f-row">
                                        <div className="f-group">
                                            <label>Grade Level</label>
                                            <select value={newClassGrade} onChange={e => setNewClassGrade(Number(e.target.value) as Grade)}>
                                                <option value={9}>Grade 9</option>
                                                <option value={10}>Grade 10</option>
                                                <option value={11}>Grade 11</option>
                                                <option value={12}>Grade 12</option>
                                            </select>
                                        </div>
                                        <div className="f-group">
                                            <label>Section Number</label>
                                            <select value={newClassName} onChange={e => setNewClassName(e.target.value)} required>
                                                <option value="">Select Section</option>
                                                <option value="1">Section 1</option>
                                                <option value="2">Section 2</option>
                                                <option value="3">Section 3</option>
                                                <option value="4">Section 4</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="a-submit-btn accent-gradient">Initialize Class</button>
                                </form>
                            </section>

                            <section className="a-card glass-card">
                                <div className="a-card-head">
                                    <School className="text-purple" />
                                    <h2>Institutional Directory</h2>
                                </div>
                                <div className="class-grid-v2">
                                    {loading && classes.length === 0 && (
                                        <div className="a-loading-inline">
                                            <RefreshCw className="spin-slow" />
                                            <span>Synchronizing Registry...</span>
                                        </div>
                                    )}
                                    {classes.map(c => (
                                        <div key={c.id} className="class-card-v3 glass-card">
                                            <div className="c-info">
                                                <span className="c-grade">GRADE {c.grade}</span>
                                                <span className="c-id">Class {c.name}</span>
                                            </div>
                                            <button onClick={() => handleRemoveClass(c.id)} className="c-delete"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    {classes.length === 0 && (
                                        <div className="a-empty-state">
                                            <School size={48} opacity={0.2} />
                                            <p>No classes defined.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="a-analytics animate-fade-in">
                        <div className="rankings-grid">
                            <section className="a-card glass-card">
                                <div className="a-card-head">
                                    <Trophy size={24} className="icon-gold" />
                                    <h2>Class Leaderboard</h2>
                                </div>
                                <div className="rank-list">
                                    {getClassRankings().map((c, i) => (
                                        <div key={c.id} className="rank-item-v3">
                                            <span className="r-pos">{i + 1}</span>
                                            <div className="r-info">
                                                <strong>Class {c.id}</strong>
                                                <span>{c.count} students</span>
                                            </div>
                                            <span className="r-pts">{Math.round(c.total / (c.count || 1))} AVG</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="a-card glass-card">
                                <div className="a-card-head">
                                    <Award size={24} className="icon-blue" />
                                    <h2>Top Global Students</h2>
                                </div>
                                <div className="rank-list">
                                    {users.filter(u => u.role === 'Student').sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10).map((s, i) => (
                                        <div key={s.id} className="rank-item-v3">
                                            <span className="r-pos">{i + 1}</span>
                                            <div className="r-info">
                                                <strong>{s.name}</strong>
                                                <span>{s.classId}</span>
                                            </div>
                                            <span className="r-pts">{s.points} PTS</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .admin-app { display: flex; min-height: 100vh; background: #f8fafc; }
                
                /* Sidebar */
                .a-sidebar { width: 260px; position: fixed; height: 100vh; background: white; padding: 2rem 1.5rem; display: flex; flex-direction: column; z-index: 100; border-radius: 0 !important; }
                .a-sidebar-head { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 4rem; }
                .a-logo { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; }
                .a-brand { display: flex; flex-direction: column; }
                .a-main { font-weight: 900; font-size: 1.3rem; letter-spacing: -0.05em; color: #020617; }
                .a-sub { font-size: 0.7rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.1em; }
                
                .a-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                .a-nav button { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 16px; font-weight: 700; color: #64748b; background: none; transition: 0.2s; text-align: left; }
                .a-nav button.active { background: #f1f5f9; color: #020617; }
                
                .a-sidebar-foot { margin-top: auto; padding-top: 1rem; }
                .p-logout-btn { width: 100%; display: flex; align-items: center; gap: 0.75rem; color: #94a3b8; font-weight: 800; font-size: 0.9rem; padding: 1rem; border-radius: 14px; transition: all 0.2s; border: 1px solid transparent; background: none; cursor: pointer; }
                .p-logout-btn:hover { color: #ef4444; background: #fef2f2; border-color: #fee2e2; }
                .p-logout-btn:hover svg { transform: translateX(3px); }
                .p-logout-btn svg { transition: transform 0.2s; }
                
                /* Workspace */
                .a-workspace { flex: 1; margin-left: 260px; padding: 2.5rem 4rem; max-width: 1600px; margin-right: auto; }
                .a-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
                .a-h-titles h1 { font-size: 2rem; font-weight: 900; color: #020617; letter-spacing: -0.05em; }
                .a-h-titles p { color: #64748b; font-weight: 600; margin-top: 0.25rem; }
                .a-sync { display: flex; align-items: center; gap: 0.5rem; background: white; padding: 0.7rem 1.25rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900; color: #94a3b8; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
                
                /* Cards */
                .a-dashboard-grid { display: grid; grid-template-columns: 1fr 400px; gap: 3rem; }
                .a-card { padding: 2rem; border-radius: 20px; }
                .span-2 { grid-column: span 1; }
                .span-all { grid-column: 1 / -1; }
                
                .welcome-card { color: white; display: flex; align-items: center; background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%); }
                .w-content h2 { font-size: 1.5rem; font-weight: 900; margin-bottom: 0.5rem; }
                .w-content p { opacity: 0.7; margin-bottom: 2rem; font-weight: 500; }
                .w-stats { display: flex; gap: 3rem; }
                .w-stat { display: flex; flex-direction: column; }
                .w-val { font-size: 2.2rem; font-weight: 900; line-height: 1; }
                .w-lbl { font-size: 0.7rem; font-weight: 800; opacity: 0.5; margin-top: 0.5rem; letter-spacing: 0.1em; }
                .w-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }
                
                .a-card-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                .a-card-head h2 { font-size: 1.25rem; font-weight: 900; }
                
                .a-form { display: flex; flex-direction: column; gap: 1rem; }
                .a-form input, .a-form select { padding: 1rem; border-radius: 14px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 700; width: 100%; }
                .f-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .f-group { display: flex; flex-direction: column; gap: 0.4rem; }
                .f-group label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-left: 0.5rem; }
                .a-submit-btn { padding: 1.1rem; border-radius: 16px; color: white; font-weight: 900; margin-top: 0.5rem; }
                
                /* Class Grid */
                .class-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
                .class-card-v3 { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-radius: 18px; transition: 0.2s; background: white; border: 1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                .class-card-v3:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
                .c-info { display: flex; flex-direction: column; gap: 0.2rem; }
                .c-grade { font-size: 0.7rem; font-weight: 900; color: #6366f1; letter-spacing: 0.05em; }
                .c-id { font-weight: 800; color: #0f172a; font-size: 1.15rem; line-height: 1.2; }
                .c-delete { color: #f87171; width: 36px; height: 36px; border-radius: 10px; background: #fef2f2; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .c-delete:hover { background: #fee2e2; color: #ef4444; }
                
                /* Registry Table */
                .a-table-container { overflow-x: auto; }
                .a-table { width: 100%; border-collapse: collapse; }
                .a-table th { text-align: left; padding: 1.25rem; font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
                .a-table td { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; }
                .u-cell { display: flex; align-items: center; gap: 1rem; font-weight: 800; }
                .u-avatar { width: 36px; height: 36px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
                .u-avatar.admin { background: #fef3c7; color: #d97706; }
                .u-avatar.teacher { background: #e0f2fe; color: #0369a1; }
                .u-avatar.student { background: #f3e8ff; color: #7e22ce; }
                .role-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
                .role-badge.admin { background: #fef3c7; color: #92400e; }
                .role-badge.teacher { background: #e0f2fe; color: #0369a1; }
                .role-badge.student { background: #f3e8ff; color: #7e22ce; }
                .a-delete-btn { width: 32px; height: 32px; border-radius: 8px; background: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .a-delete-btn:hover { background: #fee2e2; transform: scale(1.1); }
                
                /* Faculty Class Manager */
                .a-faculty-grid { display: grid; grid-template-columns: 350px 1fr; gap: 3rem; }
                .a-faculty-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .f-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border-radius: 20px; background: #f1f5f9; cursor: pointer; transition: 0.2s; border: 2px solid transparent; }
                .f-item:hover { background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .f-item.active { background: white; border-color: #6366f1; }
                .f-avatar { width: 44px; height: 44px; border-radius: 12px; background: #020617; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                .f-info { flex: 1; display: flex; flex-direction: column; }
                .f-info strong { font-weight: 900; color: #0f172a; }
                .f-info span { font-size: 0.75rem; color: #64748b; font-weight: 700; }
                .f-chevron { color: #cbd5e1; transition: 0.2s; }
                .f-item.active .f-chevron { color: #6366f1; transform: translateX(5px); }
                
                .manager-header { margin-bottom: 2rem; }
                .manager-header h3 { font-size: 1.4rem; font-weight: 900; }
                .manager-header p { font-size: 0.9rem; color: #64748b; font-weight: 600; }
                
                .class-checklist { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
                .checklist-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border-radius: 20px; cursor: pointer; transition: 0.2s; position: relative; }
                .checklist-item input { position: absolute; opacity: 0; cursor: pointer; }
                .checkbox-custom { width: 24px; height: 24px; border-radius: 8px; border: 2px solid #cbd5e1; background: white; transition: 0.2s; }
                .checklist-item input:checked ~ .checkbox-custom { background: #6366f1; border-color: #6366f1; transform: scale(1.1); }
                .checklist-item span { font-weight: 800; color: #475569; }
                .checklist-item input:checked ~ span { color: #020617; }
                
                .a-empty-state { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #cbd5e1; text-align: center; }
                .a-empty-state p { margin-top: 1rem; font-weight: 700; }
                .no-data { grid-column: 1 / -1; color: #94a3b8; font-weight: 600; text-align: center; padding: 2rem; }
                
                /* Analytics */
                .rankings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
                .rank-item-v3 { display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem; background: #f8fafc; border-radius: 20px; }
                .r-pts { margin-left: auto; font-weight: 900; color: #6366f1; }
                
                .spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
