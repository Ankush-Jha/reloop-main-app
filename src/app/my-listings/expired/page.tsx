'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import DemoManager from '@/lib/demo-manager';
import { Listing } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ExpiredListingsPage() {
    const router = useRouter();
    const { user, isDemo } = useAuth();
    const [expiredListings, setExpiredListings] = useState<Listing[]>([]);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadExpired = async () => {
            setIsLoading(true);
            try {
                if (user?.uid && !isDemo) {
                    const expired = await DBService.getExpiredListings(user.uid);
                    setExpiredListings(expired as Listing[]);
                } else {
                    setExpiredListings(DemoManager.getExpiredListings());
                }
            } catch (error) {
                console.error('Error loading expired listings:', error);
                setExpiredListings(DemoManager.getExpiredListings());
            }
            setIsLoading(false);
        };
        loadExpired();
    }, [user, isDemo]);

    const handleEquityChoice = async (listingId: string, choice: 'recycle' | 'donate') => {
        setProcessing(true);

        try {
            if (user?.uid && !isDemo) {
                const result = await DBService.handleEquityChoice(user.uid, listingId, choice);
                if (result.success) {
                    setCoinsEarned(result.coinsAwarded);
                    setCompleted(true);
                } else {
                    alert('Failed to process. Please try again.');
                }
            } else {
                await DemoManager.simulateDelay(1500);
                const result = DemoManager.handleEquityChoice(listingId, choice);
                setCoinsEarned(result.coinsAwarded);
                setCompleted(true);
            }
        } catch (error) {
            console.error('Error processing choice:', error);
            alert('An error occurred. Please try again.');
        }

        setProcessing(false);
    };

    if (completed) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-28 h-28 bg-green-500 rounded-full border-4 border-dark shadow-brutal flex items-center justify-center mb-6 animate-bounce">
                    <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
                <h1 className="text-2xl font-black text-dark dark:text-white mb-2">Great Choice!</h1>
                <p className="text-dark/70 dark:text-white/70 mb-6 text-sm max-w-xs">
                    You&apos;ve helped the planet and earned rewards
                </p>
                <div className="bg-card-green rounded-2xl border-2 border-dark shadow-brutal-sm p-6 mb-6 w-full max-w-xs">
                    <p className="text-4xl font-black text-dark mb-2">+{coinsEarned}</p>
                    <p className="text-sm font-bold text-dark/70">🪙 Eco Coins Earned</p>
                </div>
                <button
                    onClick={() => router.push('/my-listings')}
                    className="w-full max-w-xs bg-dark text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal"
                >
                    View My Listings
                </button>
            </div>
        );
    }

    if (selectedListing) {
        const recycleCoins = Math.floor(selectedListing.price * 0.1);
        const donateCoins = recycleCoins + 10;

        return (
            <div className="min-h-screen bg-background">
                <PageHeader title="Choose Your Path" backHref="/my-listings/expired" />

                <div className="px-5 pb-28 pt-4 space-y-4">
                    {/* Item Card */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal p-4"
                    >
                        <div className="flex gap-3">
                            <div
                                className="w-20 h-20 rounded-xl border-2 border-dark bg-gray-100 shrink-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('${selectedListing.images[0]}')` }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-dark dark:text-white">{selectedListing.title}</p>
                                <p className="text-sm text-dark/60 dark:text-white/60 mt-1">Listed for ₹{selectedListing.price}</p>
                                <div className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg inline-flex items-center gap-1 mt-2">
                                    <span className="material-symbols-outlined text-orange-600 text-sm">schedule</span>
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">14 days expired</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Info */}
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card-blue rounded-xl border-2 border-dark shadow-brutal-sm px-4 py-3"
                    >
                        <p className="text-sm font-bold text-dark">📦 Equity Protocol Active</p>
                        <p className="text-xs text-dark/70 mt-1">Your item didn&apos;t sell in 14 days. Choose to recycle or donate it to earn Eco Coins!</p>
                    </motion.div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-4 mt-6">
                        {/* Recycle Option */}
                        <motion.button
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => handleEquityChoice(selectedListing.id, 'recycle')}
                            disabled={processing}
                            className="group bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl border-3 border-dark shadow-brutal p-6 text-left hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-4xl text-dark" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
                                        <div>
                                            <p className="text-xl font-black text-dark uppercase">Recycle It</p>
                                            <p className="text-sm font-bold text-dark/70">Send to partners</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-dark/60 mt-2">We&apos;ll send it to our recycling partners for proper processing</p>
                                </div>
                                <div className="bg-white/40 backdrop-blur-sm rounded-xl px-3 py-2 border border-dark/10 shrink-0 ml-3">
                                    <p className="text-2xl font-black text-dark">+{recycleCoins}</p>
                                    <p className="text-[10px] font-bold text-dark/70">COINS</p>
                                </div>
                            </div>
                        </motion.button>

                        {/* Donate Option */}
                        <motion.button
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => handleEquityChoice(selectedListing.id, 'donate')}
                            disabled={processing}
                            className="group bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl border-3 border-dark shadow-brutal p-6 text-left hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-4xl text-dark" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                        <div>
                                            <p className="text-xl font-black text-dark uppercase">Donate It</p>
                                            <p className="text-sm font-bold text-dark/70">Give to charity</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-dark/60 mt-2">Donate to local charities to help those in need</p>
                                    <div className="inline-flex items-center gap-1 bg-white/30 rounded-lg px-2 py-1 mt-2">
                                        <span className="material-symbols-outlined text-xs text-dark">grade</span>
                                        <span className="text-[10px] font-black text-dark">+10 BONUS COINS</span>
                                    </div>
                                </div>
                                <div className="bg-white/40 backdrop-blur-sm rounded-xl px-3 py-2 border border-dark/10 shrink-0 ml-3">
                                    <p className="text-2xl font-black text-dark">+{donateCoins}</p>
                                    <p className="text-[10px] font-bold text-dark/70">COINS</p>
                                </div>
                            </div>
                        </motion.button>
                    </div>

                    {processing && (
                        <div className="flex items-center justify-center gap-3 py-4">
                            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-bold text-dark/60">Processing...</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Expired Listings" backHref="/my-listings" />

            <motion.div
                className="px-5 pb-28 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : expiredListings.length === 0 ? (
                    <motion.div variants={itemVariants} className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-dark/30 dark:text-white/30 mb-4">inventory_2</span>
                        <p className="text-dark/60 dark:text-white/60 font-bold">No expired items</p>
                        <p className="text-sm text-dark/40 dark:text-white/40 mt-2">Items unsold after 14 days will appear here</p>
                    </motion.div>
                ) : (
                    expiredListings.map((listing) => (
                        <motion.div
                            key={listing.id}
                            variants={itemVariants}
                            onClick={() => setSelectedListing(listing)}
                            className="bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                            <div className="flex gap-3">
                                <div
                                    className="w-16 h-16 rounded-lg border-2 border-dark bg-gray-100 shrink-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url('${listing.images[0]}')` }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-dark dark:text-white">{listing.title}</p>
                                    <p className="text-sm text-dark/60 dark:text-white/60 mt-1">₹{listing.price}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-lg">
                                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Expired</span>
                                        </div>
                                        <span className="material-symbols-outlined text-dark/40 text-sm">arrow_forward</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* Demo Helper */}
                {!isLoading && expiredListings.length === 0 && (
                    <motion.div variants={itemVariants} className="bg-card-yellow rounded-xl border-2 border-dark shadow-brutal-sm px-4 py-3">
                        <p className="text-xs font-bold text-dark">💡 Demo Tip</p>
                        <p className="text-xs text-dark/70 mt-1">
                            Drop off an item at a Reloop Point, then use the &quot;Fast-Forward&quot; button in settings to simulate expiry.
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
