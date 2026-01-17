import React from 'react';
import { 
    ClipboardList, 
    Ticket, 
    Trophy, 
    Settings, 
    LogOut 
} from 'lucide-react';
import type { User } from '../types';

interface StudentSidebarProps {
    activeTab: 'rewards' | 'tasks' | 'leaderboard' | 'settings';
    setActiveTab: (tab: 'rewards' | 'tasks' | 'leaderboard' | 'settings') => void;
    currentUser: User | null;
    logout: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ 
    activeTab, 
    setActiveTab, 
    currentUser, 
    logout 
}) => {
    return (
        <nav className="s-sidebar glass-card animate-slide-right">
            <div className="s-sidebar-top">
                <div className="s-brand">
                    <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '100%', height: 'auto' }} />
                </div>
                <div className="s-brand-text">
                    <span className="s-main">ATS Innovator Portal</span>
                    <span className="s-sub">STUDENT HUB</span>
                </div>
            </div>

            <div className="s-nav">
                <button
                    className={activeTab === 'tasks' ? 'active' : ''}
                    onClick={() => setActiveTab('tasks')}
                >
                    <ClipboardList size={20} />
                    <span>Academic Tasks</span>
                </button>
                <button
                    className={activeTab === 'rewards' ? 'active' : ''}
                    onClick={() => setActiveTab('rewards')}
                >
                    <Ticket size={20} />
                    <span>Rewards Portal</span>
                </button>
                <button
                    className={activeTab === 'leaderboard' ? 'active' : ''}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    <Trophy size={20} />
                    <span>Institutional Ranking</span>
                </button>
                <button
                    className={activeTab === 'settings' ? 'active' : ''}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={20} />
                    <span>Profile Settings</span>
                </button>
            </div>

            <div className="user-profile-v2">
                <div className="u-box">
                    <div className="u-meta">
                        <span className="u-name">{currentUser?.name}</span>
                        <span className="u-role">ATS Innovator</span>
                    </div>
                    <div className="u-avatar-v2 gold-gradient">
                        {currentUser?.name?.charAt(0)}
                    </div>
                </div>
                <button onClick={logout} className="p-logout">
                    <LogOut size={18} />
                </button>
            </div>
        </nav>
    );
};

export default StudentSidebar;
