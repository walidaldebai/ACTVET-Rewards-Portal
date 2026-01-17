import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';
import { auth, db, MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    setAdminUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Recover manual admin session from storage if it exists
        const storedAdmin = localStorage.getItem('actvet_admin_session');
        if (storedAdmin && !currentUser) {
            try {
                setCurrentUser(JSON.parse(storedAdmin));
            } catch (e) {
                localStorage.removeItem('actvet_admin_session');
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                // Existing logic for authenticated user
                if (!fbUser.email?.endsWith('@actvet.gov.ae')) {
                    await signOut(auth);
                    setCurrentUser(null);
                    setLoading(false);
                    return;
                }

                try {
                    const dbRef = ref(db);
                    const snapshot = await get(child(dbRef, `Users/${fbUser.uid}`));
                    if (snapshot.exists()) {
                        setCurrentUser({
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName || 'User',
                            ...snapshot.val(),
                        } as User);
                    } else if (fbUser.email === MASTER_ADMIN_EMAIL) {
                        // Master admin might not have a DB record yet, but is valid
                        setCurrentUser({
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: 'Walid (Master Admin)',
                            role: 'Admin'
                        } as User);
                    } else {
                        await signOut(auth);
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error("Auth: Error fetching user data:", error);
                    setCurrentUser(null);
                }
            } else {
                // If Firebase user is gone, try auto-reauth for master admin if session exists
                const storedAdmin = localStorage.getItem('actvet_admin_session');
                if (storedAdmin) {
                    try {
                        const adminData = JSON.parse(storedAdmin);
                        if (adminData.email === MASTER_ADMIN_EMAIL) {
                            console.log("Auth: Detected master admin session, attempting auto-reauth...");
                            await signInWithEmailAndPassword(auth, MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD);
                            // The next onAuthStateChanged cycle will handle the login
                            return;
                        }
                    } catch (e) {
                        localStorage.removeItem('actvet_admin_session');
                    }
                }
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const setAdminUser = (user: User) => {
        localStorage.setItem('actvet_admin_session', JSON.stringify(user));
        setCurrentUser(user);
    };

    const logout = async () => {
        localStorage.removeItem('actvet_admin_session');
        await signOut(auth);
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, logout, setAdminUser }}>
            {loading ? (
                <div className="loading-screen">
                    <div className="loader"></div>
                    <p>Initializing Session...</p>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
