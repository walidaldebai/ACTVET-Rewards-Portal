import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, increment, addDoc, query, where } from 'firebase/firestore';
import { Users, PlusCircle, CheckCircle, Filter, Award, Search, LogOut, RefreshCw } from 'lucide-react';
import type { User, Grade, Task } from '../types';

const TeacherDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [selectedGrade, setSelectedGrade] = useState<Grade | 'All'>('All');
    const [students, setStudents] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPoints, setNewTaskPoints] = useState(50);
    const [newTaskGrade, setNewTaskGrade] = useState<Grade>(11);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = (selectedGrade === 'All'
        ? students
        : students.filter(s => s.grade === selectedGrade)
    ).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    React.useEffect(() => {
        fetchLiveData();
    }, []);

    const fetchLiveData = async () => {
        setLoading(true);
        try {
            const studentQuery = query(collection(db, 'Users'), where('role', '==', 'Student'));
            const studentSnap = await getDocs(studentQuery);
            const taskSnap = await getDocs(collection(db, 'Tasks'));

            setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
            setTasks(taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
        } catch (error) {
            console.error("Live Sync Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPoints = async (studentId: string, amount: number) => {
        try {
            const userRef = doc(db, 'Users', studentId);
            await updateDoc(userRef, {
                points: increment(amount)
            });
            setStudents(prev => prev.map(s =>
                s.id === studentId ? { ...s, points: (s.points || 0) + amount } : s
            ));
        } catch (error) {
            alert('Update failed. Check connection.');
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const taskData = {
            title: newTaskTitle,
            description: 'Assigned Task via ACTVET Teacher Portal',
            points: newTaskPoints,
            grade: newTaskGrade,
            assignedBy: currentUser?.id || '',
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        try {
            const docRef = await addDoc(collection(db, 'Tasks'), taskData);
            setTasks([{ id: docRef.id, ...taskData } as Task, ...tasks]);
            setNewTaskTitle('');
            alert('✨ Task Posted Live to Student Portals!');
        } catch (error) {
            alert('Failed to post task.');
        }
    };

    const handleApproveTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.studentId) {
            try {
                // Update Student Points
                const userRef = doc(db, 'Users', task.studentId);
                await updateDoc(userRef, {
                    points: increment(task.points)
                });

                // Update Task Status
                const taskRef = doc(db, 'Tasks', taskId);
                await updateDoc(taskRef, {
                    status: 'Approved'
                });

                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Approved' } : t));
                setStudents(prev => prev.map(s =>
                    s.id === task.studentId ? { ...s, points: (s.points || 0) + task.points } : s
                ));
            } catch (error) {
                alert('Approval failed.');
            }
        }
    };

    return (
        <div className="teacher-container">
            {/* Sidebar Navigation */}
            <aside className="sidebar premium-gradient">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Award size={32} />
                        <span>ACTVET</span>
                    </div>
                    <p className="sidebar-role">Teacher Hub</p>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-item active">
                        <Users size={20} />
                        <span>Dashboard</span>
                    </div>
                    <div className="nav-item">
                        <PlusCircle size={20} />
                        <span>Create Task</span>
                    </div>
                    <div className="nav-item">
                        <CheckCircle size={20} />
                        <span>Approvals</span>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="teacher-profile">
                        <div className="avatar white">
                            {currentUser?.name?.charAt(0)}
                        </div>
                        <div className="profile-info">
                            <span className="p-name">{currentUser?.name}</span>
                            <span className="p-subject">{currentUser?.subject}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-button-sidebar">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="teacher-content animate-fade-in">
                <header className="content-header">
                    <div className="header-titles">
                        <h1>Teacher Management Console</h1>
                        <p>Welcome back, manage your students and distribute reward points.</p>
                    </div>
                    <div className="header-actions">
                        <div className="sync-pill">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                            <span>{loading ? 'READING DATA' : 'SYNCED'}</span>
                        </div>
                        <div className="search-bar glass-card">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* Points Manager */}
                    <section className="dashboard-card glass-card span-2">
                        <div className="section-title-box">
                            <div className="title-left">
                                <Users size={22} className="text-accent" />
                                <h2>Points Manager</h2>
                            </div>
                            <div className="filter-group">
                                <Filter size={16} />
                                <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value as any)}>
                                    <option value="All">All Grades</option>
                                    <option value="9">Grade 9</option>
                                    <option value="10">Grade 10</option>
                                    <option value="11">Grade 11</option>
                                    <option value="12">Grade 12</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="teacher-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Grade</th>
                                        <th>Current Points</th>
                                        <th>Quick Award</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id}>
                                            <td>
                                                <div className="student-cell">
                                                    <div className="s-avatar">{student.name.charAt(0)}</div>
                                                    <span>{student.name}</span>
                                                </div>
                                            </td>
                                            <td>Grade {student.grade}</td>
                                            <td>
                                                <span className="points-pill">{student.points} PTS</span>
                                            </td>
                                            <td>
                                                <div className="award-buttons">
                                                    <button onClick={() => handleAddPoints(student.id, 5)} className="award-btn">+5</button>
                                                    <button onClick={() => handleAddPoints(student.id, 10)} className="award-btn">+10</button>
                                                    <button onClick={() => handleAddPoints(student.id, 50)} className="award-btn highlight">+50</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Right Column Stack */}
                    <div className="dashboard-stack">
                        {/* Task Creator */}
                        <section className="dashboard-card glass-card">
                            <div className="section-title-box">
                                <div className="title-left">
                                    <PlusCircle size={22} className="text-primary" />
                                    <h2>Create New Task</h2>
                                </div>
                            </div>
                            <form onSubmit={handleCreateTask} className="task-form">
                                <div className="form-group">
                                    <label>Task Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Science Lab Report"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Target Grade</label>
                                        <select value={newTaskGrade} onChange={(e) => setNewTaskGrade(Number(e.target.value) as Grade)}>
                                            <option value={9}>Grade 9</option>
                                            <option value={10}>Grade 10</option>
                                            <option value={11}>Grade 11</option>
                                            <option value={12}>Grade 12</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Points</label>
                                        <input
                                            type="number"
                                            value={newTaskPoints}
                                            onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary-large">Post Task to Portal</button>
                            </form>
                        </section>

                        {/* Approvals List */}
                        <section className="dashboard-card glass-card">
                            <div className="section-title-box">
                                <div className="title-left">
                                    <CheckCircle size={22} className="text-success" />
                                    <h2>Pending Approvals</h2>
                                </div>
                                <span className="count-badge">{tasks.filter(t => t.status === 'Completed').length}</span>
                            </div>
                            <div className="approvals-list">
                                {tasks.filter(t => t.status !== 'Approved').map(task => (
                                    <div key={task.id} className="approval-item">
                                        <div className="approval-info">
                                            <strong>{task.title}</strong>
                                            <p>Grade {task.grade} • {task.points} pts</p>
                                        </div>
                                        {task.studentId ? (
                                            <button className="approve-button" onClick={() => handleApproveTask(task.id)}>Approve</button>
                                        ) : (
                                            <span className="waiting-pill">Waiting...</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style>{`
        .teacher-container {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }

        .sync-pill {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: white;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 800;
            color: #64748b;
            border: 1px solid #e2e8f0;
            margin-right: 1.5rem;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Sidebar */
        .sidebar {
          width: 280px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 2.5rem 1.5rem;
          color: white;
          z-index: 100;
        }
        .sidebar-header { margin-bottom: 3.5rem; text-align: center; }
        .sidebar-logo { display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 1.8rem; font-weight: 900; letter-spacing: -1px; }
        .sidebar-role { font-size: 0.85rem; opacity: 0.7; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-top: 0.5rem; }

        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.2s;
          cursor: pointer;
        }
        .nav-item:hover { background: rgba(255,255,255,0.1); }
        .nav-item.active { background: white; color: var(--primary); }

        .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; }
        .teacher-profile { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .avatar.white { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
        .profile-info { display: flex; flex-direction: column; }
        .p-name { font-weight: 700; font-size: 0.95rem; }
        .p-subject { font-size: 0.75rem; opacity: 0.7; }
        .logout-button-sidebar { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; color: #fca5a5; background: none; font-weight: 700; font-size: 0.9rem; }
        .logout-button-sidebar:hover { color: white; background: rgba(239, 68, 68, 0.1); border-radius: 8px; }

        /* Content */
        .teacher-content { flex: 1; margin-left: 280px; padding: 2.5rem 3.5rem; }
        .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
        .header-titles h1 { font-size: 2.2rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem; }
        .header-titles p { color: #64748b; font-size: 1.1rem; }

        .search-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; border-radius: 100px; width: 350px; background: white !important; }
        .search-bar input { border: none; outline: none; width: 100%; font-size: 0.95rem; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; }
        .span-2 { grid-column: span 2; }
        .dashboard-card { padding: 2.5rem; border-radius: 28px; background: white; }
        .section-title-box { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .title-left { display: flex; align-items: center; gap: 1rem; }
        .title-left h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; }

        .filter-group { display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; }
        .filter-group select { border: none; background: transparent; font-weight: 600; color: #475569; }

        .teacher-table { width: 100%; border-collapse: separate; border-spacing: 0 1rem; }
        .teacher-table th { text-align: left; padding: 0 1.5rem; color: #94a3b8; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .teacher-table td { padding: 1.25rem 1.5rem; background: white; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
        .teacher-table tr td:first-child { border-left: 1px solid #f1f5f9; border-radius: 16px 0 0 16px; }
        .teacher-table tr td:last-child { border-right: 1px solid #f1f5f9; border-radius: 0 16px 16px 0; }
        
        .student-cell { display: flex; align-items: center; gap: 1rem; }
        .s-avatar { width: 32px; height: 32px; border-radius: 8px; background: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; }
        .points-pill { background: #fef3c7; color: #92400e; padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 800; font-size: 0.8rem; }
        
        .award-buttons { display: flex; gap: 0.5rem; }
        .award-btn { padding: 0.5rem 1rem; border-radius: 10px; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.85rem; }
        .award-btn:hover { background: var(--primary); color: white; }
        .award-btn.highlight { background: #f59e0b; color: white; }

        .dashboard-stack { display: flex; flex-direction: column; gap: 2.5rem; }
        
        .task-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: #64748b; }
        .form-group input, .form-group select { padding: 0.85rem 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; }
        .form-row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
        .btn-primary-large { width: 100%; padding: 1.1rem; border-radius: 16px; background: #0f172a; color: white; font-weight: 800; font-size: 1rem; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1); margin-top: 0.5rem; }
        .btn-primary-large:hover { background: #1e293b; transform: translateY(-2px); }

        .approvals-list { display: flex; flex-direction: column; gap: 1rem; }
        .approval-item { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
        .approval-info strong { font-size: 1rem; color: #1e293b; display: block; }
        .approval-info p { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }
        .approve-button { background: #10b981; color: white; border-radius: 10px; padding: 0.5rem 1rem; font-weight: 700; font-size: 0.85rem; }
        .waiting-pill { font-size: 0.75rem; font-weight: 700; color: #94a3b8; font-style: italic; }
        .count-badge { background: #ef4444; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; }

        @media (max-width: 1280px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .span-2 { grid-column: span 1; }
        }
      `}</style>
        </div>
    );
};

export default TeacherDashboard;
