import React from 'react';
import { Ticket, Lock, Zap } from 'lucide-react';
import type { VoucherLevel } from '../types';

interface RewardsSectionProps {
  vouchers: VoucherLevel[];
  points: number;
  handleRedeem: (voucher: VoucherLevel) => void;
}

const RewardsSection: React.FC<RewardsSectionProps> = ({
  vouchers,
  points,
  handleRedeem
}) => {
  return (
    <>
      <div className="rewards-hero animate-fade-in">
        <div className="r-hero-content">
          <h1>Institutional Rewards</h1>
          <p>Redeem your Excellence Points for professional assets and exclusive campus perks.</p>
        </div>
        <div className="r-balance-pill glass-card">
          <div className="r-pill-icon"><Zap size={20} /></div>
          <div className="r-pill-meta">
            <span className="r-pill-lbl">AVAILABLE BALANCE</span>
            <span className="r-pill-val">
              {points.toLocaleString()}
              <span style={{ fontSize: '0.6em', opacity: 0.6, marginLeft: '12px' }}>PTS</span>
            </span>
          </div>
        </div>
      </div>

      <section className="portal-section">
      <div className="section-head-v2">
        <div className="s-icon purple"><Ticket size={24} /></div>
        <div>
          <h2>Reward Catalog</h2>
          <p>Redeem your Excellence Points for campus canteen credits and nutritional perks</p>
        </div>
      </div>

      <div className="vouchers-carousel">
        {vouchers.map((voucher) => {
          const isLocked = points < voucher.pointCost;
          const progress = Math.min((points / voucher.pointCost) * 100, 100);

          return (
            <div key={voucher.id} className={`v-item-v2 glass-card ${isLocked ? 'locked' : 'available'}`}>
              <div className="v-header-v2">
                <span className="v-price-tag gold-gradient">{voucher.aedValue} AED</span>
                {isLocked && <Lock size={16} className="v-lock-icon" />}
              </div>
              <h3>{voucher.name}</h3>
              <p className="v-desc-tiny">{voucher.description}</p>
              <div className="v-progress-info">
                <span>{voucher.pointCost} PTS</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="v-progress-track-v2">
                <div className="v-bar-v2 gold-gradient" style={{ width: `${progress}%` }}></div>
              </div>
              {!isLocked ? (
                <button className="v-redeem-btn accent-gradient" onClick={() => handleRedeem(voucher)}>Redeem Now</button>
              ) : (
                <div className="v-locked-msg">Need {voucher.pointCost - points} more pts</div>
              )}
            </div>
          );
        })}
        {vouchers.length === 0 && (
          <div className="empty-tasks-v2" style={{ gridColumn: '1/-1' }}>
            <div className="empty-icon-wrapper purple">
              <Ticket size={40} className="spin-slow" />
            </div>
            <h3>Rewards Inbound</h3>
            <p>The catalog is currently being updated with new premium perks.<br />Your excellence points remain safe.</p>
          </div>
        )}
      </div>
    </section>
  </>
  );
};

export default RewardsSection;
