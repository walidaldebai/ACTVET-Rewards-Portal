import React from 'react';
import { Trophy, Users as UsersIcon } from 'lucide-react';
import type { User } from '../types';

interface LeaderboardSectionProps {
  allStudents: User[];
  currentUser: User | null;
  getClassLeaderboard: () => any[];
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  allStudents,
  currentUser,
  getClassLeaderboard
}) => {
  return (
    <div className="leaderboard-grid animate-fade-in">
      <section className="leaderboard-section glass-card">
        <div className="l-head">
          <Trophy size={32} className="icon-gold" />
          <h2>Top Students (Campus Wide)</h2>
        </div>
        <div className="l-list">
          {allStudents.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5).map((s, i) => (
            <div key={s.id} className={`l-item ${s.id === currentUser?.id ? 'current' : ''}`}>
              <span className="l-rank">{i + 1}</span>
              <div className="l-avatar">{s.name.charAt(0)}</div>
              <div className="l-info">
                <span className="l-name">{s.name}</span>
                <span className="l-class">{s.classId}</span>
              </div>
              <span className="l-pts">{s.points} PTS</span>
            </div>
          ))}
        </div>
      </section>

      <section className="leaderboard-section glass-card">
        <div className="l-head">
          <UsersIcon size={32} className="icon-purple" />
          <h2>Top Classes (Average)</h2>
        </div>
        <div className="l-list">
          {getClassLeaderboard().map((c, i) => (
            <div key={c.id} className={`l-item ${c.id === currentUser?.classId ? 'current' : ''}`}>
              <span className="l-rank">{i + 1}</span>
              <div className="l-avatar class">#</div>
              <div className="l-info">
                <span className="l-name">Class {c.id}</span>
                <span className="l-class">{c.studentCount} active students</span>
              </div>
              <span className="l-pts">{Math.round(c.totalPoints / c.studentCount)} AVG</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LeaderboardSection;
