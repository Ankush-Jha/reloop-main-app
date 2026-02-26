'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
import DemoManager from '@/lib/demo-manager';
import { PageHeader } from '@/components/ui/PageHeader';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

interface LeaderboardEntry {
    rank: number;
    name: string;
    avatar: string;
    xp: number;
    co2Saved: number;
}

export default function LeaderboardPage() {
    const { user, isDemo, isLoading: authLoading } = useAuth();
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

    useEffect(() => {
        if (authLoading) return;

        const loadLeaderboard = async () => {
            setIsLoading(true);
            try {
                if (isDemo) {
                    // Demo mode - use mock data
                    const mockLeaders = DemoManager.getLeaderboard();
                    if (user) {
                        const userEntry = {
                            rank: 4,
                            name: user.name || 'You',
                            avatar: user.avatar || 'https://ui-avatars.com/api/?name=You',
                            xp: user.xp || 0,
                            co2Saved: user.co2Saved || 0
                        };
                        setLeaders([...mockLeaders, userEntry].sort((a, b) => b.xp - a.xp).map((l, i) => ({ ...l, rank: i + 1 })));
                    } else {
                        setLeaders(mockLeaders);
                    }
                } else {
                    // Firebase mode
                    const firebaseLeaders = await DBService.getLeaderboard(20);
                    if (firebaseLeaders.length > 0) {
                        setLeaders(firebaseLeaders);
                    } else {
                        // Fallback to demo data if Firebase is empty
                        setLeaders(DemoManager.getLeaderboard());
                    }
                }
            } catch (error) {
                console.error('Error loading leaderboard:', error);
                setLeaders(DemoManager.getLeaderboard());
            }
            setIsLoading(false);
        };
        loadLeaderboard();
    }, [authLoading, isDemo, user]);

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-dark';
            case 2: return 'bg-gradient-to-br from-gray-300 to-gray-400 text-dark';
            case 3: return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
            default: return 'bg-gray-100 dark:bg-dark-surface text-dark dark:text-white';
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader title="Leaderboard" backHref="/" />

            <motion.div
                className="px-5 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {/* Timeframe Selector */}
                <motion.div variants={itemVariants} className="flex gap-2">
                    {(['week', 'month', 'all'] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all ${timeframe === tf
                                ? 'bg-primary border-dark text-dark'
                                : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 text-dark/60 dark:text-white/60'
                                }`}
                        >
                            {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
                        </button>
                    ))}
                </motion.div>

                {/* Top 3 Podium */}
                <motion.div variants={itemVariants} className="flex justify-center items-end gap-3 py-6">
                    {leaders.slice(0, 3).map((leader, idx) => {
                        const order = [1, 0, 2]; // Display order: 2nd, 1st, 3rd
                        const actualLeader = leaders[order[idx]];
                        if (!actualLeader) return null;

                        const heights = ['h-24', 'h-32', 'h-20'];
                        return (
                            <div key={actualLeader.rank} className="flex flex-col items-center">
                                <img
                                    src={actualLeader.avatar}
                                    alt={actualLeader.name}
                                    className={`w-16 h-16 rounded-full border-4 ${actualLeader.rank === 1 ? 'border-yellow-400' :
                                        actualLeader.rank === 2 ? 'border-gray-300' : 'border-amber-600'
                                        } shadow-lg mb-2`}
                                />
                                <p className="font-bold text-sm text-dark dark:text-white truncate max-w-[80px]">
                                    {actualLeader.name}
                                </p>
                                <p className="text-xs text-dark/60 dark:text-white/60">{actualLeader.xp} XP</p>
                                <div className={`${heights[idx]} w-20 ${getRankStyle(actualLeader.rank)} rounded-t-xl mt-2 flex items-start justify-center pt-2`}>
                                    <span className="text-2xl">{getRankIcon(actualLeader.rank)}</span>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Full Rankings */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <h3 className="font-bold text-dark dark:text-white ml-1">Full Rankings</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        leaders.map((leader) => (
                            <div
                                key={leader.rank}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 ${user?.name === leader.name
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${getRankStyle(leader.rank)}`}>
                                    {leader.rank <= 3 ? getRankIcon(leader.rank) : leader.rank}
                                </div>
                                <img
                                    src={leader.avatar}
                                    alt={leader.name}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-dark dark:text-white truncate">
                                        {leader.name} {user?.name === leader.name && <span className="text-primary">(You)</span>}
                                    </p>
                                    <p className="text-xs text-dark/60 dark:text-white/60">
                                        {leader.co2Saved}kg CO₂ saved
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-primary">{leader.xp}</p>
                                    <p className="text-xs text-dark/60 dark:text-white/60">XP</p>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
