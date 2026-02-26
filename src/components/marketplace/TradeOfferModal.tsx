import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { Listing, UpcycleIdea, Mission } from '@/types';
import { MissionCompleteToast } from '@/components/ui/MissionCompleteToast';
import { GamificationService } from '@/lib/firebase/gamification-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import { formatRupeeValue } from '@/lib/eco-coins';

interface TradeOfferModalProps {
    targetListing: Listing;
    onClose: () => void;
    onSuccess: () => void;
}

export const TradeOfferModal = ({ targetListing, onClose, onSuccess }: TradeOfferModalProps) => {
    const { user } = useAuth();
    // Mock user inventory (listings created by current user)
    // In a real app, this would be fetched from API
    const [myInventory, setMyInventory] = useState<Listing[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [offeredCoins, setOfferedCoins] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [completedMission, setCompletedMission] = useState<Mission | null>(null);

    useEffect(() => {
        const loadInventory = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            // Get listings that are NOT the target listing and presumably belong to "me" (mock logic)
            // For demo, we'll just get some other listings
            const allListings = DemoManager.getMockListings();
            const others = allListings.filter(l => l.id !== targetListing.id).slice(0, 4);
            setMyInventory(others);
            setIsLoading(false);
        };
        loadInventory();
    }, [targetListing.id]);

    const handleSubmit = async () => {
        if (!selectedItemId && !offeredCoins) return;
        if (!user?.uid) {
            alert('Please log in to make an offer');
            return;
        }

        // Validate seller data exists
        if (!targetListing.seller?.id) {
            console.error('Seller data missing:', targetListing);
            alert('Unable to create offer - seller information is missing.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Import DBService to create real trade
            const { DBService } = await import('@/lib/firebase/db');

            // Get the selected item details if any
            const selectedItem = selectedItemId ? myInventory.find(i => i.id === selectedItemId) : null;

            // Create trade data with proper validation
            // Note: Don't include undefined values - Firestore rejects them
            const offeredCoinsNum = parseInt(offeredCoins) || 0;
            const tradeData = {
                listingId: targetListing.id,
                listingTitle: targetListing.title || 'Untitled',
                listingImage: targetListing.images?.[0] || '',
                sellerId: targetListing.seller.id,
                sellerName: targetListing.seller.name || 'Seller',
                sellerAvatar: targetListing.seller.avatar || '',
                traderId: user.uid,
                traderName: user.name || 'User',
                traderAvatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4ce68a&color=fff`,
                status: 'pending' as const,
                // Only include optional fields if they have values
                ...(selectedItem?.title ? { offeredItem: selectedItem.title } : {}),
                ...(offeredCoinsNum > 0 ? { offeredCoins: offeredCoinsNum } : {}),
            };

            console.log('Creating trade with data:', tradeData);

            // Save trade to Firestore
            const tradeId = await DBService.createTrade(tradeData);
            console.log('Trade created successfully:', tradeId);

            // Create a conversation with the seller and send trade offer as offer card
            try {
                // Find or create conversation with listing context
                const conversationId = await DBService.findOrCreateConversation(
                    user.uid,
                    targetListing.seller.id,
                    targetListing.id,
                    targetListing.title,
                    targetListing.images?.[0],
                    targetListing.price,
                    targetListing.seller.name,
                    targetListing.seller.avatar
                );

                // Send the trade offer as an offer-type message (shows as OfferCard)
                await DBService.sendOffer(
                    conversationId,
                    user.uid,
                    offeredCoinsNum,
                    targetListing.title
                );
                console.log('Conversation created with offer card:', conversationId);
            } catch (convError) {
                console.warn('Failed to create conversation:', convError);
                // Don't fail the whole trade if conversation creation fails
            }

            // Create notification for the seller (don't fail if this fails)
            try {
                await DBService.createNotification({
                    userId: targetListing.seller.id,
                    type: 'trade',
                    title: 'New Trade Offer!',
                    message: `${tradeData.traderName} wants to trade for your "${targetListing.title}"`,
                    icon: 'swap_horiz',
                    actionUrl: '/messages',
                });
            } catch (notifError) {
                console.warn('Failed to create notification:', notifError);
            }

            // Check for mission completion
            try {
                const mission = await GamificationService.updateMissionProgress(user.uid, 'trade');
                if (mission) {
                    setCompletedMission(mission);
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 2500);
                    return;
                }
            } catch (err) {
                console.error('Error updating mission:', err);
            }

            setIsSubmitting(false);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating trade:', error);
            console.error('Error details:', error?.message, error?.code);
            alert(`Failed to create trade offer: ${error?.message || 'Unknown error'}`);
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-dark/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t-2 sm:border-2 border-dark max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b-2 border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-[900] text-dark dark:text-white uppercase tracking-wide">
                            Make an Offer
                        </h2>
                        <p className="text-xs text-dark/60 dark:text-gray-400">Trading for <span className="font-bold">{targetListing.title}</span></p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-dark dark:text-gray-300">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* 1. Offer Coins */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-dark dark:text-white mb-2 uppercase tracking-wider">
                            Offer Coins
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🪙</span>
                            <input
                                type="number"
                                value={offeredCoins}
                                onChange={e => setOfferedCoins(e.target.value)}
                                placeholder={`Asking price: ${targetListing.price}`}
                                className="w-full pl-12 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:outline-none font-bold text-lg dark:text-white transition-all"
                            />
                        </div>
                        {offeredCoins && (
                            <p className="text-sm text-gray-500 mt-2 text-center font-bold">
                                = {formatRupeeValue(parseInt(offeredCoins) || 0)}
                            </p>
                        )}
                    </div>

                    {/* 2. Offer Items */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-bold text-dark dark:text-white uppercase tracking-wider">
                                Or Trade Item
                            </label>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                Optional
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex gap-3 overflow-x-auto pb-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-32 h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse shrink-0" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {myInventory.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                                        className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${selectedItemId === item.id
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 dark:ring-offset-dark'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="aspect-square bg-gray-100 dark:bg-dark-bg">
                                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs font-bold text-dark dark:text-white truncate">{item.title}</p>
                                            <p className="text-[10px] text-gray-500">🪙 {item.price}</p>
                                        </div>
                                        {selectedItemId === item.id && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border border-dark shadow-sm">
                                                <span className="material-symbols-outlined text-sm text-dark font-bold">check</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pb-28 border-t-2 border-gray-100 dark:border-gray-700 flex gap-3 shrink-0 bg-white dark:bg-dark-surface z-10 safe-area-bottom">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 font-bold text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!offeredCoins && !selectedItemId)}
                        className="flex-[2] py-4 bg-primary text-dark font-black uppercase tracking-wide rounded-2xl shadow-brutal hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Send Offer</span>
                                <span className="material-symbols-outlined">send</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Mission Toast */}
            {completedMission && (
                <MissionCompleteToast
                    mission={completedMission}
                    onClose={() => setCompletedMission(null)}
                />
            )}
        </motion.div>
    );
};
