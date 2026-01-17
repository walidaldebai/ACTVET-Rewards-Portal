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
    <div className="hero-banner-v2 premium-gradient animate-fade-in">
      <div className="hero-content-v2">
        <div className="welcome-tag">
          <Zap size={14} className="text-yellow" />
          <span>ATS HUB • PERFORMANCE METRICS</span>
        </div>
        <h1>Welcome, ATS Innovator</h1>
        <p>Campus Rank: #{campusRank} • Excellence Points: {points.toLocaleString()}</p>

        <div className="hero-stats-v2">
          <div className="h-stat">
            <span className="h-val">#{campusRank}</span>
            <span className="h-lbl">CAMPUS RANK</span>
          </div>
          <div className="h-divider"></div>
          <div className="h-stat">
            <span className="h-val">#{sectionRank}</span>
            <span className="h-lbl">SECTION RANK</span>
          </div>
        </div>
      </div>

      <div className="balance-card-v2 glass-card animate-slide-up">
        <span className="bal-lbl">WALLET BALANCE</span>
        <div className="bal-amount-v2">
          <Zap size={32} className="icon-bolt" />
          <span className="pts-count">{points.toLocaleString()}</span>
        </div>
        <div className="bal-history">
          <TrendingUp size={14} />
          <span>Growth Mindset Active</span>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
