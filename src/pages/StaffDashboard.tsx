import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { ref, onValue, update, query, orderByChild } from 'firebase/database';
import { LogOut, Ticket, CheckCircle, Clock, Search, Menu } from 'lucide-react';
import type { Redemption } from '../types';
import '../styles/AdminDashboard.css';


const StaffDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
    const [quickCode, setQuickCode] = useState('');
    const [foundRedemption, setFoundRedemption] = useState<Redemption | null>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024 && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (window.innerWidth > 1024 && !isSidebarOpen) {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

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

    // Auto-lookup effect for "work like it used to" behavior
    useEffect(() => {
        if (!quickCode) {
            setFoundRedemption(null);
            return;
        }

        // Exact match check
        const codeToSearch = quickCode.trim().toUpperCase();

        // Double check against normalized just in case, but user said "100% matches"
        // Let's stick to strict UPPER case comparison as codes are usually stored UPPER
        const strictFound = redemptions.find(r => r.code && r.code.toUpperCase() === codeToSearch);

        if (strictFound) {
            setFoundRedemption(strictFound);
        } else {
            setFoundRedemption(null);
        }
    }, [quickCode, redemptions]);

    const handleQuickSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const codeToSearch = quickCode.trim().toUpperCase();
        if (!codeToSearch) return;

        if (loading) {
            alert('Wait for registry to synchronize...');
            return;
        }

        const found = redemptions.find(r => r.code && r.code.toUpperCase() === codeToSearch);
        if (found) {
            setFoundRedemption(found);
        } else {
            setFoundRedemption(null);
            alert(`No active redemption found for code: ${codeToSearch}`);
        }
    };

    const historyRedemptions = redemptions.filter(r => r.status === 'Used');

    return (
        <div className={`admin-app ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
            {/* Background Liquid Glows */}
            <div className="liquid-blob blob-1"></div>
            <div className="liquid-blob blob-2"></div>
            <div className="liquid-blob blob-3"></div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="p-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1500,
                        display: window.innerWidth <= 1024 ? 'block' : 'none'
                    }}
                ></div>
            )}

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
                        <Search size={20} />
                        <span>Search by Code</span>
                    </button>
                    <button
                        className={activeTab === 'history' ? 'active' : ''}
                        onClick={() => setActiveTab('history')}
                    >
                        <Clock size={20} />
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
                    <div className="a-h-titles" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-toggle-btn"
                            style={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#0f172a',
                                transition: '0.3s',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1>Voucher Redemption</h1>
                            <p>Verify and process student reward vouchers</p>
                        </div>
                    </div>
                    <div className="a-header-right">
                        <div className="a-user-profile">
                            <div className="a-user-info">
                                <span className="a-user-name">{currentUser?.name}</span>
                                <span className="role-badge staff">Staff Personnel</span>
                            </div>
                            <div className="u-avatar staff">
                                {currentUser?.name?.[0] || 'S'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="a-content">
                    {activeTab === 'search' ? (
                        <div className="search-central-view animate-fade-in">
                            <div className="search-hero-card glass-card">
                                <div className="a-logo" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                                    <Search size={32} />
                                </div>
                                <h2>Voucher Verification</h2>
                                <p>Enter the student verification code to process reward</p>

                                <form onSubmit={handleQuickSearch} style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter Code..."
                                        value={quickCode}
                                        onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                                        className="a-input"
                                        style={{
                                            padding: '1.5rem 2rem',
                                            borderRadius: '20px',
                                            fontWeight: 950,
                                            fontSize: '2rem',
                                            letterSpacing: '6px',
                                            textAlign: 'center',
                                            color: '#0f172a',
                                            background: 'white',
                                            boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        className="a-submit-btn"
                                        style={{
                                            width: '100%',
                                            marginTop: '1.5rem',
                                            background: '#10b981',
                                            color: 'white'
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
                                                    {foundRedemption.studentName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <strong style={{ display: 'block', fontSize: '1.25rem' }}>{foundRedemption.studentName || 'Unknown Student'}</strong>
                                                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Redemption Request</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setFoundRedemption(null)} style={{ background: '#f1f5f9', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                                                ✕
                                            </button>
                                        </div>

                                        {/* Standardized Coupon UI for the result */}
                                        {/* Standardized Coupon UI for the result - Matching History Grid */}
                                        <div className="coupon-card" style={{ marginBottom: '1.5rem', minHeight: '120px' }}>
                                            <div className="coupon-left" style={{ background: '#000000', width: '110px', padding: '1rem', color: 'white' }}>
                                                <div className="coupon-value" style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{foundRedemption.aedValue || 0}</div>
                                                <div className="coupon-currency" style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8 }}>AED</div>
                                            </div>
                                            <div className="coupon-divider"></div>
                                            <div className="coupon-right" style={{ flexDirection: 'row', padding: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <h3 className="coupon-title" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{foundRedemption.voucherName || 'Voucher'}</h3>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                                        {foundRedemption.studentName || 'Student'} • {new Date().toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.9rem',
                                                        fontWeight: 800,
                                                        color: '#0f172a',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {foundRedemption.status === 'Pending' ? (isExpired(foundRedemption.timestamp) ? 'EXPIRED' : 'VALID') : 'BOUGHT'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="coupon-punch-top" style={{ left: '98px', background: '#ffffff' }}></div>
                                            <div className="coupon-punch-bottom" style={{ left: '98px', background: '#ffffff' }}></div>
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Request Date:</span>
                                                <span style={{ fontWeight: 700 }}>{foundRedemption.timestamp ? new Date(foundRedemption.timestamp).toLocaleDateString() : 'Date Unknown'}</span>
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
                                                    opacity: isExpired(foundRedemption.timestamp) ? 0.6 : 1,
                                                    color: 'black'
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
                                                    Processed by {foundRedemption.processedBy || 'Staff'} on {foundRedemption.processedAt ? new Date(foundRedemption.processedAt).toLocaleString() : 'Unknown Date'}
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

                            <div className="voucher-coupon-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
                                {loading ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center' }}>
                                        <div className="loader-container">
                                            <div className="spinner-large" style={{ margin: '0 auto' }}></div>
                                            <p style={{ marginTop: '1.5rem', fontWeight: 800, color: '#64748b' }}>Loading History...</p>
                                        </div>
                                    </div>
                                ) : historyRedemptions.filter(r =>
                                    (r.studentName && r.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                    (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()))
                                ).length > 0 ? (
                                    historyRedemptions.filter(r =>
                                        (r.studentName && r.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                        (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()))
                                    ).map(r => (
                                        <div className="coupon-card" key={r.id} style={{ minHeight: '120px' }}>
                                            <div className="coupon-left" style={{ background: '#000000', width: '110px', padding: '1rem', color: 'white' }}>
                                                <div className="coupon-value" style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{r.aedValue}</div>
                                                <div className="coupon-currency" style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8 }}>AED</div>
                                            </div>
                                            <div className="coupon-divider"></div>
                                            <div className="coupon-right" style={{ flexDirection: 'row', padding: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <h3 className="coupon-title" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{r.voucherName}</h3>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{r.studentName} • {new Date(r.timestamp).toLocaleDateString()}</span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.9rem',
                                                        fontWeight: 800,
                                                        color: '#0f172a',
                                                        letterSpacing: '0.05em'
                                                    }}>USED</span>
                                                </div>
                                            </div>
                                            <div className="coupon-punch-top" style={{ left: '98px', background: '#f8fafc' }}></div>
                                            <div className="coupon-punch-bottom" style={{ left: '98px', background: '#f8fafc' }}></div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center' }}>
                                        <div className="no-data">
                                            <Clock size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                            <p style={{ fontWeight: 800, color: '#64748b' }}>No redemption history found.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
