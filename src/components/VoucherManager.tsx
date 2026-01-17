import React from 'react';
import { Plus, Ticket, Trash2 } from 'lucide-react';

interface VoucherManagerProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    newVoucherTitle: string;
    setNewVoucherTitle: (val: string) => void;
    newVoucherCost: number;
    setNewVoucherCost: (val: number) => void;
    newVoucherAEDValue: number;
    setNewVoucherAEDValue: (val: number) => void;
    vouchers: any[];
    onDeleteVoucher: (id: string) => Promise<void>;
}

const VoucherManager: React.FC<VoucherManagerProps> = ({
    onSubmit,
    newVoucherTitle,
    setNewVoucherTitle,
    newVoucherCost,
    setNewVoucherCost,
    newVoucherAEDValue,
    setNewVoucherAEDValue,
    vouchers,
    onDeleteVoucher
}) => {
    return (
        <div className="a-dashboard-grid animate-fade-in">
            <section className="a-card glass-card">
                <div className="a-card-head">
                    <Plus className="text-blue" />
                    <h2>Create Voucher</h2>
                </div>
                <form onSubmit={onSubmit} className="a-form">
                    <input 
                        type="text" 
                        placeholder="Title (e.g. Free Coffee)" 
                        value={newVoucherTitle} 
                        onChange={e => setNewVoucherTitle(e.target.value)} 
                        required 
                    />
                    <div className="f-row">
                        <div className="f-group">
                            <label>Cost (Points)</label>
                            <input 
                                type="number" 
                                value={newVoucherCost} 
                                onChange={e => setNewVoucherCost(Number(e.target.value))} 
                                required 
                            />
                        </div>
                        <div className="f-group">
                            <label>AED Value</label>
                            <input 
                                type="number" 
                                value={newVoucherAEDValue} 
                                onChange={e => setNewVoucherAEDValue(Number(e.target.value))} 
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" className="a-submit-btn accent-gradient">
                        Create Voucher
                    </button>
                </form>
            </section>

            <section className="a-card glass-card">
                <div className="a-card-head">
                    <Ticket className="text-purple" />
                    <h2>Current Vouchers</h2>
                </div>
                <div className="class-grid-v2">
                    {vouchers.map(v => (
                        <div 
                            key={v.id} 
                            className="class-card-v3 glass-card" 
                            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}
                        >
                            <div className="c-info">
                                <span className="c-grade">{v.pointCost} PTS</span>
                                <span className="c-id">{v.name}</span>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                width: '100%', 
                                alignItems: 'center', 
                                marginTop: '0.5rem' 
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                                    {v.aedValue} AED
                                </span>
                                <button 
                                    onClick={() => onDeleteVoucher(v.id)} 
                                    className="c-delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default VoucherManager;
