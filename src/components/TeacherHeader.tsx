import { RefreshCw, Menu } from 'lucide-react';

interface TeacherHeaderProps {
    subject: string;
    onToggleSidebar: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({ subject, onToggleSidebar }) => {
    return (
        <header className="p-header">
            <div className="p-header-titles" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                    onClick={onToggleSidebar}
                    className="p-toggle-btn"
                    style={{
                        background: 'rgba(255,255,255,0.5)',
                        border: '1px solid white',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        transition: '0.3s'
                    }}
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1>Academic Governance</h1>
                    <p>Coordinate student recognition and {subject} performance tracking.</p>
                </div>
            </div>
            <div className="p-sync">
                <div className="p-sync-icon pulse"><RefreshCw size={14} /></div>
                <span>REAL-TIME ANALYTICS ACTIVE</span>
            </div>
        </header>
    );
};

export default TeacherHeader;
