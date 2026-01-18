import React, { useState } from 'react';
import { ClipboardList, RefreshCw, Clock, FileText, Download, Upload, CheckCircle2, XCircle, Lock as LockIcon, Play, Calendar, Zap } from 'lucide-react';
import type { Task, TaskSubmission, User } from '../types';
import TaskStartModal from './TaskStartModal';

interface TasksSectionProps {
  tasks: Task[];
  submissions: TaskSubmission[];
  currentUser: User | null;
  submittingId: string | null;
  handInFile: File | null;
  setHandInFile: (file: File | null) => void;
  handleSubmitTask: (task: Task) => void;
  isCheatLocked: boolean;
  activeTaskId: string | null;
  onStartTask: (task: Task) => void;
  timeLeft: number | null;
}

const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  submissions,
  currentUser,
  submittingId,
  handInFile,
  setHandInFile,
  handleSubmitTask,
  isCheatLocked,
  activeTaskId,
  onStartTask,
  timeLeft
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = tasks.filter(t =>
    t.grade === currentUser?.grade &&
    (!t.assignedToClass || t.assignedToClass === currentUser?.classId)
  );

  const handleStartClick = (task: Task) => {
    const skipWarning = localStorage.getItem('skipTaskWarning') === 'true';
    if (skipWarning) {
      onStartTask(task);
    } else {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  const handleConfirmStart = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('skipTaskWarning', 'true');
    }
    if (selectedTask) {
      onStartTask(selectedTask);
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const isOtherTaskActive = activeTaskId !== null && activeTaskId !== undefined;

  return (
    <section className="portal-section">
      <div className="section-head-v2">
        <div className="s-icon blue"><ClipboardList size={24} /></div>
        <div>
          <h2>Academic Tasks</h2>
          <p>Submit assignments to earn recognition points from your teachers</p>
        </div>
      </div>

      <div className="tasks-list-v2">
        {filteredTasks.map(task => {
          const submission = submissions.find(s => s.taskId === task.id);
          const isActive = activeTaskId === task.id;
          const isLocked = isOtherTaskActive && !isActive && !submission;
          
          return (
            <div key={task.id} className={`t-row-v2 glass-card animate-slide-up ${submission ? 'submitted' : ''} ${isActive ? 'active-task-row' : ''} ${isLocked ? 'locked-task' : ''}`}>
              <div className="task-v2-header">
                <div className="task-v2-meta">
                  <span className="task-v2-subject">{task.subject}</span>
                  <div className="task-v2-tags">
                    {task.timeLimit && (
                      <div className={`task-time-pill ${isActive ? 'timer-active' : ''}`}>
                        <Clock size={14} />
                        <span>{isActive && timeLeft !== null ? 
                          `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 
                          `${task.timeLimit} MINS`}</span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className={`task-deadline-pill ${new Date(task.deadline) < new Date() ? 'expired' : ''}`}>
                        <Calendar size={14} />
                        <span>{new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-v2-status">
                  {submission ? (
                    <div className={`t-status-badge ${submission.status === 'Approved' ? 'approved' : 'pending'}`}>
                      {submission.status === 'Approved' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      <span>{submission.status.toUpperCase()}</span>
                    </div>
                  ) : isActive ? (
                    <div className="t-status-badge active">
                      <div className="pulse-dot"></div>
                      <span>IN PROGRESS</span>
                    </div>
                  ) : isLocked ? (
                    <div className="t-status-badge locked">
                      <LockIcon size={16} />
                      <span>LOCKED</span>
                    </div>
                  ) : (
                    <div className="t-status-badge available">
                      <span>AVAILABLE</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="task-v2-body">
                <h3>{task.title}</h3>
                <p className="task-v2-desc">{task.description}</p>
                
                <div className="task-v2-footer">
                  <div className="task-points-pill">
                    <Zap size={16} />
                    <span>{task.points} PTS</span>
                  </div>

                  <div className="task-actions">
                    {submission ? (
                      <div className="submission-info">
                        <span className="sub-date">Submitted {new Date(submission.timestamp).toLocaleDateString()}</span>
                        {submission.fileUrl && (
                          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="sub-file-link">
                            <FileText size={16} />
                            VIEW ATTACHMENT
                          </a>
                        )}
                      </div>
                    ) : isActive ? (
                      <div className="task-active-controls">
                        <label className="hand-in-btn">
                          <Upload size={18} />
                          <span>{handInFile ? handInFile.name : 'UPLOAD SOLUTION'}</span>
                          <input 
                            type="file" 
                            onChange={(e) => setHandInFile(e.target.files?.[0] || null)} 
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button 
                          className="submit-task-btn"
                          disabled={!handInFile || submittingId === task.id}
                          onClick={() => handleSubmitTask(task)}
                        >
                          {submittingId === task.id ? <RefreshCw className="spin" size={18} /> : <CheckCircle2 size={18} />}
                          SUBMIT NOW
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="start-task-btn"
                        disabled={isLocked || isCheatLocked}
                        onClick={() => handleStartClick(task)}
                      >
                        <Play size={18} />
                        START TASK
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="empty-tasks-v2">
            <div className="empty-icon-wrapper blue">
              <RefreshCw size={40} className="spin-slow" />
            </div>
            <h3>All Caught Up!</h3>
            <p>No active tasks for Grade {currentUser?.grade} at the moment.<br />Check back later for new academic challenges.</p>
          </div>
        )}
      </div>

      <TaskStartModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onConfirm={handleConfirmStart}
        taskTitle={selectedTask?.title || ''}
      />
    </section>
  );
};

export default TasksSection;
