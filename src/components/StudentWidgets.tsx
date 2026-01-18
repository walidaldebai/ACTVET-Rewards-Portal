import React, { useState } from 'react';
import { Award, Star, Target, Flame, Bell, CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="widget-modern glass-card animate-scale-in">
      <div className="wm-header">
        <div className="wm-title-group">
          <Target size={18} className="wm-icon-target" />
          <span className="wm-title">PERFORMANCE STATUS</span>
        </div>
        <div className="wm-badge-live">LIVE</div>
      </div>
      
      <div className="wm-body">
        <div className="wm-main-stat">
          <span className="wm-val">{approvalRate}%</span>
          <span className="wm-lbl">APPROVAL RATE</span>
        </div>
        
        <div className="wm-sub-stats">
          <div className="wm-sub-item">
            <span className="wms-val">{totalCount}</span>
            <span className="wms-lbl">TASKS DONE</span>
          </div>
          <div className="wm-divider"></div>
          <div className="wm-sub-item">
            <span className="wms-val">{approvedCount}</span>
            <span className="wms-lbl">APPROVED</span>
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
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="widget-modern glass-card animate-scale-in">
      <div className="wm-header">
        <div className="wm-title-group">
          <Award size={18} className="wm-icon-award" />
          <span className="wm-title">ACHIEVEMENTS</span>
        </div>
        <button 
          className="w-toggle-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse achievements" : "Expand achievements"}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      <div className={`achievements-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
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
                <div className="ach-bar-bg">
                  <div className="ach-bar-fill" style={{ width: `${ach.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface DeadlinesWidgetProps {
  upcomingDeadlines: Task[];
}

export const SystemUpdatesWidget: React.FC = () => {
  return (
    <div className="widget-modern glass-card animate-scale-in">
      <div className="wm-header">
        <div className="wm-title-group">
          <Bell size={18} className="wm-icon-bell" />
          <span className="wm-title">SYSTEM UPDATES</span>
        </div>
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
    <div className="widget-modern glass-card animate-scale-in">
      <div className="wm-header">
        <div className="wm-title-group">
          <CalendarCheck size={18} className="wm-icon-calendar" />
          <span className="wm-title">UPCOMING DEADLINES</span>
        </div>
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
