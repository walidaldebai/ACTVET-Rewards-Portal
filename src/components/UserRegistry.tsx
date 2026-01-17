import React from 'react';
import { Search, Edit, Trash2, ShieldOff } from 'lucide-react';
import type { User } from '../types';

interface UserRegistryProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    filteredUsers: User[];
    onEdit: (user: User) => void;
    onRemove: (id: string) => void;
    onUnlock: (id: string) => void;
    runSeed: () => void;
}

const UserRegistry: React.FC<UserRegistryProps> = ({
    searchTerm,
    setSearchTerm,
    filteredUsers,
    onEdit,
    onRemove,
    onUnlock,
    runSeed
}) => {
    return (
        <div className="a-directory animate-fade-in">
            <div className="a-section-head">
                <h2>User Registry</h2>
                <div className="a-search glass-card">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter entities..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>
            <div className="p-students-table-wrapper glass-card">
                <table className="a-table">
                    <thead>
                        <tr>
                            <th>Entity</th>
                            <th>Institutional Access</th>
                            <th>Access Code</th>
                            <th>Role</th>
                            <th>UID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ fontSize: '2rem' }}>📂</div>
                                                <p>No authenticated entities found in the registry.</p>
                                                 <p style={{ fontSize: '0.85rem' }}>If this is a new installation, please rebuild the institutional dataset.</p>
                                                 <button 
                                                    onClick={runSeed}
                                                    className="a-retry-btn"
                                                    style={{ background: '#3b82f6', marginTop: '0.5rem' }}
                                                 >
                                                    Initialize System Data
                                                 </button>
                                             </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="u-cell">
                                                    <div className={`u-avatar ${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <strong>{user.name}</strong>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td className="text-mono" style={{ fontWeight: 700 }}>
                                                {user.password || 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`role-badge ${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="text-mono">{user.id.substring(0, 8)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {user.isQuizLocked && (
                                                        <button 
                                                            onClick={() => onUnlock(user.id)} 
                                                            className="a-delete-btn" 
                                                            title="Unlock Account"
                                                            style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }}
                                                        >
                                                            <ShieldOff size={16} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => onEdit(user)} 
                                                        className="a-delete-btn" 
                                                        style={{ background: '#eff6ff', color: '#3b82f6' }}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => onRemove(user.id)} 
                                                        className="a-delete-btn"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserRegistry;
