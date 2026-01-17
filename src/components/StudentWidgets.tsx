import React from 'react';
import { Award, Star, Target, Flame, Bell } from 'lucide-react';
import type { User, TaskSubmission, Achievement, Task } from '../types';

interface ProfileWidgetProps {
  currentUser: User | null;
  submissions: TaskSubmission[];
}

export const ProfileWidget: React.FC<ProfileWidgetProps> = ({ currentUser, submissions }) => {
  const userSubmissions = submissions.filter(s => s.studentId === currentUser?.id);
  const approvedCount = userSubmissions.filter(s => s.status === 'Approved').length;
  const totalCount = userSubmissions.length || 1;
  const approvalRate = ((approvedCount / totalCount) * 100).toFixed(0);

  return (
    <div className="widget-card glass-card">
      <div className="w-header">
        <h3>My Status</h3>
        <div className="w-pulse green"></div>
      </div>
      <div className="profile-mini-stats">
        <div className="stat-item">
          <span className="stat-val">{userSubmissions.length}</span>
          <span className="stat-lbl">Tasks Done</span>
        </div>
        <div className="vertical-div"></div>
        <div className="stat-item">
          <span className="stat-val">{approvalRate}%</span>
          <span className="stat-lbl">Approval Rate</span>
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
    <div className="widget-card glass-card">
      <div className="w-header">
        <h3>Achievements</h3>
        <Award size={16} className="text-muted" />
      </div>
      <div className="achievements-list">
        {achievements.map(ach => (
          <div key={ach.id} className={`ach-item ${ach.isUnlocked ? 'unlocked' : ''}`}>
            <div className={`ach-icon ${ach.isUnlocked ? 'active' : ''}`}>
              {ach.icon === 'star' && <Star size={14} />}
              {ach.icon === 'target' && <Target size={14} />}
              {ach.icon === 'flame' && <Flame size={14} />}
              {ach.icon === 'award' && <Award size={14} />}
            </div>
            <div className="ach-info">
              <span className="ach-title">{ach.title}</span>
              <span className="ach-desc">{ach.description}</span>
              <div className="ach-bar-bg">
                <div className="ach-bar-fill" style={{ width: `${ach.progress}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DeadlinesWidgetProps {
  upcomingDeadlines: Task[];
}

export const SystemUpdatesWidget: React.FC = () => {
  return (
    <div className="widget-card glass-card">
      <div className="w-header">
        <h3>System Updates</h3>
        <Bell size={16} className="text-muted" />
      </div>
      <div className="notif-list">
        <div className="notif-item">
          <div className="n-dot"></div>
          <p>Rewards catalog updated with 3 new items.</p>
          <span className="n-time">2h ago</span>
        </div>
        <div className="notif-item">
          <div className="n-dot"></div>
          <p>Leaderboard refreshed for Term 2.</p>
          <span className="n-time">5h ago</span>
        </div>
      </div>
    </div>
  );
};

export const DeadlinesWidget: React.FC<DeadlinesWidgetProps> = ({ upcomingDeadlines }) => {
  return (
    <div className="widget-card glass-card">
      <div className="w-header">
        <h3>Upcoming Deadlines</h3>
        <CalendarCheck size={16} className="text-muted" />
      </div>
      <div className="deadlines-list">
        {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(t => (
          <div key={t.id} className="deadline-item">
            <div className="d-date-box">
              <span className="d-day">{new Date(t.deadline!).getDate()}</span>
              <span className="d-month">{new Date(t.deadline!).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
            </div>
            <div className="d-info">
              <span className="d-subject">{t.subject}</span>
              <span className="d-task-title">{t.title.substring(0, 25)}{t.title.length > 25 ? '...' : ''}</span>
            </div>
          </div>
        )) : (
          <div className="empty-widget">
            <span>No upcoming deadlines</span>
          </div>
        )}
      </div>
    </div>
  );
};
