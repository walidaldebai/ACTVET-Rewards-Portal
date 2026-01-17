import React from 'react';
import { Award } from 'lucide-react';
import type { User, Task, TaskSubmission } from '../types';
import TaskForm from './TaskForm';
import TaskActivity from './TaskActivity';

interface TeacherOverviewProps {
    currentUser: User | null;
    submissions: TaskSubmission[];
    tasks: Task[];
    filteredStudentsCount: number;
    // TaskForm props
    onSubmit: (e: React.FormEvent) => Promise<void>;
    newTaskTitle: string;
    setNewTaskTitle: (val: string) => void;
    newTaskGrade: number;
    setNewTaskGrade: (val: any) => void;
    newTaskClassId: string;
    setNewTaskClassId: (val: string) => void;
    newTaskMaxScore: number;
    setNewTaskMaxScore: (val: number) => void;
    newTaskPoints: number;
    setNewTaskPoints: (val: number) => void;
    newTaskDeadline: string;
    setNewTaskDeadline: (val: string) => void;
    newTaskFile: File | null;
    setNewTaskFile: (val: File | null) => void;
    uploading: boolean;
    classes: any[];
}

const TeacherOverview: React.FC<TeacherOverviewProps> = ({
    currentUser,
    submissions,
    tasks,
    filteredStudentsCount,
    onSubmit,
    newTaskTitle,
    setNewTaskTitle,
    newTaskGrade,
    setNewTaskGrade,
    newTaskClassId,
    setNewTaskClassId,
    newTaskMaxScore,
    setNewTaskMaxScore,
    newTaskPoints,
    setNewTaskPoints,
    newTaskDeadline,
    setNewTaskDeadline,
    newTaskFile,
    setNewTaskFile,
    uploading,
    classes
}) => {
    return (
        <div className="p-dashboard-grid animate-fade-in">
            <section className="p-card-v3 welcome-card premium-gradient span-2">
                <div className="welcome-content">
                    <h2>Subject: {currentUser?.subject}</h2>
                    <p>You have {submissions.length} pending validations and {tasks.length} active assignments.</p>
                    <div className="welcome-stats">
                        <div className="w-stat">
                            <span className="w-val">{filteredStudentsCount}</span>
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

            <TaskForm 
                onSubmit={onSubmit}
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

            <TaskActivity tasks={tasks} />
        </div>
    );
};

export default TeacherOverview;
