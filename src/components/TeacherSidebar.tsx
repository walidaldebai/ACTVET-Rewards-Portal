import React from 'react';
import { 
    LayoutDashboard, 
    UserCheck, 
    Users, 
    Archive, 
    BookOpen, 
    ShieldAlert,
    LogOut 
} from 'lucide-react';
import type { User } from '../types';

interface TeacherSidebarProps {
    activeTab: 'overview' | 'queue' | 'students' | 'resources' | 'lockouts';
    setActiveTab: (tab: 'overview' | 'queue' | 'students' | 'resources' | 'lockouts') => void;
    currentUser: User | null;
    submissionsCount: number;
    logout: () => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ 
    activeTab, 
    setActiveTab, 
    currentUser, 
    submissionsCount, 
    logout 
}) => {
    return (
        <aside className="p-sidebar glass-card animate-slide-right">
            <div className="p-sidebar-top">
                <div className="p-brand">
                    <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '100%', height: 'auto' }} />
                </div>
                <div className="p-brand-text">
                    <span className="p-main">ATS Innovator Portal</span>
                    <span className="p-sub">TEACHER HUB</span>
                </div>
            </div>

            <div className="p-subject-tag accent-gradient">
                <BookOpen size={14} />
                <span>{currentUser?.subject || 'Educator'}</span>
            </div>

            <nav className="p-nav">
                <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                    <LayoutDashboard size={20} />
                    <span>Command Center</span>
                </button>
                <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>
                    <UserCheck size={20} />
                    <span>Validation Queue</span>
                    {submissionsCount > 0 && <span className="p-count">{submissionsCount}</span>}
                </button>
                <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
                    <Users size={20} />
                    <span>Student Directory</span>
                </button>
                <button className={activeTab === 'resources' ? 'active' : ''} onClick={() => setActiveTab('resources')}>
                    <Archive size={20} />
                    <span>Resource Vault</span>
                </button>
                <button className={activeTab === 'lockouts' ? 'active' : ''} onClick={() => setActiveTab('lockouts')}>
                    <ShieldAlert size={20} />
                    <span>Quiz Resets</span>
                </button>
            </nav>

            <div className="p-sidebar-bottom">
                <div className="p-profile-strip glass-card">
                    <div className="p-avatar gold-gradient">{currentUser?.name?.charAt(0)}</div>
                    <div className="p-info">
                        <span className="p-name">{currentUser?.name}</span>
                        <span className="p-role">Teacher</span>
                    </div>
                </div>
                <div className="p-logout-wrapper">
                    <button onClick={logout} className="p-logout-btn">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default TeacherSidebar;
