import React from 'react';
import { TrendingUp, ClipboardList } from 'lucide-react';
import type { Task } from '../types';

interface TaskActivityProps {
    tasks: Task[];
}

const TaskActivity: React.FC<TaskActivityProps> = ({ tasks }) => {
    return (
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
                            <span className="p-a-meta">
                                Grade {task.grade} • {task.points} PTS • {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="p-a-badge">Active</div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="p-empty-state">No recent task activity.</div>
                )}
            </div>
        </section>
    );
};

export default TaskActivity;
