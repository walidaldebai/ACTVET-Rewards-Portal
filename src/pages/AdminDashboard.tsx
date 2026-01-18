import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db, firebaseConfig } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth';
import { ref, set, remove, update, onValue, push, query, orderByChild } from 'firebase/database';
import { seedInitialData } from '../lib/seeder';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AdminOverview from '../components/AdminOverview';
import UserRegistry from '../components/UserRegistry';
import FacultyManager from '../components/FacultyManager';
import ClassManager from '../components/ClassManager';
import AnalyticsSection from '../components/AnalyticsSection';
import VoucherManager from '../components/VoucherManager';
import RedemptionManager from '../components/RedemptionManager';
import type { User, Role, Grade, CampusClass, Redemption } from '../types';
import '../styles/AdminDashboard.css';

const AdminDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'faculty' | 'classes' | 'analytics' | 'vouchers' | 'redemptions'>('overview');

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

    // Voucher State
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [newVoucherTitle, setNewVoucherTitle] = useState('');
    const [newVoucherCost, setNewVoucherCost] = useState(500);
    const [newVoucherAEDValue, setNewVoucherAEDValue] = useState(10);

    // Redemption State
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);

    // Edit Mode State
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [editClassId, setEditClassId] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Super Admin')) return;

        // AUTH LOGGING: Check exact state of Firebase Auth
        console.log("Admin Dashboard: Auth Check", {
            contextUser: currentUser.email,
            firebaseUser: auth.currentUser?.email,
            uid: auth.currentUser?.uid,
            role: currentUser.role
        });

        if (!auth.currentUser) {
            console.warn("Admin Dashboard: Waiting for Firebase Auth...");
            setLoading(false); 
            return;
        }

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
            setDbError(null);
        }, (error) => {
            console.error("Firebase Read Error (Users):", error);
            setLoading(false);
            setDbError(error.message);
            // Only alert if it's a persistent issue after initial load
            if (users.length === 0) {
                console.warn("Database access restricted. Check Firebase Security Rules.");
            }
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

            if (sortedClasses.length > 0) {
                setNewUserClassId(prev => prev || sortedClasses[0].id);
            }
        }, (error) => {
            console.error("Firebase Read Error (Classes):", error);
        });

        // Listen for Vouchers
        const vouchersRef = ref(db, 'Voucher_Levels');
        const vouchersUnsubscribe = onValue(vouchersRef, (snapshot) => {
            const fetched: any[] = [];
            snapshot.forEach(child => { fetched.push({ id: child.key, ...child.val() }); });
            const sorted = fetched.sort((a, b) => a.pointCost - b.pointCost);
            setVouchers(sorted);
            
            // Proactive cleanup: Rename Canteen to Staff if found in DB data
            fetched.forEach((v: any) => {
                if (v.name && v.name.includes('Canteen')) {
                    const newName = v.name.replace('Canteen', 'Staff');
                    update(ref(db, `Voucher_Levels/${v.id}`), { name: newName });
                }
            });
        }, (error) => {
            console.error("Firebase Read Error (Vouchers):", error);
        });

        // Listen for Redemptions
        const redemptionsRef = ref(db, 'Redemption_Requests');
        const redemptionsQuery = query(redemptionsRef, orderByChild('studentId'));
        const redemptionsUnsubscribe = onValue(redemptionsQuery, (snapshot) => {
            const fetchedRedemptions: Redemption[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((redSnap) => {
                    fetchedRedemptions.push({ id: redSnap.key!, ...redSnap.val() });
                });
            }
            setRedemptions(fetchedRedemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        });

        return () => {
            usersUnsubscribe();
            classesUnsubscribe();
            vouchersUnsubscribe();
            redemptionsUnsubscribe();
        };
    }, [currentUser, auth.currentUser]); // Added auth.currentUser to force re-run when auth initializes

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProvisionLoading(true);

        // EDIT MODE
        if (editUserId) {
            try {
                const updates: any = {
                    name: newUserName,
                    email: newUserEmail.toLowerCase(),
                    role: newUserRole,
                    password: newUserPassword, // In a real app, handle password separately
                };
                if (newUserRole === 'Teacher') {
                    updates.subject = newUserSubject;
                } else if (newUserRole === 'Student') {
                    updates.grade = newUserGrade;
                    updates.classId = newUserClassId;
                }

                await update(ref(db, `Users/${editUserId}`), updates);
                alert('Profile updated successfully.');
                setEditUserId(null);
                setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
            } catch (err: any) {
                alert(err.message);
            } finally {
                setProvisionLoading(false);
            }
            return;
        }

        // CREATE MODE
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

    const startEditUser = (user: User) => {
        setEditUserId(user.id);
        setNewUserName(user.name);
        setNewUserEmail(user.email);
        setNewUserPassword(user.password || '');
        setNewUserRole(user.role);
        if (user.role === 'Student') {
            setNewUserGrade(user.grade || 11);
            setNewUserClassId(user.classId || '');
        } else if (user.role === 'Teacher') {
            setNewUserSubject(user.subject || '');
        }
        setActiveTab('overview'); // Switch to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddVoucher = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final auth check before push
        if (!auth.currentUser) {
            alert("Error: Firebase Authentication is not active. Please refresh the page.");
            return;
        }

        console.log("Attempting to add voucher as:", auth.currentUser.email);

        try {
            const newRef = push(ref(db, 'Voucher_Levels'));
            await set(newRef, {
                name: newVoucherTitle,
                pointCost: Number(newVoucherCost),
                aedValue: Number(newVoucherAEDValue),
                description: `AED ${newVoucherAEDValue} Staff Credit`,
                minGrade: 0 // Available to all for now
            });
            setNewVoucherTitle('');
            setNewVoucherCost(500);
            setNewVoucherAEDValue(10);
            alert('Voucher added.');
        } catch (err: any) {
            console.error("Voucher Creation Error:", err);
            let errorMsg = err.message;
            if (err.message.includes('PERMISSION_DENIED')) {
                errorMsg = "Permission Denied. Please ensure you are logged in as an Admin and your session hasn't expired. Try clicking 'Re-authenticate' if you see the warning.";
            }
            alert('Failed to add voucher: ' + errorMsg);
        }
    };

    const handleDeleteVoucher = async (id: string) => {
        if (confirm('Delete this voucher?')) await remove(ref(db, `Voucher_Levels/${id}`));
    };

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editClassId) {
            try {
                await update(ref(db, `Classes/${editClassId}`), {
                    name: newClassName,
                    grade: newClassGrade
                });
                alert('Class updated successfully.');
                setEditClassId(null);
                setNewClassName('');
            } catch (err: any) {
                alert(err.message);
            }
            return;
        }

        if (!newClassName) {
            alert('Selection required.');
            return;
        }

        const classId = `${newClassGrade}${newClassName.toUpperCase().replace(/\s+/g, '-')}`;
        const classRef = ref(db, `Classes/${classId}`);
        
        try {
            await set(classRef, {
                id: classId,
                name: newClassName,
                grade: newClassGrade,
                createdAt: new Date().toISOString()
            });
            setNewClassName('');
            alert('Class initialized in institutional registry.');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const startEditClass = (cls: CampusClass) => {
        setEditClassId(cls.id);
        setNewClassName(cls.name);
        setNewClassGrade(cls.grade);
        setActiveTab('classes');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRemoveClass = async (id: string) => {
        if (confirm(`Abolish Class ${id}? This will disconnect students and faculty assignments.`)) {
            await remove(ref(db, `Classes/${id}`));
        }
    };

    const handleUnlockUser = async (id: string) => {
        if (confirm('Restore access for this account? Security flags will be cleared.')) {
            try {
                await update(ref(db, `Users/${id}`), {
                    isQuizLocked: false
                });
                alert('Account access restored.');
            } catch (err: any) {
                alert('Failed to unlock: ' + err.message);
            }
        }
    };

    const handleRemoveUser = async (id: string) => {
        if (confirm('Permanently de-provision this profile? Access will be revoked immediately.')) {
            await remove(ref(db, `Users/${id}`));
        }
    };

    const handleResetQuiz = async (studentId: string) => {
        if (!confirm('Are you sure you want to reset the innovator assessment for this student? Their verification will be removed and points will NOT be deducted.')) return;
        
        try {
            await update(ref(db, `Users/${studentId}`), {
                isInnovatorVerified: false,
                quizAttempts: 0
            });
            alert('Assessment reset successfully.');
        } catch (error: any) {
            alert('Failed to reset assessment: ' + error.message);
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

    const handleResetPoints = async () => {
        if (!confirm('CRITICAL: This will reset points for ALL students to 0. This action cannot be undone. Are you sure?')) return;

        try {
            const updates: Record<string, any> = {};
            users.filter(u => u.role === 'Student').forEach(u => {
                updates[`Users/${u.id}/points`] = 0;
            });

            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                alert('All student points have been reset to 0.');
            } else {
                alert('No students found to reset.');
            }
        } catch (error: any) {
            console.error('Failed to reset points:', error);
            alert('Failed to reset points: ' + error.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleProcessRedemption = async (id: string, status: 'Approved' | 'Used' | 'Rejected') => {
        try {
            await update(ref(db, `Redemption_Requests/${id}`), { 
                status,
                processedAt: new Date().toISOString(),
                processedBy: currentUser?.name
            });
            alert(`Redemption marked as ${status}`);
        } catch (err: any) {
            alert("Error updating redemption: " + err.message);
        }
    };

    if (loading) return (
        <div className="admin-loader-screen">
            <div className="spinner-large"></div>
            <span>Accessing Institutional Core...</span>
        </div>
    );

    const selectedTeacher = users.find(u => u.id === selectedTeacherId);

    return (
        <div className="admin-app">
            <AdminSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                runSeed={runSeed} 
                handleResetPoints={handleResetPoints} 
                logout={logout} 
                seeding={seeding} 
                role={currentUser?.role || 'Admin'}
            />

            <main className="a-workspace animate-fade-in">
                <AdminHeader activeTab={activeTab} userCount={users.length} logout={logout} />

                {dbError && (
                    <div className="a-error-notice glass-card animate-slide-up">
                        <div className="a-error-icon">⚠️</div>
                        <div className="a-error-content">
                            <h3>Database Synchronization Error</h3>
                            <p>{dbError}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => window.location.reload()} className="a-retry-btn">
                                    Retry Connection
                                </button>
                                {dbError.includes('permission_denied') && (
                                    <button 
                                        onClick={logout} 
                                        className="a-retry-btn" 
                                        style={{ background: '#ef4444' }}
                                    >
                                        Re-authenticate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!auth.currentUser && currentUser?.role === 'Admin' && (
                    <div className="a-error-notice glass-card animate-slide-up" style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
                        <div className="a-error-icon">🔐</div>
                        <div className="a-error-content" style={{ color: '#92400e' }}>
                            <h3>Session Out of Sync</h3>
                            <p>Your administrative session is active, but your database security token has expired.</p>
                            <button onClick={logout} className="a-retry-btn" style={{ background: '#f59e0b' }}>
                                Re-authenticate Now
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <AdminOverview 
                        users={users} 
                        classes={classes}
                        editUserId={editUserId}
                        provisionLoading={provisionLoading}
                        newUserName={newUserName}
                        setNewUserName={setNewUserName}
                        newUserEmail={newUserEmail}
                        setNewUserEmail={setNewUserEmail}
                        newUserPassword={newUserPassword}
                        setNewUserPassword={setNewUserPassword}
                        newUserRole={newUserRole}
                        setNewUserRole={setNewUserRole}
                        newUserSubject={newUserSubject}
                        setNewUserSubject={setNewUserSubject}
                        newUserGrade={newUserGrade}
                        setNewUserGrade={setNewUserGrade}
                        newUserClassId={newUserClassId}
                        setNewUserClassId={setNewUserClassId}
                        handleAddUser={handleAddUser}
                        handleRemoveUser={handleRemoveUser}
                        onResetQuiz={handleResetQuiz}
                        setEditUserId={setEditUserId}
                    />
                )}

                {activeTab === 'directory' && (
                    <UserRegistry 
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                filteredUsers={filteredUsers}
                                onEdit={startEditUser}
                                onRemove={handleRemoveUser}
                                onUnlock={handleUnlockUser}
                                runSeed={runSeed}
                            />
                )}

                {activeTab === 'faculty' && (
                    <FacultyManager 
                        teachers={users.filter(u => u.role === 'Teacher')}
                        selectedTeacherId={selectedTeacherId}
                        setSelectedTeacherId={setSelectedTeacherId}
                        selectedTeacher={selectedTeacher}
                        classes={classes}
                        toggleClassAssignment={toggleClassAssignment}
                    />
                )}

                {activeTab === 'classes' && (
                    <ClassManager 
                        onSubmit={handleAddClass}
                        newClassGrade={newClassGrade}
                        setNewClassGrade={setNewClassGrade}
                        newClassName={newClassName}
                        setNewClassName={setNewClassName}
                        loading={loading}
                        classes={classes}
                        onRemoveClass={handleRemoveClass}
                        onEditClass={startEditClass}
                        editClassId={editClassId}
                        onCancelEdit={() => {
                            setEditClassId(null);
                            setNewClassName('');
                        }}
                    />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsSection 
                        classRankings={getClassRankings()}
                        topStudents={users.filter(u => u.role === 'Student').sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10)}
                    />
                )}

                {activeTab === 'vouchers' && (
                    <VoucherManager 
                        onSubmit={handleAddVoucher}
                        newVoucherTitle={newVoucherTitle}
                        setNewVoucherTitle={setNewVoucherTitle}
                        newVoucherCost={newVoucherCost}
                        setNewVoucherCost={setNewVoucherCost}
                        newVoucherAEDValue={newVoucherAEDValue}
                        setNewVoucherAEDValue={setNewVoucherAEDValue}
                        vouchers={vouchers}
                        onDeleteVoucher={handleDeleteVoucher}
                    />
                )}

                {activeTab === 'redemptions' && (
                    <div className="animate-fade-in">
                        <RedemptionManager redemptions={redemptions} onProcess={handleProcessRedemption} />
                        <div style={{ marginTop: '3rem' }}>
                            <VoucherManager 
                                onSubmit={handleAddVoucher}
                                newVoucherTitle={newVoucherTitle}
                                setNewVoucherTitle={setNewVoucherTitle}
                                newVoucherCost={newVoucherCost}
                                setNewVoucherCost={setNewVoucherCost}
                                newVoucherAEDValue={newVoucherAEDValue}
                                setNewVoucherAEDValue={setNewVoucherAEDValue}
                                vouchers={vouchers}
                                onDeleteVoucher={handleDeleteVoucher}
                            />
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
};

export default AdminDashboard;
