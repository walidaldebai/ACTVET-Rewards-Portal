import React from 'react';
import { UserPlus } from 'lucide-react';
import type { Role, Grade, CampusClass } from '../types';

interface UserFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    editUserId: string | null;
    provisionLoading: boolean;
    newUserName: string;
    setNewUserName: (val: string) => void;
    newUserEmail: string;
    setNewUserEmail: (val: string) => void;
    newUserPassword: string;
    setNewUserPassword: (val: string) => void;
    newUserRole: Role;
    setNewUserRole: (val: Role) => void;
    newUserSubject: string;
    setNewUserSubject: (val: string) => void;
    newUserGrade: Grade;
    setNewUserGrade: (val: Grade) => void;
    newUserClassId: string;
    setNewUserClassId: (val: string) => void;
    classes: CampusClass[];
    onCancelEdit: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
    onSubmit,
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
    classes,
    onCancelEdit
}) => {
    return (
        <section className="a-card glass-card">
            <div className="a-card-head">
                <UserPlus className="text-blue" />
                <h2>{editUserId ? 'Edit User' : 'Provision User'}</h2>
            </div>
            <form onSubmit={onSubmit} className="a-form">
                <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={newUserName} 
                    onChange={e => setNewUserName(e.target.value)} 
                    required 
                />
                <input 
                    type="email" 
                    placeholder="Institutional Email" 
                    value={newUserEmail} 
                    onChange={e => setNewUserEmail(e.target.value)} 
                    required 
                />
                <div className="f-row">
                    <input 
                        type="text" 
                        placeholder="Access Code" 
                        value={newUserPassword} 
                        onChange={e => setNewUserPassword(e.target.value)} 
                        required 
                    />
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)}>
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                {newUserRole === 'Teacher' && (
                    <input 
                        type="text" 
                        placeholder="Subject" 
                        value={newUserSubject} 
                        onChange={e => setNewUserSubject(e.target.value)} 
                        required 
                    />
                )}
                {newUserRole === 'Student' && (
                    <div className="f-row">
                        <select value={newUserGrade} onChange={e => {
                            const grade = Number(e.target.value) as Grade;
                            setNewUserGrade(grade);
                            const firstForGrade = classes.find(c => c.grade === grade);
                            setNewUserClassId(firstForGrade ? firstForGrade.id : '');
                        }}>
                            <option value={9}>G9</option>
                            <option value={10}>G10</option>
                            <option value={11}>G11</option>
                            <option value={12}>G12</option>
                        </select>
                        <select value={newUserClassId} onChange={e => setNewUserClassId(e.target.value)} required>
                            <option value="" disabled>Select Section</option>
                            {classes.filter(c => c.grade === newUserGrade).map(c => (
                                <option key={c.id} value={c.id}>S{c.name} (Grade {c.grade})</option>
                            ))}
                            {classes.filter(c => c.grade === newUserGrade).length === 0 && (
                                <option value="" disabled>No classes for G{newUserGrade}</option>
                            )}
                        </select>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="a-submit-btn accent-gradient" disabled={provisionLoading} style={{ flex: 1 }}>
                        {provisionLoading ? 'Processing...' : editUserId ? 'Update Entity' : 'Activate Entity'}
                    </button>
                    {editUserId && (
                        <button 
                            type="button" 
                            onClick={onCancelEdit} 
                            className="a-submit-btn" 
                            style={{ background: '#64748b', width: 'auto' }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
};

export default UserForm;
