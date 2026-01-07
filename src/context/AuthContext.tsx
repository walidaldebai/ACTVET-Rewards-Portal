import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
        // Check for persistent local admin session first
        const savedAdmin = localStorage.getItem('actvet_admin_session');
        if (savedAdmin) {
            setCurrentUser(JSON.parse(savedAdmin));
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                // Check domain
                if (!fbUser.email?.endsWith('@actvet.gov.ae')) {
                    await signOut(auth);
                    setCurrentUser(null);
                    setLoading(false);
                    return;
                }

                // Fetch additional user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'Users', fbUser.uid));
                    if (userDoc.exists()) {
                        setCurrentUser({
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName || 'User',
                            ...userDoc.data(),
                        } as User);
                    } else {
                        setCurrentUser({
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName || 'User',
                            role: 'Student',
                        } as User);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const setAdminUser = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('actvet_admin_session', JSON.stringify(user));
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
