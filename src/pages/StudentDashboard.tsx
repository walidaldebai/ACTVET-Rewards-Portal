import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, push, set, onValue, child, query, orderByChild, equalTo } from 'firebase/database';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import {
  Zap,
  ShieldCheck,
  Menu,
  ClipboardList,
  Ticket,
  Award,
  Settings,
  LayoutDashboard,
  Trophy,
  ChevronRight,
  ChevronLeft,
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
import type { VoucherLevel, Task, TaskSubmission, User, CampusClass, Achievement, Redemption } from '../types';

const StudentDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [points, setPoints] = useState(currentUser?.points || 0);
  const [vouchers, setVouchers] = useState<VoucherLevel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<CampusClass[]>([]);

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [handInFile, setHandInFile] = useState<File | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [isCheatLocked, setIsCheatLocked] = useState(currentUser?.isQuizLocked || false);
  const [showWarning, setShowWarning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(currentUser?.activeTaskId || null);
  const [taskStartTime, setTaskStartTime] = useState<string | null>(currentUser?.taskStartTime || null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const quizCompletedRef = React.useRef(false);

  // Sync points and isCheatLocked with currentUser's state
  useEffect(() => {
    if (currentUser) {
      if (currentUser.isQuizLocked !== undefined) {
        setIsCheatLocked(currentUser.isQuizLocked);
      }
      if (currentUser.points !== undefined) {
        setPoints(currentUser.points);
      }
      if (currentUser.activeTaskId !== undefined) {
        setActiveTaskId(currentUser.activeTaskId);
      }
      if (currentUser.taskStartTime !== undefined) {
        setTaskStartTime(currentUser.taskStartTime);
      }
    }
  }, [currentUser]);

  // Task Timer Effect
  useEffect(() => {
    if (!currentUser) return;

    const checkAbandonedTask = async () => {
      if (currentUser.activeTaskId && currentUser.taskStartTime) {
        const activeTask = tasks.find(t => t.id === currentUser.activeTaskId);
        if (activeTask) {
          // STRICT RULE: If they closed the page with an active task, it fails immediately on return
          console.log("Abandoned task detected on mount, failing it immediately as per security policy...");
          await handleTimeout(activeTask, 'Automatic failure: Page session was closed or refreshed during active task.');
        }
      }
    };

    checkAbandonedTask();
  }, [currentUser, tasks]);

  useEffect(() => {
     if (!activeTaskId || !taskStartTime || tasks.length === 0) {
      setTimeLeft(null);
      return;
    }

    const task = tasks.find(t => t.id === activeTaskId);
    if (!task || !task.timeLimit) return;

    const limitInSeconds = task.timeLimit * 60;
    const start = new Date(taskStartTime).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = limitInSeconds - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // Auto-fail task on timeout
        handleTimeout(task);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTaskId, taskStartTime, tasks]);

  const handleTimeout = async (task: Task, customMessage?: string) => {
    if (!currentUser) return;
    
    try {
      const submissionRef = push(ref(db, 'Task_Submissions'));
      await set(submissionRef, {
        taskId: task.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentGrade: currentUser.grade!,
        status: 'Rejected',
        submittedAt: new Date().toISOString(),
        points: 0,
        taskTitle: task.title,
        subject: task.subject,
        teacherComment: customMessage || 'Automatic failure: Time limit exceeded.'
      });
      
      setActiveTaskId(null);
      setTaskStartTime(null);
      
      await update(ref(db, `Users/${currentUser.id}`), {
        activeTaskId: null,
        taskStartTime: null,
        isQuizLocked: true // Lock the student out as well
      });

      alert(customMessage || `⏰ Time's up! The task "${task.title}" has been marked as failed.`);
    } catch (err) {
      console.error("Failed to handle task timeout", err);
    }
  };

  const calculateRank = (studentId: string) => {
    if (!currentUser || allStudents.length === 0) return '-';
    // Only rank students who have finished the quiz
    const classMates = allStudents.filter(s => 
      s.grade === currentUser.grade && 
      s.classId === currentUser.classId &&
      s.isInnovatorVerified // Only verified innovators are ranked
    );
    const sorted = [...classMates].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === studentId);
    return index === -1 ? '-' : index + 1;
  };

  const calculateCampusRank = (studentId: string) => {
    if (!currentUser || allStudents.length === 0) return '-';
    // Only rank students who have finished the quiz
    const verifiedStudents = allStudents.filter(s => s.isInnovatorVerified);
    const sorted = [...verifiedStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === studentId);
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
      const data = snapshot.val();
      if (data) {
        // Map the entries to ensure each voucher has an id (using the key as fallback)
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          ...val,
          id: val.id || key
        }));
        setVouchers(list);
      }
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

    // Listen for Submissions (Client-side filtering to avoid indexing warnings)
    const submissionsRef = child(dbRef, 'Task_Submissions');
    const unsubscribeSubmissions = onValue(submissionsRef, (snapshot) => {
      const fetched: TaskSubmission[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const data = child.val();
          if (data.studentId === currentUser.id) {
            fetched.push({ id: child.key, ...data });
          }
        });
      }
      setSubmissions(fetched);
    });

    // Listen for Redemptions (Client-side filtering to avoid indexing warnings)
    const redemptionsRef = child(dbRef, 'Redemption_Requests');
    const unsubscribeRedemptions = onValue(redemptionsRef, (snapshot) => {
      const fetched: Redemption[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const data = child.val();
          if (data.studentId === currentUser.id) {
            fetched.push({ id: child.key, ...data });
          }
        });
      }
      setRedemptions(fetched);
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

    // Listen for current user points in real-time
    const userPointsRef = ref(db, `Users/${currentUser.id}/points`);
    const unsubscribeUserPoints = onValue(userPointsRef, (snapshot) => {
      if (snapshot.exists()) {
        setPoints(snapshot.val());
      }
    });

    return () => {
      unsubscribeVouchers();
      unsubscribeTasks();
      unsubscribeSubmissions();
      unsubscribeRedemptions();
      unsubscribeUsers();
      unsubscribeClasses();
      unsubscribeUserPoints();
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
      // Security enforcement: Fail task/quiz if student switches tabs
      const isTakingQuiz = showQuiz && !quizCompletedRef.current;
      const isTaskActive = activeTaskId !== null;

      if (document.hidden && currentUser?.role === 'Student' && !isCheatLocked && (isTakingQuiz || isTaskActive)) {
        // User switched tabs - Potential Cheating
        setIsCheatLocked(true);
        
        // Persist lock state to database and clear active task
        try {
          await update(ref(db, `Users/${currentUser.id}`), {
            isQuizLocked: true,
            activeTaskId: null,
            taskStartTime: null
          });
        } catch (e) {
          console.error("Failed to persist lock state", e);
        }
        
        // If they were taking the quiz or task, we force close and lock them out
        if (isTakingQuiz) {
          setShowQuiz(false);
        }
        
        if (isTaskActive) {
          const activeTask = tasks.find(t => t.id === activeTaskId);
          if (activeTask) {
            await handleTimeout(activeTask, 'Automatic failure: Security violation (tab switching/closing during active task).');
          }
        }

        // Notify Teacher (Push to Notifications collection)
        try {
          const notificationRef = push(ref(db, 'Notifications'));
          await set(notificationRef, {
            type: 'cheat_alert',
            title: 'Academic Integrity Warning',
            message: `Student ${currentUser.name} switched tabs/windows during ${isTakingQuiz ? 'Innovator Quiz' : 'an Active Task'}. Potential AI resource usage detected.`,
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

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTaskId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, isCheatLocked, showQuiz, activeTaskId]);

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

  const onStartTask = async (task: Task) => {
     if (!currentUser) return;
     const startTime = new Date().toISOString();
     setActiveTaskId(task.id);
     setTaskStartTime(startTime);
     try {
       await update(ref(db, `Users/${currentUser.id}`), {
         activeTaskId: task.id,
         taskStartTime: startTime
       });
     } catch (e) {
       console.error("Failed to persist active task", e);
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
      setActiveTaskId(null); // Clear active task on success
      setTaskStartTime(null);

      // Clear from database too
      if (currentUser) {
        await update(ref(db, `Users/${currentUser.id}`), {
          activeTaskId: null,
          taskStartTime: null
        });
      }
      alert('✅ Work handed in successfully! Awaiting teacher validation.');
    } catch (err) {
      console.error(err);
      alert('Hand-in failed.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRedeem = async (voucher: VoucherLevel) => {
    if (!auth.currentUser) {
      alert("Session expired. Please sign out and sign in again.");
      return;
    }

    const studentId = auth.currentUser.uid;

    if (points < voucher.pointCost) {
      alert(`Insufficient points! You need ${voucher.pointCost - points} more points.`);
      return;
    }

    if (window.confirm(`Redeem ${voucher.name} for ${voucher.pointCost} points?`)) {
      try {
        const redemptionId = `R-${Date.now()}`;
        const historyId = `H-${Date.now()}`;
        const newPoints = points - voucher.pointCost;

        const redemptionData = {
          id: redemptionId,
          studentId: studentId,
          studentName: currentUser.name || 'Student',
          voucherId: voucher.id,
          voucherName: voucher.name,
          aedValue: voucher.aedValue,
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          timestamp: new Date().toISOString(),
          status: 'Pending'
        };

        const historyData = {
          id: historyId,
          studentId: studentId,
          points: -voucher.pointCost,
          reason: `Redeemed ${voucher.name}`,
          timestamp: new Date().toISOString(),
          type: 'Redeemed'
        };

        // Split updates to avoid root-level permission issues and provide better error tracking
        console.log('Initiating redemption sequence for:', studentId);
        
        // 1. Create redemption request
        await set(ref(db, `Redemption_Requests/${redemptionId}`), redemptionData);
        
        // 2. Update user points
        await update(ref(db, `Users/${studentId}`), { points: newPoints });
        
        // 3. Record point history
        await set(ref(db, `Point_History/${studentId}/${historyId}`), historyData);
        
        alert(`Success! Your request for ${voucher.name} has been sent. Check your redemptions tab.`);
      } catch (error: any) {
        console.error('REDEMPTION ERROR:', error);
        alert(`Failed to redeem voucher: ${error.message || 'Unknown error'}`);
      }
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

  const handleTabChange = async (tab: 'dashboard' | 'rewards' | 'tasks' | 'leaderboard' | 'settings') => {
    if (activeTaskId && tab !== 'tasks') {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask) {
        const confirmNav = window.confirm(`⚠️ Leaving the tasks page will fail your active task "${activeTask.title}". Are you sure you want to proceed?`);
        if (confirmNav) {
          await handleTimeout(activeTask);
          setActiveTab(tab);
        }
        return;
      }
    }
    setActiveTab(tab);
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
      {/* Background Liquid Glows */}
      <div className="liquid-blob blob-1"></div>
      <div className="liquid-blob blob-2"></div>
      <div className="liquid-blob blob-3"></div>

      <StudentSidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        currentUser={currentUser} 
        logout={logout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="mobile-header mobile-only">
        <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-brand">
          <span className="s-main">ATS Innovator</span>
        </div>
        <div className="u-avatar-mini gold-gradient">
          {currentUser?.name?.charAt(0)}
        </div>
      </div>

      <main className={`portal-main ${!isAchievementsOpen ? 'achievements-hidden' : ''}`}>
        {isCheatLocked && (
          <div className="lockout-overlay">
            <div className="lockout-card glass-card animate-scale-in">
              <div className="lockout-icon">
                <ShieldCheck size={48} className="text-red" />
              </div>
              <h1>Access Restricted</h1>
              <p>Your account has been temporarily locked due to a security violation (unauthorized tab switching during an active assessment).</p>
              <div className="lockout-details">
                <p>To restore access, please contact your instructor or the department head for a security reset.</p>
              </div>
              <button onClick={logout} className="lockout-logout-btn">
                Terminate Session
              </button>
            </div>
          </div>
        )}

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

        {showQuiz && (
          <div className="quiz-modal-overlay">
            <div className="quiz-modal-content">
              <div className="quiz-modal-header">
                <h2>Innovator Assessment</h2>
                <button onClick={() => setShowQuiz(false)} className="quiz-close-btn">×</button>
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
                    alert(`🌟 Congratulations! You have been verified as an ATS Innovator. +${pts} Initial Merit Points Awarded.`);
                    window.location.reload();
                  } catch (e) {
                    alert("Verification failed.");
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="portal-content-layout">
          <div className="portal-main-content">
            {activeTab === 'dashboard' && (
              <div className="tab-view animate-fade-in">
                <HeroBanner 
                  currentUser={currentUser} 
                  points={points} 
                  calculateCampusRank={calculateCampusRank}
                  calculateRank={calculateRank}
                  isCheatLocked={isCheatLocked}
                />
                <div className="dashboard-grid-v2">
                  <ProfileWidget currentUser={currentUser} submissions={submissions} />
                  <DeadlinesWidget upcomingDeadlines={upcomingDeadlines} />
                  <SystemUpdatesWidget />
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
                <RewardsSection vouchers={vouchers} points={points} handleRedeem={handleRedeem} redemptions={redemptions} />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="tab-view animate-fade-in">
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
            <button 
              className="ach-toggle-btn" 
              onClick={() => setIsAchievementsOpen(!isAchievementsOpen)}
              title={isAchievementsOpen ? "Hide Achievements" : "Show Achievements"}
            >
              {isAchievementsOpen ? <ChevronRight size={20} /> : <Award size={20} />}
            </button>
            
            <div className="ach-sidebar-content">
              <div className="ach-sidebar-header">
                <Award size={24} className="text-purple-500" />
                <h2>Achievements</h2>
              </div>
              <AchievementsWidget achievements={getAchievements()} />
            </div>
          </aside>
        </div>
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
