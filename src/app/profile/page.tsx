'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { PageHeader } from '@/components/ui/PageHeader';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { BadgeRevealModal } from '@/components/ui/BadgeRevealModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { formatRupeeValue } from '@/lib/eco-coins';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const BADGE_META: Record<string, { name: string; description: string; icon: string; color: string }> = {
    'early-adopter': { name: 'Early Adopter', description: 'Joined ReLoop in the early days!', icon: '🌟', color: '#4ce68a' },
    'eco-warrior': { name: 'Eco Warrior', description: 'Saved over 10kg of CO2', icon: '🌿', color: '#dcfce7' },
    'first-trade': { name: 'First Trade', description: 'Completed your first successful trade', icon: '🤝', color: '#fde047' },
    'streak-7': { name: 'On Fire', description: 'Logged in 7 days in a row', icon: '🔥', color: '#fb923c' }
};

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [streak, setStreak] = useState(1);
    const [showBadgeReveal, setShowBadgeReveal] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        // Keep independent streak logic for now if it's separate in DemoManager
        setStreak(user?.badges?.length || 1);
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSaveProfile = async (data: any) => {
        await updateProfile(data);
        setToast('Profile Updated!');
        setTimeout(() => setToast(''), 2000);
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                title="Profile"
                backHref="/"
                rightAction={
                    <Link href="/settings" className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm">
                        <span className="material-symbols-outlined text-dark dark:text-white">settings</span>
                    </Link>
                }
            />

            <motion.div
                className="px-5 pb-28 space-y-4"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Profile Card - Compact */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark shadow-brutal p-5 flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-dark overflow-hidden bg-gray-200">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full border-2 border-dark flex items-center justify-center">
                            <span className="text-sm font-black text-dark">{user.level}</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-dark dark:text-white">{user.name}</h2>
                            <StreakBadge streak={streak} />
                        </div>
                        <p className="text-dark/50 dark:text-white/50 font-medium text-sm">{user.levelTitle}</p>
                        {/* XP Progress inline */}
                        <div className="mt-2">
                            <div className="h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden border border-dark/20">
                                <div className="h-full bg-primary" style={{ width: `${(user.xp % 500) / 5}%` }} />
                            </div>
                            <p className="text-[10px] text-dark/40 dark:text-white/40 font-bold mt-1">{500 - (user.xp % 500)} XP to Level {user.level + 1}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats - 3 Column */}
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
                    <Link href="/impact" className="bg-card-green rounded-xl border-2 border-dark shadow-brutal-sm p-3 text-center block transition-transform active:scale-95 hover:scale-105">
                        <p className="text-xl font-black text-dark dark:text-gray-900">{user.co2Saved}</p>
                        <p className="text-[10px] font-bold text-dark/60 dark:text-gray-900/70">kg CO₂</p>
                    </Link>
                    <Link href="/trade-history" className="bg-card-yellow rounded-xl border-2 border-dark shadow-brutal-sm p-3 text-center block transition-transform active:scale-95 hover:scale-105">
                        <p className="text-xl font-black text-dark dark:text-gray-900">{user.itemsTraded}</p>
                        <p className="text-[10px] font-bold text-dark/60 dark:text-gray-900/70">Items</p>
                    </Link>
                    <Link href="/rewards" className="bg-card-pink rounded-xl border-2 border-dark shadow-brutal-sm p-3 text-center block transition-transform active:scale-95 hover:scale-105">
                        <p className="text-xl font-black text-dark dark:text-gray-900">{user.coins}</p>
                        <p className="text-[10px] font-bold text-dark/60 dark:text-gray-900/70">{formatRupeeValue(user.coins)}</p>
                    </Link>
                </motion.div>

                {/* Badges - Horizontal scroll */}
                <motion.div variants={itemVariants}>
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2 ml-1">Badges Earned</p>
                    <div className="bg-white dark:bg-dark-surface rounded-xl border-2 border-dark shadow-brutal-sm p-3">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {user.badges.map((badgeId) => {
                                const meta = BADGE_META[badgeId] || { name: badgeId, icon: '🏆', color: '#e5e7eb', description: 'Badge' };
                                return (
                                    <button
                                        key={badgeId}
                                        onClick={() => { setSelectedBadge({ id: badgeId, ...meta }); setShowBadgeReveal(true); }}
                                        className="w-12 h-12 rounded-xl border-2 border-dark flex items-center justify-center shrink-0 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: meta.color }}
                                    >
                                        <span className="text-xl">{meta.icon}</span>
                                    </button>
                                );
                            })}

                            {/* Locked Badge Slots */}
                            <button
                                onClick={() => {
                                    setSelectedBadge({
                                        name: "Locked Badge",
                                        description: "Keep trading and saving CO₂ to unlock this mystery badge! 🚀",
                                        icon: "🔒",
                                        color: "#f3f4f6"
                                    });
                                    setShowBadgeReveal(true);
                                }}
                                className="w-12 h-12 bg-gray-100 dark:bg-dark-bg rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                            >
                                <span className="text-gray-300 dark:text-gray-500 text-xl">?</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedBadge({
                                        name: "Locked Badge",
                                        description: "Complete daily missions to reveal this badge!",
                                        icon: "🔒",
                                        color: "#f3f4f6"
                                    });
                                    setShowBadgeReveal(true);
                                }}
                                className="w-12 h-12 bg-gray-100 dark:bg-dark-bg rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                            >
                                <span className="text-gray-300 dark:text-gray-500 text-xl">?</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Links - 4-Column Icon Grid */}
                <motion.div variants={itemVariants}>
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2 ml-1">Quick Links</p>
                    <div className="grid grid-cols-4 gap-2">

                        <Link href="/trade-history" className="bg-card-yellow rounded-xl border-2 border-dark shadow-brutal-sm p-3 flex flex-col items-center gap-1 hover:-translate-y-1 transition-transform">
                            <span className="material-symbols-outlined text-xl text-dark">history</span>
                            <span className="text-[10px] font-[800] text-dark uppercase">Trades</span>
                        </Link>
                        <Link href="/messages" className="bg-card-blue rounded-xl border-2 border-dark shadow-brutal-sm p-3 flex flex-col items-center gap-1 hover:-translate-y-1 transition-transform">
                            <span className="material-symbols-outlined text-xl text-dark">chat</span>
                            <span className="text-[10px] font-[800] text-dark uppercase">Chat</span>
                        </Link>
                        <Link href="/rewards" className="bg-card-pink rounded-xl border-2 border-dark shadow-brutal-sm p-3 flex flex-col items-center gap-1 hover:-translate-y-1 transition-transform">
                            <span className="material-symbols-outlined text-xl text-dark">redeem</span>
                            <span className="text-[10px] font-[800] text-dark uppercase">Rewards</span>
                        </Link>
                        <Link href="/impact" className="bg-card-green rounded-xl border-2 border-dark shadow-brutal-sm p-3 flex flex-col items-center gap-1 hover:-translate-y-1 transition-transform">
                            <span className="material-symbols-outlined text-xl text-dark">eco</span>
                            <span className="text-[10px] font-[800] text-dark uppercase">Impact</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Actions Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="bg-dark text-white py-3 rounded-xl font-bold shadow-brutal-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit Profile
                    </button>
                    <button
                        onClick={() => {
                            const text = `I've saved ${user.co2Saved}kg CO₂ on ReLoop! 🌱`;
                            navigator.clipboard.writeText(text);
                            setToast('Copied!');
                            setTimeout(() => setToast(''), 2000);
                        }}
                        className="bg-card-yellow text-dark py-3 rounded-xl font-bold border-2 border-dark shadow-brutal-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-lg">share</span>
                        Share
                    </button>
                </motion.div>
            </motion.div>

            {/* Badge Modal */}
            {
                selectedBadge && (
                    <BadgeRevealModal
                        isOpen={showBadgeReveal}
                        onClose={() => setShowBadgeReveal(false)}
                        badge={selectedBadge}
                    />
                )
            }

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <EditProfileModal
                        user={user}
                        onClose={() => setShowEditModal(false)}
                        onSave={handleSaveProfile}
                    />
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-dark text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl z-50"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
