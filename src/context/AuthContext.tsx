import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';
import { auth, db } from '../lib/firebase';
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
                    } else {
                        await signOut(auth);
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error("Auth: Error fetching user data:", error);
                    setCurrentUser(null);
                }
            } else {
                // If Firebase user is gone, only keep the session if it's a persisted Admin session
                setCurrentUser(prev => {
                    const isManualAdmin = localStorage.getItem('actvet_admin_session');
                    if (isManualAdmin && prev?.role === 'Admin') {
                        return prev;
                    }
                    return null;
                });
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
            {!loading && children}
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
