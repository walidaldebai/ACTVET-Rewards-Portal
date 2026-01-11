import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, get, update, child } from 'firebase/database';
import { Wallet, Ticket, Lock, ArrowRight, ClipboardList, TrendingUp, Bell, RefreshCw } from 'lucide-react';
import type { VoucherLevel, Task } from '../types';

const StudentDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [points, setPoints] = useState(currentUser?.points || 0);
  const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchLiveData();
  }, []);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const dbRef = ref(db);
      const [vSnap, tSnap] = await Promise.all([
        get(child(dbRef, 'Voucher_Levels')),
        get(child(dbRef, 'Tasks'))
      ]);

      const fetchedVouchers: VoucherLevel[] = [];
      if (vSnap.exists()) {
        vSnap.forEach((child) => {
          fetchedVouchers.push({ id: child.key, ...child.val() });
        });
      }

      const fetchedTasks: Task[] = [];
      if (tSnap.exists()) {
        tSnap.forEach((child) => {
          fetchedTasks.push({ id: child.key, ...child.val() });
        });
      }

      setVouchers(fetchedVouchers);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Live Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (voucher: VoucherLevel) => {
    if (points >= voucher.pointCost && currentUser?.id) {
      try {
        const newPoints = points - voucher.pointCost;
        await update(ref(db, `Users/${currentUser.id}`), {
          points: newPoints
        });

        setPoints(newPoints);
        alert(`🎉 Redemption Successful!\nYour digital code for ${voucher.name} has been generated.`);
      } catch (err) {
        alert("Transaction failed. Check connection.");
      }
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="dashboard-nav glass-card">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon premium-gradient">
              <Ticket size={22} color="white" />
            </div>
            <div className="brand-text">
              <span className="brand-name">ACTVET</span>
              <span className="brand-tagline">Rewards Portal</span>
            </div>
          </div>

          <div className="nav-user">
            <div className="sync-status-indicator">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>{loading ? 'SYNCING' : 'LIVE'}</span>
            </div>
            <button className="notification-btn">
              <Bell size={20} />
              <span className="notify-dot"></span>
            </button>
            <div className="user-details-box">
              <div className="user-info-text">
                <span className="user-display-name">{currentUser?.name}</span>
                <span className="user-display-grade">Grade {currentUser?.grade} Student</span>
              </div>
              <div className="user-avatar-circle premium-gradient">
                {currentUser?.name?.charAt(0)}
              </div>
            </div>
            <button onClick={logout} className="logout-link">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="dashboard-content animate-fade-in">
        <div className="content-stack">
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-main-card premium-gradient">
              <div className="hero-left">
                <h1>Welcome back, {currentUser?.name?.split(' ')[0]}!</h1>
                <p>You're doing great! Complete 2 more tasks to reach Silver status.</p>
                <div className="achievement-badge">
                  <TrendingUp size={16} />
                  <span>Rank #12 in Grade {currentUser?.grade}</span>
                </div>
              </div>
              <div className="hero-right">
                <div className="balance-pill glass-card">
                  <span className="balance-label">Current Balance</span>
                  <div className="balance-amount">
                    <Wallet size={32} className="icon-gold" />
                    <span>{points.toLocaleString()}</span>
                    <small>PTS</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Vouchers Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="title-group">
                <Ticket className="icon-accent" />
                <h2>Available Vouchers</h2>
              </div>
              <p>Redeem your points for canteen credits and special offers.</p>
            </div>

            <div className="vouchers-grid">
              {vouchers.length > 0 ? vouchers.map((voucher) => {
                const isLocked = points < voucher.pointCost;
                const progress = Math.min((points / voucher.pointCost) * 100, 100);

                return (
                  <div key={voucher.id} className={`v-card glass-card ${isLocked ? 'v-card-locked' : 'v-card-active'}`}>
                    <div className="v-card-top">
                      <div className="v-value-tag">{voucher.valueAED} AED</div>
                      {isLocked && <Lock size={16} className="v-lock" />}
                    </div>
                    <div className="v-card-mid">
                      <h3>{voucher.name}</h3>
                      <p>{voucher.description || 'ACTVET Institutional Reward'}</p>
                    </div>
                    <div className="v-card-bottom">
                      <div className="v-progress-wrapper">
                        <div className="v-progress-text">
                          <span>{voucher.pointCost} pts required</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="v-progress-track">
                          <div className="v-progress-bar" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      {!isLocked ? (
                        <button className="v-action-btn" onClick={() => handleRedeem(voucher)}>
                          <span>Redeem Voucher</span>
                          <ArrowRight size={16} />
                        </button>
                      ) : (
                        <div className="v-lock-notice">
                          Need {voucher.pointCost - points} more points
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="empty-state">No vouchers currently configured.</div>
              )}
            </div>
          </section>

          {/* Tasks Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="title-group">
                <ClipboardList className="icon-blue" />
                <h2>Reward Tasks</h2>
              </div>
              <p>Earn points by completing these assignments from your teachers.</p>
            </div>

            <div className="tasks-container">
              {tasks.length > 0 ? tasks.filter(t => t.grade === currentUser?.grade).map(task => (
                <div key={task.id} className="task-row glass-card">
                  <div className="task-indicator">
                    <div className="indicator-pulse"></div>
                  </div>
                  <div className="task-content">
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                  </div>
                  <div className="task-meta">
                    <div className="point-badge">+{task.points} PTS</div>
                    <button className="task-view-btn">View Task</button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">No tasks assigned for Grade {currentUser?.grade} yet.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .dashboard-layout { min-height: 100vh; background: #f8fafc; padding-top: 90px; padding-bottom: 50px; }
        .sync-status-indicator { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #f1f5f9; border-radius: 50px; font-size: 0.75rem; font-weight: 800; color: #64748b; border: 1px solid #e2e8f0; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .empty-state { grid-column: 1 / -1; padding: 3rem; text-align: center; background: white; border-radius: 24px; border: 1px dashed #cbd5e1; color: #94a3b8; font-weight: 600; }
        .dashboard-nav { position: fixed; top: 0; left: 0; right: 0; height: 80px; z-index: 1000; border-radius: 0; border: none; background: rgba(255, 255, 255, 0.9) !important; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; }
        .nav-container { max-width: 1400px; width: 100%; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; }
        .nav-brand { display: flex; align-items: center; gap: 1rem; }
        .brand-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15); }
        .brand-text { display: flex; flex-direction: column; }
        .brand-name { font-weight: 800; font-size: 1.3rem; color: #0f172a; line-height: 1; letter-spacing: -0.5px; }
        .brand-tagline { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px; }
        .nav-user { display: flex; align-items: center; gap: 1.5rem; }
        .notification-btn { background: #f1f5f9; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; color: #475569; }
        .notify-dot { position: absolute; top: 10px; right: 10px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid white; }
        .user-details-box { display: flex; align-items: center; gap: 1rem; padding: 4px 6px 4px 12px; background: #f8fafc; border-radius: 50px; border: 1px solid #e2e8f0; }
        .user-info-text { display: flex; flex-direction: column; text-align: right; }
        .user-display-name { font-weight: 700; font-size: 0.9rem; color: #1e293b; }
        .user-display-grade { font-size: 0.7rem; color: #64748b; font-weight: 500; }
        .user-avatar-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.9rem; }
        .logout-link { font-size: 0.85rem; font-weight: 600; color: #ef4444; background: none; }
        .dashboard-content { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
        .content-stack { display: flex; flex-direction: column; gap: 4rem; }
        .hero-main-card { padding: 3.5rem; border-radius: 32px; color: white; display: flex; justify-content: space-between; align-items: center; position: relative; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2); }
        .hero-left h1 { font-size: 2.8rem; font-weight: 900; margin-bottom: 0.75rem; letter-spacing: -1px; }
        .hero-left p { font-size: 1.2rem; opacity: 0.9; max-width: 500px; line-height: 1.6; }
        .achievement-badge { margin-top: 2rem; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 0.6rem 1.2rem; border-radius: 100px; display: inline-flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); }
        .balance-pill { background: white !important; padding: 2.5rem 3.5rem; border-radius: 28px; text-align: center; color: #0f172a; box-shadow: 0 15px 35px rgba(0,0,0,0.12); }
        .balance-label { font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem; display: block; }
        .balance-amount { display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 4rem; font-weight: 900; line-height: 1; }
        .balance-amount small { font-size: 1.2rem; color: #cbd5e1; margin-left: -5px; }
        .icon-gold { color: #f59e0b; }
        .section-header { margin-bottom: 2.5rem; }
        .title-group { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        .title-group h2 { font-size: 1.8rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .section-header p { color: #64748b; font-size: 1.05rem; }
        .icon-accent { color: #f59e0b; }
        .icon-blue { color: #3b82f6; }
        .vouchers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 2rem; }
        .v-card { padding: 2.5rem; border-radius: 28px; transition: all 0.4s cubic-bezier(0.2, 0, 0, 1); display: flex; flex-direction: column; gap: 1.5rem; border: 1px solid rgba(0,0,0,0.04); }
        .v-card:hover { transform: translateY(-12px); box-shadow: 0 30px 60px rgba(15, 23, 42, 0.1); border-color: #e2e8f0; }
        .v-card-top { display: flex; justify-content: space-between; align-items: center; }
        .v-value-tag { background: #fef3c7; color: #92400e; padding: 0.5rem 1.25rem; border-radius: 100px; font-weight: 900; font-size: 1rem; }
        .v-lock { color: #94a3b8; }
        .v-card-mid h3 { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
        .v-card-mid p { color: #64748b; font-size: 1rem; line-height: 1.6; }
        .v-progress-wrapper { margin-bottom: 1.5rem; }
        .v-progress-text { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 800; color: #64748b; margin-bottom: 0.75rem; }
        .v-progress-track { height: 10px; background: #f1f5f9; border-radius: 20px; overflow: hidden; }
        .v-progress-bar { height: 100%; background: #fbbf24; border-radius: 20px; transition: width 0.8s ease; }
        .v-action-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 1.1rem; border-radius: 18px; background: #0f172a; color: white; font-weight: 800; font-size: 1rem; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2); }
        .v-action-btn:hover { background: #f59e0b; transform: scale(1.02); }
        .v-lock-notice { text-align: center; font-size: 0.9rem; font-weight: 700; color: #64748b; padding: 1.1rem; background: #f1f5f9; border-radius: 18px; }
        .v-card-locked { opacity: 0.85; filter: grayscale(0.2); }
        .tasks-container { display: flex; flex-direction: column; gap: 1.2rem; }
        .task-row { padding: 1.8rem 2.2rem; border-radius: 24px; display: flex; align-items: center; gap: 2rem; transition: all 0.3s ease; }
        .task-row:hover { background: white !important; border-color: #3b82f6; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .indicator-pulse { width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
        .task-content { flex: 1; }
        .task-content h4 { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
        .task-content p { color: #64748b; font-size: 0.95rem; }
        .task-meta { display: flex; align-items: center; gap: 2rem; }
        .point-badge { background: #ecfdf5; color: #059669; font-weight: 900; padding: 0.6rem 1.2rem; border-radius: 12px; font-size: 0.9rem; }
        .task-view-btn { font-size: 0.95rem; font-weight: 700; color: #3b82f6; background: none; text-decoration: none; padding: 0.5rem 1rem; }
        .task-view-btn:hover { text-decoration: underline; }
        @media (max-width: 1024px) { .login-split { grid-template-columns: 1fr; } .hero-main-card { flex-direction: column; text-align: center; padding: 3rem 2rem; gap: 3rem; } .hero-left h1 { font-size: 2.2rem; } .balance-pill { width: 100%; } .task-row { flex-direction: column; text-align: center; gap: 1.5rem; } .task-meta { width: 100%; justify-content: center; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; } }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
