
import React, { useState } from 'react';
import { ClipboardList, RefreshCw, Clock, Upload, CheckCircle2, Play, Calendar, Zap } from 'lucide-react';
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
    Number(t.grade) === Number(currentUser?.grade) &&
    (!t.assignedToClass || t.assignedToClass === currentUser?.classId)
  );

  const handleStartClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleConfirmStart = () => {
    if (selectedTask) {
      onStartTask(selectedTask);
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <section className="portal-section animate-slide-up">
      <div className="section-head-v2" style={{ marginBottom: '3rem' }}>
        <div className="s-icon blue"><ClipboardList size={28} /></div>
        <div>
          <h2 style={{ fontSize: '2.5rem' }}>Academic Quests</h2>
          <p style={{ fontSize: '1.2rem' }}>Complete institutional tasks to earn points and climb the rankings.</p>
        </div>
      </div>

      <div className="tasks-list-v2">
        {filteredTasks.length > 0 ? filteredTasks.map(task => {
          const submission = submissions.find(s => s.taskId === task.id);
          const isActive = activeTaskId === task.id;

          return (
            <div key={task.id} className={`t-row-v2 glass-card ${submission ? 'submitted' : ''} ${isActive ? 'active-task-row' : ''}`}>
              <div className="task-v2-header">
                <div className="task-v2-meta">
                  <span className="task-v2-subject">{task.subject}</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.25rem' }}>{task.title}</h3>
                </div>
                <div className="task-points-pill" style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.75rem 1.25rem', borderRadius: '16px' }}>
                  <Zap size={20} />
                  <span>{task.points} PTS</span>
                </div>
              </div>

              <p className="task-v2-desc" style={{ fontSize: '1.1rem', marginTop: '1rem', opacity: 0.8 }}>{task.description}</p>

              <div className="task-v2-footer" style={{ marginTop: '2rem', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {task.timeLimit && (
                    <div className="task-time-pill">
                      <Clock size={16} />
                      <span>{isActive && timeLeft !== null ?
                        `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` :
                        `${task.timeLimit} MINS`}</span>
                    </div>
                  )}
                  {task.deadline && (
                    <div className="task-deadline-pill">
                      <Calendar size={16} />
                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="task-actions">
                  {submission ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--success)', fontWeight: 800 }}>
                      <CheckCircle2 size={24} />
                      <span>SUBMITTED FOR REVIEW</span>
                    </div>
                  ) : isActive ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label className="hand-in-btn">
                        <Upload size={20} />
                        <span>{handInFile ? handInFile.name : 'UPLOAD FILE'}</span>
                        <input type="file" onChange={(e) => setHandInFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                      </label>
                      <button className="start-task-btn" onClick={() => handleSubmitTask(task)} disabled={!handInFile || submittingId === task.id}>
                        {submittingId === task.id ? <RefreshCw className="spin" /> : 'TURN IN TASK'}
                      </button>
                    </div>
                  ) : (
                    <button className="start-task-btn" onClick={() => handleStartClick(task)} disabled={isCheatLocked}>
                      <Play size={20} fill="currentColor" />
                      BEGIN TASK
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="empty-tasks-v2">
            <div className="empty-graphic">
              <RefreshCw size={48} />
            </div>
            <h3>Peak Performance!</h3>
            <p>You've cleared all pending tasks for Grade {currentUser?.grade}. Stay alert for new institutional challenges.</p>
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
