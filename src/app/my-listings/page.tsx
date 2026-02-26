'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
import { Listing, Trade } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { CreateListingWizard } from '@/components/ui/CreateListingWizard';

const STATUS_CONFIG = {
    available: { label: 'Active', color: 'bg-primary text-dark', icon: '🟢' },
    pending: { label: 'Pending', color: 'bg-yellow-400 text-dark', icon: '🟡' },
    sold: { label: 'Sold', color: 'bg-gray-400 text-white', icon: '🔴' }
};

export default function MyListingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');
    const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [expandedListing, setExpandedListing] = useState<string | null>(null);
    const [processingTradeId, setProcessingTradeId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadListings();
        }
    }, [user, authLoading, router]);

    const loadListings = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Load both listings and trades in parallel
            const [userListings, userTrades] = await Promise.all([
                DBService.getUserListings(user.uid),
                DBService.getUserTrades(user.uid)
            ]);
            setListings(userListings);
            // Convert Firestore timestamps and filter for pending trades where user is seller
            const formattedTrades = userTrades.map((t: any) => ({
                ...t,
                createdAt: t.createdAt?.toDate?.() || new Date()
            }));
            setTrades(formattedTrades);
        } catch (error) {
            console.error('Failed to load listings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get pending trades for a specific listing
    const getTradesForListing = (listingId: string) => {
        return trades.filter(t => t.listingId === listingId && t.status === 'pending');
    };

    // Handle accept trade
    const handleAcceptTrade = async (trade: Trade) => {
        if (!user?.uid) return;
        setProcessingTradeId(trade.id);
        try {
            await DBService.updateTradeStatus(trade.id, 'accepted');
            // Transfer coins if offered
            if (trade.offeredCoins && trade.offeredCoins > 0) {
                await DBService.transferCoins(trade.traderId, user.uid, trade.offeredCoins);
            }
            // Reload data
            await loadListings();
            // Navigate to verify trade
            router.push('/verify-trade');
        } catch (error) {
            console.error('Error accepting trade:', error);
            alert('Failed to accept trade. Please try again.');
        } finally {
            setProcessingTradeId(null);
        }
    };

    // Handle decline trade
    const handleDeclineTrade = async (trade: Trade) => {
        if (!user?.uid) return;
        setProcessingTradeId(trade.id);
        try {
            await DBService.updateTradeStatus(trade.id, 'declined');
            await loadListings();
        } catch (error) {
            console.error('Error declining trade:', error);
            alert('Failed to decline trade. Please try again.');
        } finally {
            setProcessingTradeId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || !user) return;
        setIsDeleting(true);
        try {
            const success = await DBService.deleteListing(deleteTarget.id, user.uid);
            if (success) {
                setListings(prev => prev.filter(l => l.id !== deleteTarget.id));
                setDeleteTarget(null);
            }
        } catch (error) {
            console.error('Failed to delete listing:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredListings = listings.filter(l =>
        filter === 'all' ? true : l.status === filter
    );

    // Count pending trades
    const pendingTradesCount = trades.filter(t => t.status === 'pending').length;

    const counts = {
        all: listings.length,
        available: listings.filter(l => l.status === 'available').length,
        sold: listings.filter(l => l.status === 'sold').length
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-sky flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sky pb-24">
            <PageHeader title="My Listings" />

            {/* Stats Bar */}
            <div className="px-4 pt-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {(['all', 'available', 'sold'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${filter === f
                                ? 'bg-dark text-white'
                                : 'bg-white text-dark border-2 border-gray-200'
                                }`}
                        >
                            {f === 'all' ? '📋' : STATUS_CONFIG[f].icon}
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${filter === f ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {counts[f]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Listings Grid */}
            <div className="p-4">
                {filteredListings.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-dark shadow-brutal">
                            <span className="text-5xl">📦</span>
                        </div>
                        <h2 className="text-2xl font-black text-dark mb-2">
                            {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all'
                                ? 'Create your first listing to start trading!'
                                : 'Try a different filter'}
                        </p>
                        {filter === 'all' && (
                            <button
                                onClick={() => setShowWizard(true)}
                                className="px-8 py-4 bg-primary text-dark font-black rounded-full shadow-brutal hover:scale-105 active:scale-95 transition-transform"
                            >
                                Create Listing
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredListings.map((listing, i) => {
                            const listingTrades = getTradesForListing(listing.id);
                            const hasOffers = listingTrades.length > 0;
                            const isExpanded = expandedListing === listing.id;

                            return (
                                <motion.div
                                    key={listing.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border-3 border-dark shadow-brutal overflow-hidden"
                                >
                                    <div className="flex gap-4 p-3">
                                        {/* Image */}
                                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shrink-0 relative">
                                            {listing.images?.[0] ? (
                                                <Image
                                                    src={listing.images[0]}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-2xl">📦</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-dark truncate">{listing.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_CONFIG[listing.status].color}`}>
                                                    {STATUS_CONFIG[listing.status].label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 capitalize">{listing.category}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-lg">🪙</span>
                                                    <span className="font-black text-dark">{listing.price}</span>
                                                </div>
                                                {/* Trade offers badge */}
                                                {hasOffers && (
                                                    <button
                                                        onClick={() => setExpandedListing(isExpanded ? null : listing.id)}
                                                        className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold animate-pulse"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                                        {listingTrades.length} offer{listingTrades.length > 1 ? 's' : ''}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Trade Offers Section */}
                                    <AnimatePresence>
                                        {isExpanded && hasOffers && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t-2 border-gray-100 bg-yellow-50 overflow-hidden"
                                            >
                                                <div className="p-3 space-y-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Trade Offers</p>
                                                    {listingTrades.map(trade => (
                                                        <div key={trade.id} className="bg-white rounded-xl p-3 border border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                                                                    <img src={trade.traderAvatar} alt={trade.traderName} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-dark text-sm truncate">{trade.traderName}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                        {trade.offeredCoins && (
                                                                            <span className="flex items-center gap-1">
                                                                                🪙 {trade.offeredCoins}
                                                                            </span>
                                                                        )}
                                                                        {trade.offeredItem && (
                                                                            <span className="flex items-center gap-1">
                                                                                ↔ {trade.offeredItem}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Accept/Decline buttons */}
                                                            <div className="flex gap-2 mt-3">
                                                                <button
                                                                    onClick={() => handleDeclineTrade(trade)}
                                                                    disabled={processingTradeId === trade.id}
                                                                    className="flex-1 py-2 rounded-lg border-2 border-red-300 text-red-600 font-bold text-xs hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                                                                >
                                                                    {processingTradeId === trade.id ? (
                                                                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                                            Decline
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAcceptTrade(trade)}
                                                                    disabled={processingTradeId === trade.id}
                                                                    className="flex-1 py-2 rounded-lg bg-primary border-2 border-dark text-dark font-bold text-xs shadow-brutal-sm hover:shadow-none active:translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                                                                >
                                                                    {processingTradeId === trade.id ? (
                                                                        <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                                            Accept
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Actions */}
                                    <div className="flex border-t border-gray-100">
                                        <Link
                                            href={`/marketplace/${listing.id}`}
                                            className="flex-1 py-2.5 text-center text-sm font-bold text-dark hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                            View
                                        </Link>
                                        <div className="w-px bg-gray-100" />
                                        {/* Trade Offers button */}
                                        <button
                                            onClick={() => setExpandedListing(isExpanded ? null : listing.id)}
                                            className={`flex-1 py-2.5 text-center text-sm font-bold transition-colors flex items-center justify-center gap-1 ${hasOffers ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-400'}`}
                                        >
                                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                            Offers
                                            {hasOffers && (
                                                <span className="w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                                                    {listingTrades.length}
                                                </span>
                                            )}
                                        </button>
                                        <div className="w-px bg-gray-100" />
                                        {/* Chat button */}
                                        <Link
                                            href={`/messages/new?listingId=${listing.id}`}
                                            className="flex-1 py-2.5 text-center text-sm font-bold text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">chat</span>
                                            Chat
                                        </Link>
                                        <div className="w-px bg-gray-100" />
                                        <button
                                            onClick={() => setDeleteTarget(listing)}
                                            className="flex-1 py-2.5 text-center text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FAB */}
            {listings.length > 0 && (
                <button
                    onClick={() => setShowWizard(true)}
                    className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-dark rounded-full border-3 border-dark shadow-brutal flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-2xl">add</span>
                </button>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-dark/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => !isDeleting && setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm border-4 border-dark shadow-brutal"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                                </div>
                                <h3 className="text-xl font-black text-dark mb-2">Delete Listing?</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Are you sure you want to delete "{deleteTarget.title}"? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 bg-gray-100 text-dark font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            'Delete'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Listing Wizard */}
            <CreateListingWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSuccess={loadListings}
            />
        </div>
    );
}
