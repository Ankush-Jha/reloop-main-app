'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { auth } from '@/lib/firebase/client';
import { DBService } from '@/lib/firebase/db';
import { onAuthStateChanged } from 'firebase/auth';
import DemoManager from '@/lib/demo-manager';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isDemo: boolean;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    refreshUser: () => void;
    enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isDemo: false,
    logout: () => { },
    updateProfile: async () => { },
    refreshUser: () => { },
    enableDemoMode: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

    // Function to refresh user data (for admin updates)
    const refreshUser = useCallback(async () => {
        if (isDemo) {
            setUser({ ...DemoManager.getMockUser() });
        } else if (firebaseUid) {
            const profile = await DBService.getUserProfile(firebaseUid);
            if (profile) setUser(profile);
        }
    }, [isDemo, firebaseUid]);

    const enableDemoMode = useCallback(() => {
        localStorage.setItem('isDemoMode', 'true');
        setIsDemo(true);
        setUser({ ...DemoManager.getMockUser() });
    }, []);

    // Listen to Firebase Auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Real Firebase user
                setIsDemo(false);
                localStorage.removeItem('isDemoMode');
                setFirebaseUid(firebaseUser.uid);

                try {
                    const profile = await DBService.getUserProfile(firebaseUser.uid);
                    if (profile) {
                        setUser(profile);
                    } else {
                        // Fallback if Firestore doc missing
                        setUser({
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName || 'User',
                            email: firebaseUser.email || '',
                            avatar: firebaseUser.photoURL || '',
                            level: 1,
                            coins: 0,
                            xp: 0,
                            levelTitle: 'Seedling',
                            itemsTraded: 0,
                            co2Saved: 0,
                            badges: []
                        });
                    }
                } catch (e) {
                    console.error("Error fetching user profile", e);
                }
            } else {
                // No Firebase user - check if we should be in demo mode
                setFirebaseUid(null);
                const storedDemo = localStorage.getItem('isDemoMode');
                if (storedDemo === 'true') {
                    setIsDemo(true);
                    setUser({ ...DemoManager.getMockUser() });
                } else {
                    setIsDemo(false);
                    setUser(null);
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Real-time subscription to user profile (Firebase only)
    useEffect(() => {
        if (!firebaseUid || isDemo) return;

        console.log('[AuthContext] Subscribing to user profile:', firebaseUid);

        const unsubscribe = DBService.subscribeToUserProfile(firebaseUid, (profile) => {
            if (profile) {
                console.log('[AuthContext] User profile updated:', profile.name, 'coins:', profile.coins);
                setUser(profile);
            }
        });

        return () => {
            console.log('[AuthContext] Unsubscribing from user profile');
            unsubscribe();
        };
    }, [firebaseUid, isDemo]);

    // Subscribe to DemoManager updates for demo mode
    useEffect(() => {
        if (!isDemo) return;

        console.log('[AuthContext] Subscribing to DemoManager updates');

        const unsubscribe = DemoManager.subscribe((updatedUser) => {
            console.log('[AuthContext] Received update from DemoManager:', updatedUser.name);
            setUser({ ...updatedUser });
        });

        return () => {
            console.log('[AuthContext] Unsubscribing from DemoManager');
            unsubscribe();
        };
    }, [isDemo]);

    const logout = async () => {
        if (isDemo) {
            localStorage.removeItem('isDemoMode');
            setIsDemo(false);
            setUser(null);
            DemoManager.resetAll();
        } else {
            await auth.signOut();
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;

        if (isDemo) {
            DemoManager.adminUpdateUser(data);
        } else {
            try {
                await DBService.updateUserProfile(user.uid, data);
                // Profile will be updated via real-time subscription
            } catch (e) {
                console.error("Error updating profile", e);
                throw e;
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isDemo, logout, updateProfile, refreshUser, enableDemoMode }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
