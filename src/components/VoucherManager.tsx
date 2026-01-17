import React from 'react';
import { Plus, Ticket, Trash2, Gift } from 'lucide-react';

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
                    <div className="f-group">
                        <label>Voucher Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Free Coffee, 10 AED Staff Credit" 
                            value={newVoucherTitle} 
                            onChange={e => setNewVoucherTitle(e.target.value)} 
                            required 
                        />
                    </div>
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
                <div className="voucher-coupon-grid">
                    {vouchers.map(v => (
                        <div key={v.id} className="coupon-card">
                            <div className="coupon-left">
                                <div className="coupon-value">{v.aedValue}</div>
                                <div className="coupon-currency">AED</div>
                            </div>
                            <div className="coupon-divider"></div>
                            <div className="coupon-right">
                                <div className="coupon-info">
                                    <h3 className="coupon-title">{v.name}</h3>
                                    <p className="coupon-cost">{v.pointCost} Points</p>
                                </div>
                                <button 
                                    onClick={() => onDeleteVoucher(v.id)} 
                                    className="coupon-delete"
                                    title="Delete Voucher"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="coupon-punch-top"></div>
                            <div className="coupon-punch-bottom"></div>
                        </div>
                    ))}
                    {vouchers.length === 0 && (
                        <div className="no-data-placeholder">
                            <Gift size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No vouchers created yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default VoucherManager;
