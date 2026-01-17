import React from 'react';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    School,
    BarChart3,
    Ticket,
    Bell,
    Database,
    Trash2,
    LogOut
} from 'lucide-react';

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    runSeed: () => void;
    handleResetPoints: () => void;
    logout: () => void;
    seeding: boolean;
    role: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeTab,
    setActiveTab,
    runSeed,
    handleResetPoints,
    logout,
    seeding,
    role
}) => {
    return (
        <aside className="a-sidebar glass-card">
            <div className="a-sidebar-head">
                <div className="a-logo">
                    <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '100%', height: 'auto' }} />
                </div>
                <div className="a-brand">
                    <span className="a-main">ATS Innovator Portal</span>
                    <span className="a-sub">GOVERNANCE ENGINE</span>
                </div>
            </div>

            <nav className="a-nav">
                <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                    <LayoutDashboard size={18} />
                    <span>Command Center</span>
                </button>
                <button className={activeTab === 'directory' ? 'active' : ''} onClick={() => setActiveTab('directory')}>
                    <Users size={18} />
                    <span>User Registry</span>
                </button>
                <button className={activeTab === 'faculty' ? 'active' : ''} onClick={() => setActiveTab('faculty')}>
                    <GraduationCap size={18} />
                    <span>Faculty Manager</span>
                </button>
                <button className={activeTab === 'classes' ? 'active' : ''} onClick={() => setActiveTab('classes')}>
                    <School size={18} />
                    <span>Campus Classes</span>
                </button>
                <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
                    <BarChart3 size={18} />
                    <span>Analytics</span>
                </button>
                <button className={activeTab === 'vouchers' ? 'active' : ''} onClick={() => setActiveTab('vouchers')}>
                    <Ticket size={18} />
                    <span>Staff Vouchers</span>
                </button>
                <button className={activeTab === 'redemptions' ? 'active' : ''} onClick={() => setActiveTab('redemptions')}>
                    <Bell size={18} />
                    <span>Redemption Requests</span>
                </button>

                {role === 'Super Admin' && (
                    <>
                        <button onClick={runSeed} className={seeding ? 'spin' : ''}>
                            <Database size={18} />
                            <span>Rebuild Data</span>
                        </button>
                        <button onClick={handleResetPoints} className="text-red-hover">
                            <Trash2 size={18} />
                            <span>Reset All Points</span>
                        </button>
                    </>
                )}
            </nav>

            <div className="a-sidebar-foot">
                <button onClick={logout} className="p-logout-btn">
                    <LogOut size={18} />
                    <span>Terminate Session</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
