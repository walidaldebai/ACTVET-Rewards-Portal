import React from 'react';
import { Trophy, Award } from 'lucide-react';
import type { User } from '../types';

interface AnalyticsSectionProps {
    classRankings: { id: string; total: number; count: number }[];
    topStudents: User[];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ classRankings, topStudents }) => {
    return (
        <div className="a-analytics animate-fade-in">
            <div className="rankings-grid">
                <section className="a-card glass-card">
                    <div className="a-card-head">
                        <Trophy size={24} className="icon-gold" />
                        <h2>Class Leaderboard</h2>
                    </div>
                    <div className="rank-list">
                        {classRankings.map((c, i) => (
                            <div key={c.id} className="rank-item-v3">
                                <span className="r-pos">{i + 1}</span>
                                <div className="r-info">
                                    <strong>Class {c.id}</strong>
                                    <span>{c.count} students</span>
                                </div>
                                <span className="r-pts">
                                    {Math.round(c.total / (c.count || 1))} AVG
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="a-card glass-card">
                    <div className="a-card-head">
                        <Award size={24} className="icon-blue" />
                        <h2>Top Global Students</h2>
                    </div>
                    <div className="rank-list">
                        {topStudents.map((s, i) => (
                            <div key={s.id} className="rank-item-v3">
                                <span className="r-pos">{i + 1}</span>
                                <div className="r-info">
                                    <strong>{s.name}</strong>
                                    <span>{s.classId}</span>
                                </div>
                                <span className="r-pts">{s.points} PTS</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AnalyticsSection;
