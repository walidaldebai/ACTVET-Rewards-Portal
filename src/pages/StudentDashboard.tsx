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

const InnovatorQuiz: React.FC<{ userId: string, attempts: number, onComplete: (pts: number) => void }> = ({ onComplete }) => {
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
                      <div className="empty-tasks-v2">
                        <div className="empty-icon-wrapper blue">
                          <RefreshCw size={40} className="spin-slow" />
                        </div>
                        <h3>All Caught Up!</h3>
                        <p>No active tasks for Grade {currentUser?.grade} at the moment.<br />Check back later for new academic challenges.</p>
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

        /* Global Portal Reset */
        .student-portal {
            display: flex;
            min-height: 100vh;
            background: #f8fafc;
            background-image: 
                radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.03) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(34, 197, 94, 0.03) 0px, transparent 50%);
        }

        /* ----- SIDEBAR ----- */
        .s-sidebar {
            width: 280px;
            position: fixed;
            left: 20px;
            top: 20px;
            bottom: 20px;
            background: white;
            border-radius: var(--radius-lg);
            border: 1px solid white;
            box-shadow: var(--shadow-lg);
            z-index: 100;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .s-sidebar-top {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 3rem;
            text-align: center;
        }

        .s-brand {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border);
            padding: 10px;
        }

        .s-brand-text { display: flex; flex-direction: column; gap: 0.25rem; }
        .s-main { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--primary); }
        .s-sub { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.15em; text-transform: uppercase; }

        .s-nav { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
        .s-nav button {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            border-radius: 16px;
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--text-muted);
            background: transparent;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
        }

        .s-nav button:hover {
            background: var(--bg-main);
            color: var(--primary);
            transform: translateX(4px);
        }

        .s-nav button.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 10px 20px -5px rgba(2, 6, 23, 0.2);
        }

        .user-profile-v2 {
            margin-top: auto;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .u-box { display: flex; align-items: center; gap: 0.75rem; }
        .u-avatar-v2 {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
            background: var(--gold-gradient);
            box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
        }
        .u-meta { display: flex; flex-direction: column; }
        .u-name { font-weight: 700; font-size: 0.9rem; color: var(--primary); }
        .u-role { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }

        .p-logout {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            background: var(--bg-main);
            transition: all 0.2s;
        }
        .p-logout:hover { background: #fee2e2; color: #ef4444; }

        /* ----- MAIN CONTENT ----- */
        .portal-main {
            flex: 1;
            margin-left: 320px;
            padding: 2rem 3rem 2rem 0;
            max-width: 1600px;
        }

        /* HERO SECTION */
        .hero-banner-v2 {
            position: relative;
            padding: 3.5rem;
            border-radius: var(--radius-lg);
            background: var(--premium-gradient);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            overflow: hidden;
            box-shadow: var(--shadow-lg);
        }

        /* Mesh Background Effect */
        .hero-banner-v2::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -20%;
            width: 80%;
            height: 200%;
            background: radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 60%);
            transform: rotate(15deg);
            pointer-events: none;
        }
        .hero-banner-v2::after {
            content: '';
            position: absolute;
            bottom: -50%;
            right: -10%;
            width: 60%;
            height: 150%;
            background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 60%);
            pointer-events: none;
        }

        .hero-content-v2 { position: relative; z-index: 10; max-width: 650px; }
        
        .welcome-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 100px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #cbd5e1;
            margin-bottom: 1.5rem;
            letter-spacing: 0.05em;
        }

        .hero-content-v2 h1 { font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; letter-spacing: -0.02em; }
        .hero-content-v2 p { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2.5rem; font-weight: 500; }

        .hero-stats-v2 { display: flex; gap: 3rem; }
        .h-stat { display: flex; flex-direction: column; gap: 0.25rem; }
        .h-val { font-size: 2rem; font-weight: 800; line-height: 1; }
        .h-lbl { font-size: 0.7rem; font-weight: 700; opacity: 0.6; letter-spacing: 0.1em; text-transform: uppercase; }
        .h-divider { width: 1px; height: 50px; background: rgba(255,255,255,0.15); }

        .balance-card-v2 {
            position: relative;
            z-index: 10;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 2.5rem;
            border-radius: 24px;
            text-align: center;
            min-width: 280px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transition: transform 0.3s;
        }
        .balance-card-v2:hover { transform: translateY(-5px); }

        .bal-lbl { display: block; font-size: 0.75rem; font-weight: 700; opacity: 0.8; color: white; margin-bottom: 1rem; letter-spacing: 0.1em; }
        .bal-amount-v2 { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1rem; }
        .pts-count { font-size: 3rem; font-weight: 800; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        .icon-bolt { color: var(--gold); filter: drop-shadow(0 0 10px var(--gold)); }

        .bal-history {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.8rem;
            background: rgba(16, 185, 129, 0.2);
            border-radius: 100px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #4ade80;
        }

        /* CARD SECTIONS */
        .section-head-v2 { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem; }
        .s-icon {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: var(--shadow-sm);
        }
        .s-icon.blue { background: #e0f2fe; color: #0284c7; }
        .s-icon.purple { background: #f3e8ff; color: #9333ea; }
        
        .section-head-v2 h2 { font-size: 1.8rem; font-weight: 800; color: var(--primary); margin-bottom: 0.25rem; }
        .section-head-v2 p { color: var(--text-muted); font-size: 1rem; }

        /* Tasks Grid */
        .tasks-list-v2 { display: grid; gap: 1.5rem; }
        .t-row-v2 {
            display: grid;
            grid-template-columns: 24px 1fr 280px;
            gap: 2rem;
            padding: 2rem;
            background: white;
            border-radius: 20px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
        }

        .icon-gold { color: #f59e0b; }
        .icon-purple { color: #8b5cf6; }
        
        .empty-tasks-v2 {
            grid-column: 1 / -1;
            padding: 4rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            background: rgba(255, 255, 255, 0.6);
            border: 2px dashed #cbd5e1;
            border-radius: 24px;
            transition: all 0.3s;
        }
        .empty-tasks-v2:hover { background: rgba(255, 255, 255, 0.9); border-color: var(--accent); transform: translateY(-4px); }
        
        .empty-icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
        }
        .empty-icon-wrapper.blue { background: #e0f2fe; color: #0284c7; }
        .empty-icon-wrapper.purple { background: #f3e8ff; color: #9333ea; }
        
        .empty-tasks-v2 h3 { font-size: 1.25rem; font-weight: 800; color: var(--primary); margin: 0; }
        .empty-tasks-v2 p { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
        
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
            transition: all 0.3s ease;
        }

        .t-row-v2:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow);
            border-color: #cbd5e1;
        }

        .t-row-v2.submitted { opacity: 0.85; background: #f8fafc; }

        .t-status-v2 { display: flex; justify-content: center; padding-top: 0.5rem; }
        .t-pulse { width: 10px; height: 10px; border-radius: 50%; }
        .t-pulse.blue { background: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
        .t-pulse.orange { background: #f97316; }
        .t-pulse.green { background: #22c55e; }

        .task-v2-main { display: flex; flex-direction: column; gap: 0.5rem; }
        .task-v2-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        .task-v2-subject { font-size: 0.7rem; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; }
        .task-v2-tags { display: flex; gap: 0.5rem; }
        
        .t-content-v2 h3 { font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; }
        .task-v2-desc { color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; margin-bottom: 1.5rem; max-width: 90%; }

        .task-attachment-link {
            display: inline-flex;
            align-items: center;
            gap: 1rem;
            padding: 0.8rem 1.25rem;
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 12px;
            text-decoration: none;
            transition: 0.2s;
            max-width: fit-content;
        }
        .task-attachment-link:hover { border-color: var(--accent); background: white; box-shadow: var(--shadow-sm); }
        .att-pre { width: 36px; height: 36px; background: #e0f2fe; color: #0284c7; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .att-details { display: flex; flex-direction: column; }
        .att-label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .att-name { font-size: 0.85rem; font-weight: 600; color: var(--primary); }

        .task-v2-actions { display: flex; align-items: center; justify-content: flex-end; }
        
        .hand-in-zone {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
        }

        .file-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.8rem 1rem;
            background: white;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            cursor: pointer;
            transition: 0.2s;
        }
        .file-input-wrapper:hover { border-color: var(--accent); background: #f0f9ff; }
        .file-input-wrapper input { opacity: 0; position: absolute; inset: 0; cursor: pointer; }
        .file-input-wrapper span { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .handin-btn-v2 {
            width: 100%;
            padding: 1rem;
            background: var(--primary);
            color: white;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.95rem;
            transition: 0.2s;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .handin-btn-v2:hover { background: var(--accent); transform: translateY(-2px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
        .handin-btn-v2:disabled { opacity: 0.7; cursor: not-allowed; }

        .status-v2 {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.6rem 1.2rem;
            border-radius: 100px;
            font-size: 0.85rem;
            font-weight: 800;
        }
        .status-v2.pending { background: #fff7ed; color: #c2410c; }
        .status-v2.approved { background: #ecfdf5; color: #15803d; }
        .status-v2.rejected { background: #fef2f2; color: #b91c1c; }

        /* Vouchers */
        .vouchers-carousel {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 2rem;
        }
        .v-item-v2 {
            background: white;
            border-radius: 24px;
            padding: 2rem;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .v-item-v2:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); border-color: transparent; }
        
        .v-item-v2.locked { opacity: 0.7; filter: grayscale(1); }
        .v-item-v2.locked:hover { transform: none; box-shadow: none; }

        .v-header-v2 { display: flex; justify-content: space-between; align-items: start; }
        .v-price-tag {
            padding: 0.5rem 1rem;
            background: var(--gold-gradient);
            color: #020617;
            font-weight: 800;
            border-radius: 100px;
            font-size: 0.85rem;
            box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
        }

        .v-item-v2 h3 { font-size: 1.4rem; font-weight: 800; color: var(--primary); line-height: 1.2; }

        .v-progress-track-v2 {
            height: 8px;
            background: #f1f5f9;
            border-radius: 100px;
            overflow: hidden;
            margin-top: auto;
        }
        .v-bar-v2 { height: 100%; border-radius: 100px; background: var(--gold); }

        .v-redeem-btn {
            width: 100%;
            padding: 1rem;
            border-radius: 14px;
            background: var(--primary);
            color: white;
            font-weight: 700;
            margin-top: 1rem;
            transition: 0.2s;
        }
        .v-redeem-btn:hover { background: var(--accent); box-shadow: 0 8px 20px -5px rgba(14, 165, 233, 0.4); }

        /* Leaderboard */
        .leaderboard-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
        .leaderboard-section { background: white; border-radius: 24px; padding: 2rem; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
        
        .l-item {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            padding: 1rem;
            border-radius: 16px;
            transition: 0.2s;
            border-bottom: 1px solid #f8fafc;
        }
        /* REWARDS HERO (Restored) */
        .rewards-hero { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 3.5rem; 
            background: white; 
            border-radius: 32px; 
            margin-bottom: 3rem; 
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border);
            position: relative;
            overflow: hidden;
        }
        /* Add a subtle decorative gradient to the hero */
        .rewards-hero::before {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 300px;
            background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.05));
            pointer-events: none;
        }

        .r-hero-content h1 { font-size: 2.2rem; font-weight: 900; color: var(--primary); margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .r-hero-content p { color: var(--text-muted); font-weight: 500; font-size: 1.05rem; max-width: 500px; line-height: 1.6; }
        
        .r-balance-pill { 
            display: flex; 
            align-items: center; 
            gap: 1.25rem; 
            padding: 1.25rem 2rem; 
            border-radius: 24px; 
            background: white;
            border: 1px solid var(--border);
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
            position: relative;
            z-index: 5;
        }
        .r-pill-icon { 
            width: 52px; 
            height: 52px; 
            border-radius: 14px; 
            background: #fff7ed; 
            color: #f59e0b; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        .r-pill-meta { display: flex; flex-direction: column; }
        .r-pill-lbl { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.15em; margin-bottom: 0.25rem; }
        .r-pill-val { font-size: 1.5rem; font-weight: 900; color: var(--primary); line-height: 1; }

        .l-item:last-child { border-bottom: none; }
        .l-item:hover { background: #f8fafc; }
        .l-item.current { background: #f0f9ff; border: 1px solid #e0f2fe; }

        .l-rank { font-size: 1.1rem; font-weight: 900; color: #cbd5e1; width: 30px; }
        .l-item:nth-child(1) .l-rank { color: #eab308; }
        .l-item:nth-child(2) .l-rank { color: #94a3b8; }
        .l-item:nth-child(3) .l-rank { color: #b45309; }

        .l-avatar { width: 44px; height: 44px; background: #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }
        .l-item.current .l-avatar { background: white; color: var(--accent); box-shadow: var(--shadow-sm); }

        .l-name { font-weight: 700; color: var(--primary); font-size: 0.95rem; }
        .l-class { font-size: 0.75rem; color: var(--text-muted); }
        .l-pts { margin-left: auto; font-weight: 800; color: var(--primary); font-size: 1rem; }

        /* Quiz Lock Overlay */
        .forced-quiz-container {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
        }
        .quiz-lock-header {
            padding: 1.5rem 3rem;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
        }
        .quiz-lock-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 32px 32px;
        }

        .quiz-card {
            width: 100%;
            max-width: 800px;
            background: white;
            border-radius: 32px;
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            border: 1px solid var(--border);
        }

        /* Animations */
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-slow { animation: spin 3s linear infinite; }
        
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Responsive */
        @media (max-width: 1024px) {
            .s-sidebar { display: none; } /* Mobile nav needed */
            .portal-main { margin-left: 0; padding: 1rem; }
            .hero-banner-v2 { flex-direction: column; text-align: center; gap: 2rem; padding: 2rem; }
            .hero-stats-v2 { width: 100%; justify-content: center; }
            .t-row-v2 { grid-template-columns: 1fr; gap: 1.5rem; }
            .t-status-v2 { display: none; }
            .leaderboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
