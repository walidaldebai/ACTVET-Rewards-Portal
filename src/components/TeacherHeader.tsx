import React from 'react';
import { RefreshCw } from 'lucide-react';

interface TeacherHeaderProps {
    subject: string;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({ subject }) => {
    return (
        <header className="p-header">
            <div className="p-header-titles">
                <h1>Academic Governance</h1>
                <p>Coordinate student recognition and {subject} performance tracking.</p>
            </div>
            <div className="p-sync">
                <div className="p-sync-icon pulse"><RefreshCw size={14} /></div>
                <span>REAL-TIME ANALYTICS ACTIVE</span>
            </div>
        </header>
    );
};

export default TeacherHeader;
