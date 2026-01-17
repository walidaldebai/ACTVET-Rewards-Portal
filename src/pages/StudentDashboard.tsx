import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, push, set, onValue } from 'firebase/database';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import {
  Zap,
  ShieldCheck,
} from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
import InnovatorQuiz from '../components/InnovatorQuiz';
import TasksSection from '../components/TasksSection';
import RewardsSection from '../components/RewardsSection';
import LeaderboardSection from '../components/LeaderboardSection';
import SettingsSection from '../components/SettingsSection';
import HeroBanner from '../components/HeroBanner';
import { ProfileWidget, AchievementsWidget, DeadlinesWidget, SystemUpdatesWidget } from '../components/StudentWidgets';
import '../styles/StudentDashboard.css';
import type { VoucherLevel, Task, TaskSubmission, User, CampusClass, Achievement } from '../types';

const StudentDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [points, setPoints] = useState(currentUser?.points || 0);
  const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<CampusClass[]>([]);

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [handInFile, setHandInFile] = useState<File | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'tasks' | 'leaderboard' | 'settings'>('tasks');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [isCheatLocked, setIsCheatLocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const calculateRank = (userId: string) => {
    if (!currentUser || allStudents.length === 0) return '-';
    // Only rank students who have finished the quiz
    const classMates = allStudents.filter(s => 
      s.grade === currentUser.grade && 
      s.classId === currentUser.classId &&
      s.isInnovatorVerified // Only verified innovators are ranked
    );
    const sorted = [...classMates].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === userId);
    return index === -1 ? '-' : index + 1;
  };

  const calculateCampusRank = (userId: string) => {
    if (!currentUser || allStudents.length === 0) return '-';
    // Only rank students who have finished the quiz
    const verifiedStudents = allStudents.filter(s => s.isInnovatorVerified);
    const sorted = [...verifiedStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === userId);
    return index === -1 ? '-' : index + 1;
  };

  const checkAndUnlockAchievements = useCallback(async (currentPoints: number) => {
    if (!currentUser) return;

    const userSubmissions = submissions.filter(s => s.studentId === currentUser.id);
    const approvedSubs = userSubmissions.filter(s => s.status === 'Approved');
    const currentAchievements = currentUser.achievements || [];
    
    const newAchievements: string[] = [];

    // Check First Step
    if (userSubmissions.length > 0 && !currentAchievements.includes('1')) {
      newAchievements.push('1');
    }

    // Check Task Master
    if (userSubmissions.length >= 5 && !currentAchievements.includes('2')) {
      newAchievements.push('2');
    }

    // Check On Fire
    if (approvedSubs.length >= 3 && !currentAchievements.includes('3')) {
      newAchievements.push('3');
    }

    // Check High Flyer (2000 points)
    if (currentPoints >= 2000 && !currentAchievements.includes('4')) {
      newAchievements.push('4');
    }

    // If there are new achievements, update the database
    if (newAchievements.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newAchievements];
      try {
        await update(ref(db, `Users/${currentUser.id}`), {
          achievements: updatedAchievements
        });
        console.log('New achievements unlocked:', newAchievements);
      } catch (error) {
        console.error('Failed to save achievements:', error);
      }
    }
  }, [currentUser, submissions]);

  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    const dbRef = ref(db);
    
    // Listen for Vouchers
    const vouchersRef = child(dbRef, 'Voucher_Levels');
    const unsubscribeVouchers = onValue(vouchersRef, (snapshot) => {
      const fetched: VoucherLevel[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => { fetched.push({ id: child.key, ...child.val() }); });
      }
      setVouchers(fetched);
      setLoading(false);
    });

    // Listen for Tasks
    const tasksRef = child(dbRef, 'Tasks');
    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      const fetched: Task[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => { fetched.push({ id: child.key, ...child.val() }); });
      }
      setTasks(fetched);
    });

    // Listen for Submissions
    const submissionsRef = child(dbRef, 'Task_Submissions');
    const unsubscribeSubmissions = onValue(submissionsRef, (snapshot) => {
      const fetched: TaskSubmission[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const sub = child.val();
          if (sub.studentId === currentUser.id) {
            fetched.push({ id: child.key, ...sub });
          }
        });
      }
      setSubmissions(fetched);
    });

    // Listen for All Students (for Leaderboard)
    const usersRef = child(dbRef, 'Users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const fetched: User[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const u = child.val();
          if (u.role === 'Student') {
            fetched.push({ id: child.key, ...u });
          }
        });
      }
      setAllStudents(fetched);
    });

    // Listen for Classes
    const classesRef = child(dbRef, 'Classes');
    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const fetched: CampusClass[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((snapChild) => {
          fetched.push({ id: snapChild.key!, ...snapChild.val() });
        });
      }
      setClasses(fetched);
    });

    // Set points initially from currentUser
    setPoints(currentUser.points || 0);

    return () => {
      unsubscribeVouchers();
      unsubscribeTasks();
      unsubscribeSubmissions();
      unsubscribeUsers();
      unsubscribeClasses();
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && points > 0) {
      checkAndUnlockAchievements(points);
    }
  }, [points, submissions, currentUser, checkAndUnlockAchievements]);

  const fetchLiveData = async () => {
    // This function is now deprecated in favor of real-time listeners
    // Keeping it empty to avoid breaking other calls if any
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // ONLY trigger if student is actively doing a task OR taking the quiz
      const isDoingTask = activeTab === 'tasks';
      const isTakingQuiz = showQuiz;

      if (document.hidden && currentUser?.role === 'Student' && !isCheatLocked && (isDoingTask || isTakingQuiz)) {
        // User switched tabs - Potential Cheating
        setIsCheatLocked(true);
        
        // If they were taking the quiz, we force close it and lock them out
        if (isTakingQuiz) {
          setShowQuiz(false);
        }

        // Notify Teacher (Push to Notifications collection)
        try {
          const notificationRef = push(ref(db, 'Notifications'));
          await set(notificationRef, {
            type: 'cheat_alert',
            title: 'Academic Integrity Warning',
            message: `Student ${currentUser.name} switched tabs/windows during ${isTakingQuiz ? 'Innovator Quiz' : 'active tasks'}. Potential AI resource usage detected.`,
            studentId: currentUser.id,
            timestamp: new Date().toISOString(),
            isRead: false,
            severity: 'high'
          });

          setShowWarning(true);
        } catch (e) {
          console.error("Failed to report violation", e);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentUser, isCheatLocked, activeTab, showQuiz]);

  const getAchievements = (): Achievement[] => {
    if (!currentUser) return [];

    const userSubmissions = submissions.filter(s => s.studentId === currentUser.id);
    const approvedSubs = userSubmissions.filter(s => s.status === 'Approved');
    const totalPoints = points;
    const currentAchievements = currentUser.achievements || [];

    return [
      {
        id: '1',
        title: 'First Step',
        description: 'Submit your first assignment',
        icon: 'star',
        bColor: 'bg-blue-100 text-blue-600',
        isUnlocked: currentAchievements.includes('1'),
        progress: userSubmissions.length > 0 ? 100 : 0
      },
      {
        id: '2',
        title: 'Task Master',
        description: 'Submit 5 assignments',
        icon: 'target',
        bColor: 'bg-purple-100 text-purple-600',
        isUnlocked: currentAchievements.includes('2'),
        progress: Math.min((userSubmissions.length / 5) * 100, 100)
      },
      {
        id: '3',
        title: 'On Fire',
        description: 'Get 3 tasks approved',
        icon: 'flame',
        bColor: 'bg-orange-100 text-orange-600',
        isUnlocked: currentAchievements.includes('3'),
        progress: Math.min((approvedSubs.length / 3) * 100, 100)
      },
      {
        id: '4',
        title: 'High Flyer',
        description: 'Reach 2,000 Points',
        icon: 'award',
        bColor: 'bg-yellow-100 text-yellow-600',
        isUnlocked: currentAchievements.includes('4'), // Permanently unlocked once achieved
        progress: Math.min((totalPoints / 2000) * 100, 100)
      }
    ];
  };

  const upcomingDeadlines = tasks
    .filter(t => t.deadline && new Date(t.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

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
      if (!confirm(`Redeem ${voucher.name} for ${voucher.pointCost} points? This will send a request to the admin.`)) return;

      try {
        const newPoints = points - voucher.pointCost;

        // 1. Deduct points
        await update(ref(db, `Users/${currentUser.id}`), {
          points: newPoints
        });

        // 2. Create Redemption Request
        const requestRef = push(ref(db, 'Redemption_Requests'));
        await set(requestRef, {
          studentId: currentUser.id,
          studentName: currentUser.name,
          voucherId: voucher.id,
          voucherName: voucher.name,
          timestamp: new Date().toISOString(),
          status: 'Pending'
        });

        setPoints(newPoints);
        alert(`🎉 Redemption Request Sent!\nAdmins have been notified that you redeemed ${voucher.name}.`);
      } catch (err: any) {
        console.error("Redemption error:", err);
        let errorMessage = "Transaction failed.";
        
        if (err.code === 'PERMISSION_DENIED') {
          errorMessage = "Permission denied. Please contact your administrator.";
        } else if (err.code === 'NETWORK_ERROR') {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (err.message) {
          errorMessage = `Transaction failed: ${err.message}`;
        }
        
        alert(errorMessage);
      }
    } else {
      alert("Insufficient points.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (!currentUser || !auth.currentUser) return;

    setPassLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      await update(ref(db, `Users/${currentUser.id}`), {
        password: newPassword
      });
      alert("Password updated successfully.");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert("For security, please sign out and sign in again to update your password.");
      } else {
        alert("Failed to update password. " + err.message);
      }
    } finally {
      setPassLoading(false);
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
      if (!s.classId || !classStats[s.classId] || !s.isInnovatorVerified) return;
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
      <StudentSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        logout={logout} 
      />

      <main className="portal-main">
        {/* Verification Prompt Banner */}
        {!currentUser?.isInnovatorVerified && !isCheatLocked && (
          <div className="verification-prompt-banner animate-slide-down">
            <div className="v-prompt-content">
              <Zap size={20} className="text-yellow" />
              <span>
                <strong>Ranking Disabled:</strong> Complete the ATS Innovator Assessment to unlock your campus ranking and professional rewards.
              </span>
            </div>
            <button onClick={() => setShowQuiz(true)} className="v-prompt-btn">
              Start Assessment
            </button>
          </div>
        )}

        {/* Innovator Quiz Modal */}
        {showQuiz && (
          <div className="quiz-modal-overlay">
            <div className="quiz-modal-content">
              <div className="quiz-modal-header">
                <h2>Innovator Assessment</h2>
                <button onClick={() => setShowQuiz(false)} className="quiz-close-btn">×</button>
              </div>
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
        )}

        {activeTab === 'tasks' && (
              <>
                <HeroBanner 
                  currentUser={currentUser}
                  points={points}
                  calculateCampusRank={calculateCampusRank}
                  calculateRank={calculateRank}
                  isCheatLocked={isCheatLocked}
                />
                <TasksSection 
                  tasks={tasks}
                  submissions={submissions}
                  currentUser={currentUser}
                  submittingId={submittingId}
                  handInFile={handInFile}
                  setHandInFile={setHandInFile}
                  handleSubmitTask={handleSubmitTask}
                  isCheatLocked={isCheatLocked}
                />
              </>
            )}

            {activeTab === 'rewards' && (
              <RewardsSection 
                vouchers={vouchers}
                points={points}
                handleRedeem={handleRedeem}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsSection 
                currentUser={currentUser}
                handleUpdatePassword={handleUpdatePassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                passLoading={passLoading}
              />
            )}

            {
              activeTab === 'leaderboard' && (
                <LeaderboardSection 
                  allStudents={allStudents}
                  currentUser={currentUser}
                  getClassLeaderboard={getClassLeaderboard}
                />
              )
            }

            {/* Right Sidebar - Widgets */}
            <aside className="s-rightbar animate-slide-left">
              <ProfileWidget 
                currentUser={currentUser}
                submissions={submissions}
              />

              <AchievementsWidget 
                achievements={getAchievements()}
              />

              <DeadlinesWidget 
                upcomingDeadlines={upcomingDeadlines}
              />

              <SystemUpdatesWidget />
          </aside>
        </main>
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-card animate-scale-in">
            <div className="warning-icon-wrapper">
              <ShieldCheck size={48} className="text-red-500" />
            </div>
            <h2>Security Alert</h2>
            <p>
              Tab switching detected. Your session has been flagged for potential academic dishonesty (AI Resource Usage).
            </p>
            <div className="warning-details">
              All active tasks and assessments have been templocked.
            </div>
            <button onClick={() => setShowWarning(false)} className="warning-close-btn">
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
