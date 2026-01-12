import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, set, update, push, child, onValue } from 'firebase/database';
import {
    Users,
    PlusCircle,
    CheckCircle2,
    Award,
    Search,
    LogOut,
    RefreshCw,
    BookOpen,
    LayoutDashboard,
    ClipboardList,
    TrendingUp,
    XCircle,
    UserCheck,
    Clock,
    FileText,
    Upload,
    Calendar,
    Download,
    Archive,
    Trash2
} from 'lucide-react';
import type { User, Grade, Task, TaskSubmission, CampusClass } from '../types';

const TeacherDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [students, setStudents] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPoints, setNewTaskPoints] = useState(100);
    const [newTaskGrade, setNewTaskGrade] = useState<Grade>(11);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'students' | 'resources'>('overview');
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [newTaskClassId, setNewTaskClassId] = useState<string>('');
    const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
    const [newTaskMaxScore, setNewTaskMaxScore] = useState<number>(10);
    const [gradingScore, setGradingScore] = useState<Record<string, number>>({});
    const [adjustingPoints, setAdjustingPoints] = useState<string | null>(null);
    const [customPointAmount, setCustomPointAmount] = useState<number>(100);

    // Advanced Task State
    const [newTaskFile, setNewTaskFile] = useState<File | null>(null);
    const [newTaskDeadline, setNewTaskDeadline] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    const teacherClasses = currentUser?.assignedClasses || [];

    const filteredStudents = students.filter(s =>
        (teacherClasses.length === 0 || teacherClasses.includes(s.classId || '')) &&
        (selectedClassFilter === 'All' || s.classId === selectedClassFilter) &&
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        if (!currentUser) return;

        const dbRef = ref(db);
        setLoading(true);

        // Subscriptions for real-time updates
        const usersUnsubscribe = onValue(child(dbRef, 'Users'), (snapshot) => {
            const fetchedStudents: User[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const userData = child.val();
                    if (userData.role === 'Student') {
                        fetchedStudents.push({ id: child.key, ...userData });
                    }
                });
            }
            setStudents(fetchedStudents);
            setLoading(false);
        });

        const tasksUnsubscribe = onValue(child(dbRef, 'Tasks'), (snapshot) => {
            const fetchedTasks: Task[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const t = child.val();
                    if (t.assignedBy === currentUser?.id) {
                        fetchedTasks.push({ id: child.key, ...t });
                    }
                });
            }
            setTasks(fetchedTasks);
        });

        const subsUnsubscribe = onValue(child(dbRef, 'Task_Submissions'), (snapshot) => {
            const fetchedSubmissions: TaskSubmission[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const s = child.val();
                    if (s.subject === currentUser?.subject && s.status === 'Pending') {
                        fetchedSubmissions.push({ id: child.key, ...s });
                    }
                });
            }
            setSubmissions(fetchedSubmissions);
        });

        const classesUnsubscribe = onValue(child(dbRef, 'Classes'), (snapshot) => {
            const fetchedClasses: CampusClass[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    fetchedClasses.push({ id: child.key, ...child.val() });
                });
            }
            setClasses(fetchedClasses);
        });

        return () => {
            usersUnsubscribe();
            tasksUnsubscribe();
            subsUnsubscribe();
            classesUnsubscribe();
        };
    }, [currentUser]);



    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.subject) return;
        setUploading(true);
        console.log("Teacher: Initiating Assignment Broadcast...");

        try {
            let fileData = '';
            let fileName = '';

            if (newTaskFile) {
                if (newTaskFile.size > 5 * 1024 * 1024) {
                    throw new Error("File too large. Please keep under 5MB for database stability.");
                }

                console.log(`Teacher: Encoding resource [${newTaskFile.name}]...`);
                // Convert to Base64 for database storage (no need for Storage bucket)
                fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(newTaskFile);
                });
                fileName = newTaskFile.name;
            }

            const newTaskRef = push(ref(db, 'Tasks'));
            const taskData: any = {
                title: newTaskTitle,
                description: `Academic assignment for ${currentUser.subject}. Resources attached where applicable.`,
                points: newTaskPoints,
                grade: newTaskGrade,
                maxScore: newTaskMaxScore,
                assignedBy: currentUser.id,
                subject: currentUser.subject,
                createdAt: new Date().toISOString()
            };

            if (newTaskClassId) taskData.assignedToClass = newTaskClassId;
            if (fileData) taskData.attachmentUrl = fileData;
            if (fileName) taskData.attachmentName = fileName;
            if (newTaskDeadline) taskData.deadline = newTaskDeadline;

            await set(newTaskRef, taskData);
            console.log("Teacher: Assignment data linked to database.");

            setNewTaskTitle('');
            setNewTaskFile(null);
            setNewTaskDeadline('');
            alert('🚀 Institutional Assignment Broadcasted Successfully.');
        } catch (error: any) {
            console.error("Broadcast Error:", error);
            alert(`⚠️ Broadcast Failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm("🚨 Are you sure? This will permanently remove the assignment and its associated resource file from the database.")) return;
        try {
            await set(ref(db, `Tasks/${taskId}`), null);
            alert('✨ Assignment and associated files removed successfully.');
        } catch (error: any) {
            alert(`Delete failed: ${error.message}`);
        }
    };

    const handleProcessSubmission = async (submission: TaskSubmission, approve: boolean) => {
        try {
            const status = approve ? 'Approved' : 'Rejected';
            const updates: any = {};

            updates[`Task_Submissions/${submission.id}/status`] = status;

            if (approve) {
                const student = students.find(s => s.id === submission.studentId);
                const currentPoints = student?.points || 0;
                const score = gradingScore[submission.id] || 0;
                const taskMaxScore = submission.maxScore || 10;
                const finalPoints = Math.round((score / taskMaxScore) * submission.points);

                updates[`Task_Submissions/${submission.id}/status`] = status;
                updates[`Task_Submissions/${submission.id}/actualScore`] = score;
                updates[`Task_Submissions/${submission.id}/maxScore`] = taskMaxScore;
                updates[`Users/${submission.studentId}/points`] = currentPoints + finalPoints;

                const historyRef = push(ref(db, 'Point_History'));
                updates[`Point_History/${historyRef.key}`] = {
                    userId: submission.studentId,
                    points: finalPoints,
                    reason: `Task: ${submission.taskTitle} (${score}/${taskMaxScore})`,
                    timestamp: new Date().toISOString(),
                    type: 'Awarded'
                };

            }

            await update(ref(db), updates);
            alert(approve ? `✅ Graded & Points Awarded` : `❌ Submission declined`);
        } catch (error) {
            alert('Processing failed.');
        }
    };

    const handleQuickAdjust = async (studentId: string, amount: number) => {
        try {
            const student = students.find(s => s.id === studentId);
            if (!student) return;
            const newPoints = (student.points || 0) + amount;
            await update(ref(db, `Users/${studentId}`), { points: newPoints });

            const historyRef = push(ref(db, 'Point_History'));
            await set(historyRef, {
                userId: studentId,
                points: amount,
                reason: `Instructor Adjustment: ${currentUser?.subject || 'General'}`,
                timestamp: new Date().toISOString(),
                type: amount > 0 ? 'Awarded' : 'Redeemed'
            });
            setAdjustingPoints(null);
        } catch (err) {
            alert('Adjustment failed.');
        }
    };

    if (loading) return <div>Loading Gateway...</div>;

    return (
        <div className="teacher-portal">
            <aside className="p-sidebar glass-card animate-slide-right">
                <div className="p-sidebar-top">
                    <div className="p-brand">
                        <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '100%', height: 'auto' }} />
                    </div>
                    <div className="p-brand-text">
                        <span className="p-main">ATS Innovator Portal</span>
                        <span className="p-sub">TEACHER HUB</span>
                    </div>
                </div>

                <div className="p-subject-tag accent-gradient">
                    <BookOpen size={14} />
                    <span>{currentUser?.subject || 'Educator'}</span>
                </div>

                <nav className="p-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        <LayoutDashboard size={20} />
                        <span>Command Center</span>
                    </button>
                    <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>
                        <UserCheck size={20} />
                        <span>Validation Queue</span>
                        {submissions.length > 0 && <span className="p-count">{submissions.length}</span>}
                    </button>
                    <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
                        <Users size={20} />
                        <span>Student Directory</span>
                    </button>
                    <button className={activeTab === 'resources' ? 'active' : ''} onClick={() => setActiveTab('resources')}>
                        <Archive size={20} />
                        <span>Resource Vault</span>
                    </button>
                </nav>

                <div className="p-sidebar-bottom">
                    <div className="p-profile-strip glass-card">
                        <div className="p-avatar gold-gradient">{currentUser?.name?.charAt(0)}</div>
                        <div className="p-info">
                            <span className="p-name">{currentUser?.name}</span>
                            <span className="p-role">Teacher</span>
                        </div>
                    </div>
                    <div className="p-logout-wrapper">
                        <button onClick={logout} className="p-logout-btn">
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="p-main-workspace animate-fade-in">
                <header className="p-header">
                    <div className="p-header-titles">
                        <h1>Academic Governance</h1>
                        <p>Coordinate student recognition and {currentUser?.subject} performance tracking.</p>
                    </div>
                    <div className="p-sync">
                        <div className="p-sync-icon pulse"><RefreshCw size={14} /></div>
                        <span>REAL-TIME ANALYTICS ACTIVE</span>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="p-dashboard-grid animate-fade-in">
                        <section className="p-card-v3 welcome-card premium-gradient span-2">
                            <div className="welcome-content">
                                <h2>Subject: {currentUser?.subject}</h2>
                                <p>You have {submissions.length} pending validations and {tasks.length} active assignments.</p>
                                <div className="welcome-stats">
                                    <div className="w-stat">
                                        <span className="w-val">{filteredStudents.length}</span>
                                        <span className="w-lbl">MY STUDENTS</span>
                                    </div>
                                    <div className="w-divider"></div>
                                    <div className="w-stat">
                                        <span className="w-val">{tasks.length}</span>
                                        <span className="w-lbl">PUBLISHED TASKS</span>
                                    </div>
                                </div>
                            </div>
                            <div className="welcome-icon">
                                <Award size={120} opacity={0.1} />
                            </div>
                        </section>

                        <section className="p-card-v3 glass-card">
                            <div className="p-card-head">
                                <PlusCircle className="text-purple" />
                                <h2>Assign New Task</h2>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-task-form">
                                <div className="p-f-group">
                                    <label>Assignment Title</label>
                                    <input type="text" placeholder="Advanced Equation Set B" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
                                </div>
                                <div className="p-f-row">
                                    <div className="p-f-group">
                                        <label>Target Grade</label>
                                        <select value={newTaskGrade} onChange={e => {
                                            const g = Number(e.target.value) as Grade;
                                            setNewTaskGrade(g);
                                            setNewTaskClassId(''); // Reset class specific
                                        }}>
                                            <option value={9}>Grade 9</option>
                                            <option value={10}>Grade 10</option>
                                            <option value={11}>Grade 11</option>
                                            <option value={12}>Grade 12</option>
                                        </select>
                                    </div>
                                    <div className="p-f-group">
                                        <label>Target Class (Optional)</label>
                                        <select value={newTaskClassId} onChange={e => setNewTaskClassId(e.target.value)}>
                                            <option value="">All Classes</option>
                                            {classes.filter(c => c.grade === newTaskGrade).map(c => (
                                                <option key={c.id} value={c.id}>Class {c.id}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-f-row">
                                    <div className="p-f-group">
                                        <label>Max Grade (e.g. 10/20)</label>
                                        <input type="number" value={newTaskMaxScore} onChange={e => setNewTaskMaxScore(Number(e.target.value))} />
                                    </div>
                                    <div className="p-f-group">
                                        <label>Award Points</label>
                                        <input type="number" value={newTaskPoints} onChange={e => setNewTaskPoints(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="p-f-row">
                                    <div className="p-f-group">
                                        <label><Calendar size={14} /> Submission Deadline</label>
                                        <input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} />
                                    </div>
                                    <div className="p-f-group">
                                        <label><Upload size={14} /> Attach Resource (PDF/DOC)</label>
                                        <div className="custom-file-upload glass-card">
                                            <Upload size={18} />
                                            <span>{newTaskFile ? newTaskFile.name : 'Click to select file...'}</span>
                                            <input type="file" onChange={e => setNewTaskFile(e.target.files?.[0] || null)} />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="p-submit-btn accent-gradient" disabled={uploading}>
                                    {uploading ? 'Processing File...' : 'Broadcast Assignment'}
                                </button>
                            </form>
                        </section>

                        <section className="p-card-v3 glass-card span-all">
                            <div className="p-card-head">
                                <TrendingUp className="text-blue" />
                                <h2>Recent Task Activity</h2>
                            </div>
                            <div className="p-activity-list">
                                {tasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="p-activity-item">
                                        <div className="p-a-icon"><ClipboardList size={18} /></div>
                                        <div className="p-a-info">
                                            <span className="p-a-title">{task.title}</span>
                                            <span className="p-a-meta">Grade {task.grade} • {task.points} PTS • {new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="p-a-badge">Active</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'queue' && (
                    <div className="p-queue-section animate-fade-in">
                        <div className="p-section-head">
                            <UserCheck className="text-blue" />
                            <h2>Validation Queue</h2>
                            <span className="p-badge-v2">{submissions.length} PENDING</span>
                        </div>

                        <div className="p-queue-grid">
                            {submissions.map(sub => (
                                <div key={sub.id} className="p-queue-card glass-card animate-slide-up">
                                    <div className="p-q-header">
                                        <div className="p-q-user">
                                            <div className="p-q-avatar">{sub.studentName.charAt(0)}</div>
                                            <div className="p-q-meta">
                                                <span className="p-q-name">{sub.studentName}</span>
                                                <span className="p-q-class">Grade {sub.studentGrade} Student</span>
                                            </div>
                                        </div>
                                        <div className="p-q-points">+{sub.points}</div>
                                    </div>
                                    <div className="p-q-content">
                                        <span className="p-q-label">Submission for:</span>
                                        <h4 className="p-q-title">{sub.taskTitle}</h4>
                                        <div className="p-q-time"><Clock size={14} /> Submitted {new Date(sub.submittedAt).toLocaleTimeString()}</div>

                                        {sub.submissionFileUrl && (
                                            <a href={sub.submissionFileUrl} target="_blank" rel="noreferrer" className="p-q-attachment glass-card">
                                                <div className="p-q-att-icon"><FileText size={18} /></div>
                                                <div className="p-q-att-info">
                                                    <span>Student Solve File</span>
                                                    <small>{sub.submissionFileName || 'hand-in.pdf'}</small>
                                                </div>
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="p-q-grading">
                                        <div className="grading-row">
                                            <label>Grade Score:</label>
                                            <div className="grading-inputs">
                                                <input
                                                    type="number"
                                                    value={gradingScore[sub.id] || ''}
                                                    onChange={e => setGradingScore(prev => ({ ...prev, [sub.id]: Number(e.target.value) }))}
                                                    placeholder="Point"
                                                />
                                                <span className="out-of">/ {sub.maxScore || 10}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-q-actions">
                                        <button className="p-btn-decline" onClick={() => handleProcessSubmission(sub, false)}><XCircle size={18} /> Reject</button>
                                        <button className="p-btn-approve accent-gradient" onClick={() => handleProcessSubmission(sub, true)}>Award & Close</button>
                                    </div>
                                </div>
                            ))}
                            {submissions.length === 0 && (
                                <div className="p-empty-state glass-card">
                                    <CheckCircle2 size={48} />
                                    <h3>Queue Cleared</h3>
                                    <p>All student submissions for {currentUser?.subject} have been processed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="p-students-section animate-fade-in">
                        <div className="p-section-head">
                            <Users className="text-purple" />
                            <h2>Student Directory</h2>
                            <div className="p-filters-v2">
                                <select className="p-class-select glass-card" value={selectedClassFilter} onChange={e => setSelectedClassFilter(e.target.value)}>
                                    <option value="All">All Assigned Classes</option>
                                    {classes.filter(c => teacherClasses.includes(c.id)).map(c => (
                                        <option key={c.id} value={c.id}>Class {c.id}</option>
                                    ))}
                                </select>
                                <div className="p-search-box glass-card">
                                    <Search size={18} />
                                    <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="p-students-table-wrapper glass-card">
                            <table className="p-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Grade</th>
                                        <th>Wallet Balance</th>
                                        <th className="text-right">Institutional Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id}>
                                            <td>
                                                <div className="p-table-user">
                                                    <div className="p-table-avatar">{student.name.charAt(0)}</div>
                                                    <div className="p-table-info">
                                                        <span className="p-t-name">{student.name}</span>
                                                        <span className="p-t-email">{student.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="p-badge-grade">Grade {student.grade} - {student.classId}</span></td>
                                            <td><span className="p-t-pts">{student.points?.toLocaleString()} PTS</span></td>
                                            <td className="text-right">
                                                <div className="p-table-actions">
                                                    <button className="p-action-btn" onClick={() => handleQuickAdjust(student.id, 50)}>+50</button>
                                                    <button className="p-action-btn gold" onClick={() => handleQuickAdjust(student.id, 100)}>+100</button>
                                                    {adjustingPoints === student.id ? (
                                                        <div className="p-adjust-input glass-card">
                                                            <input type="number" value={customPointAmount} onChange={e => setCustomPointAmount(Number(e.target.value))} />
                                                            <button onClick={() => handleQuickAdjust(student.id, customPointAmount)}>Set</button>
                                                            <button onClick={() => setAdjustingPoints(null)}>×</button>
                                                        </div>
                                                    ) : (
                                                        <button className="p-action-btn accent" onClick={() => {
                                                            setAdjustingPoints(student.id);
                                                            setCustomPointAmount(100);
                                                        }}>Custom</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="p-resources-section animate-fade-in">
                        <div className="p-section-head">
                            <Archive className="text-purple" />
                            <h2>Resource Vault</h2>
                            <span className="p-badge-v2">{tasks.length} ASSETS UPLOADED</span>
                        </div>

                        <div className="p-resources-grid">
                            {tasks.map(task => (
                                <div key={task.id} className="p-resource-card glass-card">
                                    <div className="p-r-top">
                                        <div className="p-r-icon gold-gradient"><FileText /></div>
                                        <div className="p-r-info">
                                            <span className="p-r-name">{task.title}</span>
                                            <span className="p-r-meta">Uploaded {new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <button className="p-r-delete" onClick={() => handleDeleteTask(task.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="p-r-stats">
                                        <div className="r-stat">
                                            <small>GRADE</small>
                                            <span>{task.grade}</span>
                                        </div>
                                        <div className="r-stat">
                                            <small>STATUS</small>
                                            <span className="text-green">Active</span>
                                        </div>
                                    </div>
                                    {task.attachmentUrl && (
                                        <a href={task.attachmentUrl} download={task.attachmentName} className="p-r-view-btn glass-card">
                                            <Download size={16} />
                                            <span>Download Attachment ({task.attachmentName})</span>
                                        </a>
                                    )}
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="p-empty-state glass-card">
                                    <Archive size={48} />
                                    <h3>Vault is Empty</h3>
                                    <p>You haven't uploaded any assignment resources yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .teacher-portal { display: flex; min-height: 100vh; background: #f8fafc; padding: 2rem; }
                
                /* Sidebar */
                .p-sidebar { width: 280px; border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; position: fixed; height: calc(100vh - 4rem); background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                .p-sidebar-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
                .p-brand { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; }
                .p-brand-text { display: flex; flex-direction: column; }
                .p-main { font-weight: 900; font-size: 1.5rem; letter-spacing: -0.05em; color: #020617; line-height: 1; }
                .p-sub { font-size: 0.75rem; font-weight: 800; color: #64748b; letter-spacing: 0.2em; margin-top: 0.25rem; }
                
                .p-subject-tag { margin-bottom: 1.5rem; padding: 0.6rem 1rem; border-radius: 12px; color: white; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
                
                .p-nav { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
                .p-nav button { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem 1.2rem; border-radius: 16px; font-weight: 700; color: #64748b; background: none; transition: 0.2s; position: relative; }
                .p-nav button.active { background: #f8fafc; color: #020617; box-shadow: inset 0 0 0 1px #f1f5f9; }
                .p-count { position: absolute; right: 1.5rem; background: #ef4444; color: white; padding: 0.2rem 0.6rem; border-radius: 8px; font-size: 0.7rem; font-weight: 900; }
                
                .p-sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem; }
                .p-profile-strip { padding: 0.75rem; display: flex; align-items: center; gap: 0.75rem; border-radius: 16px !important; background: #f8fafc; border: 1px solid #f1f5f9; }
                .p-avatar { width: 38px; height: 38px; min-width: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 1rem; }
                .p-info { display: flex; flex-direction: column; min-width: 0; }
                .p-name { font-weight: 800; font-size: 0.85rem; color: #020617; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .p-role { font-size: 0.6rem; color: #6366f1; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                
                .p-logout-wrapper { padding-top: 0.25rem; }
                .p-logout-btn { display: flex; align-items: center; gap: 0.6rem; color: #ef4444; font-weight: 800; font-size: 0.85rem; background: none; border: none; cursor: pointer; transition: 0.2s; opacity: 0.7; }
                .p-logout-btn:hover { opacity: 1; transform: translateX(5px); }
                .p-logout-btn svg { transition: transform 0.2s; }
                
                /* Workspace */
                .p-main-workspace { flex: 1; margin-left: 280px; padding: 2rem 3rem; max-width: 1600px; margin-right: auto; }
                .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem; }
                .p-header-titles h1 { font-size: 2.2rem; font-weight: 900; letter-spacing: -0.05em; color: #020617; margin-bottom: 0.25rem; }
                .p-header-titles p { font-size: 1rem; color: #64748b; font-weight: 600; }
                .p-sync { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1.5rem; border-radius: 100px; font-weight: 800; font-size: 0.75rem; color: #94a3b8; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
                .p-sync-icon { color: #10b981; }
                
                /* Dashboard Blocks */
                .p-dashboard-grid { display: grid; grid-template-columns: 1fr 450px; gap: 3rem; }
                .p-card-v3 { padding: 2rem; border-radius: 24px; }
                .span-2 { grid-column: span 1; }
                .span-all { grid-column: 1 / -1; }
                
                .welcome-card { position: relative; color: white; display: flex; justify-content: space-between; align-items: center; overflow: hidden; background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%); width: 100%; }
                .welcome-content { position: relative; z-index: 10; }
                .welcome-content h2 { font-size: 1.6rem; font-weight: 900; margin-bottom: 0.5rem; }
                .welcome-content p { font-size: 1.1rem; opacity: 0.8; margin-bottom: 2.5rem; }
                .welcome-stats { display: flex; align-items: center; gap: 3rem; }
                .w-stat { display: flex; flex-direction: column; }
                .w-val { font-size: 2.5rem; font-weight: 900; line-height: 1; }
                .w-lbl { font-size: 0.7rem; font-weight: 800; opacity: 0.6; letter-spacing: 0.1em; margin-top: 0.5rem; }
                .w-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }
                .welcome-icon { position: absolute; right: -2rem; bottom: -2rem; transform: rotate(-15deg); }
                
                .p-card-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 2.5rem; }
                .p-card-head h2 { font-size: 1.4rem; font-weight: 900; color: #020617; }
                
                .p-task-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .p-f-group { display: flex; flex-direction: column; gap: 0.6rem; }
                .p-f-group label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem; min-height: 1rem; }
                .p-f-group input, .p-f-group select { padding: 1.1rem 1.25rem; border-radius: 18px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 700; font-size: 1rem; transition: 0.2s; height: 56px; line-height: 1; }
                .p-f-group input:focus { border-color: #6366f1; background: white; }
                .p-f-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: flex-end; }
                
                .custom-file-upload { position: relative; display: flex; align-items: center; gap: 0.75rem; padding: 0 1.25rem; border-radius: 18px; background: #f8fafc; color: #64748b; font-size: 0.9rem; font-weight: 700; border: 2px dashed #f1f5f9; cursor: pointer; transition: 0.2s; height: 56px; overflow: hidden; }
                .custom-file-upload:hover { border-color: #6366f1; background: #f0f7ff; }
                .custom-file-upload input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
                .custom-file-upload span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

                .p-submit-btn { padding: 1.25rem; border-radius: 20px; color: white; font-weight: 900; font-size: 1.1rem; margin-top: 1rem; box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); }
                
                .p-activity-list { display: flex; flex-direction: column; gap: 1rem; }
                .p-activity-item { padding: 1.5rem; background: white; border-radius: 22px; display: flex; align-items: center; gap: 1.5rem; border: 1px solid #f1f5f9; }
                .p-a-icon { width: 44px; height: 44px; background: #f8fafc; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #6366f1; }
                .p-a-info { flex: 1; display: flex; flex-direction: column; }
                .p-a-title { font-weight: 800; color: #0f172a; font-size: 1.1rem; }
                .p-a-meta { font-size: 0.8rem; color: #94a3b8; font-weight: 600; margin-top: 0.2rem; }
                .p-a-badge { background: #ecfdf5; color: #10b981; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.7rem; font-weight: 900; }
                
                /* Queue Section */
                .p-section-head { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 3.5rem; }
                .p-section-head h2 { font-size: 2rem; font-weight: 900; }
                .p-badge-v2 { background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 10px; font-weight: 900; color: #475569; font-size: 0.85rem; }
                
                .p-queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2rem; }
                .p-queue-card { padding: 2.5rem; border-radius: 28px; display: flex; flex-direction: column; gap: 2rem; }
                .p-q-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .p-q-user { display: flex; align-items: center; gap: 1.25rem; }
                .p-q-avatar { width: 56px; height: 56px; background: #f8fafc; border-radius: 18px; border: 1px solid #f1f5f9; font-size: 1.5rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
                .p-q-meta { display: flex; flex-direction: column; }
                .p-q-name { font-weight: 900; font-size: 1.2rem; color: #020617; }
                .p-q-class { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                .p-q-points { background: #f0f9ff; color: #0369a1; padding: 0.6rem 1rem; border-radius: 12px; font-weight: 900; font-size: 1rem; }
                
                .p-q-content { flex: 1; }
                .p-q-label { font-size: 0.7rem; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.1em; }
                .p-q-title { font-size: 1.4rem; font-weight: 900; margin: 0.5rem 0; color: #1e293b; }
                .p-q-time { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
                
                .p-q-actions { display: grid; grid-template-columns: 140px 1fr; gap: 1rem; }
                .p-btn-approve { padding: 1.1rem; border-radius: 18px; color: white; font-weight: 900; font-size: 1rem; }
                .p-btn-decline { padding: 1.1rem; border-radius: 18px; color: #ef4444; background: #fef2f2; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: 0.2s; }
                .p-btn-decline:hover { background: #fee2e2; }
                
                .p-q-attachment { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 16px !important; margin-top: 1.5rem; text-decoration: none; border: 1px solid #f1f5f9; }
                .p-q-att-icon { width: 40px; height: 40px; border-radius: 10px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; }
                .p-q-att-info { flex: 1; display: flex; flex-direction: column; }
                .p-q-att-info span { font-weight: 800; font-size: 0.9rem; color: #0f172a; }
                .p-q-att-info small { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                
                /* Directory */
                .p-filters-v2 { flex: 1; display: flex; align-items: center; gap: 1.5rem; margin-left: 2rem; }
                .p-class-select { padding: 1rem 1.5rem; border-radius: 50px; border: none; font-weight: 700; color: #64748b; appearance: none; cursor: pointer; }
                .p-search-box { flex: 1; display: flex; align-items: center; gap: 1rem; padding: 0 2rem; border-radius: 50px !important; }
                .p-search-box input { border: none; padding: 1.25rem 0; background: none; font-weight: 600; font-size: 1rem; width: 100%; outline: none; }
                
                .p-students-table-wrapper { padding: 1.5rem; border-radius: 32px !important; }
                .p-table { width: 100%; border-collapse: collapse; }
                .p-table th { text-align: left; padding: 1.5rem 2rem; font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #f1f5f9; }
                .p-table td { padding: 2rem; border-bottom: 1px solid #f1f5f9; }
                .p-table tr:last-child td { border-bottom: none; }
                
                .p-table-user { display: flex; align-items: center; gap: 1.25rem; }
                .p-table-avatar { width: 44px; height: 44px; background: #f8fafc; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; }
                .p-table-info { display: flex; flex-direction: column; }
                .p-t-name { font-weight: 800; color: #0f172a; font-size: 1.05rem; }
                .p-t-email { font-size: 0.85rem; color: #94a3b8; font-weight: 600; }
                
                .p-badge-grade { background: #fdf4ff; color: #a21caf; padding: 0.4rem 1rem; border-radius: 100px; font-weight: 900; font-size: 0.75rem; }
                .p-t-pts { font-weight: 900; color: #6366f1; font-size: 1.1rem; }
                
                .p-table-actions { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; }
                .p-action-btn { padding: 0.6rem 1.2rem; border-radius: 10px; background: #020617; color: white; font-weight: 900; font-size: 0.8rem; transition: 0.2s; }
                .p-action-btn.gold { background: #f59e0b; }
                .p-action-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                
                .p-empty-state { grid-column: 1 / -1; padding: 6rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; color: #cbd5e1; }
                .p-empty-state h3 { font-size: 2rem; font-weight: 900; color: #94a3b8; margin-top: 1rem; }
                .p-empty-state p { font-size: 1.1rem; font-weight: 600; color: #94a3b8; }
                
                @keyframes animate-slide-right { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes animate-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes animate-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                
                .animate-slide-right { animation: animate-slide-right 0.5s ease-out forwards; }
                .animate-fade-in { animation: animate-fade-in 0.5s ease-out forwards; }
                .animate-slide-up { animation: animate-slide-up 0.5s ease-out forwards; }
                
                .pulse { animation: pulse 2s infinite; }

                /* Resources Vault */
                .p-resources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; margin-top: 2rem; }
                .p-resource-card { padding: 2rem; border-radius: 24px; display: flex; flex-direction: column; gap: 1.5rem; border: 1px solid #f1f5f9; background: white; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .p-resource-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
                .p-r-top { display: flex; align-items: center; gap: 1.25rem; }
                .p-r-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; }
                .p-r-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .p-r-name { font-weight: 800; color: #0f172a; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .p-r-meta { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                .p-r-delete { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; background: none; transition: 0.2s; border: none; cursor: pointer; }
                .p-r-delete:hover { background: #fef2f2; color: #ef4444; }
                
                .p-r-stats { display: flex; gap: 2rem; padding: 1rem 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
                .r-stat { display: flex; flex-direction: column; }
                .r-stat small { font-size: 0.6rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.1em; }
                .r-stat span { font-weight: 900; font-size: 0.9rem; color: #020617; }
                
                .p-r-view-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 1rem; border-radius: 14px !important; text-decoration: none; color: #6366f1; font-weight: 800; font-size: 0.85rem; border: 1px solid #f1f5f9; background: white; transition: 0.2s; }
                .p-r-view-btn:hover { background: #f8fafc; transform: translateY(-2px); }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;
