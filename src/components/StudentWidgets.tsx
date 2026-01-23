
import React from 'react';
import { Award, Star, Target, Flame, Bell, CalendarCheck } from 'lucide-react';
import type { User, TaskSubmission, Achievement, Task } from '../types';

interface ProfileWidgetProps {
  currentUser: User | null;
  submissions: TaskSubmission[];
}

export const ProfileWidget: React.FC<ProfileWidgetProps> = ({ currentUser, submissions }) => {
  const userSubmissions = submissions.filter(s => s.studentId === currentUser?.id);
  const approvedCount = userSubmissions.filter(s => s.status === 'Approved').length;
  const totalCount = userSubmissions.length || 0;
  const approvalRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(0) : '0';

  return (
    <div className="widget-modern glass-card animate-slide-up">
      <div className="wm-header">
        <span className="wm-title">Performance Rate</span>
        <div style={{ background: 'var(--success)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900 }}>ACTIVE</div>
      </div>

      <div className="wm-body" style={{ marginTop: '1rem' }}>
        <span className="wm-val">{approvalRate}%</span>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 900 }}>{totalCount}</span>
            <span>Total Tasks</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--success)', fontSize: '1.25rem', fontWeight: 900 }}>{approvedCount}</span>
            <span>Approved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AchievementsWidgetProps {
  achievements: Achievement[];
}

export const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ achievements }) => {
  return (
    <div className="ach-list-modern">
      {achievements.map(ach => (
        <div key={ach.id} className={`ach-item ${ach.isUnlocked ? 'unlocked' : 'locked'}`}>
          <div className="a-icon-box">
            {ach.icon === 'star' && <Star size={20} />}
            {ach.icon === 'target' && <Target size={20} />}
            {ach.icon === 'flame' && <Flame size={20} />}
            {ach.icon === 'award' && <Award size={20} />}
            {!ach.isUnlocked && <div className="a-lock-overlay">🔒</div>}
          </div>
          <div className="ach-info-text">
            <div className="ach-header-row">
              <span className="a-title">{ach.title}</span>
              <span className="a-percent">{ach.progress}%</span>
            </div>
            <p className="a-desc">{ach.description}</p>
            <div className="ach-progress-outer">
              <div
                className="ach-progress-inner"
                style={{
                  width: `${ach.progress}%`,
                  background: ach.isUnlocked ? 'var(--gold-gradient)' : 'var(--accent-gradient)'
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SystemUpdatesWidget: React.FC = () => {
  return (
    <div className="widget-modern glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="wm-header">
        <span className="wm-title">Campus Intelligence</span>
        <Bell size={18} color="var(--accent)" />
      </div>
      <div className="notif-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="notif-item">
          <div className="n-dot"></div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rewards Catalog Refreshed</p>
            <span className="n-time">Just now</span>
          </div>
        </div>
        <div className="notif-item">
          <div className="n-dot"></div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Term 2 Analytics Live</p>
            <span className="n-time">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeadlinesWidget: React.FC<{ upcomingDeadlines: Task[] }> = ({ upcomingDeadlines }) => {
  return (
    <div className="widget-modern glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="wm-header">
        <span className="wm-title">Priority Deadlines</span>
        <CalendarCheck size={18} color="var(--danger)" />
      </div>
      <div className="deadlines-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {upcomingDeadlines.length > 0 ? upcomingDeadlines.slice(0, 3).map(t => (
          <div key={t.id} className="deadline-item">
            <div className="d-date-box">
              <span className="d-day">{new Date(t.deadline!).getDate()}</span>
              <span className="d-month">{new Date(t.deadline!).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
            </div>
            <div className="d-info">
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase' }}>{t.subject}</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.title.substring(0, 25)}</div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Zero Pending Academic Deadlines</div>
        )}
      </div>
    </div>
  );
};
