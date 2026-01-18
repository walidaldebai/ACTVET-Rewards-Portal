import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, onValue, update, query, orderByChild } from 'firebase/database';
import { LogOut, Ticket, CheckCircle, Clock, Search, User as UserIcon } from 'lucide-react';
import type { Redemption } from '../types';
import '../styles/AdminDashboard.css'; // Reuse admin styles for consistency

const StaffDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
    const [quickCode, setQuickCode] = useState('');
    const [foundRedemption, setFoundRedemption] = useState<Redemption | null>(null);

    useEffect(() => {
        const redemptionsRef = ref(db, 'Redemption_Requests');
        const redemptionsQuery = query(redemptionsRef, orderByChild('timestamp'));
        const unsubscribe = onValue(redemptionsQuery, (snapshot) => {
            const data: Redemption[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    data.push({ id: child.key!, ...child.val() });
                });
            }
            // Sort by timestamp descending
            setRedemptions(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            
            // If we have a foundRedemption, update its data from the live list
            if (foundRedemption) {
                const updated = data.find(r => r.id === foundRedemption.id);
                if (updated) setFoundRedemption(updated);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, [foundRedemption]);

    const isExpired = (timestamp: string) => {
        const now = new Date();
        const redeemedDate = new Date(timestamp);
        const diffInDays = (now.getTime() - redeemedDate.getTime()) / (1000 * 3600 * 24);
        return diffInDays > 7;
    };

    const handleMarkAsUsed = async (redemption: Redemption) => {
        if (redemption.status !== 'Pending') {
            alert('This voucher has already been processed.');
            return;
        }

        if (isExpired(redemption.timestamp)) {
            alert('This voucher has expired (older than 1 week). It cannot be redeemed.');
            return;
        }

        if (!confirm(`Mark voucher ${redemption.code} as used? This action cannot be undone.`)) return;
        
        try {
            // Use a specific reference to the redemption node
            const redemptionRef = ref(db, `Redemption_Requests/${redemption.id}`);
            
            // Build the update object with all required fields to satisfy security rules
            const updates = {
                status: 'Used',
                processedAt: new Date().toISOString(),
                processedBy: currentUser?.name || 'Staff Personnel',
                // Explicitly include these to ensure .validate rules pass
                studentId: redemption.studentId,
                voucherId: redemption.voucherId,
                // Include other existing fields to be safe
                studentName: redemption.studentName,
                voucherName: redemption.voucherName,
                aedValue: redemption.aedValue,
                code: redemption.code,
                timestamp: redemption.timestamp
            };

            console.log('Attempting to update redemption:', redemption.id, updates);
            await update(redemptionRef, updates);
            
            alert('Voucher marked as used successfully!');
            setQuickCode(''); // Clear quick search
            setFoundRedemption(null); // Clear result display
        } catch (error: any) {
            console.error('Error updating redemption:', error);
            // Provide more detailed error message if available
            const errorMsg = error.code === 'PERMISSION_DENIED' 
                ? 'Permission Denied: You do not have authorization to process redemptions. Please contact the administrator.'
                : error.message;
            alert(`Failed to update redemption status: ${errorMsg}`);
        }
    };

    const handleQuickSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickCode.trim()) return;

        const found = redemptions.find(r => r.code.toUpperCase() === quickCode.toUpperCase());
        if (found) {
            setFoundRedemption(found);
        } else {
            setFoundRedemption(null);
            alert('Invalid or non-existent redemption code.');
        }
    };

    const historyRedemptions = redemptions.filter(r => r.status === 'Used');

    return (
        <div className="admin-app">
            <aside className="a-sidebar glass-card">
                <div className="a-sidebar-head">
                    <div className="a-logo" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                        <Ticket size={24} />
                    </div>
                    <div className="a-brand">
                        <span className="a-main">STAFF PORTAL</span>
                        <span className="a-sub">REWARDS ENGINE</span>
                    </div>
                </div>

                <nav className="a-nav">
                    <button 
                        className={activeTab === 'search' ? 'active' : ''} 
                        onClick={() => setActiveTab('search')}
                    >
                        <Search size={18} />
                        <span>Search by Code</span>
                    </button>
                    <button 
                        className={activeTab === 'history' ? 'active' : ''} 
                        onClick={() => setActiveTab('history')}
                    >
                        <Clock size={18} />
                        <span>Redemption History</span>
                    </button>
                </nav>

                <div className="a-sidebar-foot">
                    <button onClick={logout} className="p-logout-btn">
                        <LogOut size={18} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            <main className="a-workspace animate-fade-in">
                <header className="a-header">
                    <div className="a-h-titles">
                        <h1>Voucher Redemption</h1>
                        <p>Verify and process student reward vouchers</p>
                    </div>
                    <div className="a-header-right">
                        <div className="a-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="a-user-info" style={{ textAlign: 'right' }}>
                                <span className="a-user-name" style={{ display: 'block', fontWeight: 900, fontSize: '1rem' }}>{currentUser?.name}</span>
                                <span className="role-badge staff">Staff Personnel</span>
                            </div>
                            <div className="u-avatar staff" style={{ width: '44px', height: '44px', fontWeight: 900 }}>
                                {currentUser?.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="a-content">
                    {activeTab === 'search' ? (
                        <div className="search-central-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
                            <div className="search-hero-card glass-card" style={{ 
                                width: '100%', 
                                maxWidth: '600px', 
                                padding: '3rem', 
                                background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
                                borderRadius: '24px',
                                boxShadow: '0 20px 40px rgba(5, 150, 105, 0.2)',
                                textAlign: 'center',
                                color: 'white'
                            }}>
                                <div className="a-logo" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                                    <Search size={32} />
                                </div>
                                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Voucher Verification</h2>
                                <p style={{ opacity: 0.9, marginBottom: '2.5rem' }}>Enter the 6-digit student verification code to process reward</p>
                                
                                <form onSubmit={handleQuickSearch} style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Code (e.g. 4YBDDT)"
                                        value={quickCode}
                                        onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                        style={{ 
                                            width: '100%',
                                            padding: '1.25rem 2rem', 
                                            borderRadius: '16px', 
                                            border: 'none', 
                                            fontWeight: 900, 
                                            fontSize: '1.5rem',
                                            letterSpacing: '4px',
                                            textAlign: 'center',
                                            color: '#1e293b',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <button 
                                        type="submit"
                                        className="a-submit-btn"
                                        style={{ 
                                            width: '100%', 
                                            marginTop: '1.5rem', 
                                            padding: '1.25rem', 
                                            background: '#10b981', 
                                            color: 'white', 
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            borderRadius: '16px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        VERIFY STUDENT CODE
                                    </button>
                                </form>

                                {foundRedemption && (
                                    <div className="search-result-overlay animate-scale-in" style={{ marginTop: '2.5rem', background: 'white', borderRadius: '20px', padding: '2rem', color: '#1e293b', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div className="u-avatar student" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                                                    {foundRedemption.studentName.charAt(0)}
                                                </div>
                                                <div>
                                                    <strong style={{ display: 'block', fontSize: '1.25rem' }}>{foundRedemption.studentName}</strong>
                                                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Redemption Request</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setFoundRedemption(null)} style={{ background: '#f1f5f9', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                                                ✕
                                            </button>
                                        </div>
                                        
                                        {/* Standardized Coupon UI for the result */}
                                        <div className="coupon-card" style={{ marginBottom: '1.5rem' }}>
                                            <div className="coupon-left">
                                                <div className="coupon-value">{foundRedemption.aedValue}</div>
                                                <div className="coupon-currency">AED</div>
                                            </div>
                                            <div className="coupon-divider"></div>
                                            <div className="coupon-right">
                                                <div className="coupon-info">
                                                    <h3 className="coupon-title">{foundRedemption.voucherName}</h3>
                                                    <p className="coupon-cost">Code: {foundRedemption.code}</p>
                                                </div>
                                                <div className="coupon-status">
                                                    <span className={`role-badge ${foundRedemption.status.toLowerCase()}`} style={{ padding: '0.4rem 0.8rem' }}>{foundRedemption.status}</span>
                                                </div>
                                            </div>
                                            <div className="coupon-punch-top"></div>
                                            <div className="coupon-punch-bottom"></div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Request Date:</span>
                                                <span style={{ fontWeight: 700 }}>{new Date(foundRedemption.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            {foundRedemption.status === 'Pending' && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
                                                    <span style={{ 
                                                        fontWeight: 700, 
                                                        color: isExpired(foundRedemption.timestamp) ? '#ef4444' : '#10b981' 
                                                    }}>
                                                        {isExpired(foundRedemption.timestamp) ? 'EXPIRED' : 'VALID'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {foundRedemption.status === 'Pending' ? (
                                            <button 
                                                onClick={() => handleMarkAsUsed(foundRedemption)}
                                                className={`a-submit-btn ${isExpired(foundRedemption.timestamp) ? 'bg-gray-400' : 'accent-gradient'}`}
                                                style={{ 
                                                    width: '100%', 
                                                    margin: 0, 
                                                    padding: '1.25rem', 
                                                    fontWeight: 900, 
                                                    fontSize: '1.1rem', 
                                                    borderRadius: '12px',
                                                    cursor: isExpired(foundRedemption.timestamp) ? 'not-allowed' : 'pointer',
                                                    opacity: isExpired(foundRedemption.timestamp) ? 0.6 : 1
                                                }}
                                                disabled={isExpired(foundRedemption.timestamp)}
                                            >
                                                {isExpired(foundRedemption.timestamp) ? 'EXPIRED VOUCHER' : 'CONFIRM & COMPLETE REDEMPTION'}
                                            </button>
                                        ) : (
                                            <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '1.25rem', color: '#059669', fontWeight: 800, textAlign: 'center', border: '1px solid #10b981' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                                    <CheckCircle size={24} />
                                                    VOUCHER REDEEMED
                                                </div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                                    Processed by {foundRedemption.processedBy} on {new Date(foundRedemption.processedAt!).toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="a-card glass-card animate-fade-in">
                            <div className="a-card-head" style={{ justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Clock className="text-green" />
                                    <h2>Redemption History</h2>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="a-search" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '300px' }}>
                                        <Search size={18} style={{ color: '#94a3b8' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Search past redemptions..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ background: 'none', border: 'none', outline: 'none', fontWeight: 700, width: '100%', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="a-table-container">
                                <table className="a-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Voucher</th>
                                            <th>Value</th>
                                            <th>Code</th>
                                            <th>Requested Date</th>
                                            <th>Processed Date</th>
                                            <th style={{ textAlign: 'right' }}>Staff Member</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem' }}>
                                                    <div className="loader-container">
                                                        <div className="spinner-large" style={{ margin: '0 auto' }}></div>
                                                        <p style={{ marginTop: '1.5rem', fontWeight: 800, color: '#64748b' }}>Loading History...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : historyRedemptions.filter(r => 
                                            r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            r.code.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).length > 0 ? (
                                            historyRedemptions.filter(r => 
                                                r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                r.code.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map(r => (
                                                <tr key={r.id}>
                                                    <td>
                                                        <div className="u-cell">
                                                            <div className="u-avatar student" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                                                {r.studentName.charAt(0)}
                                                            </div>
                                                            <strong>{r.studentName}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="role-badge student" style={{ background: '#f0f9ff', color: '#0369a1' }}>{r.voucherName}</span>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: '#059669' }}>{r.aedValue} AED</strong>
                                                    </td>
                                                    <td>
                                                        <code style={{ background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', fontWeight: 800, letterSpacing: '1px' }}>{r.code}</code>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(r.timestamp).toLocaleDateString()}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(r.timestamp).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(r.processedAt!).toLocaleDateString()}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(r.processedAt!).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <div className="u-avatar staff" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>{r.processedBy?.charAt(0) || 'S'}</div>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.processedBy || 'Staff'}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem' }}>
                                                    <div className="no-data">
                                                        <Clock size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                                        <p style={{ fontWeight: 800, color: '#64748b' }}>No redemption history found.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
