import React from 'react';
import { Ticket, Lock, Zap, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { VoucherLevel, Redemption } from '../types';

interface RewardsSectionProps {
  vouchers: VoucherLevel[];
  points: number;
  handleRedeem: (voucher: VoucherLevel) => void;
  redemptions?: Redemption[];
}

const RewardsSection: React.FC<RewardsSectionProps> = ({
  vouchers,
  points,
  handleRedeem,
  redemptions = []
}) => {
  const activeVouchers = redemptions.filter(r => r.status === 'Pending');

  const getExpiryInfo = (timestamp: string) => {
    const redeemedDate = new Date(timestamp);
    const expiryDate = new Date(redeemedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return {
      isExpired: diffMs < 0,
      daysLeft: diffDays,
      expiryDate: expiryDate.toLocaleDateString()
    };
  };
  return (
    <div className="rewards-container-v2">
      <div className="rewards-hero glass-card animate-fade-in">
        <div className="r-hero-content">
          <div className="r-hero-tag">PREMIUM ASSETS</div>
          <h1>Institutional Rewards</h1>
          <p>Redeem your Excellence Points for professional assets and exclusive campus perks.</p>
        </div>
        <div className="r-balance-card">
          <div className="r-bal-label">AVAILABLE BALANCE</div>
          <div className="r-bal-value">
            <Zap size={24} className="icon-bolt" />
            <span>{points.toLocaleString()}</span>
            <span className="pts-suffix">PTS</span>
          </div>
          <div className="r-bal-progress">
            <div className="r-bal-bar" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {activeVouchers.length > 0 && (
        <section className="portal-section animate-slide-up">
          <div className="section-head-v2">
            <div className="s-icon green"><CheckCircle size={32} /></div>
            <div>
              <h2>My Active Vouchers</h2>
              <p>Show these codes to the staff member to redeem your reward</p>
            </div>
          </div>

          <div className="vouchers-grid">
            {activeVouchers.map((redemption) => {
              const { isExpired, daysLeft, expiryDate } = getExpiryInfo(redemption.timestamp);
              
              return (
                <div key={redemption.id} className={`coupon-card-v2 active-redeemed ${isExpired ? 'expired-voucher' : ''}`}>
                  <div className="coupon-v2-top">
                    <div className="coupon-v2-value">
                      <span className="val-num">{redemption.aedValue}</span>
                      <span className="val-cur">AED</span>
                    </div>
                    <div className="coupon-v2-type">CASH VOUCHER</div>
                  </div>
                  
                  <div className="coupon-v2-body">
                    <h3 className="coupon-v2-title">{redemption.voucherName}</h3>
                    <div className="coupon-v2-code-box">
                      <span className="code-label">VERIFICATION CODE</span>
                      <span className="code-value">{redemption.code}</span>
                    </div>
                  </div>
                  
                  <div className="coupon-v2-footer">
                    <div className={`coupon-v2-expiry ${isExpired ? 'expired' : ''}`}>
                      <Clock size={14} />
                      <span>
                        {isExpired 
                          ? `Expired on ${expiryDate}` 
                          : `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="coupon-v2-punch left"></div>
                  <div className="coupon-v2-punch right"></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="portal-section">
        <div className="section-head-v2">
          <div className="s-icon purple"><Ticket size={32} /></div>
          <div>
            <h2>Reward Catalog</h2>
            <p>Redeem your Excellence Points for campus staff credits and nutritional perks</p>
          </div>
        </div>

        <div className="vouchers-grid">
          {vouchers.map((voucher) => {
            const isLocked = points < voucher.pointCost;
            const progress = Math.min((points / voucher.pointCost) * 100, 100);

            return (
              <div key={voucher.id} className={`coupon-card-v2 ${isLocked ? 'locked' : 'available'}`}>
                <div className="coupon-v2-top">
                  <div className="coupon-v2-value">
                    <span className="val-num">{voucher.aedValue}</span>
                    <span className="val-cur">AED</span>
                  </div>
                  {isLocked && (
                    <div className="coupon-v2-lock">
                      <Lock size={16} />
                    </div>
                  )}
                </div>
                
                <div className="coupon-v2-body">
                  <h3 className="coupon-v2-title">{voucher.name}</h3>
                  <div className="coupon-v2-cost">
                    <Zap size={14} />
                    <span>{voucher.pointCost} Points</span>
                  </div>
                  
                  {isLocked && (
                    <div className="coupon-v2-progress">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      <span className="progress-text">{voucher.pointCost - points} more pts needed</span>
                    </div>
                  )}
                </div>
                
                <div className="coupon-v2-footer">
                  {!isLocked ? (
                    <button className="redeem-btn-v2" onClick={() => handleRedeem(voucher)}>
                      REDEEM NOW
                    </button>
                  ) : (
                    <div className="locked-btn-v2">
                      INSUFFICIENT BALANCE
                    </div>
                  )}
                </div>
                
                <div className="coupon-v2-punch left"></div>
                <div className="coupon-v2-punch right"></div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default RewardsSection;
