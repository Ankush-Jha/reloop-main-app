'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';

interface TradeData {
    coins: number;
    item: string | null;
    co2: number;
    listingTitle: string;
}

export default function TradeCompletePage() {
    const [showConfetti, setShowConfetti] = useState(false);
    const [tradeData, setTradeData] = useState<TradeData | null>(null);
    const [userCoins, setUserCoins] = useState(0);

    useEffect(() => {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 3000);

        // Load trade data from sessionStorage
        const raw = sessionStorage.getItem('reloop_last_trade');
        if (raw) {
            try {
                setTradeData(JSON.parse(raw));
            } catch { /* ignore */ }
        }

        setUserCoins(DemoManager.getMockUser().coins);

        return () => clearTimeout(timer);
    }, []);

    const coinsOffered = tradeData?.coins || 45;
    const co2Saved = tradeData?.co2 || 5.2;

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white dark:from-[#0f2a1f] dark:via-[#122e22] dark:to-[#0f1f17] flex flex-col items-center justify-center px-8">
            {/* Success Animation */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring' as const, stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-32 h-32 bg-primary rounded-[2.5rem] border-[3px] border-dark dark:border-gray-600 shadow-brutal flex items-center justify-center mb-8"
            >
                <span className="material-symbols-outlined text-6xl text-dark">check</span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-4"
            >
                <h1 className="text-4xl font-[900] text-dark dark:text-white uppercase tracking-tight">
                    Trade Sent!
                </h1>
                <p className="text-dark/70 dark:text-white/70 font-medium text-lg max-w-[280px]">
                    {tradeData?.listingTitle
                        ? `Your trade request for "${tradeData.listingTitle}" has been sent!`
                        : 'Your trade request has been sent. The seller will respond soon!'}
                </p>
            </motion.div>

            {/* Impact Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 bg-white dark:bg-dark-surface rounded-3xl border-2 border-dark dark:border-gray-600 shadow-brutal p-6 w-full max-w-sm"
            >
                <p className="text-sm font-bold text-dark/60 dark:text-white/60 text-center mb-4">Your Impact</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card-green rounded-2xl p-4 text-center">
                        <p className="text-2xl font-[900] text-dark dark:text-white">
                            {tradeData?.item ? tradeData.item : `${coinsOffered}`}
                        </p>
                        <p className="text-xs font-bold text-dark/60 dark:text-white/60">
                            {tradeData?.item ? 'Item Swapped' : 'Eco Coins Offered'}
                        </p>
                    </div>
                    <div className="bg-card-blue rounded-2xl p-4 text-center">
                        <p className="text-2xl font-[900] text-dark dark:text-white">{co2Saved}</p>
                        <p className="text-xs font-bold text-dark/60 dark:text-white/60">kg CO₂ Saved</p>
                    </div>
                </div>
                <div className="mt-3 bg-card-yellow rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-dark dark:text-white">Balance: 🪙 {userCoins} Eco Coins</p>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-8 w-full max-w-sm space-y-3"
            >
                <Link
                    href="/trade-history"
                    className="w-full bg-dark dark:bg-primary text-white dark:text-dark py-4 rounded-2xl font-[900] uppercase tracking-wider shadow-brutal active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                    <span className="material-symbols-outlined">history</span>
                    View Trade History
                </Link>
                <Link
                    href="/marketplace"
                    className="w-full bg-white dark:bg-dark-surface text-dark dark:text-white py-4 rounded-2xl font-bold border-2 border-dark dark:border-gray-600 shadow-brutal-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                    Back to Marketplace
                </Link>
            </motion.div>

            {/* Confetti Effect */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#4ce68a', '#fde047', '#fda4af', '#93c5fd', '#c4b5fd'][i % 5],
                            }}
                            initial={{ top: '-5%', rotate: 0 }}
                            animate={{
                                top: '105%',
                                rotate: Math.random() * 720 - 360,
                                x: Math.random() * 200 - 100,
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                delay: Math.random() * 0.5,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
