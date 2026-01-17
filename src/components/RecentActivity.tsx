import React from 'react';
import { Activity, Trash2, RotateCcw } from 'lucide-react';
import type { User } from '../types';

interface RecentActivityProps {
    users: User[];
    onRemove: (id: string) => void;
    onResetQuiz: (studentId: string) => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ users, onRemove, onResetQuiz }) => {
    return (
        <section className="a-card glass-card span-all">
            <div className="a-card-head">
                <Activity className="text-purple" />
                <h2>Recent System Activity</h2>
            </div>
            <div className="a-table-container">
                <table className="a-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Institutional Email / Access</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.slice(0, 5).map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="u-cell">
                                        <div className={`u-avatar ${user.role.toLowerCase()}`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>{user.name}</div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="text-mono">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{user.email}</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, letterSpacing: '0.1em' }}>
                                            PASS: {user.password || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {user.role === 'Student' && (
                                            <button 
                                                onClick={() => onResetQuiz(user.id)} 
                                                className="a-delete-btn"
                                                title="Reset Innovator Assessment"
                                                style={{ background: '#fef9c3', color: '#854d0e' }}
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => onRemove(user.id)} className="a-delete-btn" title="Delete User">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default RecentActivity;
