'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
import { Message } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
};

type TabType = 'marketplace' | 'community';

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('marketplace');
    const { isDemo, user } = useAuth();

    useEffect(() => {
        const loadMessages = async () => {
            setIsLoading(true);
            try {
                if (isDemo) {
                    // Demo mode only - use mock data
                    setMessages(DemoManager.getMockMessages());
                } else if (user) {
                    // Firebase mode - load conversations for logged-in users
                    const conversations = await DBService.getConversations(user.uid);
                    console.log('Loaded conversations:', conversations);

                    // Transform conversations to Message format
                    const formattedMessages: Message[] = conversations.map((conv: any) => {
                        const otherParticipantId = conv.participants?.find((p: string) => p !== user.uid) || '';
                        // Try to get name from stored data or use fallback
                        const senderName = conv.sellerName || conv.otherParticipantName || 'Seller';
                        const senderAvatar = conv.sellerAvatar || conv.otherParticipantAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=4ce68a&color=fff`;

                        return {
                            id: conv.id,
                            senderId: otherParticipantId,
                            senderName,
                            senderAvatar,
                            lastMessage: conv.lastMessage || 'Start chatting!',
                            timestamp: conv.lastMessageAt?.toDate?.() || new Date(),
                            unread: conv.unreadCount > 0,
                            conversationType: conv.listingId ? 'marketplace' : 'community',
                            listingId: conv.listingId,
                            listingTitle: conv.listingTitle,
                            listingPrice: conv.listingPrice,
                            listingImage: conv.listingImage,
                        };
                    });
                    setMessages(formattedMessages);
                } else {
                    // No user - show empty
                    setMessages([]);
                }
            } catch (error) {
                console.error('Failed to load messages', error);
                // Don't fallback to demo data for logged-in users, just show empty
                if (isDemo) {
                    setMessages(DemoManager.getMockMessages());
                } else {
                    setMessages([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();

        // Subscribe to demo data updates (demo mode only)
        let unsubscribe = () => { };
        let pollInterval: NodeJS.Timeout | null = null;

        if (isDemo) {
            unsubscribe = DemoManager.subscribe(() => {
                setMessages([...DemoManager.getMockMessages()]);
            });
        } else if (user) {
            // Poll Firebase every 3 seconds for real-time message updates
            pollInterval = setInterval(loadMessages, 3000);
        }

        return () => {
            unsubscribe();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [isDemo, user]);

    // Format price as Indian Rupees
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Filter messages by tab
    const filteredMessages = messages.filter(m => m.conversationType === activeTab);

    // Count unread by type
    const marketplaceUnread = messages.filter(m => m.conversationType === 'marketplace' && m.unread).length;
    const communityUnread = messages.filter(m => m.conversationType === 'community' && m.unread).length;

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Messages" subtitle="Your conversations" />

            {/* Tabs */}
            <div className="px-5 mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`flex-1 relative ${activeTab === 'marketplace' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">storefront</span>
                            Marketplace
                            {marketplaceUnread > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-dark">
                                    {marketplaceUnread}
                                </span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`flex-1 relative ${activeTab === 'community' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                            DIY Community
                            {communityUnread > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-dark">
                                    {communityUnread}
                                </span>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            <div className="px-5 pb-28">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <EmptyState
                        icon={activeTab === 'marketplace' ? 'shopping_bag' : 'forum'}
                        title={activeTab === 'marketplace' ? 'No marketplace chats' : 'No community discussions'}
                        description={activeTab === 'marketplace'
                            ? 'Start a conversation with a seller'
                            : 'Connect with DIY creators'
                        }
                    />
                ) : (
                    <motion.div
                        className="space-y-3"
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        {filteredMessages.map((msg) => (
                            <motion.div key={msg.id} variants={itemVariants}>
                                <Link href={`/messages/${msg.id}`}>
                                    <div className={`p-4 rounded-2xl border-2 ${msg.unread ? 'bg-primary/10 border-primary' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700'} shadow-brutal-sm hover:-translate-y-0.5 transition-all`}>
                                        <div className="flex gap-3">
                                            {/* Thumbnail: Item or Project image */}
                                            {(msg.listingImage || msg.projectId) && (
                                                <div className="w-14 h-14 rounded-xl border-2 border-dark overflow-hidden bg-gray-100 shrink-0">
                                                    <img
                                                        src={msg.listingImage || 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100&h=100&fit=crop'}
                                                        alt={msg.listingTitle || msg.projectTitle || 'Item'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <div className={`w-12 h-12 rounded-full border-2 ${msg.unread ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} overflow-hidden bg-gray-200`}>
                                                    <img
                                                        src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}`}
                                                        alt={msg.senderName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {msg.unread && (
                                                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white dark:border-dark-surface" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Context badge showing item/project */}
                                                {(msg.listingTitle || msg.projectTitle) && (
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                                                            {activeTab === 'marketplace' ? 'About:' : 'Project:'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-dark dark:text-white truncate">
                                                            {msg.listingTitle || msg.projectTitle}
                                                        </span>
                                                        {msg.listingPrice && (
                                                            <span className="text-[10px] font-bold text-primary ml-1">
                                                                {formatPrice(msg.listingPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className={`font-bold ${msg.unread ? 'text-dark dark:text-white' : 'text-gray-700 dark:text-gray-300'} truncate`}>
                                                        {msg.senderName}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate ${msg.unread ? 'font-medium text-dark/80 dark:text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {msg.lastMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
