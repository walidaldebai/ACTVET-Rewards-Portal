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
        <div className="modal-overlay animate-fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="modal-content glass-card animate-scale-in" style={{
                maxWidth: '500px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '2.5rem',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: '#ef4444'
                    }}>
                        <AlertTriangle size={32} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
                        Ready to start {taskTitle}?
                    </h2>

                    <div style={{ 
                        backgroundColor: '#f8fafc', 
                        padding: '1.5rem', 
                        borderRadius: '16px', 
                        textAlign: 'left',
                        marginBottom: '2rem',
                        border: '1px solid #e2e8f0'
                    }}>
                        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                            <strong>Warning:</strong> Once this task is opened, you cannot close it without being locked out. 
                            Navigating away, switching tabs, or closing the browser will result in an <strong>automatic failure</strong>.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', justifyContent: 'center' }}>
                        <input 
                            type="checkbox" 
                            id="dontShow" 
                            checked={dontShowAgain} 
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="dontShow" style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                            Don't show this warning again
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={onClose}
                            className="glass-card"
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontWeight: 700,
                                color: '#64748b',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onConfirm(dontShowAgain)}
                            className="accent-gradient"
                            style={{
                                flex: 2,
                                padding: '1rem',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 800,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <Play size={18} fill="currentColor" />
                            Continue to Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskStartModal;
