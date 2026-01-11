import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, get, set, update, push, child } from 'firebase/database';
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
            const dbRef = ref(db);
            const [userSnap, taskSnap] = await Promise.all([
                get(child(dbRef, 'Users')),
                get(child(dbRef, 'Tasks'))
            ]);

            const fetchedStudents: User[] = [];
            if (userSnap.exists()) {
                userSnap.forEach((child) => {
                    const userData = child.val();
                    if (userData.role === 'Student') {
                        fetchedStudents.push({ id: child.key, ...userData });
                    }
                });
            }

            const fetchedTasks: Task[] = [];
            if (taskSnap.exists()) {
                taskSnap.forEach((child) => {
                    fetchedTasks.push({ id: child.key, ...child.val() });
                });
            }

            setStudents(fetchedStudents);
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Live Sync Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPoints = async (studentId: string, amount: number) => {
        try {
            const student = students.find(s => s.id === studentId);
            const newPoints = (student?.points || 0) + amount;

            await update(ref(db, `Users/${studentId}`), {
                points: newPoints
            });

            setStudents(prev => prev.map(s =>
                s.id === studentId ? { ...s, points: newPoints } : s
            ));
        } catch (error) {
            alert('Update failed. Check connection.');
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const newTaskRef = push(ref(db, 'Tasks'));
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
            await set(newTaskRef, taskData);
            setTasks([{ id: newTaskRef.key as string, ...taskData } as Task, ...tasks]);
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
                // Get current student points
                const dbRef = ref(db);
                const studentSnap = await get(child(dbRef, `Users/${task.studentId}`));
                const currentPoints = studentSnap.val()?.points || 0;
                const newPoints = currentPoints + task.points;

                // Update Student Points and Task Status
                const updates: any = {};
                updates[`Users/${task.studentId}/points`] = newPoints;
                updates[`Tasks/${taskId}/status`] = 'Approved';

                await update(ref(db), updates);

                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Approved' } : t));
                setStudents(prev => prev.map(s =>
                    s.id === task.studentId ? { ...s, points: newPoints } : s
                ));
            } catch (error) {
                alert('Approval failed.');
            }
        }
    };

    return (
        <div className="teacher-container">
            <aside className="sidebar premium-gradient">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Award size={32} />
                        <span>ACTVET</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-item active"><Users size={20} /><span>Dashboard</span></div>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-button-sidebar">Sign Out</button>
                </div>
            </aside>

            <main className="teacher-content animate-fade-in">
                <header className="content-header">
                    <div className="header-titles">
                        <h1>Teacher HUB</h1>
                        <p>Real-time database active</p>
                    </div>
                    <div className="sync-pill">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        <span>{loading ? 'READING DB' : 'SYNCED'}</span>
                    </div>
                </header>

                <div className="dashboard-grid">
                    <section className="dashboard-card glass-card span-2">
                        <h2>Points Manager</h2>
                        <div className="table-responsive">
                            <table className="teacher-table">
                                <thead>
                                    <tr><th>Student</th><th>Grade</th><th>Points</th><th>Quick Award</th></tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id}>
                                            <td>{student.name}</td>
                                            <td>Grade {student.grade}</td>
                                            <td>{student.points} PTS</td>
                                            <td>
                                                <button onClick={() => handleAddPoints(student.id, 50)}>+50</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="dashboard-card glass-card">
                        <h2>New Task</h2>
                        <form onSubmit={handleCreateTask} className="task-form">
                            <input type="text" placeholder="Title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
                            <select value={newTaskGrade} onChange={e => setNewTaskGrade(Number(e.target.value) as Grade)}>
                                <option value={10}>Grade 10</option>
                                <option value={11}>Grade 11</option>
                            </select>
                            <input type="number" value={newTaskPoints} onChange={e => setNewTaskPoints(Number(e.target.value))} />
                            <button type="submit">Post Task</button>
                        </form>
                    </section>
                </div>
            </main>

            <style>{`
                .teacher-container { display: flex; min-height: 100vh; background: #f1f5f9; }
                .sidebar { width: 280px; background: #0f172a; color: white; display: flex; flex-direction: column; padding: 2rem; }
                .teacher-content { flex: 1; padding: 3rem; }
                .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
                .dashboard-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                .teacher-table { width: 100%; border-collapse: collapse; }
                .teacher-table th, .teacher-table td { text-align: left; padding: 1rem; border-bottom: 1px solid #f1f5f9; }
                .task-form { display: flex; flex-direction: column; gap: 1rem; }
                .task-form input, .task-form select { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; }
                .task-form button { padding: 1rem; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; }
                .sync-pill { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-weight: bold; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;
