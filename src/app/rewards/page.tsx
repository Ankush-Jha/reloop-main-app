'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import DemoManager from '@/lib/demo-manager';
import { Reward } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const TABS = ['All', 'Vouchers', 'Merch', 'Donate'];

// Generate a QR-like pattern (simplified visual representation)
function QRPattern({ code }: { code: string }) {
    const size = 140;
    const cellSize = 7;
    const cells = [];

    for (let y = 0; y < size / cellSize; y++) {
        for (let x = 0; x < size / cellSize; x++) {
            const hash = (code.charCodeAt(x % code.length) * (y + 1) + x * 13) % 10;
            if (hash > 4 || x < 2 || y < 2 || x > 17 || y > 17) {
                const isCorner = (x < 3 && y < 3) || (x < 3 && y > 16) || (x > 16 && y < 3);
                if (isCorner || hash > 5) {
                    cells.push(
                        <rect
                            key={`${x}-${y}`}
                            x={x * cellSize}
                            y={y * cellSize}
                            width={cellSize - 1}
                            height={cellSize - 1}
                            fill="currentColor"
                        />
                    );
                }
            }
        }
    }

    return (
        <svg width={size} height={size} className="text-dark">
            {cells}
            <rect x="0" y="0" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="5" y="5" width="11" height="11" fill="currentColor" />
            <rect x={size - 21} y="0" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x={size - 16} y="5" width="11" height="11" fill="currentColor" />
            <rect x="0" y={size - 21} width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="5" y={size - 16} width="11" height="11" fill="currentColor" />
        </svg>
    );
}

// Floating particles component for community card
function FloatingParticles({ type }: { type: 'tree' | 'ocean' }) {
    const particles = type === 'tree'
        ? ['🍃', '🌿', '🌱', '✨', '💚']
        : ['🌊', '💧', '🐠', '✨', '💙'];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((emoji, i) => (
                <motion.span
                    key={i}
                    className="absolute text-2xl"
                    initial={{ x: Math.random() * 100 + '%', y: '110%', opacity: 0 }}
                    animate={{ y: '-10%', opacity: [0, 1, 1, 0], x: `${Math.random() * 100}%` }}
                    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                >
                    {emoji}
                </motion.span>
            ))}
        </div>
    );
}

