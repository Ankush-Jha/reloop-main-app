'use client';

import { motion } from 'framer-motion';

interface OfferCardProps {
    amount: number;
    status: 'pending' | 'accepted' | 'declined' | 'countered';
    counterAmount?: number;
    isSeller: boolean;
    isOwn: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
    onCounter?: (amount: number) => void;
    timestamp: Date;
}

export function OfferCard({
    amount,
    status,
    counterAmount,
    isSeller,
    isOwn,
    onAccept,
    onDecline,
    onCounter,
    timestamp,
}: OfferCardProps) {
    const statusConfig = {
        pending: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-300 dark:border-yellow-700',
            badge: 'bg-yellow-200 text-yellow-800',
            icon: 'hourglass_empty',
            label: 'Pending',
        },
        accepted: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-300 dark:border-green-700',
            badge: 'bg-green-200 text-green-800',
            icon: 'check_circle',
            label: 'Accepted',
        },
        declined: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-300 dark:border-red-700',
            badge: 'bg-red-200 text-red-800',
            icon: 'cancel',
            label: 'Declined',
        },
        countered: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-300 dark:border-blue-700',
            badge: 'bg-blue-200 text-blue-800',
            icon: 'swap_horiz',
            label: 'Countered',
        },
    };

    const config = statusConfig[status];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-[85%] rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden ${isOwn ? 'ml-auto' : 'mr-auto'}`}
        >
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">local_offer</span>
                    <span className="font-bold text-sm text-dark dark:text-white">Trade Offer</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badge} flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-xs">{config.icon}</span>
                    {config.label}
                </span>
            </div>

            {/* Amount */}
            <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <span className="text-3xl font-black text-dark dark:text-white">{amount}</span>
                    <span className="text-gray-500 font-medium">coins</span>
                </div>
                {status === 'countered' && counterAmount && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        <span className="font-bold">Counter: {counterAmount} coins</span>
                    </div>
                )}
            </div>

            {/* Actions - Only show for pending offers where user is the seller */}
            {status === 'pending' && isSeller && !isOwn && (
                <div className="px-4 pb-4 flex gap-2">
                    <button
                        onClick={onDecline}
                        className="flex-1 py-2.5 rounded-xl border-2 border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 py-2.5 rounded-xl bg-primary border-2 border-dark text-dark font-bold text-sm shadow-brutal-sm hover:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-lg">check</span>
                        Accept
                    </button>
                </div>
            )}

            {/* Timestamp */}
            <div className="px-4 pb-2 text-[10px] text-gray-500 dark:text-gray-400 text-right">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </motion.div>
    );
}
