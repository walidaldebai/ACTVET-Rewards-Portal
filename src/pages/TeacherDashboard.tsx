import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, set, update, push, child, onValue } from 'firebase/database';
import TeacherSidebar from '../components/TeacherSidebar';
import TeacherHeader from '../components/TeacherHeader';
import TeacherOverview from '../components/TeacherOverview';
import SubmissionQueue from '../components/SubmissionQueue';
import StudentDirectory from '../components/StudentDirectory';
import ResourceVault from '../components/ResourceVault';
import QuizLockouts from '../components/QuizLockouts';
import type { User, Grade, Task, TaskSubmission, CampusClass } from '../types';
import '../styles/TeacherDashboard.css';

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
    const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'students' | 'resources' | 'lockouts'>('overview');
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
                snapshot.forEach((snapChild) => {
                    const userData = snapChild.val();
                    if (userData.role === 'Student') {
                        fetchedStudents.push({ id: snapChild.key, ...userData });
                    }
                });
            }
            setStudents(fetchedStudents);
            setLoading(false);
        }, (error) => {
            console.error("Firebase Read Error (Users):", error);
            setLoading(false);
        });

        const tasksUnsubscribe = onValue(child(dbRef, 'Tasks'), (snapshot) => {
            const fetchedTasks: Task[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((snapChild) => {
                    const t = snapChild.val();
                    if (t.assignedBy === currentUser?.id) {
                        fetchedTasks.push({ id: snapChild.key, ...t });
                    }
                });
            }
            setTasks(fetchedTasks);
        }, (error) => {
            console.error("Firebase Read Error (Tasks):", error);
        });

        const subsUnsubscribe = onValue(child(dbRef, 'Task_Submissions'), (snapshot) => {
            const fetchedSubmissions: TaskSubmission[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((snapChild) => {
                    const s = snapChild.val();
                    if (s.subject === currentUser?.subject && s.status === 'Pending') {
                        fetchedSubmissions.push({ id: snapChild.key, ...s });
                    }
                });
            }
            setSubmissions(fetchedSubmissions);
        }, (error) => {
            console.error("Firebase Read Error (Submissions):", error);
        });

        const classesUnsubscribe = onValue(child(dbRef, 'Classes'), (snapshot) => {
            const fetchedClasses: CampusClass[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    fetchedClasses.push({ id: child.key, ...child.val() });
                });
            }
            setClasses(fetchedClasses);
        }, (error) => {
            console.error("Firebase Read Error (Classes):", error);
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

                const historyRef = push(ref(db, `Point_History/${submission.studentId}`));
                updates[`Point_History/${submission.studentId}/${historyRef.key}`] = {
                    studentId: submission.studentId,
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

            const historyRef = push(ref(db, `Point_History/${studentId}`));
            await set(historyRef, {
                studentId: studentId,
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
            <TeacherSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                currentUser={currentUser} 
                submissionsCount={submissions.length} 
                logout={logout} 
            />

            <main className="p-main-workspace animate-fade-in">
                <TeacherHeader subject={currentUser?.subject || 'Educator'} />

                {activeTab === 'overview' && (
                    <TeacherOverview 
                        currentUser={currentUser}
                        submissions={submissions}
                        tasks={tasks}
                        filteredStudentsCount={filteredStudents.length}
                        onSubmit={handleCreateTask}
                        newTaskTitle={newTaskTitle}
                        setNewTaskTitle={setNewTaskTitle}
                        newTaskGrade={newTaskGrade}
                        setNewTaskGrade={setNewTaskGrade}
                        newTaskClassId={newTaskClassId}
                        setNewTaskClassId={setNewTaskClassId}
                        newTaskMaxScore={newTaskMaxScore}
                        setNewTaskMaxScore={setNewTaskMaxScore}
                        newTaskPoints={newTaskPoints}
                        setNewTaskPoints={setNewTaskPoints}
                        newTaskDeadline={newTaskDeadline}
                        setNewTaskDeadline={setNewTaskDeadline}
                        newTaskFile={newTaskFile}
                        setNewTaskFile={setNewTaskFile}
                        uploading={uploading}
                        classes={classes}
                    />
                )}

                {activeTab === 'queue' && (
                    <SubmissionQueue 
                        submissions={submissions}
                        gradingScore={gradingScore}
                        setGradingScore={setGradingScore}
                        handleProcessSubmission={handleProcessSubmission}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'students' && (
                    <StudentDirectory 
                        filteredStudents={filteredStudents}
                        classes={classes}
                        teacherClasses={teacherClasses}
                        selectedClassFilter={selectedClassFilter}
                        setSelectedClassFilter={setSelectedClassFilter}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        handleQuickAdjust={handleQuickAdjust}
                        adjustingPoints={adjustingPoints}
                        setAdjustingPoints={setAdjustingPoints}
                        customPointAmount={customPointAmount}
                        setCustomPointAmount={setCustomPointAmount}
                    />
                )}

                {activeTab === 'resources' && (
                    <ResourceVault 
                        tasks={tasks}
                        handleDeleteTask={handleDeleteTask}
                    />
                )}

                {activeTab === 'lockouts' && (
                    <QuizLockouts 
                        students={students.filter(s => 
                            s.isQuizLocked && 
                            (teacherClasses.length === 0 || teacherClasses.includes(s.classId || ''))
                        )}
                    />
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
