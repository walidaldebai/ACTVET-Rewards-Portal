import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';

interface StudentHeaderProps {
    points: number;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ points }) => {
    return (
        <header className="s-header">
            <div className="s-header-titles">
                <h1>Student Command Center</h1>
                <p>Monitor your academic progress and merit point accumulation.</p>
            </div>
            <div className="s-header-stats">
                <div className="s-point-display gold-gradient">
                    <Zap size={20} fill="currentColor" />
                    <div className="s-p-info">
                        <span className="s-p-val">{points.toLocaleString()}</span>
                        <span className="s-p-lbl">MERIT POINTS</span>
                    </div>
                </div>
                <div className="s-sync-status">
                    <RefreshCw size={14} className="spin" />
                    <span>ENCRYPTED LIVE FEED</span>
                </div>
            </div>
        </header>
    );
};

export default StudentHeader;
