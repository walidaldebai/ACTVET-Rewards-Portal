import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import type { User } from '../types';

interface HeroBannerProps {
  currentUser: User | null;
  points: number;
  calculateCampusRank: (id: string) => string | number;
  calculateRank: (id: string) => string | number;
  isCheatLocked?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  currentUser,
  points,
  calculateCampusRank,
  calculateRank,
  isCheatLocked
}) => {
  const campusRank = isCheatLocked ? '?' : calculateCampusRank(currentUser?.id || '');
  const sectionRank = isCheatLocked ? '?' : calculateRank(currentUser?.id || '');

  return (
    <div className="hero-banner-modern animate-fade-in">
      <div className="hero-main-content">
        <div className="welcome-section">
          <div className="status-pill animate-slide-right">
            <span className="pulse-dot"></span>
            ATS INNOVATOR HUB
          </div>
          <h1 className="hero-title">
            Welcome back, <span className="text-gradient">{currentUser?.name?.split(' ')[0] || 'Innovator'}</span>
          </h1>
          <p className="hero-subtitle">
            Your academic excellence journey continues. You are currently ranked 
            <span className="rank-highlight"> #{campusRank} </span> in the campus.
          </p>
        </div>

        <div className="quick-metrics animate-slide-up">
          <div className="metric-item">
            <div className="metric-icon campus"><TrendingUp size={20} /></div>
            <div className="metric-info">
              <span className="m-label">CAMPUS RANK</span>
              <span className="m-value">#{campusRank}</span>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon section"><Zap size={20} /></div>
            <div className="metric-info">
              <span className="m-label">SECTION RANK</span>
              <span className="m-value">#{sectionRank}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wallet-card-modern glass-card floating">
        <div className="wallet-head">
          <span className="w-label">TOTAL EXCELLENCE</span>
          <div className="w-badge">LIVE SYNC</div>
        </div>
        <div className="wallet-body">
          <div className="w-amount">
            <Zap size={32} className="zap-icon" />
            <span className="w-pts">{points.toLocaleString()}</span>
            <span className="w-currency">PTS</span>
          </div>
          <div className="w-progress">
            <div className="w-progress-bar" style={{ width: '75%' }}></div>
          </div>
          <div className="w-footer">
            <span>Next Reward at 2,500 PTS</span>
            <span className="w-percent">75%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
