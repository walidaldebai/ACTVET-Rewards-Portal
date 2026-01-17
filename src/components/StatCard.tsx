import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    label: string;
    icon?: LucideIcon;
    className?: string;
    children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, label, icon: Icon, className = '', children }) => {
    return (
        <section className={`a-card glass-card ${className}`}>
            <div className="a-card-head">
                {Icon && <Icon size={20} />}
                <h2>{title}</h2>
            </div>
            <div className="w-content">
                <div className="w-stats">
                    <div className="w-stat">
                        <span className="w-val">{value}</span>
                        <span className="w-lbl">{label}</span>
                    </div>
                </div>
                {children}
            </div>
        </section>
    );
};

export default StatCard;
