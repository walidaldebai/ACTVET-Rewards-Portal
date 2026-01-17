import React from 'react';
import { ShieldAlert, Unlock, UserX } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, update } from 'firebase/database';
import type { User } from '../types';

interface QuizLockoutsProps {
    students: User[];
}

const QuizLockouts: React.FC<QuizLockoutsProps> = ({ students }) => {
    const handleUnlock = async (studentId: string) => {
        if (!confirm('Are you sure you want to unlock this student? They will be able to attempt the quiz again.')) return;

        try {
            await update(ref(db, `Users/${studentId}`), {
                isQuizLocked: false
            });
            alert('Student unlocked successfully!');
        } catch (error) {
            console.error('Failed to unlock student:', error);
            alert('Failed to unlock student.');
        }
    };

    return (
        <div className="lockouts-container animate-fade-in">
            <div className="section-header">
                <div className="header-icon locked">
                    <ShieldAlert size={24} />
                </div>
                <div className="header-text">
                    <h2>Quiz Security Management</h2>
                    <p>Manage students who have been locked out of the Innovator Assessment due to security violations.</p>
                </div>
            </div>

            <div className="lockouts-grid">
                {students.length === 0 ? (
                    <div className="empty-lockouts glass-card">
                        <div className="empty-icon">
                            <UserX size={48} />
                        </div>
                        <h3>No Active Lockouts</h3>
                        <p>All students currently have access to their assessments.</p>
                    </div>
                ) : (
                    students.map(student => (
                        <div key={student.id} className="lockout-card glass-card animate-scale-in">
                            <div className="student-info">
                                <div className="student-avatar gold-gradient">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="details">
                                    <h4>{student.name}</h4>
                                    <span className="class-badge">Class {student.classId}</span>
                                    <span className="email">{student.email}</span>
                                </div>
                            </div>
                            
                            <div className="lock-reason">
                                <span className="reason-label">Violation Detected:</span>
                                <span className="reason-text">Tab Switching / External Resource Access</span>
                            </div>

                            <button 
                                className="unlock-btn primary-gradient"
                                onClick={() => handleUnlock(student.id)}
                            >
                                <Unlock size={18} />
                                <span>Reset & Unlock Quiz</span>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QuizLockouts;
