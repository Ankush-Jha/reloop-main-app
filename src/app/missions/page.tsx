'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
import { PageHeader } from '@/components/ui/PageHeader';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

interface Mission {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    progress: number;
    target: number;
    completed: boolean;
    claimed: boolean;
    type: 'daily';
}

export default function MissionsPage() {
    const { user, isLoading: authLoading, isDemo } = useAuth();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    // Fetch missions from Firebase
    useEffect(() => {
        async function fetchMissions() {
            if (authLoading) return;

            if (user?.uid && !isDemo) {
                try {
                    const data = await DBService.getDailyMissions(user.uid);
                    setMissions(data);
                } catch (error) {
                    console.error('Error fetching missions:', error);
                }
            } else {
                // Demo mode: show sample missions
                setMissions([
                    { id: 'daily-login', title: 'Daily Check-in', description: 'Log in to the app today', icon: 'login', xpReward: 10, progress: 1, target: 1, completed: true, claimed: false, type: 'daily' },
                    { id: 'daily-scan', title: 'Scan 3 Items', description: 'Use the scanner to identify 3 items', icon: 'qr_code_scanner', xpReward: 30, progress: 2, target: 3, completed: false, claimed: false, type: 'daily' },
                    { id: 'daily-trade', title: 'Complete a Trade', description: 'Buy or sell an item on marketplace', icon: 'swap_horiz', xpReward: 50, progress: 0, target: 1, completed: false, claimed: false, type: 'daily' },
                    { id: 'daily-bag', title: 'Fill a Smart Bag', description: 'Fill and mark a smart bag as ready', icon: 'shopping_bag', xpReward: 40, progress: 0, target: 1, completed: false, claimed: false, type: 'daily' },
                ]);
            }
            setIsLoading(false);
        }
        fetchMissions();
    }, [user, authLoading, isDemo]);

    // Claim reward handler
    const handleClaim = async (missionId: string) => {
        if (!user?.uid || isDemo) return;

        setClaiming(missionId);
        try {
            const result = await DBService.claimDailyMissionReward(user.uid, missionId);
            if (result.success) {
                // Update local state
                setMissions(prev => prev.map(m =>
                    m.id === missionId ? { ...m, claimed: true } : m
                ));
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
        }
        setClaiming(null);
    };

    const completedCount = missions.filter(m => m.completed).length;
    const totalXP = missions.filter(m => m.completed).reduce((sum, m) => sum + m.xpReward, 0);

    // Calculate time until daily reset (midnight)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
    const minsLeft = Math.floor(((midnight.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader title="Daily Missions" backHref="/" />

            <motion.div
                className="px-5 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {/* Progress Summary */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary to-green-400 rounded-2xl border-2 border-dark shadow-brutal p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-dark/70">Today's Progress</p>
                            <p className="text-3xl font-black text-dark">{completedCount}/{missions.length}</p>
                            <p className="text-xs text-dark/60">missions completed</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-dark/70">XP Earned</p>
                            <p className="text-3xl font-black text-dark">+{totalXP}</p>
                        </div>
                    </div>
                    {/* Reset timer */}
                    <div className="mt-3 pt-3 border-t border-dark/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-dark/60 text-sm">schedule</span>
                        <p className="text-xs text-dark/70">Resets in {hoursLeft}h {minsLeft}m</p>
                    </div>
                </motion.div>

                {/* Missions List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <motion.div variants={itemVariants} className="space-y-3">
                        {missions.map((mission) => (
                            <div
                                key={mission.id}
                                className={`bg-white dark:bg-dark-surface rounded-xl border-2 ${mission.completed
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                    } shadow-brutal-sm p-4`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mission.completed
                                        ? 'bg-green-500 text-white'
                                        : 'bg-card-blue text-dark'
                                        }`}>
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: mission.completed ? "'FILL' 1" : undefined }}>
                                            {mission.completed ? 'check_circle' : mission.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold ${mission.completed ? 'line-through text-dark/50 dark:text-white/50' : 'text-dark dark:text-white'}`}>
                                                {mission.title}
                                            </p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-600">
                                                daily
                                            </span>
                                        </div>
                                        <p className="text-xs text-dark/60 dark:text-white/60 mt-0.5">{mission.description}</p>

                                        {/* Progress Bar */}
                                        {!mission.completed && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-dark/60 dark:text-white/60">{mission.progress}/{mission.target}</span>
                                                    <span className="text-dark/60 dark:text-white/60">{Math.round((mission.progress / mission.target) * 100)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Rewards - XP only */}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs font-bold text-amber-600">+{mission.xpReward} XP</span>

                                            {/* Claim button */}
                                            {mission.completed && !mission.claimed && (
                                                <button
                                                    onClick={() => handleClaim(mission.id)}
                                                    disabled={claiming === mission.id}
                                                    className="px-3 py-1 bg-primary text-dark text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {claiming === mission.id ? 'Claiming...' : 'Claim XP'}
                                                </button>
                                            )}
                                            {mission.claimed && (
                                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    Claimed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Info box */}
                <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">Daily Missions</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                Missions reset every day at midnight. Complete all to earn bonus XP and level up faster!
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
