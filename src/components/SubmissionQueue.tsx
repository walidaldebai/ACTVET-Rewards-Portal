import React from 'react';
import { UserCheck, Clock, FileText, Download, XCircle, CheckCircle2 } from 'lucide-react';
import type { TaskSubmission, User } from '../types';

interface SubmissionQueueProps {
    submissions: TaskSubmission[];
    gradingScore: Record<string, number>;
    setGradingScore: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    handleProcessSubmission: (submission: TaskSubmission, approve: boolean) => Promise<void>;
    currentUser: User | null;
}

const SubmissionQueue: React.FC<SubmissionQueueProps> = ({
    submissions,
    gradingScore,
    setGradingScore,
    handleProcessSubmission,
    currentUser
}) => {
    return (
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
                            <div className="p-q-time">
                                <Clock size={14} /> Submitted {new Date(sub.submittedAt).toLocaleTimeString()}
                            </div>

                            {sub.submissionFileUrl && (
                                <a 
                                    href={sub.submissionFileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-q-attachment glass-card"
                                >
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
                                        onChange={e => setGradingScore(prev => ({ 
                                            ...prev, 
                                            [sub.id]: Number(e.target.value) 
                                        }))}
                                        placeholder="Point"
                                    />
                                    <span className="out-of">/ {sub.maxScore || 10}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-q-actions">
                            <button 
                                className="p-btn-decline" 
                                onClick={() => handleProcessSubmission(sub, false)}
                            >
                                <XCircle size={18} /> Reject
                            </button>
                            <button 
                                className="p-btn-approve accent-gradient" 
                                onClick={() => handleProcessSubmission(sub, true)}
                            >
                                Award & Close
                            </button>
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
    );
};

export default SubmissionQueue;
