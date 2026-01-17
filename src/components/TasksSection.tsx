import React from 'react';
import { ClipboardList, RefreshCw, Clock, FileText, Download, Upload, CheckCircle2, XCircle, Lock as LockIcon } from 'lucide-react';
import type { Task, TaskSubmission, User } from '../types';

interface TasksSectionProps {
  tasks: Task[];
  submissions: TaskSubmission[];
  currentUser: User | null;
  submittingId: string | null;
  handInFile: File | null;
  setHandInFile: (file: File | null) => void;
  handleSubmitTask: (task: Task) => void;
  isCheatLocked: boolean;
}

const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  submissions,
  currentUser,
  submittingId,
  handInFile,
  setHandInFile,
  handleSubmitTask,
  isCheatLocked
}) => {
  const filteredTasks = tasks.filter(t =>
    t.grade === currentUser?.grade &&
    (!t.assignedToClass || t.assignedToClass === currentUser?.classId)
  );

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
                      {isCheatLocked ? (
                        <div className="cheat-lock-msg">
                          <LockIcon size={16} />
                          <span>Task Locked - Security Violation</span>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  )}
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
    </section>
  );
};

export default TasksSection;
