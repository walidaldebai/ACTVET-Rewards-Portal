
import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Zap,
  ShieldCheck,
  Trophy,
  Ticket
} from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../lib/firebase';
import type { User, Task, TaskSubmission, VoucherLevel, Redemption } from '../types';
import StudentSidebar from '../components/StudentSidebar';
import HeroBanner from '../components/HeroBanner';
import { ProfileWidget, DeadlinesWidget, SystemUpdatesWidget, AchievementsWidget } from '../components/StudentWidgets';
import TasksSection from '../components/TasksSection';
import RewardsSection from '../components/RewardsSection';
import LeaderboardSection from '../components/LeaderboardSection';
import SettingsSection from '../components/SettingsSection';
import InnovatorQuiz from '../components/InnovatorQuiz';
import '../styles/StudentDashboard.css';

const StudentDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings' | 'achievements'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  // States for interactive components
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [handInFile, setHandInFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const [showHeader, setShowHeader] = useState(false);

  // Security features
  const [isCheatLocked, setIsCheatLocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const quizCompletedRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(db, `Users/${user.uid}`);
    const unsubscribeUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentUser({ id: user.uid, ...data });
        setPoints(data.points || 0);
        setIsCheatLocked(data.isCheatLocked || false);
      }
      setLoading(false);
    });

    const tasksRef = ref(db, 'Tasks');
    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTasks(Object.entries(data).map(([id, t]: [string, any]) => ({ id, ...t })));
      }
    });

    const subRef = ref(db, 'Submissions');
    const unsubscribeSubs = onValue(subRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSubmissions(Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })));
      }
    });

    const vouchRef = ref(db, 'Voucher_Levels');
    const unsubscribeVouch = onValue(vouchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVouchers(Object.entries(data).map(([id, v]: [string, any]) => ({ id, ...v })));
      }
    });

    const redRef = ref(db, 'Redemption_Requests');
    const unsubscribeRed = onValue(redRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRedemptions(Object.entries(data).map(([id, r]: [string, any]) => ({ id, ...r })));
      }
    });

    const allUsrRef = ref(db, 'Users');
    const unsubscribeAllUsr = onValue(allUsrRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const students = Object.entries(data)
          .filter(([_, u]: [string, any]) => u.role?.toLowerCase() === 'student')
          .map(([id, u]: [string, any]) => ({ id, ...u }));
        setAllStudents(students);
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeTasks();
      unsubscribeSubs();
      unsubscribeVouch();
      unsubscribeRed();
      unsubscribeAllUsr();
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && activeTaskId) {
        if (!currentUser) return;
        setShowWarning(true);
        setIsCheatLocked(true);
        await update(ref(db, `Users/${currentUser.id}`), { isCheatLocked: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTaskId, currentUser]);

  useEffect(() => {
    let timer: any;
    if (activeTaskId && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
    } else if (timeLeft === 0 && activeTaskId) {
      setActiveTaskId(null);
      setTimeLeft(null);
      alert("Assessment time limit reached. Progress has been autosaved.");
    }
    return () => clearInterval(timer);
  }, [activeTaskId, timeLeft]);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const calculateRank = (studentId: string) => {
    if (!currentUser) return '?';
    const studentsInClass = allStudents.filter(s => s.classId === currentUser.classId);
    const sorted = [...studentsInClass].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === studentId);
    return index !== -1 ? index + 1 : '?';
  };

  const calculateCampusRank = (studentId: string) => {
    const sorted = [...allStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === studentId);
    return index !== -1 ? index + 1 : '?';
  };

  const getAchievements = () => {
    const studentSubmissions = submissions.filter(s => s.studentId === currentUser?.id);
    const approvedCount = studentSubmissions.filter(s => s.status === 'Approved').length;

    return [
      { id: '1', title: 'First Step', description: 'Submit your first task', icon: 'star', progress: Math.min((studentSubmissions.length / 1) * 100, 100), isUnlocked: studentSubmissions.length >= 1 },
      { id: '2', title: 'Task Master', description: 'Complete 5 tasks', icon: 'award', progress: Math.min((approvedCount / 5) * 100, 100), isUnlocked: approvedCount >= 5 },
      { id: '3', title: 'On Fire', description: 'Earn 1000 points', icon: 'flame', progress: Math.min((points / 1000) * 100, 100), isUnlocked: points >= 1000 },
      { id: '4', title: 'High Flyer', description: 'Reach Campus Top 5', icon: 'target', progress: Number(calculateCampusRank(currentUser?.id || '')) <= 5 ? 100 : 0, isUnlocked: Number(calculateCampusRank(currentUser?.id || '')) <= 5 }
    ];
  };

  const onStartTask = (task: Task) => {
    if (isCheatLocked) return;
    setActiveTaskId(task.id);
    if (task.timeLimit) setTimeLeft(task.timeLimit * 60);
  };

  const handleSubmitTask = async (task: Task) => {
    if (!auth.currentUser || !handInFile) return;
    setSubmittingId(task.id);
    try {
      const submissionData = {
        taskId: task.id,
        taskTitle: task.title,
        studentId: auth.currentUser.uid,
        studentName: currentUser?.name || 'Anonymous',
        status: 'Pending',
        timestamp: Date.now(),
        fileUrl: URL.createObjectURL(handInFile),
        subject: task.subject,
        grade: task.grade
      };
      await update(ref(db, `Submissions/${Date.now()}_${auth.currentUser.uid}`), submissionData);
      setHandInFile(null);
      setActiveTaskId(null);
      setTimeLeft(null);
      alert("Task submitted successfully for review.");
    } catch (e) {
      alert("Submission failed.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRedeem = async (voucher: VoucherLevel) => {
    if (!currentUser || (currentUser.points || 0) < voucher.pointCost) {
      alert("Insufficient points.");
      return;
    }
    const confirm = window.confirm(`Redeem "${voucher.name}" for ${voucher.pointCost} points?`);
    if (!confirm) return;

    try {
      const requestId = `REQ_${Date.now()}`;
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const requestData = {
        studentId: currentUser.id,
        studentName: currentUser.name,
        voucherId: voucher.id,
        voucherName: voucher.name,
        aedValue: voucher.aedValue,
        code: verificationCode,
        status: 'Pending',
        timestamp: new Date().toISOString(),
        pointsCost: voucher.pointCost
      };
      await update(ref(db, `Redemption_Requests/${requestId}`), requestData);
      await update(ref(db, `Users/${currentUser.id}`), { points: (currentUser.points || 0) - voucher.pointCost });
      alert(`Redemption request submitted! Your code is: ${verificationCode}`);
    } catch (error) {
      console.error("Redemption request failed:", error);
      alert("Request failed.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setPassLoading(true);
    setTimeout(() => {
      setPassLoading(false);
      setNewPassword('');
      setConfirmPassword('');
      alert("Password updated successfully.");
    }, 1500);
  };

  const getClassLeaderboard = () => {
    const classData: { [key: string]: { totalPoints: number; studentCount: number } } = {};
    allStudents.forEach(s => {
      if (s.classId) {
        if (!classData[s.classId]) classData[s.classId] = { totalPoints: 0, studentCount: 0 };
        classData[s.classId].totalPoints += (s.points || 0);
        classData[s.classId].studentCount += 1;
      }
    });
    return Object.entries(classData)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.totalPoints / b.studentCount) - (a.totalPoints / a.studentCount));
  };

  const upcomingDeadlines = tasks
    .filter(t => t.grade === currentUser?.grade && t.deadline && new Date(t.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Synchronizing Portal Hub...</p>
      </div>
    );
  }

  return (
    <div className="student-portal">
      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        logout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div
        className="mobile-header mobile-only"
        style={{
          position: showHeader ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 1.5rem',
          background: showHeader ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: showHeader ? 'blur(20px)' : 'none',
          zIndex: 2200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          boxShadow: showHeader ? '0 10px 30px rgba(0,0,0,0.05)' : 'none',
          transform: 'translateY(0)',
        }}
      >
        <button
          className="menu-btn"
          onClick={() => setIsSidebarOpen(prev => !prev)}
          style={{
            background: showHeader ? 'transparent' : 'white',
            padding: '0.5rem',
            borderRadius: '12px',
            boxShadow: showHeader ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          {isSidebarOpen ? <X size={24} color="var(--primary)" /> : <Menu size={24} color="var(--primary)" />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--primary)' }}>{currentUser?.name}</span>
            <span style={{ fontWeight: 850, fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase' }}>Grade {currentUser?.grade}</span>
          </div>
          <div className="u-avatar-v2" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
            {currentUser?.name?.charAt(0)}
          </div>
        </div>
      </div>

      <main className="portal-main">
        <div className="portal-actions-top">
          <button 
            className={`ach-toggle-btn-v2 ${isAchievementsOpen ? 'active' : ''}`}
            onClick={() => setIsAchievementsOpen(!isAchievementsOpen)}
            title={isAchievementsOpen ? "Hide Achievements" : "Show Achievements"}
          >
            <Trophy size={20} />
            <span>Achievements</span>
          </button>
        </div>

        <div className={`portal-content-layout ${isAchievementsOpen ? 'has-achievements' : ''}`}>
          <div className="portal-main-content">
            {activeTab === 'dashboard' && (
              <div className="tab-view animate-fade-in">
                <HeroBanner
                  currentUser={currentUser}
                  points={points}
                  calculateCampusRank={calculateCampusRank}
                  calculateRank={calculateRank}
                />
                <div className="dashboard-grid-v2" style={{ marginTop: '3rem' }}>
                  <ProfileWidget currentUser={currentUser} submissions={submissions} />
                  <DeadlinesWidget upcomingDeadlines={upcomingDeadlines} />
                  <SystemUpdatesWidget />
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="tab-view animate-fade-in full-page-tab">
                <div className="section-head-v2">
                  <div className="s-icon purple"><Trophy size={24} /></div>
                  <div>
                    <h2>Institutional Recognition</h2>
                    <p>Track your academic achievements and innovator verification</p>
                  </div>
                </div>

                <div className="achievements-page-layout">
                  <AchievementsWidget achievements={getAchievements()} />

                  <div className="verification-card glass-card premium-card">
                    <Zap size={32} />
                    <h3>Innovator Level Assessment</h3>
                    <p>Unlock professional-grade rewards by completing the institutional competency assessment.</p>
                    <button onClick={() => setShowQuiz(true)}>Launch Assessment</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="tab-view animate-fade-in">
                <TasksSection
                  tasks={tasks}
                  submissions={submissions}
                  currentUser={currentUser}
                  submittingId={submittingId}
                  handInFile={handInFile}
                  setHandInFile={setHandInFile}
                  handleSubmitTask={handleSubmitTask}
                  isCheatLocked={isCheatLocked}
                  activeTaskId={activeTaskId}
                  onStartTask={onStartTask}
                  timeLeft={timeLeft}
                />
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="tab-view animate-fade-in">
                <div className="section-head-v2">
                  <div className="s-icon gold"><Ticket size={24} /></div>
                  <div>
                    <h2>Reward Marketplace</h2>
                    <p>Redeem your hard-earned points for exclusive campus vouchers</p>
                  </div>
                </div>
                <RewardsSection vouchers={vouchers} points={points} handleRedeem={handleRedeem} redemptions={redemptions} />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="tab-view animate-fade-in">
                <div className="section-head-v2">
                  <div className="s-icon purple"><Trophy size={24} /></div>
                  <div>
                    <h2>Campus Rankings</h2>
                    <p>See where you stand among the top innovators at ATS</p>
                  </div>
                </div>
                <LeaderboardSection allStudents={allStudents} currentUser={currentUser} getClassLeaderboard={getClassLeaderboard} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-view animate-fade-in">
                <SettingsSection
                  currentUser={currentUser}
                  handleUpdatePassword={handleUpdatePassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  passLoading={passLoading}
                />
              </div>
            )}
          </div>

          {/* Achievements Sidebar */}
          <aside className={`achievements-sidebar glass-card ${isAchievementsOpen ? 'open' : 'closed'}`}>
            <div className="ach-sidebar-content">
              <div className="ach-sidebar-header">
                <div className="ach-header-title">
                  <Trophy size={24} className="text-purple-500" />
                  <h2>Achievements</h2>
                </div>
                <button 
                  className="ach-close-btn mobile-only" 
                  onClick={() => setIsAchievementsOpen(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <AchievementsWidget achievements={getAchievements()} />
            </div>
          </aside>
        </div>
      </main>

      {/* Security Overlays */}
      {showWarning && (
        <div className="modal-overlay">
          <div className="modal-content-glass animate-scale-in">
            <div className="modal-warning-icon">
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 950, textAlign: 'center', marginBottom: '1rem' }}>Security Violation</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              We detected a tab switch or system interruption during an active assessment. Your account has been flagged for administrative review.
            </p>
            <button className="modal-btn primary" style={{ width: '100%' }} onClick={() => setShowWarning(false)}>
              Acknowledge & Terminate Task
            </button>
          </div>
        </div>
      )}

      {showQuiz && (
        <div className="modal-overlay">
          <div className="modal-content-glass animate-scale-in" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 950 }}>Innovator Assessment</h2>
              <button 
                className="s-close-btn" 
                onClick={() => setShowQuiz(false)}
              >
                <X size={20} />
              </button>
            </div>
            <InnovatorQuiz
              studentId={currentUser?.id || ''}
              attempts={currentUser?.quizAttempts || 0}
              onComplete={async (pts) => {
                quizCompletedRef.current = true;
                if (!auth.currentUser) return;
                try {
                  const updates = {
                    isInnovatorVerified: true,
                    points: (currentUser?.points || 0) + pts,
                    quizAttempts: (currentUser?.quizAttempts || 0) + 1
                  };
                  await update(ref(db, `Users/${auth.currentUser.uid}`), updates);
                  setShowQuiz(false);
                  setPoints((currentUser?.points || 0) + pts);
                  alert(`🌟 Verification Success! +${pts} Excellence Points Awarded.`);
                  window.location.reload();
                } catch (e) {
                  alert("Verification failed.");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
