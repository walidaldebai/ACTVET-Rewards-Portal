import React from 'react';
import { Users, Search } from 'lucide-react';
import type { User, CampusClass } from '../types';

interface StudentDirectoryProps {
    filteredStudents: User[];
    classes: CampusClass[];
    teacherClasses: string[];
    selectedClassFilter: string;
    setSelectedClassFilter: (val: string) => void;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    handleQuickAdjust: (studentId: string, amount: number) => Promise<void>;
    adjustingPoints: string | null;
    setAdjustingPoints: (val: string | null) => void;
    customPointAmount: number;
    setCustomPointAmount: (val: number) => void;
}

const StudentDirectory: React.FC<StudentDirectoryProps> = ({
    filteredStudents,
    classes,
    teacherClasses,
    selectedClassFilter,
    setSelectedClassFilter,
    searchTerm,
    setSearchTerm,
    handleQuickAdjust,
    adjustingPoints,
    setAdjustingPoints,
    customPointAmount,
    setCustomPointAmount
}) => {
    return (
        <div className="p-students-section animate-fade-in">
            <div className="p-section-head">
                <Users className="text-purple" />
                <h2>Student Directory</h2>
                <div className="p-filters-v2">
                    <select 
                        className="p-class-select glass-card" 
                        value={selectedClassFilter} 
                        onChange={e => setSelectedClassFilter(e.target.value)}
                    >
                        <option value="All">{teacherClasses.length === 0 ? 'All Campus Students' : 'All Assigned Classes'}</option>
                        {classes.filter(c => teacherClasses.includes(c.id)).map(c => (
                            <option key={c.id} value={c.id}>Class {c.id}</option>
                        ))}
                    </select>
                    <div className="p-search-box glass-card">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search students..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            <div className="p-students-table-wrapper glass-card">
                <table className="p-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Grade</th>
                            <th>Wallet Balance</th>
                            <th className="text-right">Institutional Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td>
                                    <div className="p-table-user">
                                        <div className="p-table-avatar">{student.name.charAt(0)}</div>
                                        <div className="p-table-info">
                                            <span className="p-t-name">{student.name}</span>
                                            <span className="p-t-email">{student.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="p-badge-grade">
                                        Grade {student.grade} - {student.classId}
                                    </span>
                                </td>
                                <td>
                                    <span className="p-t-pts">
                                        {student.points?.toLocaleString()} PTS
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="p-table-actions">
                                        {adjustingPoints === student.id ? (
                                            <div className="p-adjust-input animate-slide-right">
                                                <input 
                                                    type="number" 
                                                    value={customPointAmount} 
                                                    onChange={e => setCustomPointAmount(Number(e.target.value))} 
                                                />
                                                <button onClick={() => handleQuickAdjust(student.id, customPointAmount)}>Add</button>
                                                <button onClick={() => handleQuickAdjust(student.id, -customPointAmount)} className="red">Deduct</button>
                                                <button onClick={() => setAdjustingPoints(null)} className="cancel">X</button>
                                            </div>
                                        ) : (
                                            <button 
                                                className="p-action-btn accent" 
                                                onClick={() => {
                                                    setAdjustingPoints(student.id);
                                                    setCustomPointAmount(100);
                                                }}
                                            >
                                                Custom
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-empty-table">
                                    <div className="p-empty-msg">
                                        <Users size={48} />
                                        <h3>{searchTerm ? 'No matching students found' : (teacherClasses.length === 0 ? 'No students found in the system' : 'No students found in your assigned classes')}</h3>
                                        <p>
                                            {searchTerm 
                                                ? 'Try a different search term.' 
                                                : (teacherClasses.length === 0 
                                                    ? 'The system directory is currently empty. Please contact an administrator.' 
                                                    : 'Try changing the class filter or contact an administrator for class assignments.')}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentDirectory;
