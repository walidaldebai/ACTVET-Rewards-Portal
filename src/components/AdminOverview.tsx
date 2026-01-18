import React from 'react';
import type { User, CampusClass } from '../types';
import UserForm from './UserForm';
import RecentActivity from './RecentActivity';
import { Ticket, Trash2 } from 'lucide-react';

interface AdminOverviewProps {
    users: User[];
    classes: CampusClass[];
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
        </div>
    );
};

export default AdminOverview;
