'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import DemoManager from '@/lib/demo-manager';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/lib/contexts/AuthContext';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function SettingsPage() {
    const { logout } = useAuth();
    const [isDemoMode, setIsDemoMode] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setIsDemoMode(DemoManager.isEnabled);
        setMounted(true);
    }, []);

    const toggleDemoMode = () => {
        DemoManager.setMode(!isDemoMode);
        setIsDemoMode(!isDemoMode);
    };

    const isDark = theme === 'dark';

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Settings" backHref="/" />

            <motion.div
                className="px-5 pb-28 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {/* Account Section */}
                <motion.section variants={itemVariants}>
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2 ml-1">Account</p>
                    <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm overflow-hidden">
                        <Link href="/profile" className="flex items-center gap-3 p-4 border-b-2 border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-card-blue rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">person</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark dark:text-white text-sm">Profile</p>
                                <p className="text-[10px] text-dark/50 dark:text-white/50">View and edit</p>
                            </div>
                            <span className="material-symbols-outlined text-dark/30 dark:text-white/30 text-lg">chevron_right</span>
                        </Link>
                        <Link href="/my-listings" className="flex items-center gap-3 p-4 border-b-2 border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-primary rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">inventory_2</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark dark:text-white text-sm">My Listings</p>
                                <p className="text-[10px] text-dark/50 dark:text-white/50">View and manage</p>
                            </div>
                            <span className="material-symbols-outlined text-dark/30 dark:text-white/30 text-lg">chevron_right</span>
                        </Link>
                        <Link href="/notifications" className="flex items-center gap-3 p-4">
                            <div className="w-10 h-10 bg-card-pink rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">notifications</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark dark:text-white text-sm">Notifications</p>
                                <p className="text-[10px] text-dark/50 dark:text-white/50">Manage alerts</p>
                            </div>
                            <span className="material-symbols-outlined text-dark/30 dark:text-white/30 text-lg">chevron_right</span>
                        </Link>
                    </div>
                </motion.section>

                {/* Appearance Section */}
                <motion.section variants={itemVariants}>
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2 ml-1">Appearance</p>
                    <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-card-blue rounded-xl border-2 border-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-dark">
                                {mounted && isDark ? 'dark_mode' : 'light_mode'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-dark dark:text-white text-sm">Dark Mode</p>
                            <p className="text-[10px] text-dark/50 dark:text-white/50">
                                {mounted ? (isDark ? 'On' : 'Off') : '...'}
                            </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mounted && isDark}
                                onChange={() => setTheme(isDark ? 'light' : 'dark')}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 border-2 border-dark rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-1 after:left-1 after:bg-dark after:border-2 after:border-dark after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6 peer-checked:after:bg-white peer-checked:after:border-white" />
                        </label>
                    </div>
                </motion.section>

                {/* Developer Section - Only visible when demo mode is enabled */}
                {isDemoMode && (
                    <motion.section variants={itemVariants}>
                        <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2 ml-1">Developer</p>
                        <div className="bg-card-yellow rounded-2xl border-2 border-dark shadow-brutal-sm p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">science</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark text-sm">Demo Mode</p>
                                <p className="text-[10px] text-dark/50">Mock data only</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDemoMode}
                                    onChange={toggleDemoMode}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-white border-2 border-dark rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-1 after:left-1 after:bg-dark after:border-2 after:border-dark after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6 peer-checked:after:bg-white peer-checked:after:border-white" />
                            </label>
                        </div>
                    </motion.section>
                )}

                {/* About Section */}
                <motion.section variants={itemVariants}>
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2 ml-1">About</p>
                    <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm overflow-hidden">
                        <Link href="/help" className="flex items-center gap-3 p-4 border-b-2 border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-card-green rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">help</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark dark:text-white text-sm">Help & Support</p>
                                <p className="text-[10px] text-dark/50 dark:text-white/50">FAQ & contact</p>
                            </div>
                            <span className="material-symbols-outlined text-dark/30 dark:text-white/30 text-lg">chevron_right</span>
                        </Link>
                        <Link href="/privacy" className="flex items-center gap-3 p-4 border-b-2 border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-card-blue rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">privacy_tip</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark dark:text-white text-sm">Privacy Policy</p>
                                <p className="text-[10px] text-dark/50 dark:text-white/50">Your data rights</p>
                            </div>
                            <span className="material-symbols-outlined text-dark/30 dark:text-white/30 text-lg">chevron_right</span>
                        </Link>
                        <div className="flex items-center gap-3 p-4">
                            <div className="w-10 h-10 bg-card-yellow rounded-xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-dark">info</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-dark dark:text-white text-sm">Version</p>
                                <p className="text-[10px] text-dark/50 dark:text-white/50">2.0.0 (Next.js)</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Logout */}
                <motion.div variants={itemVariants}>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to log out?')) {
                                await logout();
                                window.location.href = '/login';
                            }
                        }}
                        className="w-full bg-card-coral rounded-2xl border-2 border-dark shadow-brutal-sm p-4 flex items-center gap-3 active:scale-95 transition-transform"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl border-2 border-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-dark">logout</span>
                        </div>
                        <p className="font-bold text-dark">Log Out</p>
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
