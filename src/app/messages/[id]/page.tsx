'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ChatMessage, Message } from '@/types';
import { useNavContext, NavPresets } from '@/lib/hooks/useNavContext';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { InlineOffer } from '@/components/chat/InlineOffer';
import { OfferCard } from '@/components/chat/OfferCard';
import { QRCodeMessage } from '@/components/chat/QRCodeMessage';

// Format price as Indian Rupees
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;
    const { user } = useAuth();
    const [messages, setChatMessages] = useState<ChatMessage[]>([]);
    const [contact, setContact] = useState<Message | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showOfferUI, setShowOfferUI] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Real-time message subscription
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupRealtime = async () => {
            if (user?.uid) {
                try {
                    // Get conversation info
                    const conversations = await DBService.getConversations(user.uid);
                    const conv: any = conversations.find((c: any) => c.id === conversationId);

                    if (conv) {
                        // Find the other participant
                        const otherParticipantId = conv.participants.find((p: string) => p !== user.uid);
                        // Use stored seller info (from when conversation was created)
                        const contactName = conv.sellerName || conv.otherParticipantName || 'User';
                        const contactAvatar = conv.sellerAvatar || conv.otherParticipantAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=4ce68a&color=fff`;

                        setContact({
                            id: conv.id,
                            senderId: otherParticipantId || conversationId,
                            senderName: contactName,
                            senderAvatar: contactAvatar,
                            lastMessage: '',
                            timestamp: new Date(),
                            unread: false,
                            conversationType: conv.listingId ? 'marketplace' : 'community',
                            listingTitle: conv.listingTitle,
                            listingPrice: conv.listingPrice,
                            listingImage: conv.listingImage,
                            listingId: conv.listingId,
                        });
                    }

                    // Subscribe to real-time messages
                    unsubscribe = DBService.subscribeToMessages(conversationId, (firebaseMessages) => {
                        const formattedMessages = firebaseMessages.map((m: any) => ({
                            id: m.id,
                            senderId: m.senderId,
                            text: m.text,
                            timestamp: m.timestamp?.toDate?.() || new Date(),
                            isOwn: m.senderId === user.uid,
                            read: m.read || false,
                            type: m.type || 'text',
                            offerAmount: m.offerAmount,
                            offerStatus: m.offerStatus,
                            counterAmount: m.counterAmount,
                            qrType: m.qrType,
                            qrData: m.qrData,
                        }));
                        setChatMessages(formattedMessages);
                        setIsLoading(false);
                    });
                } catch (error) {
                    console.error('Error setting up real-time chat:', error);
                    loadMockData();
                }
            } else {
                loadMockData();
            }
        };

        const loadMockData = () => {
            const allMessages = DemoManager.getMockMessages();
            // Find by message id first, then fall back to senderId for legacy support
            const found = allMessages.find(m => m.id === conversationId) ||
                allMessages.find(m => m.senderId === conversationId);
            if (found) setContact(found as Message);
            setChatMessages(DemoManager.getConversation(conversationId));
            DemoManager.markConversationRead(conversationId);
            setIsLoading(false);
        };

        setupRealtime();

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [conversationId, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Dynamic navigation context for chat
    const navContextConfig = useMemo(() => {
        if (!contact) return null;

        // Only show offer action for marketplace conversations
        if (contact.conversationType !== 'marketplace') return null;

        return NavPresets.chat({
            onOffer: () => {
                // Pre-fill offer message
                const offerAmount = contact.listingPrice
                    ? Math.round(contact.listingPrice * 0.9)
                    : 0;
                setNewMessage(`I'd like to offer ${formatPrice(offerAmount)} for this item. Let me know if that works!`);
            },
            onBack: () => router.back(),
            onCall: () => {
                // Could integrate with phone/video calling
                alert('Calling feature coming soon!');
            },
            onAttach: () => {
                // Could open media picker
                alert('Attach media coming soon!');
            },
        });
    }, [contact, router]);

    useNavContext(navContextConfig);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const msg: ChatMessage = {
            id: `chat-${Date.now()}`,
            senderId: user?.uid || 'demo-user-123',
            text: newMessage.trim(),
            timestamp: new Date(),
            isOwn: true,
        };

        // Optimistic update for smoother UX
        setChatMessages(prev => [...prev, msg]);
        setNewMessage('');

        // Send via Firebase if authenticated
        if (user?.uid) {
            try {
                await DBService.sendMessage(conversationId, user.uid, msg.text);
            } catch (error) {
                console.error('Failed to send message:', error);
                // Revert on error
                setChatMessages(prev => prev.filter(m => m.id !== msg.id));
            }
        } else {
            // Mock mode - add to DemoManager and simulate reply
            DemoManager.addMessage(conversationId, msg);

            setTimeout(() => {
                const replies = [
                    'Sounds good! Let me know if you have any questions.',
                    'Great, I\'ll be around campus today!',
                    'Sure thing! When works for you?',
                    'Awesome, looking forward to it!',
                ];
                const reply: ChatMessage = {
                    id: `chat-${Date.now() + 1}`,
                    senderId: conversationId,
                    text: replies[Math.floor(Math.random() * replies.length)],
                    timestamp: new Date(),
                    isOwn: false,
                };
                DemoManager.addMessage(conversationId, reply);
                setChatMessages(prev => [...prev, reply]);
            }, 1500);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="px-5 pt-6 pb-4 flex items-center gap-4 border-b-2 border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg sticky top-0 z-20">
                <Link
                    href="/messages"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm shrink-0"
                >
                    <span className="material-symbols-outlined text-dark dark:text-white">arrow_back</span>
                </Link>
                {contact && (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full border-2 border-dark dark:border-gray-600 overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                            <img src={contact.senderAvatar} alt={contact.senderName} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-dark dark:text-white truncate">{contact.senderName}</p>
                            {contact.listingTitle && (
                                <p className="text-xs text-primary font-bold truncate">{contact.listingTitle}</p>
                            )}
                        </div>
                    </div>
                )}
                {/* Real-time indicator */}
                {user?.uid && (
                    <div className="flex items-center gap-1 text-xs text-green-500 font-bold">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live
                    </div>
                )}
            </header>

            {/* Context Header - Shows item/project info - STICKY */}
            {contact && (contact.conversationType === 'marketplace' || contact.listingTitle || contact.projectId) && (
                <div className="px-5 py-3 bg-gray-50/95 dark:bg-dark-surface/95 backdrop-blur-md border-b-2 border-gray-100 dark:border-gray-700 flex items-center gap-3 sticky top-[72px] z-10">
                    {/* Item/Project Image */}
                    <div className="w-14 h-14 rounded-xl border-2 border-dark overflow-hidden bg-gray-200 shrink-0">
                        <img
                            src={contact.listingImage || 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100&h=100&fit=crop'}
                            alt={contact.listingTitle || contact.projectTitle || 'Item'}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Item/Project Details */}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-dark dark:text-white truncate text-sm">
                            {contact.listingTitle || contact.projectTitle}
                        </p>
                        {contact.listingPrice && (
                            <p className="text-primary font-black text-lg">
                                {formatPrice(contact.listingPrice)}
                            </p>
                        )}
                        {contact.projectTitle && !contact.listingPrice && (
                            <p className="text-xs text-gray-500">DIY Project Discussion</p>
                        )}
                    </div>

                    {/* Make Offer Button - Only for marketplace items */}
                    {contact.conversationType === 'marketplace' && contact.listingPrice && (
                        <button
                            onClick={() => setShowOfferUI(true)}
                            className="shrink-0 h-10 px-4 bg-[#fde047] text-dark font-bold text-sm rounded-xl border-2 border-dark shadow-brutal-sm flex items-center gap-2 active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">local_offer</span>
                            Offer
                        </button>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">chat_bubble</span>
                        <p className="text-gray-500 font-medium">No messages yet</p>
                        <p className="text-gray-400 text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Offer Card for offer-type messages */}
                            {msg.type === 'offer' && msg.offerAmount ? (
                                <OfferCard
                                    amount={msg.offerAmount}
                                    status={msg.offerStatus || 'pending'}
                                    counterAmount={msg.counterAmount}
                                    isSeller={!msg.isOwn} // If not my message, I'm the seller receiving the offer
                                    isOwn={msg.isOwn}
                                    onAccept={async () => {
                                        if (user?.uid && msg.offerAmount && contact) {
                                            try {
                                                // Update offer status with all required data for QR generation
                                                await DBService.updateOfferStatus(
                                                    conversationId,
                                                    msg.id,
                                                    'accepted',
                                                    undefined, // counterAmount
                                                    msg.offerAmount,
                                                    contact.listingId,
                                                    contact.listingTitle,
                                                    user.uid, // seller (current user accepting)
                                                    msg.senderId // buyer (person who sent offer)
                                                );

                                                // Mark the listing as pending (will be sold after QR pickup scan)
                                                if (contact.listingId) {
                                                    await DBService.updateListingStatus(contact.listingId, 'pending');
                                                    alert(`🎉 Deal confirmed! Pickup QR sent to buyer. Item will be removed from marketplace after pickup is complete.`);
                                                }
                                            } catch (error) {
                                                console.error('Error accepting offer:', error);
                                                alert('Failed to accept offer. Please try again.');
                                            }
                                        }
                                    }}
                                    onDecline={async () => {
                                        if (user?.uid) {
                                            try {
                                                await DBService.updateOfferStatus(conversationId, msg.id, 'declined');
                                            } catch (error) {
                                                console.error('Error declining offer:', error);
                                            }
                                        }
                                    }}
                                    timestamp={msg.timestamp}
                                />
                            ) : msg.type === 'qr' && msg.qrData ? (
                                /* QR Code message (pickup/dropoff) */
                                <QRCodeMessage
                                    type={msg.qrType || 'pickup'}
                                    qrData={msg.qrData}
                                    isOwn={msg.isOwn}
                                    timestamp={msg.timestamp}
                                />
                            ) : msg.type === 'system' ? (
                                /* System message (offer accepted/declined) */
                                <div className="w-full text-center py-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                        {msg.text}
                                    </span>
                                </div>
                            ) : (
                                /* Regular text message */
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium ${msg.isOwn
                                        ? 'bg-primary text-dark rounded-br-md border-2 border-dark dark:border-gray-600'
                                        : 'bg-white dark:bg-dark-surface text-dark dark:text-white rounded-bl-md border-2 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : ''}`}>
                                        <span className={`text-[10px] ${msg.isOwn ? 'text-dark/50 dark:text-white/50' : 'text-dark/40 dark:text-white/40'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {/* Read receipt for own messages */}
                                        {msg.isOwn && (
                                            <span className={`text-[10px] ${msg.read ? 'text-blue-500' : 'text-gray-400'}`}>
                                                {msg.read ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Inline Offer UI - OLX Style */}
            <AnimatePresence>
                {showOfferUI && contact?.listingPrice && (
                    <InlineOffer
                        listingPrice={contact.listingPrice}
                        onSubmit={async (amount) => {
                            setShowOfferUI(false);

                            // If logged in, use Firebase
                            if (user?.uid) {
                                try {
                                    await DBService.sendOffer(
                                        conversationId,
                                        user.uid,
                                        amount,
                                        contact.listingTitle
                                    );
                                } catch (error) {
                                    console.error('Error sending offer:', error);
                                    alert('Failed to send offer. Please try again.');
                                }
                            } else {
                                // Demo mode - add as regular message
                                const offerMessage = `💰 Offer: ${amount} coins\n\nI'd like to offer ${amount} coins for "${contact.listingTitle}". Let me know if that works!`;
                                const msg: ChatMessage = {
                                    id: `chat-${Date.now()}`,
                                    senderId: 'demo-user-123',
                                    text: offerMessage,
                                    timestamp: new Date(),
                                    isOwn: true,
                                    type: 'offer',
                                    offerAmount: amount,
                                    offerStatus: 'pending',
                                };
                                setChatMessages(prev => [...prev, msg]);
                                DemoManager.addMessage(conversationId, msg);
                            }
                        }}
                        onCancel={() => setShowOfferUI(false)}
                    />
                )}
            </AnimatePresence>

            {/* Standard Input - Hidden when offer UI is showing */}
            {!showOfferUI && (
                <div className="sticky bottom-0">
                    {/* Quick Replies - Inline with input, shown when user toggles or no messages */}
                    <AnimatePresence>
                        {contact && contact.conversationType === 'marketplace' && showQuickReplies && (
                            <QuickReplies
                                onSelect={(message) => {
                                    setNewMessage(message);
                                    setShowQuickReplies(false);
                                }}
                                listingTitle={contact.listingTitle}
                                listingPrice={contact.listingPrice}
                            />
                        )}
                    </AnimatePresence>

                    <div className="p-4 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-t-2 border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            {/* Quick Reply Toggle Button */}
                            {contact?.conversationType === 'marketplace' && (
                                <button
                                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${showQuickReplies
                                        ? 'bg-primary border-dark text-dark'
                                        : 'bg-gray-100 dark:bg-dark-surface border-gray-200 dark:border-gray-600 text-gray-500'
                                        }`}
                                    title="Quick replies"
                                >
                                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                                </button>
                            )}
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 h-12 rounded-full bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 px-5 font-medium placeholder:text-gray-400 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim()}
                                className="w-12 h-12 bg-primary rounded-full border-2 border-dark dark:border-gray-600 flex items-center justify-center shadow-brutal-sm disabled:opacity-50 active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined text-dark dark:text-white">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
