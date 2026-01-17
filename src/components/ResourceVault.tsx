import React from 'react';
import { Archive, FileText, Trash2, Download } from 'lucide-react';
import type { Task } from '../types';

interface ResourceVaultProps {
    tasks: Task[];
    handleDeleteTask: (taskId: string) => Promise<void>;
}

const ResourceVault: React.FC<ResourceVaultProps> = ({
    tasks,
    handleDeleteTask
}) => {
    return (
        <div className="p-resources-section animate-fade-in">
            <div className="p-section-head">
                <Archive className="text-purple" />
                <h2>Resource Vault</h2>
                <span className="p-badge-v2">{tasks.length} ASSETS UPLOADED</span>
            </div>

            <div className="p-resources-grid">
                {tasks.map(task => (
                    <div key={task.id} className="p-resource-card glass-card">
                        <div className="p-r-top">
                            <div className="p-r-icon gold-gradient"><FileText /></div>
                            <div className="p-r-info">
                                <span className="p-r-name">{task.title}</span>
                                <span className="p-r-meta">Uploaded {new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button className="p-r-delete" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="p-r-stats">
                            <div className="r-stat">
                                <small>GRADE</small>
                                <span>{task.grade}</span>
                            </div>
                            <div className="r-stat">
                                <small>STATUS</small>
                                <span className="text-green">Active</span>
                            </div>
                        </div>
                        {task.attachmentUrl && (
                            <a 
                                href={task.attachmentUrl} 
                                download={task.attachmentName} 
                                className="p-r-view-btn glass-card"
                            >
                                <Download size={16} />
                                <span>Download Attachment ({task.attachmentName})</span>
                            </a>
                        )}
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="p-empty-state glass-card">
                        <Archive size={48} />
                        <h3>Vault is Empty</h3>
                        <p>You haven't uploaded any assignment resources yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceVault;
