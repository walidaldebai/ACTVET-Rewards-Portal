
import React from 'react';
import {
    LayoutDashboard,
    ClipboardList,
    Ticket,
    Trophy,
    Settings,
    LogOut,
    X
} from 'lucide-react';
import type { User } from '../types';

interface StudentSidebarProps {
    activeTab: 'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings' | 'achievements';
    setActiveTab: (tab: 'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings' | 'achievements') => void;
    currentUser: User | null;
    logout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({
    activeTab,
    setActiveTab,
    currentUser,
    logout,
    isOpen = false,
    onClose
}) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && <div className="s-sidebar-overlay" onClick={onClose} />}

            <nav className={`s-sidebar glass-card ${isOpen ? 'open' : ''}`}>
                <div className="s-sidebar-top">
                    <div className="s-sidebar-header mobile-only">
                        <button className="s-close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className="s-brand">
                        <img src="/ats_logo.png" alt="ATS Logo" />
                    </div>
                    <div className="s-brand-text">
                        <span className="s-main">ATS Innovator</span>
                        <span className="s-sub">Student Portal</span>
                    </div>
                </div>

                <div className="s-nav">
                    <button
                        className={activeTab === 'dashboard' ? 'active' : ''}
                        onClick={() => { setActiveTab('dashboard'); onClose?.(); }}
                    >
                        <LayoutDashboard size={22} />
                        <span>Insight</span>
                    </button>
                    <button
                        className={activeTab === 'tasks' ? 'active' : ''}
                        onClick={() => { setActiveTab('tasks'); onClose?.(); }}
                    >
                        <ClipboardList size={22} />
                        <span>Academics</span>
                    </button>
                    <button
                        className={activeTab === 'achievements' ? 'active' : ''}
                        onClick={() => { setActiveTab('achievements'); onClose?.(); }}
                    >
                        <Trophy size={22} />
                        <span>Achievements</span>
                    </button>
                    <button
                        className={activeTab === 'rewards' ? 'active' : ''}
                        onClick={() => { setActiveTab('rewards'); onClose?.(); }}
                    >
                        <Ticket size={22} />
                        <span>Rewards</span>
                    </button>
                    <button
                        className={activeTab === 'leaderboard' ? 'active' : ''}
                        onClick={() => { setActiveTab('leaderboard'); onClose?.(); }}
                    >
                        <Trophy size={22} />
                        <span>Ranking</span>
                    </button>
                    <button
                        className={activeTab === 'settings' ? 'active' : ''}
                        onClick={() => { setActiveTab('settings'); onClose?.(); }}
                    >
                        <Settings size={22} />
                        <span>Profile</span>
                    </button>
                </div>

                <div className="user-profile-v2">
                    <div className="u-avatar-v2">
                        {currentUser?.name?.charAt(0)}
                    </div>
                    <div className="u-box">
                        <span className="u-name">{currentUser?.name?.split(' ')[0]}</span>
                        <span className="u-role">ATS Student</span>
                    </div>
                    <button onClick={logout} className="p-logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>
        </>
    );
};

export default StudentSidebar;
