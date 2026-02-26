import { create } from 'zustand';
import { User, ScanResult } from '@/types';

interface AppState {
    // User
    user: User | null;
    isLoggedIn: boolean;
    setUser: (user: User | null) => void;

    // Demo Mode
    isDemoMode: boolean;
    setDemoMode: (enabled: boolean) => void;

    // Scan Result
    scanResult: ScanResult | null;
    setScanResult: (result: ScanResult | null) => void;

    // Loading states
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // User
    user: null,
    isLoggedIn: false,
    setUser: (user) => set({ user, isLoggedIn: !!user }),

    // Demo Mode
    isDemoMode: false,
    setDemoMode: (enabled) => set({ isDemoMode: enabled }),

    // Scan Result
    scanResult: null,
    setScanResult: (result) => set({ scanResult: result }),

    // Loading
    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),
}));

export default useAppStore;
