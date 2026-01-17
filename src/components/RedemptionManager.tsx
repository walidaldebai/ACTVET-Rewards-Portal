import React from 'react';
import { Bell } from 'lucide-react';

interface RedemptionManagerProps {
    redemptions: any[];
}

const RedemptionManager: React.FC<RedemptionManagerProps> = ({ redemptions }) => {
    return (
        <div className="a-dashboard-grid animate-fade-in">
            <section className="a-card glass-card span-all">
                <div className="a-card-head">
                    <Bell className="text-purple" />
                    <h2>Pending Redemption Requests</h2>
                </div>
                <div className="a-table-container">
                    <table className="a-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Student</th>
                                <th>Voucher Attempted</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {redemptions.map(r => (
                                <tr key={r.id}>
                                    <td className="text-mono" style={{ fontSize: '0.8rem' }}>
                                        {new Date(r.timestamp).toLocaleString()}
                                    </td>
                                    <td><strong>{r.userName}</strong><br/>{r.userEmail}</td>
                                    <td><span className="role-badge student">{r.voucherName}</span></td>
                                    <td>{r.message || <span style={{ opacity: 0.4 }}>No verification message</span>}</td>
                                </tr>
                            ))}
                            {redemptions.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
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
