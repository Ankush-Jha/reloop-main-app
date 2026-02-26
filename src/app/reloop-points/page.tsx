'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import DemoManager from '@/lib/demo-manager';
import { ReloopPoint } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function ReloopPointsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isDemo, isLoading: authLoading } = useAuth();
    const listingId = searchParams.get('listingId');
    const listingTitle = searchParams.get('title') || 'Your Item';

    const [points, setPoints] = useState<ReloopPoint[]>([]);
    const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
    const [dropping, setDropping] = useState(false);
    const [dropped, setDropped] = useState(false);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to finish loading before fetching data
        if (authLoading) return;

        const loadPoints = async () => {
            setIsLoading(true);
            try {
                if (isDemo) {
                    // Demo mode - use mock data
                    setPoints(DemoManager.getReloopPoints());
                } else {
                    // Firebase mode - try Firebase first, fallback to mock
                    const firebasePoints = await DBService.getReloopPoints();
                    if (firebasePoints.length > 0) {
                        setPoints(firebasePoints as ReloopPoint[]);
                    } else {
                        setPoints(DemoManager.getReloopPoints());
                    }
                }
            } catch (error) {
                console.error('Error loading points:', error);
                setPoints(DemoManager.getReloopPoints());
            }
            setIsLoading(false);
        };
        loadPoints();
    }, [isDemo, authLoading]);

    const handleDropOff = async () => {
        if (!selectedPoint || !listingId) return;

        setDropping(true);
        try {
            if (user?.uid && !isDemo) {
                const result = await DBService.dropItemAtPoint(user.uid, listingId, selectedPoint);
                if (result.success) {
                    setExpiryDate(result.expiresAt || null);
                    setDropped(true);
                } else {
                    alert('Failed to drop off item. Please try again.');
                }
            } else {
                await DemoManager.simulateDelay(1500);
                const result = DemoManager.dropItemAtPoint(listingId, selectedPoint);
                if (result.success) {
                    setExpiryDate(result.expiresAt || null);
                    setDropped(true);
                }
            }
        } catch (error) {
            console.error('Error dropping item:', error);
            alert('An error occurred. Please try again.');
        }
        setDropping(false);
    };

    if (dropped && expiryDate) {
        const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-28 h-28 bg-green-500 rounded-full border-4 border-dark shadow-brutal flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h1 className="text-2xl font-black text-dark dark:text-white mb-2">Item Dropped!</h1>
                <p className="text-dark/70 dark:text-white/70 mb-6 text-sm max-w-xs">
                    Your item is now listed at {points.find(p => p.id === selectedPoint)?.name}
                </p>
                <div className="bg-card-yellow rounded-2xl border-2 border-dark shadow-brutal-sm p-4 mb-6 w-full max-w-xs">
                    <p className="text-xs font-bold text-dark/70 mb-1">14-Day Liquidity Window</p>
                    <p className="text-2xl font-black text-dark">{daysRemaining} days remaining</p>
                    <p className="text-xs text-dark/50 mt-2">If unsold, you can recycle or donate it</p>
                </div>
                <div className="space-y-3 w-full max-w-xs">
                    <button
                        onClick={() => router.push('/my-listings')}
                        className="w-full bg-dark text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">list</span>
                        View My Listings
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-white dark:bg-dark-surface text-dark dark:text-white font-bold py-3 rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Choose Reloop Point" backHref="/sell" />

            <motion.div
                className="px-5 pb-28 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {/* Item being dropped */}
                <motion.div variants={itemVariants} className="bg-card-blue rounded-xl border-2 border-dark shadow-brutal-sm px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-dark">package_2</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-dark text-sm truncate">{listingTitle}</p>
                        <p className="text-xs text-dark/60">Select where to drop off</p>
                    </div>
                </motion.div>

                {/* Reloop Points List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <motion.div variants={itemVariants} className="space-y-3">
                        {points.map((point) => (
                            <div
                                key={point.id}
                                onClick={() => setSelectedPoint(point.id)}
                                className={`bg-white dark:bg-dark-surface rounded-xl border-2 ${selectedPoint === point.id
                                    ? 'border-green-500 ring-2 ring-green-200'
                                    : 'border-dark dark:border-gray-600'
                                    } shadow-brutal-sm p-4 cursor-pointer transition-all`}
                            >
                                <div className="flex items-center gap-3">
                                    {selectedPoint === point.id ? (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white">check</span>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-card-yellow rounded-full border-2 border-dark flex items-center justify-center">
                                            <span className="material-symbols-outlined text-dark">place</span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-dark dark:text-white">{point.name}</p>
                                        <p className="text-xs text-dark/60 dark:text-white/60">{point.location}</p>
                                    </div>
                                    {(point as any).distance && (
                                        <span className="bg-gray-100 dark:bg-dark-bg px-3 py-1 rounded-lg text-xs font-bold text-dark/70 dark:text-white/70">
                                            {(point as any).distance}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Drop Off Button */}
                <motion.div variants={itemVariants} className="pt-4">
                    <button
                        onClick={handleDropOff}
                        disabled={!selectedPoint || dropping}
                        className={`w-full py-4 rounded-2xl border-2 border-dark shadow-brutal font-black text-lg transition-all flex items-center justify-center gap-2 ${selectedPoint
                            ? 'bg-primary text-dark'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {dropping ? (
                            <>
                                <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                Confirm Drop-off
                            </>
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}

function ReloopPointsLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function ReloopPointsPage() {
    return (
        <Suspense fallback={<ReloopPointsLoading />}>
            <ReloopPointsContent />
        </Suspense>
    );
}
