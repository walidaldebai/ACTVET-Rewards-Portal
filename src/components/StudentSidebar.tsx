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
    activeTab: 'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings';
    setActiveTab: (tab: 'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings') => void;
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
            {/* Overlay for mobile */}
            {isOpen && <div className="s-sidebar-overlay mobile-only" onClick={onClose}></div>}
            
            <nav className={`s-sidebar glass-card animate-slide-right ${isOpen ? 'open' : ''}`}>
                <div className="s-sidebar-top">
                    <div className="s-sidebar-header mobile-only">
                        <button className="s-close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
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
                        className={activeTab === 'dashboard' ? 'active' : ''}
                        onClick={() => { setActiveTab('dashboard'); onClose?.(); }}
                    >
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </button>
                    <button
                        className={activeTab === 'tasks' ? 'active' : ''}
                        onClick={() => { setActiveTab('tasks'); onClose?.(); }}
                    >
                        <ClipboardList size={20} />
                        <span>Academic Tasks</span>
                    </button>
                    <button
                        className={activeTab === 'rewards' ? 'active' : ''}
                        onClick={() => { setActiveTab('rewards'); onClose?.(); }}
                    >
                        <Ticket size={20} />
                        <span>Rewards Portal</span>
                    </button>
                    <button
                        className={activeTab === 'leaderboard' ? 'active' : ''}
                        onClick={() => { setActiveTab('leaderboard'); onClose?.(); }}
                    >
                        <Trophy size={20} />
                        <span>Institutional Ranking</span>
                    </button>
                    <button
                        className={activeTab === 'settings' ? 'active' : ''}
                        onClick={() => { setActiveTab('settings'); onClose?.(); }}
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
        </>
    );
};

export default StudentSidebar;
