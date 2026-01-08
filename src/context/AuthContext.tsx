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
                    console.log(`Auth: Session detected for ${fbUser.email}. Project: ${auth.app.options.projectId}. Fetching Firestore profile...`);
                    const userDoc = await getDoc(doc(db, 'Users', fbUser.uid));
                    if (userDoc.exists()) {
                        setCurrentUser({
                            id: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName || 'User',
                            ...userDoc.data(),
                        } as User);
                        console.log("Auth: Profile loaded successfully.");
                    } else {
                        // User exists in Auth but not in our Firestore Registry
                        console.error(`Auth Error: UID ${fbUser.uid} not found in Firestore 'Users' collection. Signing out.`);
                        await signOut(auth);
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error("Auth: Error fetching user data:", error);
                    setCurrentUser(null);
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
    };

    const logout = async () => {
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
