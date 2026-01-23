
import React, { useState } from 'react';
import { AlertTriangle, Play, X } from 'lucide-react';

interface TaskStartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dontShowAgain: boolean) => void;
    taskTitle: string;
}

const TaskStartModal: React.FC<TaskStartModalProps> = ({ isOpen, onClose, onConfirm, taskTitle }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in">
            <div className="modal-content-glass animate-scale-in">
                <button onClick={onClose} className="modal-close-btn">
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center' }}>
                    <div className="modal-warning-icon">
                        <AlertTriangle size={32} />
                    </div>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
                        Ready to start {taskTitle}?
                    </h2>

                    <div style={{
                        background: 'rgba(0,0,0,0.03)',
                        padding: '1.5rem',
                        borderRadius: '20px',
                        textAlign: 'left',
                        marginBottom: '2.5rem',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                            <strong style={{ color: 'var(--danger)' }}>Warning:</strong> Once this assessment begins, the portal enters <strong>Secure Mode</strong>.
                            Navigating away, switching tabs, or resizing the window will result in an <strong>automatic security lockout</strong>.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', justifyContent: 'center' }}>
                        <input
                            type="checkbox"
                            id="dontShow"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="dontShow" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                            Don't show this security warning again
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button onClick={onClose} className="modal-btn secondary">
                            Cancel
                        </button>
                        <button onClick={() => onConfirm(dontShowAgain)} className="modal-btn primary">
                            <Play size={18} fill="currentColor" style={{ marginRight: '0.5rem' }} />
                            Begin Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskStartModal;
