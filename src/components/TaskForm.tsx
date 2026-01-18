import React from 'react';
import { PlusCircle, Calendar, Upload } from 'lucide-react';
import type { Grade, CampusClass } from '../types';

interface TaskFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    newTaskTitle: string;
    setNewTaskTitle: (val: string) => void;
    newTaskGrade: Grade;
    setNewTaskGrade: (val: Grade) => void;
    newTaskClassId: string;
    setNewTaskClassId: (val: string) => void;
    newTaskMaxScore: number;
    setNewTaskMaxScore: (val: number) => void;
    newTaskPoints: number;
    setNewTaskPoints: (val: number) => void;
    newTaskDeadline: string;
    setNewTaskDeadline: (val: string) => void;
    newTaskTimeLimit: number;
    setNewTaskTimeLimit: (val: number) => void;
    newTaskFile: File | null;
    setNewTaskFile: (file: File | null) => void;
    uploading: boolean;
    classes: CampusClass[];
}

const TaskForm: React.FC<TaskFormProps> = ({
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
    newTaskTimeLimit,
    setNewTaskTimeLimit,
    newTaskFile,
    setNewTaskFile,
    uploading,
    classes
}) => {
    return (
        <section className="p-card-v3 glass-card">
            <div className="p-card-head">
                <PlusCircle className="text-purple" />
                <h2>Assign New Task</h2>
            </div>
            <form onSubmit={onSubmit} className="p-task-form">
                <div className="p-f-group">
                    <label>Assignment Title</label>
                    <input 
                        type="text" 
                        placeholder="Advanced Equation Set B" 
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)} 
                        required 
                    />
                </div>
                <div className="p-f-row">
                    <div className="p-f-group">
                        <label>Target Grade</label>
                        <select 
                            value={newTaskGrade} 
                            onChange={e => {
                                const g = Number(e.target.value) as Grade;
                                setNewTaskGrade(g);
                                setNewTaskClassId(''); 
                            }}
                        >
                            <option value={9}>Grade 9</option>
                            <option value={10}>Grade 10</option>
                            <option value={11}>Grade 11</option>
                            <option value={12}>Grade 12</option>
                        </select>
                    </div>
                    <div className="p-f-group">
                        <label>Target Class (Optional)</label>
                        <select 
                            value={newTaskClassId} 
                            onChange={e => setNewTaskClassId(e.target.value)}
                        >
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
                        <input 
                            type="number" 
                            value={newTaskMaxScore} 
                            onChange={e => setNewTaskMaxScore(Number(e.target.value))} 
                        />
                    </div>
                    <div className="p-f-group">
                        <label>Award Points</label>
                        <input 
                            type="number" 
                            value={newTaskPoints} 
                            onChange={e => setNewTaskPoints(Number(e.target.value))} 
                        />
                    </div>
                    <div className="p-f-group">
                        <label>Time Limit (Minutes)</label>
                        <input 
                            type="number" 
                            value={newTaskTimeLimit} 
                            onChange={e => setNewTaskTimeLimit(Number(e.target.value))} 
                            min={1}
                            required
                        />
                    </div>
                </div>
                <div className="p-f-row">
                    <div className="p-f-group">
                        <label><Calendar size={14} /> Submission Deadline</label>
                        <input 
                            type="date" 
                            value={newTaskDeadline} 
                            onChange={e => setNewTaskDeadline(e.target.value)} 
                        />
                    </div>
                    <div className="p-f-group">
                        <label><Upload size={14} /> Attach Resource (PDF/DOC)</label>
                        <div className="custom-file-upload glass-card">
                            <Upload size={18} />
                            <span>{newTaskFile ? newTaskFile.name : 'Click to select file...'}</span>
                            <input 
                                type="file" 
                                onChange={e => setNewTaskFile(e.target.files?.[0] || null)} 
                            />
                        </div>
                    </div>
                </div>
                <button type="submit" className="p-submit-btn accent-gradient" disabled={uploading}>
                    {uploading ? 'Processing File...' : 'Broadcast Assignment'}
                </button>
            </form>
        </section>
    );
};

export default TaskForm;
