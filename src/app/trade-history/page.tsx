'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Trade } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-card-yellow', text: 'text-yellow-800', label: 'Pending' },
    accepted: { bg: 'bg-card-blue', text: 'text-blue-800', label: 'Accepted' },
    completed: { bg: 'bg-card-green', text: 'text-green-800', label: 'Completed' },
    declined: { bg: 'bg-card-coral', text: 'text-red-800', label: 'Declined' },
};

const TABS = ['All', 'Pending', 'Completed', 'Declined'];

export default function TradeHistoryPage() {
    const router = useRouter();
    const { isDemo, user } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [processingTradeId, setProcessingTradeId] = useState<string | null>(null);

    // Load trades
    useEffect(() => {
        loadTrades();

        if (isDemo) {
            // Subscribe to DemoManager for real-time updates
            const unsubscribe = DemoManager.subscribe(() => {
                setTrades([...DemoManager.getMockTrades()] as Trade[]);
            });
            return unsubscribe;
        }
    }, [user, isDemo]);

    const loadTrades = async () => {
        setIsLoading(true);
        if (isDemo) {
            setTrades(DemoManager.getMockTrades() as Trade[]);
            setIsLoading(false);
            return;
        }

        if (user?.uid) {
            try {
                const userTrades = await DBService.getUserTrades(user.uid);
                if (userTrades.length > 0) {
                    setTrades(userTrades.map((t: any) => ({
                        ...t,
                        createdAt: t.createdAt?.toDate?.() || new Date()
                    })));
                } else {
                    setTrades([]);
                }
            } catch (error) {
                console.error('Error loading trades:', error);
                setTrades([]);
            }
        } else {
            setTrades([]);
        }
        setIsLoading(false);
    };

    // Handle accept trade
    const handleAccept = async (trade: Trade) => {
        if (!user?.uid) {
            alert('Please log in to accept trades');
            return;
        }

        setProcessingTradeId(trade.id);
        try {
            // Update trade status
            await DBService.updateTradeStatus(trade.id, 'accepted');

            // If there are coins to transfer, do it
            if (trade.offeredCoins && trade.offeredCoins > 0) {
                await DBService.transferCoins(trade.traderId, user.uid, trade.offeredCoins);
            }

            // Reload trades
            await loadTrades();

            // Navigate to verify trade page
            router.push('/verify-trade');
        } catch (error) {
            console.error('Error accepting trade:', error);
            alert('Failed to accept trade. Please try again.');
        } finally {
            setProcessingTradeId(null);
        }
    };

    // Handle decline trade
    const handleDecline = async (trade: Trade) => {
        if (!user?.uid) {
            alert('Please log in to decline trades');
            return;
        }

        setProcessingTradeId(trade.id);
        try {
            await DBService.updateTradeStatus(trade.id, 'declined');
            await loadTrades();
        } catch (error) {
            console.error('Error declining trade:', error);
            alert('Failed to decline trade. Please try again.');
        } finally {
            setProcessingTradeId(null);
        }
    };

    const filtered = activeTab === 'All'
        ? trades
        : trades.filter(t => t.status === activeTab.toLowerCase());

    const totalCo2 = trades.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.co2Saved || 0), 0);

    // Check if user is the seller (can accept/decline)
    const isSellerForTrade = (trade: Trade) => user?.uid === trade.sellerId;

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Trade History" backHref="/profile" />

            <div className="px-5 pb-28 space-y-4">
                {/* Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-3"
                >
                    <div className="bg-card-green rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 text-center">
                        <p className="text-2xl font-[900] text-dark dark:text-white">{trades.filter(t => t.status === 'completed').length}</p>
                        <p className="text-xs font-bold text-dark/60 dark:text-white/60">Completed</p>
                    </div>
                    <div className="bg-card-yellow rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 text-center">
                        <p className="text-2xl font-[900] text-dark dark:text-white">{totalCo2.toFixed(1)}</p>
                        <p className="text-xs font-bold text-dark/60 dark:text-white/60">kg CO₂ Saved</p>
                    </div>
                </motion.div>

                {/* Pending Trades Alert */}
                {trades.filter(t => t.status === 'pending' && isSellerForTrade(t)).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card-yellow/50 border-2 border-yellow-500 rounded-2xl p-4 flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-yellow-600">pending_actions</span>
                        <div>
                            <p className="font-bold text-dark text-sm">Pending Trade Requests</p>
                            <p className="text-xs text-dark/60">You have {trades.filter(t => t.status === 'pending' && isSellerForTrade(t)).length} pending offers to review</p>
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
                >
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={activeTab === tab ? 'tab-pill-active' : 'tab-pill-inactive'}
                        >
                            {tab}
                            {tab === 'Pending' && trades.filter(t => t.status === 'pending').length > 0 && (
                                <span className="ml-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {trades.filter(t => t.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Trade List */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center py-20"
                        >
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                    ) : filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <EmptyState icon="swap_horiz" title="No trades found" description={`No ${activeTab.toLowerCase()} trades found`} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={containerVariants}
                            className="space-y-3"
                        >
                            {filtered.map((trade) => {
                                const style = STATUS_STYLES[trade.status] || STATUS_STYLES['pending'];
                                const isSeller = isSellerForTrade(trade);
                                const isPending = trade.status === 'pending';
                                const isProcessing = processingTradeId === trade.id;

                                return (
                                    <motion.div key={trade.id} variants={itemVariants}>
                                        <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4">
                                            {/* Trade Info */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl border-2 border-dark dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-dark-surface shrink-0">
                                                    <img src={trade.listingImage} alt={trade.listingTitle} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-dark dark:text-white truncate">{trade.listingTitle}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-dark-surface">
                                                            <img src={trade.traderAvatar} alt={trade.traderName} className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-xs text-dark/60 dark:text-white/60">{trade.traderName}</span>
                                                        {isSeller && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">You're selling</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                                                            {style.label}
                                                        </span>
                                                        {trade.offeredCoins && (
                                                            <span className="text-xs font-bold text-dark/60 dark:text-white/60 flex items-center gap-1">
                                                                🪙 {trade.offeredCoins}
                                                            </span>
                                                        )}
                                                        {trade.offeredItem && (
                                                            <span className="text-xs font-bold text-dark/60 dark:text-white/60">
                                                                ↔ {trade.offeredItem}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Accept/Decline Buttons (only for seller on pending trades) */}
                                            {isPending && isSeller && (
                                                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <button
                                                        onClick={() => handleDecline(trade)}
                                                        disabled={isProcessing}
                                                        className="flex-1 py-3 rounded-xl border-2 border-red-400 text-red-600 font-bold text-sm hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isProcessing ? (
                                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined text-lg">close</span>
                                                                Decline
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAccept(trade)}
                                                        disabled={isProcessing}
                                                        className="flex-1 py-3 rounded-xl bg-primary border-2 border-dark text-dark font-bold text-sm shadow-brutal-sm hover:shadow-none active:translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isProcessing ? (
                                                            <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined text-lg">check</span>
                                                                Accept
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Verify Trade button for accepted trades */}
                                            {trade.status === 'accepted' && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <Link href="/verify-trade">
                                                        <button className="w-full py-3 rounded-xl bg-card-blue border-2 border-dark text-dark font-bold text-sm shadow-brutal-sm hover:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined text-lg">verified</span>
                                                            Verify Trade
                                                        </button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
