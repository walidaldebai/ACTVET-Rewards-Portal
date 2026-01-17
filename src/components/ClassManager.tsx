import React from 'react';
import { Plus, School, RefreshCw, Trash2 } from 'lucide-react';
import type { Grade, CampusClass } from '../types';

interface ClassManagerProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    newClassGrade: Grade;
    setNewClassGrade: (grade: Grade) => void;
    newClassName: string;
    setNewClassName: (name: string) => void;
    loading: boolean;
    classes: CampusClass[];
    onRemoveClass: (id: string) => Promise<void>;
}

const ClassManager: React.FC<ClassManagerProps> = ({
    onSubmit,
    newClassGrade,
    setNewClassGrade,
    newClassName,
    setNewClassName,
    loading,
    classes,
    onRemoveClass
}) => {
    return (
        <div className="a-classes-section animate-fade-in">
            <div className="a-dashboard-grid">
                <section className="a-card glass-card">
                    <div className="a-card-head">
                        <Plus className="text-blue" />
                        <h2>Create New Class</h2>
                    </div>
                    <form onSubmit={onSubmit} className="a-form">
                        <div className="f-row">
                            <div className="f-group">
                                <label>Grade Level</label>
                                <select 
                                    value={newClassGrade} 
                                    onChange={e => setNewClassGrade(Number(e.target.value) as Grade)}
                                >
                                    <option value={9}>Grade 9</option>
                                    <option value={10}>Grade 10</option>
                                    <option value={11}>Grade 11</option>
                                    <option value={12}>Grade 12</option>
                                </select>
                            </div>
                            <div className="f-group">
                                <label>Section Number</label>
                                <select 
                                    value={newClassName} 
                                    onChange={e => setNewClassName(e.target.value)} 
                                    required
                                >
                                    <option value="">Select Section</option>
                                    <option value="1">Section 1</option>
                                    <option value="2">Section 2</option>
                                    <option value="3">Section 3</option>
                                    <option value="4">Section 4</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="a-submit-btn accent-gradient">
                            Initialize Class
                        </button>
                    </form>
                </section>

                <section className="a-card glass-card">
                    <div className="a-card-head">
                        <School className="text-purple" />
                        <h2>Institutional Directory</h2>
                    </div>
                    <div className="class-grid-v2">
                        {loading && classes.length === 0 && (
                            <div className="a-loading-inline">
                                <RefreshCw className="spin-slow" />
                                <span>Synchronizing Registry...</span>
                            </div>
                        )}
                        {classes.map(c => (
                            <div key={c.id} className="class-card-v3 glass-card">
                                <div className="c-info">
                                    <span className="c-grade">GRADE {c.grade}</span>
                                    <span className="c-id">Class {c.name}</span>
                                </div>
                                <button 
                                    onClick={() => onRemoveClass(c.id)} 
                                    className="c-delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {classes.length === 0 && (
                            <div className="a-empty-state">
                                <School size={48} opacity={0.2} />
                                <p>No classes defined.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ClassManager;
