'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Listing } from '@/types';
import { useNavContext, NavPresets } from '@/lib/hooks/useNavContext';
import { TradeOfferModal } from '@/components/marketplace/TradeOfferModal';

// Format price as Indian Rupees
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ItemDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isDemo } = useAuth();
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Owner detection
    const currentUserId = isDemo ? 'demo-user-123' : user?.uid;
    const isOwner = listing?.seller?.id === currentUserId;

    useEffect(() => {
        const loadListing = async () => {
            setIsLoading(true);
            const id = params.id as string;

            // Try Firebase first with timeout
            try {
                const firebasePromise = DBService.getListingById(id);
                const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

                const firebaseListing = await Promise.race([firebasePromise, timeoutPromise]);

                if (firebaseListing) {
                    setListing(firebaseListing);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Firebase listing fetch failed:', error);
            }

            // Fallback to DemoManager
            const found = DemoManager.getListingById?.(id);
            if (!found) {
                console.log('Listing not found in Firebase or DemoManager, redirecting...');
                router.push('/marketplace');
                return;
            }

            setListing(found);
            setIsLoading(false);
        };

        loadListing();
    }, [params.id, router]);

    // Dynamic navigation context using presets
    const navContextConfig = useMemo(() => {
        if (!listing) return null;

        return NavPresets.itemDetail({
            onMessage: () => router.push(`/messages/new?itemId=${listing.id}&sellerId=${listing.seller?.id}`),
            onBack: () => router.back(),
            onShare: () => {
                if (navigator.share) {
                    navigator.share({
                        title: listing.title,
                        text: `Check out ${listing.title} on ReLoop!`,
                        url: window.location.href,
                    });
                }
            },
            onSave: () => setIsFavorited(!isFavorited),
            isOwner,
            onEdit: () => router.push(`/marketplace/${listing.id}/edit`),
        });
    }, [listing, isOwner, isFavorited, router]);

    // Register the navigation context
    useNavContext(navContextConfig);

    const handleTradeSuccess = () => {
        setShowTradeModal(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    if (isLoading || !listing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    const co2Saved = listing.co2Saved || 15;
    const ecoPoints = Math.round((listing.price || 0) * 1.5);

    return (
        <div className="relative min-h-screen flex flex-col pb-28 bg-background overflow-x-hidden">
            {/* Hero Image Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full pt-6 pb-16 px-6 flex flex-col items-center justify-start bg-gradient-to-b from-blue-100 via-blue-50 to-background dark:from-blue-900/30 dark:via-blue-900/10 dark:to-background"
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-6 z-10">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <Link href="/marketplace" className="flex items-center justify-center w-12 h-12 bg-white dark:bg-dark-surface rounded-full border-2 border-dark shadow-brutal-sm active:scale-95 transition-transform">
                            <span className="material-symbols-outlined text-dark dark:text-white">arrow_back</span>
                        </Link>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-bold tracking-widest uppercase text-dark/50 dark:text-white/50"
                    >
                        Item Detail
                    </motion.p>
                    <motion.button
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        onClick={() => setIsFavorited(!isFavorited)}
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-dark-surface rounded-full border-2 border-dark shadow-brutal-sm active:scale-95 transition-transform"
                    >
                        <span
                            className={`material-symbols-outlined ${isFavorited ? 'text-red-500' : 'text-dark dark:text-white'}`}
                            style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                        >
                            favorite
                        </span>
                    </motion.button>
                </div>

                {/* Product Image */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative w-full max-w-sm mx-auto"
                >
                    <div className="aspect-square w-full rounded-3xl border-4 border-dark shadow-brutal overflow-hidden bg-white dark:bg-dark-surface">
                        <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {listing.isTopImpact && (
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: -2 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="absolute -bottom-4 -right-4 bg-primary text-dark px-4 py-2 rounded-full border-4 border-dark shadow-brutal-sm flex items-center gap-2 z-10 rotate-[-2deg]"
                        >
                            <span className="material-symbols-outlined material-symbols-filled text-lg">eco</span>
                            <span className="text-xs font-black uppercase tracking-wider">Top Impact</span>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* Content Card */}
            <motion.div
                className="flex-1 w-full px-4 -mt-6 z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="bg-white dark:bg-dark-surface w-full rounded-3xl border-3 border-dark shadow-brutal p-5 space-y-5">

                    {/* Eco Impact Banner */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-primary rounded-2xl border-4 border-dark shadow-[4px_4px_0px_0px_#000] p-4 relative overflow-hidden group"
                    >
                        <div className="flex items-center gap-3 relative z-10">
                            <span className="material-symbols-outlined text-2xl text-dark">forest</span>
                            <div>
                                <span className="block text-[10px] font-bold uppercase opacity-80 mb-0.5 text-dark">Eco Impact</span>
                                <span className="block text-xl font-black uppercase leading-none text-dark">YOU CAN SAVE {co2Saved} KG OF CO<sub>2</sub></span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Title & Price */}
                    <motion.div variants={itemVariants}>
                        <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tight mb-4 text-dark dark:text-white">{listing.title}</h2>
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center justify-center bg-primary px-5 py-3 rounded-full border-4 border-dark shadow-[3px_3px_0px_0px_#000]">
                                <span className="font-black text-lg text-dark">{formatPrice(listing.price)}</span>
                            </div>
                            {!isOwner && (
                                <button
                                    onClick={() => setShowTradeModal(true)}
                                    className="flex-1 bg-accent-yellow text-dark font-black uppercase text-sm py-3 px-4 rounded-full border-4 border-dark shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined font-black" style={{ fontSize: '20px' }}>swap_horiz</span>
                                    Request for Trade
                                </button>
                            )}
                            {isOwner && (
                                <span className="px-4 py-3 bg-accent-yellow text-dark rounded-full text-sm font-bold border-4 border-dark shadow-[3px_3px_0px_0px_#000]">
                                    Your Listing
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Impact Stats Grid */}
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
                        {[
                            { icon: 'water_drop', label: 'Water', bg: 'bg-blue-100' },
                            { icon: 'delete', label: 'Waste', bg: 'bg-orange-100' },
                            { icon: 'forest', label: 'Points', bg: 'bg-green-100' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.icon}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                                className="flex flex-col items-center gap-1"
                            >
                                <div className={`w-12 h-12 ${stat.bg} rounded-xl border-2 border-dark flex items-center justify-center`}>
                                    <span className="material-symbols-outlined material-symbols-filled text-xl text-dark">{stat.icon}</span>
                                </div>
                                <span className="text-[10px] font-bold text-dark/60 dark:text-white/60 uppercase">{stat.label}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Details */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-white dark:bg-dark-surface border-4 border-dark shadow-[3px_3px_0px_0px_#000]">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Condition</span>
                            <p className="text-lg font-bold text-dark dark:text-white">{listing.condition}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-dark-surface border-4 border-dark shadow-[3px_3px_0px_0px_#000]">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Category</span>
                            <p className="text-lg font-bold text-dark dark:text-white">{listing.category}</p>
                        </div>
                    </motion.div>

                    {/* Description */}
                    <motion.div variants={itemVariants}>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{listing.description}</p>
                    </motion.div>

                    {/* Seller Card - Hide for owner, show for buyers */}
                    {!isOwner && (
                        <motion.div
                            variants={itemVariants}
                            className="bg-gray-50 dark:bg-dark-bg rounded-2xl border-4 border-dark p-4 flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-2 border-dark overflow-hidden bg-gray-300">
                                        <img src={listing.seller.avatar} alt={listing.seller.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-dark-surface" />
                                </div>
                                <div>
                                    <p className="font-bold text-dark dark:text-white">{listing.seller.name}</p>
                                    <p className="text-xs text-dark/50 dark:text-white/50 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-primary text-xs">bolt</span>
                                        Responds in {listing.seller.responseTime || '2h'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/messages/new?sellerId=${listing.seller.id}&listingId=${listing.id}&listingTitle=${encodeURIComponent(listing.title)}`)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-dark-surface border-2 border-dark shadow-brutal-sm active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined text-dark dark:text-white">chat</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Owner Actions */}
                    {isOwner && (
                        <motion.div variants={itemVariants} className="flex gap-3">
                            <button
                                onClick={() => router.push(`/marketplace/${listing.id}/edit`)}
                                className="flex-1 h-12 bg-white dark:bg-dark-surface border-2 border-dark rounded-xl font-bold text-dark dark:text-white shadow-brutal-sm flex items-center justify-center gap-2 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                            >
                                <span className="material-symbols-outlined">edit</span>
                                Edit Listing
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('Delete this listing?')) {
                                        if (!isDemo && currentUserId) {
                                            try {
                                                const success = await DBService.deleteListing(listing.id, currentUserId);
                                                if (!success) {
                                                    alert('Failed to delete listing.');
                                                    return;
                                                }
                                            } catch (err) {
                                                console.error('Delete failed:', err);
                                                alert('Failed to delete listing.');
                                                return;
                                            }
                                        }
                                        router.push('/marketplace');
                                    }
                                }}
                                className="h-12 px-4 bg-red-100 dark:bg-red-900/30 border-2 border-dark rounded-xl font-bold text-red-600 shadow-brutal-sm flex items-center justify-center active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {showTradeModal && (
                    <TradeOfferModal
                        targetListing={listing}
                        onClose={() => setShowTradeModal(false)}
                        onSuccess={handleTradeSuccess}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-dark text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl z-50 flex items-center gap-2 w-max"
                    >
                        <span className="material-symbols-outlined text-green-400">check_circle</span>
                        Trade offer sent!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Action Navigation */}
            <motion.nav
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm"
            >
                <div className="bg-white dark:bg-dark-surface rounded-full border-4 border-dark shadow-[6px_6px_0px_0px_#000] py-3 px-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors"
                        aria-label="Go back"
                    >
                        <span className="material-symbols-outlined text-2xl text-dark dark:text-white">arrow_back</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                        onClick={() => setIsFavorited(!isFavorited)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors"
                        aria-label="Bookmark"
                    >
                        <span
                            className={`material-symbols-outlined text-2xl ${isFavorited ? 'text-red-500' : 'text-dark dark:text-white'}`}
                            style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                        >
                            bookmark
                        </span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: listing.title,
                                    text: `Check out ${listing.title} on ReLoop!`,
                                    url: window.location.href,
                                });
                            }
                        }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors"
                        aria-label="Share"
                    >
                        <span className="material-symbols-outlined text-2xl text-dark dark:text-white">share</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full transition-colors"
                        aria-label="More options"
                    >
                        <span className="material-symbols-outlined text-2xl text-dark dark:text-white">more_horiz</span>
                    </button>
                </div>
            </motion.nav>
        </div>
    );
}
