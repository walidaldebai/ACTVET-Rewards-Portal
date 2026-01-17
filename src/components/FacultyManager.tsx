import React from 'react';
import { GraduationCap, ChevronRight, CheckSquare } from 'lucide-react';
import type { User, CampusClass } from '../types';

interface FacultyManagerProps {
    teachers: User[];
    selectedTeacherId: string | null;
    setSelectedTeacherId: (id: string | null) => void;
    selectedTeacher: User | undefined;
    classes: CampusClass[];
    toggleClassAssignment: (teacherId: string, classId: string) => Promise<void>;
}

const FacultyManager: React.FC<FacultyManagerProps> = ({
    teachers,
    selectedTeacherId,
    setSelectedTeacherId,
    selectedTeacher,
    classes,
    toggleClassAssignment
}) => {
    return (
        <div className="a-faculty-grid animate-fade-in">
            <section className="a-card glass-card">
                <div className="a-card-head">
                    <GraduationCap className="text-blue" />
                    <h2>Faculty List</h2>
                </div>
                <div className="a-faculty-list">
                    {teachers.map(teacher => (
                        <div 
                            key={teacher.id} 
                            className={`f-item ${selectedTeacherId === teacher.id ? 'active' : ''}`} 
                            onClick={() => setSelectedTeacherId(teacher.id)}
                        >
                            <div className={`u-avatar teacher`}>{teacher.name.charAt(0)}</div>
                            <div className="f-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <strong>{teacher.name}</strong>
                                    <span className="role-badge teacher">TEACHER</span>
                                </div>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{teacher.subject}</span>
                            </div>
                            <ChevronRight size={18} className="f-chevron" />
                        </div>
                    ))}
                </div>
            </section>

            <section className="a-card glass-card">
                <div className="a-card-head">
                    <CheckSquare className="text-purple" />
                    <h2>Class Assignments</h2>
                </div>
                {selectedTeacher ? (
                    <div className="assignment-manager">
                        <div className="manager-header">
                            <h3>Assign classes to {selectedTeacher.name}</h3>
                            <p>Teachers can only validate tasks for students in assigned classes.</p>
                        </div>
                        <div className="class-checklist">
                            {classes.map(cls => (
                                <label key={cls.id} className="checklist-item glass-card">
                                    <input
                                        type="checkbox"
                                        checked={(selectedTeacher.assignedClasses || []).includes(cls.id)}
                                        onChange={() => toggleClassAssignment(selectedTeacher.id, cls.id)}
                                    />
                                    <div className="checkbox-custom"></div>
                                    <span>Class {cls.id}</span>
                                </label>
                            ))}
                            {classes.length === 0 && (
                                <p className="no-data">No campus classes defined. Go to "Campus Classes" tab to add them.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="a-empty-state">
                        <GraduationCap size={48} />
                        <p>Select a teacher to manage class assignments.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default FacultyManager;
