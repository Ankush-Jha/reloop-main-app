'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';

function NewConversationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading, isDemo } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const sellerId = searchParams.get('sellerId');
    const listingId = searchParams.get('listingId') || searchParams.get('itemId');
    const listingTitle = searchParams.get('listingTitle');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            // Redirect to login with return URL
            const returnUrl = `/messages/new?sellerId=${sellerId}&listingId=${listingId}`;
            router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        if (!sellerId) {
            setError('Missing seller information');
            return;
        }

        // Don't message yourself
        if (sellerId === user.uid) {
            setError("You can't message yourself");
            return;
        }

        // Create or find conversation
        const createConversation = async () => {
            if (isCreating) return;
            setIsCreating(true);

            try {
                if (isDemo) {
                    // In demo mode, redirect to a mock conversation
                    router.replace('/messages/demo-conversation');
                    return;
                }

                const conversationId = await DBService.findOrCreateConversation(
                    user.uid,
                    sellerId,
                    listingId || undefined,
                    listingTitle || undefined
                );

                // Redirect to the conversation
                router.replace(`/messages/${conversationId}`);
            } catch (err) {
                console.error('Error creating conversation:', err);
                setError('Failed to start conversation. Please try again.');
                setIsCreating(false);
            }
        };

        createConversation();
    }, [authLoading, user, sellerId, listingId, listingTitle, router, isDemo, isCreating]);

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal p-6 text-center max-w-sm">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
                    <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Oops!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-primary text-dark font-bold rounded-xl border-2 border-dark shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-dark dark:text-white font-medium">Starting conversation...</p>
            </div>
        </div>
    );
}

export default function NewConversationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <NewConversationContent />
        </Suspense>
    );
}