// QR Coupon Modal
function QRCouponModal({ reward, code, onClose }: { reward: Reward; code: string; onClose: () => void }) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-5"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, y: 30, rotateX: 15 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-3xl border-4 border-dark shadow-brutal-lg overflow-hidden"
            >
                {/* Ticket-style Header */}
                <div className="bg-gradient-to-br from-primary via-green-400 to-emerald-500 p-6 text-center relative">
                    <div className="absolute -left-3 top-1/2 w-6 h-6 bg-black/70 rounded-full" />
                    <div className="absolute -right-3 top-1/2 w-6 h-6 bg-black/70 rounded-full" />
                    <motion.span
                        className="text-6xl block mb-3"
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {reward.icon}
                    </motion.span>
                    <h2 className="text-2xl font-black text-dark tracking-tight">{reward.title}</h2>
                    <p className="text-sm text-dark/70 font-bold mt-1">{reward.description}</p>
                </div>

                {/* Dashed Separator */}
                <div className="border-t-2 border-dashed border-dark/20 mx-4" />

                {/* QR Code Section */}
                <div className="p-6 flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
                    <motion.div
                        className="bg-white p-5 rounded-2xl border-3 border-dark shadow-brutal-sm"
                        whileHover={{ scale: 1.02 }}
                    >
                        <QRPattern code={code} />
                    </motion.div>

                    {/* Redemption Code */}
                    <div className="mt-5 w-full bg-gray-100 rounded-2xl px-5 py-4 border-2 border-dashed border-dark/20 text-center">
                        <p className="text-[10px] text-dark/40 font-black uppercase tracking-widest">Your Coupon Code</p>
                        <p className="text-2xl font-mono font-black text-dark tracking-[0.2em] mt-1">{code}</p>
                    </div>

                    {/* Instructions */}
                    <div className="mt-4 flex items-center gap-3 bg-card-blue rounded-xl px-4 py-3 w-full">
                        <span className="material-symbols-outlined text-2xl text-dark">qr_code_scanner</span>
                        <div>
                            <p className="text-sm font-black text-dark">Show at Counter</p>
                            <p className="text-[10px] text-dark/50 font-bold">
                                Valid until {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <div className="p-5 bg-gray-50 border-t-2 border-dark/10">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-dark text-white font-black text-lg rounded-2xl active:scale-[0.98] transition-transform shadow-brutal-sm border-2 border-dark"
                    >
                        Got It! ✓
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Community Story Celebration Modal
function CommunityStoryModal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
    const isTree = reward.title.toLowerCase().includes('tree');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-5"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl border-4 border-dark shadow-brutal-lg overflow-hidden relative"
            >
                {/* Gradient border glow */}
                <motion.div
                    className="absolute -inset-1 rounded-3xl opacity-60 blur-md z-0"
                    style={{ background: isTree ? 'linear-gradient(45deg, #22c55e, #86efac, #22c55e)' : 'linear-gradient(45deg, #3b82f6, #93c5fd, #3b82f6)' }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />

                {/* Card Content */}
                <div className={`relative z-10 ${isTree ? 'bg-gradient-to-b from-green-100 via-green-50 to-white' : 'bg-gradient-to-b from-blue-100 via-blue-50 to-white'}`}>
                    <FloatingParticles type={isTree ? 'tree' : 'ocean'} />

                    {/* Header */}
                    <div className="p-8 text-center relative">
                        <motion.div
                            className="text-8xl mb-4 drop-shadow-lg"
                            animate={{ scale: [1, 1.15, 1], y: [0, -8, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            {reward.icon}
                        </motion.div>

                        <motion.h2
                            className="text-3xl font-black text-dark mb-2 tracking-tight"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            You Did It! 🎉
                        </motion.h2>

                        <motion.p
                            className="text-dark/60 font-bold text-lg"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {reward.description}
                        </motion.p>
                    </div>

                    {/* Story Feature Banner */}
                    <motion.div
                        className={`mx-5 p-5 rounded-2xl border-3 border-dark ${isTree ? 'bg-green-200' : 'bg-blue-200'} shadow-brutal-sm`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl ${isTree ? 'bg-green-500' : 'bg-blue-500'} flex items-center justify-center border-2 border-dark shadow-brutal-sm`}>
                                <span className="material-symbols-outlined text-white text-3xl">auto_stories</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-dark text-base">Your Story is Coming!</p>
                                <p className="text-xs text-dark/60 font-bold">We'll feature you in Community Stories ✨</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Impact Stats */}
                    <motion.div
                        className="grid grid-cols-2 gap-4 p-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className={`${isTree ? 'bg-green-100' : 'bg-blue-100'} rounded-2xl p-4 text-center border-2 border-dark/10`}>
                            <p className="text-3xl font-black text-dark">{isTree ? '1' : '1lb'}</p>
                            <p className="text-xs font-bold text-dark/50 uppercase tracking-wide">{isTree ? 'Tree Planted' : 'Plastic Removed'}</p>
                        </div>
                        <div className={`${isTree ? 'bg-green-100' : 'bg-blue-100'} rounded-2xl p-4 text-center border-2 border-dark/10`}>
                            <p className="text-3xl font-black text-dark">{isTree ? '20kg' : '5kg'}</p>
                            <p className="text-xs font-bold text-dark/50 uppercase tracking-wide">CO₂ Offset</p>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="p-5 flex gap-3 bg-white/50">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white border-3 border-dark text-dark font-black rounded-2xl active:scale-[0.98] transition-transform shadow-brutal-sm"
                        >
                            Done
                        </button>
                        <button
                            onClick={() => {
                                const text = `I just unlocked the ${reward.title} reward on ReLoop! 🌍✨`;
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'ReLoop Impact',
                                        text: text,
                                        url: window.location.origin
                                    }).catch(console.error);
                                } else {
                                    navigator.clipboard.writeText(text);
                                    alert('Copied to clipboard!');
                                }
                            }}
                            className={`flex-1 py-4 ${isTree ? 'bg-green-500' : 'bg-blue-500'} text-white font-black rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-brutal-sm border-3 border-dark`}
                        >
                            <span className="material-symbols-outlined">share</span>
                            Share
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

const categoryColors: Record<string, string> = {
    voucher: 'from-amber-300 to-orange-400',
    merch: 'from-pink-300 to-rose-400',
    donation: 'from-green-300 to-emerald-400',
};

export default function RewardsPage() {
    const { user: authUser, isDemo } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [activeTab, setActiveTab] = useState('All');
    const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
    const [showHowToEarn, setShowHowToEarn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Modal state
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [redemptionCode, setRedemptionCode] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Try Firebase first
                if (authUser?.uid && !isDemo) {
                    const firebaseRewards = await DBService.getRewards();
                    if (firebaseRewards.length > 0) {
                        setRewards(firebaseRewards as Reward[]);
                        // Get user's redeemed rewards
                        const redeemedSet = await DBService.getRedemptionsByRewardIds(
                            authUser.uid,
                            firebaseRewards.map(r => r.id)
                        );
                        setRedeemed(redeemedSet);
                    } else {
                        // Fallback to demo data if no Firebase rewards
                        setRewards(DemoManager.getMockRewards());
                        setRedeemed(new Set(DemoManager.getRedeemedRewards()));
                    }
                } else {
                    // Demo mode
                    setRewards(DemoManager.getMockRewards());
                    setRedeemed(new Set(DemoManager.getRedeemedRewards()));
                }
            } catch (error) {
                console.error('Error loading rewards:', error);
                setRewards(DemoManager.getMockRewards());
                setRedeemed(new Set(DemoManager.getRedeemedRewards()));
            }
            setIsLoading(false);
        };
        loadData();
    }, [authUser, isDemo]);

    const categoryMap: Record<string, string> = {
        'Vouchers': 'voucher',
        'Merch': 'merch',
        'Donate': 'donation',
    };

    const filtered = activeTab === 'All'
        ? rewards
        : rewards.filter(r => r.category === categoryMap[activeTab]);

    const generateRedemptionCode = useCallback(() => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'RL-';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }, []);

    const handleRedeem = async (reward: Reward) => {
        if (!authUser || authUser.coins < reward.cost || redeemed.has(reward.id) || isRedeeming) return;

        setIsRedeeming(true);
        try {
            if (!isDemo) {
                // Firebase redemption
                const result = await DBService.redeemReward(authUser.uid, reward.id, reward.cost);
                if (result.success) {
                    setRedeemed(prev => new Set([...prev, reward.id]));
                    if (reward.category !== 'donation') {
                        setRedemptionCode(generateRedemptionCode());
                    }
                    setSelectedReward(reward);
                } else {
                    alert(result.error || 'Failed to redeem reward');
                }
            } else {
                // Demo mode
                const success = DemoManager.redeemReward(reward.id, reward.cost);
                if (success) {
                    setRedeemed(new Set(DemoManager.getRedeemedRewards()));
                    if (reward.category !== 'donation') {
                        setRedemptionCode(generateRedemptionCode());
                    }
                    setSelectedReward(reward);
                }
            }
        } catch (error) {
            console.error('Error redeeming reward:', error);
            alert('Failed to redeem reward. Please try again.');
        }
        setIsRedeeming(false);
    };

    const closeModal = () => {
        setSelectedReward(null);
        setRedemptionCode('');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">redeem</span>
                    <p className="font-bold text-dark dark:text-white">Sign in to view rewards</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-card-yellow/20">
            <PageHeader title="Rewards" backHref="/" />

            <motion.div
                className="px-4 pb-28 space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Hero Balance Card */}
                <motion.div
                    variants={itemVariants}
                    className="relative overflow-hidden bg-gradient-to-br from-primary via-green-400 to-emerald-500 rounded-3xl border-4 border-dark shadow-brutal p-6"
                >
                    {/* Decorative circles */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                    <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-black/10 rounded-full blur-xl" />

                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-dark/50 font-black text-xs uppercase tracking-widest">Your Balance</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-5xl font-black text-dark">{authUser.coins}</p>
                                <span className="text-lg font-black text-dark/60">Eco Coins</span>
                            </div>
                            <p className="text-xs font-bold text-dark/40 mt-2">≈ ₹{(authUser.coins * 0.5).toFixed(0)} value</p>
                        </div>
                        <motion.div
                            className="text-7xl"
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            🪙
                        </motion.div>
                    </div>

                    {/* Progress to next tier */}
                    <div className="mt-5 relative">
                        <div className="flex justify-between text-[10px] font-black text-dark/50 uppercase mb-1">
                            <span>Silver Tier</span>
                            <span>250 more for Gold</span>
                        </div>
                        <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-black/10">
                            <motion.div
                                className="h-full bg-dark rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Category Tabs */}
                <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {TABS.map(tab => (
                        <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            whileTap={{ scale: 0.95 }}
                            className={`px-5 py-2.5 rounded-full font-black text-sm transition-all border-2 whitespace-nowrap ${activeTab === tab
                                ? 'bg-dark text-white border-dark shadow-brutal-sm'
                                : 'bg-white text-dark border-dark/20 hover:border-dark/40'
                                }`}
                        >
                            {tab}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Rewards List - Vertical Cards */}
                <motion.div variants={containerVariants} className="space-y-4">
                    {filtered.map((reward) => {
                        const isRedeemed = redeemed.has(reward.id);
                        const canAfford = authUser.coins >= reward.cost;
                        const isDonation = reward.category === 'donation';
                        const gradientClass = categoryColors[reward.category] || 'from-gray-300 to-gray-400';

                        return (
                            <motion.div
                                key={reward.id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className={`bg-white dark:bg-dark-surface rounded-3xl border-3 border-dark dark:border-gray-600 shadow-brutal-sm overflow-hidden ${!reward.available ? 'opacity-50' : ''}`}>
                                    <div className="flex items-stretch">
                                        {/* Left Icon Section */}
                                        <div className={`w-28 bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-4 border-r-3 border-dark relative overflow-hidden`}>
                                            {isDonation && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                            )}
                                            <span className="text-5xl relative z-10 drop-shadow-sm">{reward.icon}</span>
                                            <span className="mt-2 text-[10px] font-black uppercase text-dark/70 bg-white/50 px-2 py-0.5 rounded-full">
                                                {reward.category}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-black text-dark dark:text-white text-lg leading-tight">{reward.title}</h3>
                                                    {isDonation && (
                                                        <span className="text-[9px] font-black bg-green-500 text-white px-2 py-1 rounded-lg uppercase">
                                                            Impact
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-dark/50 dark:text-white/50 font-medium mt-1 line-clamp-2">{reward.description}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                {/* Price */}
                                                <div className="flex items-center gap-1.5 bg-card-yellow rounded-xl px-3 py-1.5 border-2 border-dark/10">
                                                    <span className="text-lg">🪙</span>
                                                    <span className="text-xl font-black text-dark">{reward.cost}</span>
                                                </div>

                                                {/* Action Button */}
                                                {isRedeemed ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 font-black text-sm bg-green-100 px-4 py-2 rounded-xl">
                                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                                        Claimed
                                                    </div>
                                                ) : (
                                                    <motion.button
                                                        onClick={() => handleRedeem(reward)}
                                                        disabled={!canAfford || !reward.available}
                                                        whileTap={{ scale: 0.95 }}
                                                        className={`px-5 py-2.5 rounded-xl border-2 border-dark font-black text-sm transition-all ${canAfford && reward.available
                                                            ? isDonation
                                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-dark shadow-brutal-sm hover:shadow-brutal'
                                                                : 'bg-primary text-dark shadow-brutal-sm hover:shadow-brutal'
                                                            : 'bg-gray-100 dark:bg-dark-bg text-dark/30 dark:text-white/30 cursor-not-allowed border-dark/20'
                                                            }`}
                                                    >
                                                        {!canAfford ? `Need ${reward.cost - authUser.coins} more` : isDonation ? '💚 Contribute' : 'Claim →'}
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* How to Earn Section */}
                <motion.div variants={itemVariants}>
                    <motion.button
                        onClick={() => setShowHowToEarn(!showHowToEarn)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-card-blue to-blue-200 rounded-2xl border-3 border-dark shadow-brutal-sm p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center border-2 border-dark">
                                <span className="material-symbols-outlined text-white">tips_and_updates</span>
                            </div>
                            <span className="font-black text-dark">How to Earn More Coins</span>
                        </div>
                        <motion.span
                            className="material-symbols-outlined text-dark text-2xl"
                            animate={{ rotate: showHowToEarn ? 180 : 0 }}
                        >
                            expand_more
                        </motion.span>
                    </motion.button>
                    <AnimatePresence>
                        {showHowToEarn && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white rounded-b-2xl border-3 border-t-0 border-dark p-4 space-y-3">
                                    {[
                                        { icon: 'photo_camera', text: 'Scan recyclable items', coins: '10-45', color: 'bg-green-100' },
                                        { icon: 'swap_horiz', text: 'Complete trades', coins: '25-100', color: 'bg-blue-100' },
                                        { icon: 'flag', text: 'Finish daily missions', coins: 'Bonus', color: 'bg-amber-100' },
                                        { icon: 'group', text: 'Refer friends', coins: '200', color: 'bg-pink-100' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className={`flex items-center gap-3 ${item.color} p-3 rounded-xl`}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <span className="material-symbols-outlined text-dark/70">{item.icon}</span>
                                            <p className="flex-1 text-sm text-dark font-bold">{item.text}</p>
                                            <span className="text-xs font-black text-dark bg-white px-2 py-1 rounded-lg">+{item.coins}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* Redemption Modals */}
            <AnimatePresence>
                {selectedReward && (
                    selectedReward.category === 'donation' ? (
                        <CommunityStoryModal reward={selectedReward} onClose={closeModal} />
                    ) : (
                        <QRCouponModal reward={selectedReward} code={redemptionCode} onClose={closeModal} />
                    )
                )}
            </AnimatePresence>
        </div>
    );
}
