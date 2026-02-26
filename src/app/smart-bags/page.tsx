'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SmartBag, User } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

type TabType = 'active' | 'history' | 'stats';

const STATUS_STEPS = [
    { key: 'registered', label: 'Bag Registered', icon: 'add_circle' },
    { key: 'filled', label: 'Marked as Filled', icon: 'shopping_bag' },
    { key: 'collected', label: 'Collected by Worker', icon: 'local_shipping' },
    { key: 'processed', label: 'Processed & Coins Awarded', icon: 'check_circle' },
];

export default function SmartBagsPage() {
    const { user, isDemo } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [bags, setBags] = useState<SmartBag[]>([]);
    const [totalCoins, setTotalCoins] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<User | null>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch user profile for accurate stats
        DBService.getUserProfile(user.uid).then(profile => {
            if (profile) setUserProfile(profile);
        });

        if (isDemo) {
            // Demo mode - use mock data
            const DemoManager = require('@/lib/demo-manager').default;
            const userBags = DemoManager.getSmartBags();
            setBags(userBags);
            setTotalCoins(userBags.reduce((sum: number, bag: SmartBag) => sum + (bag.coinsAwarded || 0), 0));
            setLoading(false);
            return;
        }

        // Real Firebase subscription
        setLoading(true);
        const unsubscribe = DBService.subscribeToUserSmartBags(user.uid, (fetchedBags) => {
            setBags(fetchedBags as SmartBag[]);
            const coins = fetchedBags.reduce((sum: number, bag: any) => sum + (bag.coinsAwarded || 0), 0);
            setTotalCoins(coins);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isDemo]);

    const activeBags = bags.filter(b => b.status !== 'processed');
    const historyBags = bags.filter(b => b.status === 'processed');
    const totalWeight = bags.reduce((sum, bag) => sum + (bag.estimatedWeight || 0), 0);
    // Use profile co2Saved if available, otherwise calculate from bags
    const co2Saved = userProfile?.co2Saved?.toFixed(1) || (totalWeight * 2.5).toFixed(1);

    const getStepIndex = (status: SmartBag['status']) => {
        const index = STATUS_STEPS.findIndex(s => s.key === status);
        return index >= 0 ? index : 0;
    };

    return (
        <div className="min-h-screen bg-[#D0E8FF] dark:bg-dark-bg flex flex-col selection:bg-primary selection:text-black overflow-x-hidden text-black dark:text-white pb-32">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex justify-between items-center z-20 relative">
                <h1 className="text-4xl font-black uppercase tracking-tight leading-none whitespace-nowrap">Smart Bags</h1>
                <button
                    onClick={() => router.push('/notifications')}
                    aria-label="Notifications"
                    className="bg-white dark:bg-dark-surface w-12 h-12 rounded-full border-4 border-black dark:border-gray-600 shadow-[4px_4px_0px_0px_#000] dark:shadow-brutal-sm flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150"
                >
                    <span className="material-symbols-outlined text-black dark:text-white" style={{ fontSize: '28px' }}>notifications</span>
                </button>
            </header>

            {/* Tab Pills */}
            <div className="px-6 pb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 w-max">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-8 py-3 rounded-full border-4 border-black font-black uppercase whitespace-nowrap active:translate-y-[2px] active:shadow-none transition-all text-sm tracking-wide ${activeTab === 'active'
                            ? 'bg-[#9747FF] text-white shadow-[4px_4px_0px_0px_#000]'
                            : 'bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-100'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-8 py-3 rounded-full border-4 border-black font-black uppercase whitespace-nowrap active:translate-y-[2px] active:shadow-none transition-all text-sm tracking-wide ${activeTab === 'history'
                            ? 'bg-[#9747FF] text-white shadow-[4px_4px_0px_0px_#000]'
                            : 'bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-100'
                            }`}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-8 py-3 rounded-full border-4 border-black font-black uppercase whitespace-nowrap active:translate-y-[2px] active:shadow-none transition-all text-sm tracking-wide ${activeTab === 'stats'
                            ? 'bg-[#9747FF] text-white shadow-[4px_4px_0px_0px_#000]'
                            : 'bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-100'
                            }`}
                    >
                        Stats
                    </button>
                </div>
            </div>

            <main className="px-6 flex-grow flex flex-col gap-6">
                {/* Recycling Bag Deposit - Main Hero Card */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    className="bg-[#FDE047] rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                            </div>
                            <div>
                                <h2 className="font-black text-xl uppercase tracking-tight text-black leading-tight">Recycling<br />Bag Deposit</h2>
                                <p className="text-xs font-bold text-black/60 mt-1">Submit full bags for collection</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="px-5 pb-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/60 rounded-xl px-3 py-2 border-2 border-black text-center">
                                <p className="text-2xl font-black text-black">{activeBags.length}</p>
                                <p className="text-[10px] font-bold text-black/70 uppercase">Active</p>
                            </div>
                            <div className="bg-white/60 rounded-xl px-3 py-2 border-2 border-black text-center">
                                <p className="text-2xl font-black text-black">{historyBags.length}</p>
                                <p className="text-[10px] font-bold text-black/70 uppercase">Completed</p>
                            </div>
                            <div className="bg-white/60 rounded-xl px-3 py-2 border-2 border-black text-center">
                                <p className="text-2xl font-black text-primary">{totalCoins}</p>
                                <p className="text-[10px] font-bold text-black/70 uppercase">Coins</p>
                            </div>
                        </div>
                    </div>

                    {/* Scan Button */}
                    <div className="p-4 border-t-4 border-black bg-white">
                        <Link
                            href="/smart-bags/scan"
                            className="block w-full py-4 bg-black text-white font-black rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] text-center flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide"
                        >
                            <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                            Register New Bag
                        </Link>
                    </div>
                </motion.div>

                {/* Impact Summary - Compact */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    className="bg-primary rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center border-2 border-black">
                            <span className="material-symbols-outlined text-black text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-black/60 uppercase">Total Impact</p>
                            <p className="text-xl font-black text-black">{co2Saved} kg CO₂ Saved</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-black/40">arrow_forward_ios</span>
                </motion.div>

                {/* Active Bags Tab */}
                {activeTab === 'active' && (
                    <motion.section
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                        className="flex flex-col gap-4"
                    >
                        {activeBags.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                                <span className="material-symbols-outlined text-6xl text-black/30 dark:text-white/30 mb-4">shopping_bag</span>
                                <p className="text-black/60 dark:text-white/60 font-bold">No active bags</p>
                                <p className="text-sm text-black/40 dark:text-white/40 mt-2">Scan a bag to get started!</p>
                            </div>
                        ) : (
                            activeBags.map((bag) => {
                                const currentStepIndex = getStepIndex(bag.status);
                                return (
                                    <motion.div
                                        key={bag.id}
                                        variants={itemVariants}
                                        className="bg-white dark:bg-dark-surface rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                                    >
                                        {/* Bag Header */}
                                        <div className="p-4 border-b-4 border-black bg-white dark:bg-dark-elevated flex gap-4 items-center">
                                            <div className="w-20 h-20 rounded-xl border-2 border-black overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-dark-surface flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-black dark:text-white">inventory_2</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl uppercase leading-tight text-black dark:text-white">ECOBAG</h3>
                                                <p className="text-xs font-bold text-gray-500 uppercase mt-1">
                                                    {bag.qrCode} • <span className="text-[#9747FF]">{bag.status === 'registered' ? 'Ready' : bag.status === 'filled' ? 'Awaiting Pickup' : 'In Transit'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="p-6 bg-white dark:bg-dark-surface">
                                            <div className="relative pl-2">
                                                {STATUS_STEPS.map((step, index) => {
                                                    const isCompleted = index <= currentStepIndex;
                                                    const isCurrent = index === currentStepIndex;
                                                    const isLast = index === STATUS_STEPS.length - 1;

                                                    return (
                                                        <div key={step.key} className="relative flex gap-4 mb-6 last:mb-0">
                                                            {/* Connecting Line */}
                                                            {!isLast && (
                                                                <div className={`absolute left-[19px] top-10 h-full w-1 ${index < currentStepIndex ? 'bg-black' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                            )}

                                                            {/* Step Circle */}
                                                            <div className={`relative z-10 w-10 h-10 rounded-full border-4 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isCompleted ? 'bg-primary' : isCurrent ? 'bg-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700'
                                                                }`}>
                                                                {isCompleted ? (
                                                                    <span className="material-symbols-outlined text-black text-xl">check</span>
                                                                ) : isCurrent ? (
                                                                    <div className="w-3 h-3 bg-[#9747FF] rounded-full"></div>
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-gray-400 text-lg">{step.icon}</span>
                                                                )}
                                                            </div>

                                                            {/* Step Label */}
                                                            <div className="pt-1">
                                                                <h4 className={`font-bold uppercase text-sm ${isCompleted ? 'text-black dark:text-white' : 'text-gray-400'}`}>{step.label}</h4>
                                                                {isCurrent && !isCompleted && (
                                                                    <p className="text-xs text-[#9747FF] font-bold mt-0.5 uppercase">In Progress</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="p-4 border-t-4 border-black bg-white dark:bg-dark-elevated">
                                            <Link
                                                href={`/smart-bags/${bag.id}`}
                                                className="block w-full py-3 bg-[#FDE047] border-4 border-black rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all text-center text-black"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.section>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <motion.section
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black uppercase tracking-wide">Completed Bags</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            {historyBags.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                                    <span className="material-symbols-outlined text-6xl text-black/30 dark:text-white/30 mb-4">history</span>
                                    <p className="text-black/60 dark:text-white/60 font-bold">No completed bags yet</p>
                                </div>
                            ) : (
                                historyBags.map((bag) => (
                                    <motion.div
                                        key={bag.id}
                                        variants={itemVariants}
                                        className="bg-white dark:bg-dark-surface rounded-xl border-2 border-black p-3 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-elevated rounded-lg border-2 border-black overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-black dark:text-white">inventory_2</span>
                                        </div>
                                        <div className="flex-grow pt-1">
                                            <h3 className="font-bold text-sm uppercase leading-tight text-black dark:text-white">ECOBAG</h3>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                                                Processed • {bag.estimatedWeight?.toFixed(1) || '0'} kg
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>eco</span>
                                                <span className="font-black text-sm text-black dark:text-white">+{bag.coinsAwarded || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 pt-1">
                                            <Link
                                                href={`/smart-bags/${bag.id}`}
                                                className="bg-white dark:bg-dark-surface px-3 py-2 border-4 border-black rounded-lg text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all whitespace-nowrap text-black dark:text-white"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.section>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                    <motion.section
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                        className="flex flex-col gap-4"
                    >
                        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] p-5">
                            <h3 className="font-black text-lg uppercase mb-4 text-black dark:text-white">Your Recycling Stats</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b-2 border-dashed border-black/20">
                                    <span className="font-bold text-black/70 dark:text-white/70">Total Bags Registered</span>
                                    <span className="font-black text-2xl text-black dark:text-white">{bags.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b-2 border-dashed border-black/20">
                                    <span className="font-bold text-black/70 dark:text-white/70">Bags Processed</span>
                                    <span className="font-black text-2xl text-black dark:text-white">{historyBags.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b-2 border-dashed border-black/20">
                                    <span className="font-bold text-black/70 dark:text-white/70">Total Weight Recycled</span>
                                    <span className="font-black text-2xl text-black dark:text-white">{totalWeight.toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b-2 border-dashed border-black/20">
                                    <span className="font-bold text-black/70 dark:text-white/70">CO₂ Saved</span>
                                    <span className="font-black text-2xl text-primary">{co2Saved} kg</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="font-bold text-black/70 dark:text-white/70">Total Coins Earned</span>
                                    <span className="font-black text-2xl text-[#9747FF]">{totalCoins}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* How It Works */}
                        <motion.div variants={itemVariants} className="bg-[#FDE047] rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] px-4 py-3">
                            <p className="text-sm font-bold text-black mb-2">📲 How Smart Bags Work</p>
                            <ol className="text-xs text-black/70 space-y-1 list-decimal list-inside">
                                <li>Scan any Dynamic QR to register a bag</li>
                                <li>Fill bag with segregated waste</li>
                                <li>Worker collects from your hostel</li>
                                <li>Bag goes to ReLoop Zone → Recycling Plant</li>
                                <li>You earn coins when processed!</li>
                            </ol>
                        </motion.div>
                    </motion.section>
                )}
            </main>
        </div>
    );
}
