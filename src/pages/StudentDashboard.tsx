import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, get, update, push, child, set } from 'firebase/database';
import {
  Ticket,
  Lock,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  Zap,
  LogOut,
  Trophy,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Upload,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import type { VoucherLevel, Task, TaskSubmission, User, CampusClass } from '../types';

const detectAI = (text: string) => {
  const aiPatterns = ["as an ai", "as a language model", "furthermore", "moreover", "in conclusion", "it is important to note"];
  return aiPatterns.some(p => text.toLowerCase().includes(p));
};

const InnovatorQuiz: React.FC<{ userId: string, attempts: number, onComplete: (pts: number) => void }> = ({ userId, attempts, onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  const questions = [
    { q: "What is your primary goal as an ATS Innovator?", difficulty: "Entry", time: 45 },
    { q: "Propose a sustainable initiative for the campus.", difficulty: "Medium", time: 90 },
    { q: "Explain how technology can enhance institutional excellence.", difficulty: "Advanced", time: 120 }
  ];

  useEffect(() => {
    const t = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const handleNext = () => {
    const text = (answers[step] || "").trim();
    if (text.length < 10) {
      alert("Please provide a more detailed response to demonstrate your innovative thinking.");
      return;
    }

    let qScore = 0;
    if (detectAI(text)) {
      alert("⚠️ AI Detection Triggered. Score for this section: 0.");
    } else if (text.length > 50) {
      qScore = 1500;
    }

    const newScore = score + qScore;
    if (step < questions.length - 1) {
      setStep(step + 1);
      setTimer(questions[step + 1].time);
      setScore(newScore);
    } else {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const speedBonus = Math.max(0, 500 - timeTaken);
      onComplete(newScore + speedBonus);
    }
  };

  return (
    <div className="quiz-card glass-card animate-slide-up">
      <div className="quiz-progress-bar">
        <div className="progress-fill gold-gradient" style={{ width: `${((step + 1) / questions.length) * 100}%` }}></div>
      </div>

      <div className="quiz-header">
        <div className="quiz-meta">
          <span className="quiz-step">CHALLENGE {step + 1} OF {questions.length}</span>
          <span className={`quiz-diff-badge ${questions[step].difficulty.toLowerCase()}`}>
            {questions[step].difficulty}
          </span>
        </div>
        <div className={`quiz-timer-v3 ${timer < 10 ? 'urgent' : ''}`}>
          <Clock size={18} />
          <span>{timer}s</span>
        </div>
      </div>

      <div className="quiz-body">
        <h2 className="quiz-q-text">{questions[step].q}</h2>

        <div className="quiz-input-area">
          <label className="input-label">
            <FileText size={16} />
            <span>ORIGINAL INNOVATION PROPOSAL</span>
          </label>
          <textarea
            className="quiz-textarea"
            placeholder="Structure your thoughts here... Demonstrate critical thinking and institutional value."
            value={answers[step] || ""}
            onChange={e => {
              const newAns = [...answers];
              newAns[step] = e.target.value;
              setAnswers(newAns);
            }}
          />
          <div className="quiz-footer-meta">
            <div className="ai-shield">
              <ShieldCheck size={14} className="text-green" />
              <span>ATS ANTI-AI CRYPTOGRAPHY ACTIVE</span>
            </div>
            <div className="char-count">{answers[step]?.length || 0} characters</div>
          </div>
        </div>
      </div>

      <button className="quiz-next-btn accent-gradient" onClick={handleNext}>
        <span>{step === questions.length - 1 ? "FINALIZE ASSESSMENT" : "SUBMIT CHALLENGE"}</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [points, setPoints] = useState(currentUser?.points || 0);
  const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<CampusClass[]>([]);
  const [activeTab, setActiveTab] = useState<'rewards' | 'tasks' | 'leaderboard'>('tasks');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [handInFile, setHandInFile] = useState<File | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const calculateRank = (userId: string) => {
    if (!currentUser || allStudents.length === 0) return '-';
    const classMates = allStudents.filter(s => s.grade === currentUser.grade && s.classId === currentUser.classId);
    const sorted = [...classMates].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === userId);
    return index === -1 ? '-' : index + 1;
  };

  const calculateCampusRank = (userId: string) => {
    if (!currentUser || allStudents.length === 0) return '-';
    const sorted = [...allStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === userId);
    return index === -1 ? '-' : index + 1;
  };

  useEffect(() => {
    fetchLiveData();
  }, [currentUser]);

  const fetchLiveData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const dbRef = ref(db);
      const [vSnap, tSnap, sSnap, uSnap, cSnap] = await Promise.all([
        get(child(dbRef, 'Voucher_Levels')),
        get(child(dbRef, 'Tasks')),
        get(child(dbRef, 'Task_Submissions')),
        get(child(dbRef, 'Users')),
        get(child(dbRef, 'Classes'))
      ]);

      const fetchedVouchers: VoucherLevel[] = [];
      if (vSnap.exists()) {
        vSnap.forEach((child) => { fetchedVouchers.push({ id: child.key, ...child.val() }); });
      }

      const fetchedTasks: Task[] = [];
      if (tSnap.exists()) {
        tSnap.forEach((child) => { fetchedTasks.push({ id: child.key, ...child.val() }); });
      }

      const fetchedSubmissions: TaskSubmission[] = [];
      if (sSnap.exists()) {
        sSnap.forEach((child) => {
          const sub = child.val();
          if (sub.studentId === currentUser.id) {
            fetchedSubmissions.push({ id: child.key, ...sub });
          }
        });
      }

      const fetchedStudents: User[] = [];
      if (uSnap.exists()) {
        uSnap.forEach((child) => {
          const u = child.val();
          if (u.role === 'Student') {
            fetchedStudents.push({ id: child.key, ...u });
          }
        });
      }

      const fetchedClasses: CampusClass[] = [];
      if (cSnap.exists()) {
        cSnap.forEach((snapChild) => {
          const cData = snapChild.val();
          fetchedClasses.push({ id: snapChild.key!, ...cData });
        });
      }
      setClasses(fetchedClasses);

      setVouchers(fetchedVouchers);
      setTasks(fetchedTasks);
      setSubmissions(fetchedSubmissions);
      setAllStudents(fetchedStudents);

      setPoints(currentUser.points || 0);
      setLoading(false);

      if (currentUser?.role === 'Student' && !currentUser.isInnovatorVerified && (currentUser.quizAttempts || 0) < 3) {
        setShowQuiz(true);
      }
    } catch (err) {
      console.error("Live Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (task: Task) => {
    if (!currentUser) return;

    const alreadySubmitted = submissions.find(s => s.taskId === task.id);
    if (alreadySubmitted) {
      alert("You have already submitted this task.");
      return;
    }

    setSubmittingId(task.id);

    try {
      let fileData = '';
      let fileName = '';

      if (handInFile) {
        if (handInFile.size > 5 * 1024 * 1024) {
          throw new Error("File too large. Please keep under 5MB.");
        }

        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(handInFile);
        });
        fileName = handInFile.name;
      }

      const submissionRef = push(ref(db, 'Task_Submissions'));
      const submissionData: any = {
        taskId: task.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentGrade: currentUser.grade!,
        status: 'Pending',
        submittedAt: new Date().toISOString(),
        points: task.points,
        taskTitle: task.title,
        subject: task.subject
      };

      if (fileData) submissionData.submissionFileUrl = fileData;
      if (fileName) submissionData.submissionFileName = fileName;

      await set(submissionRef, submissionData);
      setHandInFile(null);
      fetchLiveData();
      alert('✅ Work handed in successfully! Awaiting teacher validation.');
    } catch (err) {
      console.error(err);
      alert('Hand-in failed.');
    } finally {
      setSubmittingId(null);
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
        alert("Transaction failed.");
      }
    }
  };

  // Ranking Logic
  const getGlobalRank = () => {
    const sorted = [...allStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === currentUser?.id);
    return index === -1 ? 0 : index + 1;
  };

  const getClassRank = () => {
    const classStudents = allStudents.filter(s => s.classId === currentUser?.classId);
    const sorted = [...classStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === currentUser?.id);
    return index === -1 ? 0 : index + 1;
  };

  const getClassLeaderboard = () => {
    const classStats: Record<string, { id: string, totalPoints: number, studentCount: number }> = {};

    // Initialize stats with all known campus classes
    classes.forEach(c => {
      classStats[c.id] = { id: c.id, totalPoints: 0, studentCount: 0 };
    });

    allStudents.forEach(s => {
      if (!s.classId || !classStats[s.classId]) return;
      classStats[s.classId].totalPoints += (s.points || 0);
      classStats[s.classId].studentCount += 1;
    });

    return Object.values(classStats)
      .filter(c => c.studentCount > 0)
      .sort((a, b) => (b.totalPoints / b.studentCount) - (a.totalPoints / a.studentCount));
  };

  if (loading) {
    return (
      <div className="admin-loader-screen">
        <div className="spinner-large"></div>
        <span>Synchronizing Excellence Catalog...</span>
      </div>
    );
  }

  return (
    <div className="student-portal">
      {showQuiz ? (
        <div className="forced-quiz-container animate-fade-in">
          <div className="quiz-lock-header">
            <div className="lock-branding">
              <Zap size={32} className="text-yellow" />
              <div>
                <h1>Institutional Verification Required</h1>
                <p>You must complete the ATS Innovator Assessment to access the rewards network.</p>
              </div>
            </div>
            <button onClick={logout} className="p-logout">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
          <div className="quiz-lock-content">
            <InnovatorQuiz
              userId={currentUser?.id || ''}
              attempts={currentUser?.quizAttempts || 0}
              onComplete={async (pts) => {
                try {
                  const updates: any = {};
                  updates[`Users/${currentUser?.id}/isInnovatorVerified`] = true;
                  updates[`Users/${currentUser?.id}/points`] = (currentUser?.points || 0) + pts;
                  updates[`Users/${currentUser?.id}/quizAttempts`] = (currentUser?.quizAttempts || 0) + 1;

                  await update(ref(db), updates);
                  setShowQuiz(false);
                  setPoints((currentUser?.points || 0) + pts);
                  alert(`🌟 Congratulations! You have been verified as an ATS Innovator. +${pts} Initial Merit Points Awarded.`);
                  window.location.reload(); // Refresh to update session
                } catch (e) {
                  alert("Verification failed.");
                }
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <nav className="s-sidebar glass-card animate-slide-right">
            <div className="s-sidebar-top">
              <div className="s-brand">
                <img src="/ats_logo.png" alt="ATS Logo" style={{ width: '100%', height: 'auto' }} />
              </div>
              <div className="s-brand-text">
                <span className="s-main">ATS Innovator Portal</span>
                <span className="s-sub">STUDENT HUB</span>
              </div>
            </div>

            <div className="s-nav">
              <button
                className={activeTab === 'tasks' ? 'active' : ''}
                onClick={() => setActiveTab('tasks')}
              >
                <ClipboardList size={20} />
                <span>Academic Tasks</span>
              </button>
              <button
                className={activeTab === 'rewards' ? 'active' : ''}
                onClick={() => setActiveTab('rewards')}
              >
                <Ticket size={20} />
                <span>Rewards Portal</span>
              </button>
              <button
                className={activeTab === 'leaderboard' ? 'active' : ''}
                onClick={() => setActiveTab('leaderboard')}
              >
                <Trophy size={20} />
                <span>Institutional Ranking</span>
              </button>
            </div>

            <div className="user-profile-v2">
              <div className="u-box">
                <div className="u-meta">
                  <span className="u-name">{currentUser?.name}</span>
                  <span className="u-role">ATS Innovator</span>
                </div>
                <div className="u-avatar-v2 gold-gradient">
                  {currentUser?.name?.charAt(0)}
                </div>
              </div>
              <button onClick={logout} className="p-logout">
                <LogOut size={18} />
              </button>
            </div>
          </nav>

          <main className="portal-main">
            {activeTab === 'tasks' && (
              <div className="hero-banner-v2 premium-gradient animate-fade-in">
                <div className="hero-content-v2">
                  <div className="welcome-tag">
                    <Zap size={14} className="text-yellow" />
                    <span>ATS HUB • PERFORMANCE METRICS</span>
                  </div>
                  <h1>Welcome, ATS Innovator</h1>
                  <p>Campus Rank: #{calculateCampusRank(currentUser?.id || '')} • Excellence Points: {points.toLocaleString()}</p>

                  <div className="hero-stats-v2">
                    <div className="h-stat">
                      <span className="h-val">#{calculateCampusRank(currentUser?.id || '')}</span>
                      <span className="h-lbl">CAMPUS RANK</span>
                    </div>
                    <div className="h-divider"></div>
                    <div className="h-stat">
                      <span className="h-val">#{calculateRank(currentUser?.id || '')}</span>
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
            )}

            {activeTab === 'rewards' && (
              <div className="rewards-hero animate-fade-in">
                <div className="r-hero-content">
                  <h1>Institutional Rewards</h1>
                  <p>Redeem your Excellence Points for professional assets and exclusive campus perks.</p>
                </div>
                <div className="r-balance-pill glass-card">
                  <div className="r-pill-icon"><Zap size={20} /></div>
                  <div className="r-pill-meta">
                    <span className="r-pill-lbl">AVAILABLE BALANCE</span>
                    <span className="r-pill-val">{points.toLocaleString()} PTS</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <section className="portal-section">
                <div className="section-head-v2">
                  <div className="s-icon blue"><ClipboardList size={24} /></div>
                  <div>
                    <h2>Academic Tasks</h2>
                    <p>Submit assignments to earn recognition points from your teachers</p>
                  </div>
                </div>

                <div className="tasks-list-v2">
                  {tasks.filter(t =>
                    t.grade === currentUser?.grade &&
                    (!t.assignedToClass || t.assignedToClass === currentUser?.classId)
                  ).map(task => {
                    const submission = submissions.find(s => s.taskId === task.id);
                    return (
                      <div key={task.id} className={`t-row-v2 glass-card animate-slide-up ${submission ? 'submitted' : ''}`}>
                        <div className="t-status-v2">
                          <div className={`t-pulse ${submission?.status === 'Approved' ? 'green' : submission ? 'orange' : 'blue'}`}></div>
                        </div>
                        <div className="t-content-v2">
                          <div className="task-v2-main">
                            <div className="task-v2-header">
                              <span className="task-v2-subject">{task.subject}</span>
                              <div className="task-v2-tags">
                                {task.deadline && (
                                  <div className={`task-deadline-pill ${new Date(task.deadline) < new Date() ? 'expired' : ''}`}>
                                    <Clock size={12} />
                                    <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <span className="task-v2-points">+{task.points} PTS</span>
                              </div>
                            </div>
                            <h3>{task.title}</h3>
                            <p className="task-v2-desc">{task.description}</p>

                            {task.attachmentUrl && (
                              <a href={task.attachmentUrl} target="_blank" rel="noreferrer" className="task-attachment-link glass-card">
                                <div className="att-pre"><FileText size={18} /></div>
                                <div className="att-details">
                                  <span className="att-label">Reference Material</span>
                                  <span className="att-name">{task.attachmentName || 'assignment-guide.pdf'}</span>
                                </div>
                                <Download size={16} />
                              </a>
                            )}
                          </div>

                          <div className="task-v2-actions">
                            {submission ? (
                              <div className={`status-v2 ${submission.status.toLowerCase()}`}>
                                {submission.status === 'Approved' ? <CheckCircle2 size={18} /> :
                                  submission.status === 'Rejected' ? <XCircle size={18} /> : <RefreshCw size={18} className="spin-slow" />}
                                <span>{submission.status}</span>
                              </div>
                            ) : (
                              <div className="hand-in-zone">
                                <div className="file-input-wrapper glass-card">
                                  <Upload size={16} />
                                  <span>{handInFile ? handInFile.name : 'Choose edit/solved file'}</span>
                                  <input
                                    type="file"
                                    onChange={e => setHandInFile(e.target.files?.[0] || null)}
                                    disabled={submittingId === task.id}
                                  />
                                </div>
                                <button
                                  className="handin-btn-v2 gold-gradient"
                                  onClick={() => handleSubmitTask(task)}
                                  disabled={submittingId === task.id}
                                >
                                  {submittingId === task.id ? 'Processing...' : 'Hand in Assignment'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {tasks.filter(t =>
                    t.grade === currentUser?.grade &&
                    (!t.assignedToClass || t.assignedToClass === currentUser?.classId)
                  ).length === 0 && (
                      <div className="empty-tasks-v2 glass-card">
                        <RefreshCw size={32} className="spin-slow" />
                        <p>No active tasks for Grade {currentUser?.grade}. Check back later!</p>
                      </div>
                    )}
                </div>
              </section>
            )}

            {activeTab === 'rewards' && (
              <section className="portal-section">
                <div className="section-head-v2">
                  <div className="s-icon purple"><Ticket size={24} /></div>
                  <div>
                    <h2>Institutional Rewards</h2>
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
                          <span className="v-price-tag gold-gradient">{voucher.creditAmount} Credit</span>
                          {isLocked && <Lock size={16} className="v-lock-icon" />}
                        </div>
                        <h3>{voucher.name}</h3>
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
                    <div className="empty-tasks-v2 glass-card" style={{ gridColumn: '1/-1' }}>
                      <Ticket size={32} className="spin-slow" />
                      <p>The reward catalog is being updated by the administration. Check back soon!</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'leaderboard' && (
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
            )}
          </main>
        </>
      )}

      <style>{`
          .forced-quiz-container { position: fixed; inset: 0; background: #f8fafc; z-index: 10000; display: flex; flex-direction: column; overflow: hidden; }
          .quiz-lock-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 4rem; background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.05); z-index: 110; }
          .lock-branding { display: flex; align-items: center; gap: 1.5rem; }
          .lock-branding h1 { font-size: 1.25rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
          .lock-branding p { color: #64748b; font-weight: 600; margin: 0; font-size: 0.85rem; }
          .quiz-lock-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #f8fafc; overflow-y: auto; }
          
          /* Premium Quiz Card */
          .quiz-card { width: 100%; max-width: 850px; background: white; border-radius: 40px; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.15); overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.5); }
          .quiz-progress-bar { height: 6px; background: #f1f5f9; width: 100%; }
          .progress-fill { height: 100%; transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
          
          .quiz-header { padding: 3rem 4rem 1rem; display: flex; justify-content: space-between; align-items: flex-start; }
          .quiz-meta { display: flex; flex-direction: column; gap: 0.75rem; }
          .quiz-step { font-size: 0.75rem; font-weight: 900; color: #94a3b8; letter-spacing: 0.15em; }
          .quiz-diff-badge { padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; width: fit-content; }
          .quiz-diff-badge.entry { background: #ecfdf5; color: #059669; }
          .quiz-diff-badge.medium { background: #fff7ed; color: #ea580c; }
          .quiz-diff-badge.advanced { background: #fef2f2; color: #ef4444; }
          
          .quiz-timer-v3 { display: flex; align-items: center; gap: 0.75rem; background: #0f172a; color: white; padding: 0.75rem 1.25rem; border-radius: 20px; font-weight: 800; font-size: 1.1rem; min-width: 100px; justify-content: center; }
          .quiz-timer-v3.urgent { background: #ef4444; animation: shake 0.5s infinite; }
          
          .quiz-body { padding: 0 4rem 3rem; }
          .quiz-q-text { font-size: 2.25rem; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 2.5rem; letter-spacing: -0.03em; }
          
          .quiz-input-area { display: flex; flex-direction: column; gap: 1rem; }
          .input-label { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em; }
          .quiz-textarea { width: 100%; min-height: 220px; padding: 2rem; border-radius: 30px; border: 2px solid #f1f5f9; background: #f8fafc; font-size: 1.1rem; color: #1e293b; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); outline: none; line-height: 1.6; resize: none; font-family: inherit; }
          .quiz-textarea:focus { border-color: #6366f1; background: white; box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.15); }
          
          .quiz-footer-meta { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; }
          .ai-shield { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 800; color: #059669; }
          .char-count { font-size: 0.7rem; font-weight: 700; color: #94a3b8; }
          
          .quiz-next-btn { width: calc(100% - 8rem); margin: 0 4rem 3rem; padding: 1.25rem; border-radius: 20px; color: white; border: none; font-weight: 900; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 1rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 20px 30px -10px rgba(99, 102, 241, 0.4); }
          .quiz-next-btn:hover { transform: translateY(-3px); box-shadow: 0 25px 40px -10px rgba(99, 102, 241, 0.5); }
          .quiz-next-btn:active { transform: translateY(0); }
          
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
          
          .s-sidebar { width: 280px; position: fixed; left: 0; top: 0; bottom: 0; background: #f8fafc; border-radius: 0 !important; z-index: 100; padding: 2rem 1.5rem; display: flex; flex-direction: column; }
          .s-sidebar-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 3rem; }
          .s-brand { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
          .s-brand-text { display: flex; flex-direction: column; }
          .s-main { font-weight: 900; font-size: 1.1rem; color: #020617; }
          .s-sub { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.1em; }
          
          .s-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
          .s-nav button { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-radius: 14px; font-weight: 700; color: #64748b; background: none; transition: 0.2s; text-align: left; }
          .s-nav button.active { background: #f1f5f9; color: #6366f1; }
          .s-nav button:hover:not(.active) { background: #f8fafc; color: #475569; }

          .portal-main { margin-left: 280px; padding: 2rem 4rem; }

          /* Rewards Hero */
          .rewards-hero { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 3rem; 
            background: white; 
            border-radius: 32px; 
            margin-bottom: 3rem; 
            border: 1px solid #f1f5f9;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .r-hero-content h1 { font-size: 2rem; font-weight: 900; color: #020617; margin-bottom: 0.5rem; }
          .r-hero-content p { color: #64748b; font-weight: 600; font-size: 1rem; }
          .r-balance-pill { 
            display: flex; 
            align-items: center; 
            gap: 1.25rem; 
            padding: 1rem 1.5rem; 
            border-radius: 20px; 
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .r-pill-icon { 
            width: 44px; 
            height: 44px; 
            border-radius: 12px; 
            background: #fff7ed; 
            color: #f59e0b; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .r-pill-meta { display: flex; flex-direction: column; }
          .r-pill-lbl { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.1em; }
          .r-pill-val { font-size: 1.25rem; font-weight: 900; color: #0f172a; }
        
        /* Navigation Styles */
        .portal-nav-v2 { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            padding: 0.75rem 2rem; 
            margin-bottom: 3rem; 
            height: 70px;
        }
        .nav-content-v2 { 
            width: 100%; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            max-width: 1400px;
        }
        .brand-v2 { display: flex; align-items: center; gap: 1rem; }
        .logo-sq { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .brand-text-v2 { display: flex; flex-direction: column; }
        .b-name { font-weight: 900; font-size: 1.2rem; color: #020617; line-height: 1; letter-spacing: -0.05em; }
        .b-sub { font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; }
        
        .nav-center-tabs { display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.4rem; border-radius: 100px; position: relative; z-index: 100; }
        .nav-center-tabs button { padding: 0.6rem 1.5rem; border-radius: 100px; font-weight: 800; font-size: 0.85rem; color: #64748b; background: none; border: none; cursor: pointer; transition: all 0.2s; position: relative; z-index: 101; }
        .nav-center-tabs button.active { background: white; color: #020617; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        
        .user-profile-v2 { display: flex; align-items: center; gap: 1.5rem; }
        .u-box { display: flex; align-items: center; gap: 1rem; padding: 4px 6px 4px 16px; background: white; border-radius: 50px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .u-meta { display: flex; flex-direction: column; text-align: right; }
        .u-name { font-weight: 800; font-size: 0.9rem; color: #0f172a; }
        .u-role { font-size: 0.75rem; color: #64748b; font-weight: 600; }
        .u-avatar-v2 { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 1rem; }
        .p-logout { color: #94a3b8; background: #f1f5f9; border: none; cursor: pointer; transition: all 0.2s; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .p-logout:hover { color: #ef4444; background: #fef2f2; transform: translateY(-2px); }

        /* Hero styles */
        .hero-banner-v2 { 
            position: relative; 
            padding: 2.5rem 3.5rem; 
            border-radius: 32px; 
            color: white; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 3rem; 
            overflow: hidden; 
            background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%);
        }
        .hero-content-v2 { position: relative; z-index: 10; max-width: 600px; }
        .welcome-tag { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.1); padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.2); }
        .hero-content-v2 h1 { font-size: 2.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 1rem; }
        .hero-content-v2 p { font-size: 1.1rem; opacity: 0.9; line-height: 1.5; margin-bottom: 2rem; color: #cbd5e1; }
        .hero-stats-v2 { display: flex; align-items: center; gap: 3rem; }
        .h-stat { display: flex; flex-direction: column; }
        .h-val { font-size: 1.6rem; font-weight: 900; }
        .h-lbl { font-size: 0.7rem; font-weight: 800; opacity: 0.7; letter-spacing: 0.1em; }
        .h-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

        .balance-card-v2 { width: 300px; padding: 2.5rem 2rem; text-align: center; color: #020617; }
        .bal-lbl { font-size: 0.8rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.2em; margin-bottom: 1.5rem; display: block; }
        .bal-amount-v2 { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; }
        .icon-bolt { color: #f59e0b; filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); }
        .pts-count { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.05em; line-height: 1; }
        .bal-history { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #10b981; font-weight: 700; font-size: 0.8rem; }

        /* Sections */
        .portal-section { margin-bottom: 4rem; }
        .section-head-v2 { display: flex; gap: 1.5rem; margin-bottom: 3rem; align-items: center; }
        .s-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
        .s-icon.blue { background: #e0f2fe; color: #0369a1; }
        .s-icon.purple { background: #f3e8ff; color: #7e22ce; }
        .section-head-v2 h2 { font-size: 1.8rem; font-weight: 900; margin-bottom: 0.25rem; }
        .section-head-v2 p { color: #64748b; font-weight: 600; }

        .tasks-list-v2 { display: flex; flex-direction: column; gap: 1.5rem; }
        .t-row-v2 { padding: 2rem 2.5rem; display: flex; align-items: center; gap: 2rem; }
        .t-status-v2 { position: relative; width: 24px; }
        .t-pulse { width: 12px; height: 12px; border-radius: 50%; }
        .t-pulse.blue { background: #3b82f6; box-shadow: 0 0 15px #3b82f6; animation: pulse 2s infinite; }
        .t-pulse.orange { background: #f97316; box-shadow: 0 0 15px #f97316; animation: pulse 2s infinite; }
        .t-pulse.green { background: #10b981; box-shadow: 0 0 15px #10b981; }
        
        .t-content-v2 { flex: 1; }
        .t-subject-tag { font-size: 0.65rem; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .t-content-v2 h4 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
        .t-content-v2 p { color: #64748b; font-weight: 500; font-size: 0.95rem; }
        
        .t-actions-v2 { display: flex; align-items: center; gap: 2rem; }
        .t-point-tag { background: #f1f5f9; color: #475569; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 900; font-size: 0.9rem; }
        .t-view-btn.highlight { background: #6366f1; color: white; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 800; }
        .t-status-pill { padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
        .t-status-pill.pending { background: #fff7ed; color: #ea580c; }
        .t-status-pill.approved { background: #ecfdf5; color: #059669; }

        .vouchers-carousel { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2.5rem; }
        .v-item-v2 { padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .v-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .v-price-tag { padding: 0.5rem 1.25rem; border-radius: 100px; color: white; font-weight: 900; }
        .v-item-v2 h3 { font-size: 1.5rem; font-weight: 800; }
        .v-progress-info { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 800; color: #94a3b8; }
        .v-progress-track-v2 { height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
        .v-bar-v2 { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
        .v-redeem-btn { padding: 1.1rem; border-radius: 16px; color: white; font-weight: 800; margin-top: 1rem; }
        .v-locked-msg { border-radius: 16px; background: #f8fafc; padding: 1rem; text-align: center; color: #94a3b8; font-weight: 700; margin-top: 1rem; font-size: 0.9rem; }

        .leaderboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 2rem; }
        .leaderboard-section { padding: 2.5rem; }
        .l-head { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 3rem; }
        .l-head h2 { font-size: 1.6rem; font-weight: 900; }
        .l-list { display: flex; flex-direction: column; gap: 1rem; }
        .l-item { display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem; border-radius: 20px; transition: all 0.2s; }
        .l-item.current { background: #eff6ff; border: 1px solid #bfdbfe; }
        .l-rank { width: 30px; font-weight: 900; font-size: 1.2rem; color: #94a3b8; }
        .l-avatar { width: 48px; height: 48px; border-radius: 14px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
        .l-avatar.class { background: #e0f2fe; color: #0369a1; }
        .l-info { flex: 1; }
        .l-name { display: block; font-weight: 800; color: #0f172a; }
        .l-class { font-size: 0.8rem; color: #64748b; font-weight: 700; }
        .l-pts { font-weight: 900; color: #6366f1; font-size: 1.1rem; }

        .icon-gold { color: #f59e0b; }
        .icon-purple { color: #8b5cf6; }
        .empty-tasks-v2 { padding: 5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; color: #94a3b8; font-weight: 700; }
        .spin-slow { animation: spin 4s linear infinite; }
        
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1400px) { 
            .student-portal { padding: 2rem; }
            .hero-banner-v2 { flex-direction: column; padding: 3rem; text-align: center; gap: 3rem; }
            .leaderboard-grid { grid-template-columns: 1fr; }
            .vouchers-carousel { grid-template-columns: 1fr; }
        }

        /* Task & Hand-in UI */
        .task-v2-main { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .task-v2-header { display: flex; justify-content: space-between; align-items: start; }
        .task-v2-subject { font-size: 0.75rem; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; }
        .task-v2-tags { display: flex; align-items: center; gap: 1rem; }
        .task-deadline-pill { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700; color: #64748b; }
        .task-deadline-pill.expired { background: #fef2f2; color: #ef4444; }
        .task-v2-points { font-weight: 900; color: #10b981; font-size: 1rem; }
        .task-v2-desc { color: #64748b; font-size: 1rem; line-height: 1.6; }
        
        .task-attachment-link { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 16px !important; text-decoration: none; transition: 0.2s; background: #f8fafc; border: 1px solid #f1f5f9; }
        .task-attachment-link:hover { transform: translateY(-3px); border-color: #6366f1; }
        .att-pre { width: 40px; height: 40px; border-radius: 10px; background: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; }
        .att-details { flex: 1; display: flex; flex-direction: column; }
        .att-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
        .att-name { font-weight: 700; color: #0f172a; font-size: 0.9rem; }

        .task-v2-actions { border-top: 1px solid #f1f5f9; padding-top: 2rem; margin-top: auto; }
        .hand-in-zone { display: grid; grid-template-columns: 1fr 200px; gap: 1.5rem; align-items: center; }
        .file-input-wrapper { position: relative; display: flex; align-items: center; gap: 1rem; padding: 0.8rem 1.5rem; border-radius: 16px !important; background: #f8fafc; border: 2px dashed #cbd5e1; cursor: pointer; transition: 0.2s; overflow: hidden; height: 52px; }
        .file-input-wrapper:hover { border-color: #6366f1; background: #f0f7ff; }
        .file-input-wrapper input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .file-input-wrapper span { font-weight: 700; color: #64748b; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .handin-btn-v2 { padding: 1rem; border-radius: 16px; color: white; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); height: 52px; }

        .status-v2 { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 0.9rem; padding: 0.75rem 1.5rem; border-radius: 14px; width: fit-content; }
        .status-v2.pending { background: #fff7ed; color: #ea580c; }
        .status-v2.approved { background: #ecfdf5; color: #059669; }
        .status-v2.rejected { background: #fef2f2; color: #ef4444; }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
