import React from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import type { Redemption } from '../types';

interface RedemptionManagerProps {
    redemptions: Redemption[];
    onProcess?: (id: string, status: 'Approved' | 'Used' | 'Rejected') => Promise<void>;
}

const RedemptionManager: React.FC<RedemptionManagerProps> = ({ redemptions, onProcess }) => {
    return (
        <div className="a-dashboard-grid animate-fade-in">
            <section className="a-card glass-card span-all">
                <div className="a-card-head">
                    <Bell className="text-purple" />
                    <h2>Voucher Redemption Requests</h2>
                </div>
                <div className="a-table-container">
                    <table className="a-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Student</th>
                                <th>Voucher</th>
                                <th>Value</th>
                                <th>Code</th>
                                <th>Status</th>
                                {onProcess && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {redemptions.map(r => (
                                <tr key={r.id}>
                                    <td className="text-mono" style={{ fontSize: '0.8rem' }}>
                                        {new Date(r.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <strong>{r.studentName}</strong>
                                    </td>
                                    <td>
                                        <span className="role-badge student">{r.voucherName}</span>
                                    </td>
                                    <td>
                                        <strong className="text-green">{r.aedValue} AED</strong>
                                    </td>
                                    <td>
                                        <span className="text-mono" style={{ 
                                            background: '#f1f5f9', 
                                            padding: '0.2rem 0.4rem', 
                                            borderRadius: '4px',
                                            fontWeight: 'bold'
                                        }}>
                                            {r.code}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${r.status.toLowerCase()}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    {onProcess && (
                                        <td>
                                            {r.status === 'Pending' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => onProcess(r.id, 'Used')}
                                                        className="text-green-hover"
                                                        title="Mark as Used"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {redemptions.length === 0 && (
                                <tr>
                                    <td colSpan={onProcess ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                        No redemption requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default RedemptionManager;
