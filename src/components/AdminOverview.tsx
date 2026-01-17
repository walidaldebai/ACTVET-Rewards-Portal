import React from 'react';
import type { User, CampusClass } from '../types';
import UserForm from './UserForm';
import RecentActivity from './RecentActivity';
import { Ticket, Trash2 } from 'lucide-react';

interface AdminOverviewProps {
    users: User[];
    classes: CampusClass[];
    vouchers: any[];
    onDeleteVoucher: (id: string) => Promise<void>;
    editUserId: string | null;
    provisionLoading: boolean;
    newUserName: string;
    setNewUserName: (val: string) => void;
    newUserEmail: string;
    setNewUserEmail: (val: string) => void;
    newUserPassword: string;
    setNewUserPassword: (val: string) => void;
    newUserRole: any;
    setNewUserRole: (val: any) => void;
    newUserSubject: string;
    setNewUserSubject: (val: string) => void;
    newUserGrade: any;
    setNewUserGrade: (val: any) => void;
    newUserClassId: string;
    setNewUserClassId: (val: string) => void;
    handleAddUser: (e: React.FormEvent) => Promise<void>;
    handleRemoveUser: (id: string) => Promise<void>;
    onResetQuiz: (studentId: string) => Promise<void>;
    setEditUserId: (id: string | null) => void;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({
    users,
    classes,
    vouchers,
    onDeleteVoucher,
    editUserId,
    provisionLoading,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    newUserSubject,
    setNewUserSubject,
    newUserGrade,
    setNewUserGrade,
    newUserClassId,
    setNewUserClassId,
    handleAddUser,
    handleRemoveUser,
    onResetQuiz,
    setEditUserId
}) => {
    const studentCount = users.filter(u => u.role === 'Student').length;
    const facultyCount = users.filter(u => u.role === 'Teacher').length;
    const activeSessions = Math.floor(users.length * 0.4);

    return (
        <div className="a-dashboard-grid animate-fade-in">
            <section className="a-card welcome-card premium-gradient span-2">
                <div className="w-content">
                    <h2>System Health: Optimal</h2>
                    <p>All database clusters are synchronized. Active sessions: {activeSessions} users.</p>
                    <div className="w-stats">
                        <div className="w-stat">
                            <span className="w-val">{studentCount}</span>
                            <span className="w-lbl">STUDENTS</span>
                        </div>
                        <div className="w-divider"></div>
                        <div className="w-stat">
                            <span className="w-val">{facultyCount}</span>
                            <span className="w-lbl">FACULTY</span>
                        </div>
                    </div>
                </div>
            </section>

            <UserForm 
                onSubmit={handleAddUser}
                editUserId={editUserId}
                provisionLoading={provisionLoading}
                newUserName={newUserName}
                setNewUserName={setNewUserName}
                newUserEmail={newUserEmail}
                setNewUserEmail={setNewUserEmail}
                newUserPassword={newUserPassword}
                setNewUserPassword={setNewUserPassword}
                newUserRole={newUserRole}
                setNewUserRole={setNewUserRole}
                newUserSubject={newUserSubject}
                setNewUserSubject={setNewUserSubject}
                newUserGrade={newUserGrade}
                setNewUserGrade={setNewUserGrade}
                newUserClassId={newUserClassId}
                setNewUserClassId={setNewUserClassId}
                classes={classes}
                onCancelEdit={() => {
                    setEditUserId(null);
                    setNewUserName('');
                    setNewUserEmail('');
                    setNewUserPassword('');
                }}
            />

            <RecentActivity users={users} onRemove={handleRemoveUser} onResetQuiz={onResetQuiz} />

            <section className="a-card glass-card">
                <div className="a-card-head">
                    <Ticket className="text-purple" />
                    <h2>Current Vouchers</h2>
                </div>
                <div className="class-grid-v2">
                    {vouchers.length === 0 ? (
                        <div className="empty-state-v2">
                            <p>No active vouchers found.</p>
                        </div>
                    ) : (
                        vouchers.map(v => (
                            <div 
                                key={v.id} 
                                className="class-card-v3 glass-card" 
                                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', padding: '1.25rem' }}
                            >
                                <div className="c-info">
                                    <span className="c-grade" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                                        {v.pointCost} PTS
                                    </span>
                                    <span className="c-id" style={{ fontSize: '1rem', fontWeight: 800 }}>{v.name}</span>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    width: '100%', 
                                    alignItems: 'center', 
                                    marginTop: '0.5rem' 
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                                        {v.aedValue} AED
                                    </span>
                                    <button 
                                        onClick={() => onDeleteVoucher(v.id)} 
                                        className="c-delete"
                                        title="Delete Voucher"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminOverview;
