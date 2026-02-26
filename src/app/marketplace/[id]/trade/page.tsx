'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { Listing } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavStore } from '@/lib/store/nav-store';
import { formatRupeeValue } from '@/lib/eco-coins';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function TradeRequestPage() {
    const params = useParams();
    const router = useRouter();
    const { setActions, reset } = useNavStore();
    const [listing, setListing] = useState<Listing | null>(null);
    const [tradeType, setTradeType] = useState<'coins' | 'item'>('coins');
    const [offerCoins, setOfferCoins] = useState('');
    const [offerItem, setOfferItem] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user = DemoManager.getMockUser();

    useEffect(() => {
        const id = params.id as string;
        const found = DemoManager.getListingById(id);
        if (!found) {
            router.push('/marketplace');
            return;
        }
        setListing(found);
        setOfferCoins(String(found.price));
    }, [params.id, router]);

    const [error, setError] = useState('');

    const handleSubmit = () => {
        setError('');
        const coins = parseInt(offerCoins, 10);

        if (tradeType === 'coins') {
            if (!coins || coins <= 0) { setError('Offer must be greater than 0'); return; }
            if (coins > user.coins) { setError('Not enough Eco Coins'); return; }
        } else {
            if (!offerItem.trim()) { setError('Enter the item you want to swap'); return; }
        }

        setIsSubmitting(true);

        const tradeId = `trade-${Date.now()}`;
        const co2 = listing!.co2Saved || Math.round(Math.random() * 10 + 2);

        DemoManager.addTrade({
            id: tradeId,
            listingId: listing!.id,
            listingTitle: listing!.title,
            listingImage: listing!.images[0],
            traderId: listing!.seller.id,
            traderName: listing!.seller.name,
            traderAvatar: listing!.seller.avatar || '',
            offeredCoins: tradeType === 'coins' ? coins : undefined,
            offeredItem: tradeType === 'item' ? offerItem.trim() : undefined,
            status: 'pending',
            createdAt: new Date(),
            co2Saved: co2,
        });

        // Deduct coins if coin trade
        if (tradeType === 'coins') {
            DemoManager.updateUser({ coins: user.coins - coins, xp: user.xp + 30 });
        } else {
            DemoManager.updateUser({ xp: user.xp + 30 });
        }

        DemoManager.addNotification({
            id: `notif-${Date.now()}`,
            type: 'trade',
            title: 'Trade Request Sent',
            message: `You sent a trade request to ${listing!.seller.name} for ${listing!.title}`,
            icon: 'swap_horiz',
            timestamp: new Date(),
            read: false,
            actionUrl: '/trade-history',
        });

        // Store trade info for trade-complete page
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('reloop_last_trade', JSON.stringify({
                coins: tradeType === 'coins' ? coins : 0,
                item: tradeType === 'item' ? offerItem.trim() : null,
                co2,
                listingTitle: listing!.title,
            }));
        }

        router.push('/marketplace/trade-complete');
    };

    // Register nav action
    useEffect(() => {
        setActions({
            label: isSubmitting ? 'Sending Request...' : 'Send Trade Request',
            onClick: handleSubmit,
            icon: 'send',
            disabled: isSubmitting,
            loading: isSubmitting,
            variant: 'primary'
        });

        // Cleanup on unmount
        return () => reset();
    }, [isSubmitting, tradeType, offerCoins, offerItem, message, listing]);

    if (!listing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Trade Request" backHref={`/marketplace/${listing.id}`} />

            <motion.div
                className="px-5 pb-28 space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Item Preview */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dark dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-dark-surface shrink-0">
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-dark dark:text-white truncate">{listing.title}</p>
                        <p className="text-sm text-dark/60 dark:text-white/60">{listing.condition}</p>
                        <p className="text-sm font-bold text-primary flex items-center gap-1 mt-1">
                            🪙 {listing.price} ({formatRupeeValue(listing.price)})
                        </p>
                    </div>
                </motion.div>

                {/* Seller Info */}
                <motion.div variants={itemVariants} className="bg-card-blue rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-dark dark:border-gray-600 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img src={listing.seller.avatar} alt={listing.seller.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="font-bold text-dark dark:text-white text-sm">Trading with {listing.seller.name}</p>
                        <p className="text-xs text-dark/60 dark:text-white/60">Responds in {listing.seller.responseTime || '2h'}</p>
                    </div>
                </motion.div>

                {/* Trade Type */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">How would you like to trade?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setTradeType('coins')}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${tradeType === 'coins'
                                ? 'bg-primary border-dark dark:border-gray-600 shadow-brutal-sm'
                                : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 hover:border-dark dark:border-gray-600'
                                }`}
                        >
                            <span className="text-2xl mb-1 block">🪙</span>
                            <p className="font-bold text-dark dark:text-white text-sm">Eco Coins</p>
                        </button>
                        <button
                            onClick={() => setTradeType('item')}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${tradeType === 'item'
                                ? 'bg-primary border-dark dark:border-gray-600 shadow-brutal-sm'
                                : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 hover:border-dark dark:border-gray-600'
                                }`}
                        >
                            <span className="text-2xl mb-1 block">📦</span>
                            <p className="font-bold text-dark dark:text-white text-sm">Item Swap</p>
                        </button>
                    </div>
                </motion.div>

                {/* Offer Details */}
                <motion.div variants={itemVariants}>
                    {tradeType === 'coins' ? (
                        <div>
                            <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Offer Amount</p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🪙</span>
                                <input
                                    type="number"
                                    value={offerCoins}
                                    onChange={(e) => setOfferCoins(e.target.value)}
                                    className="w-full h-14 rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 pl-12 pr-5 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <p className="text-xs text-dark/40 dark:text-white/40 mt-2 ml-1">
                                Your balance: <span className="font-bold text-primary">🪙 {user.coins} ({formatRupeeValue(user.coins)})</span>
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Your Item to Swap</p>
                            <input
                                type="text"
                                value={offerItem}
                                onChange={(e) => setOfferItem(e.target.value)}
                                placeholder="e.g., Calculus Textbook"
                                className="w-full h-14 rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 px-5 font-medium placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    )}
                </motion.div>

                {/* Message */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Message (optional)</p>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi! I'm interested in your item..."
                        rows={3}
                        className="w-full rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 p-5 font-medium placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                </motion.div>

                {/* Error */}
                {error && (
                    <motion.p variants={itemVariants} className="text-red-500 font-bold text-sm text-center">{error}</motion.p>
                )}

            </motion.div>

            {/* Fixed Bottom Button - Above Navbar */}
            <div className="fixed bottom-24 left-0 right-0 px-5 z-40">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full h-14 rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${isSubmitting
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                        : 'bg-primary hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1'
                        }`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                            <span className="text-dark">Sending...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-dark">send</span>
                            <span className="text-dark">Send Trade Request</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
