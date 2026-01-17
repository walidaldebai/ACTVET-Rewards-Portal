import React from 'react';
import { RefreshCw, LogOut } from 'lucide-react';

interface AdminHeaderProps {
    activeTab: string;
    userCount: number;
    logout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, userCount, logout }) => {
    const getTitle = () => {
        switch (activeTab) {
            case 'overview': return 'ATS Command Center';
            case 'classes': return 'Class Architecture';
            default: return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        }
    };

    return (
        <header className="a-header">
            <div className="a-h-titles">
                <h1>{getTitle()}</h1>
                <p>Welcome, ATS Innovator. Monitoring {userCount} authenticated entities.</p>
            </div>
            <div className="a-sync">
                <button 
                    onClick={() => window.location.reload()} 
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'inherit', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}
                >
                    <RefreshCw size={14} className="spin-slow" />
                    <span>SECURE LINK ACTIVE</span>
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 1rem' }}></div>

                <button 
                     onClick={logout}
                     className="p-logout-btn"
                     style={{ 
                         padding: '0.5rem 1rem',
                         fontSize: '0.8rem',
                         color: '#64748b',
                         width: 'auto'
                     }}
                 >
                    <LogOut size={16} />
                    <span>Terminate Session</span>
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;
