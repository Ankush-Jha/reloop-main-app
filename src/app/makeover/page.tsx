'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import ScannerService from '@/lib/scanner-service';
import { PageHeader } from '@/components/ui/PageHeader';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function MakeoverPage() {
    const router = useRouter();
    const [artists] = useState(DemoManager.getArtistProfiles());
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [itemData, setItemData] = useState<{ title: string; image: string; coins: number }>({
        title: 'Your Item',
        image: '',
        coins: 50
    });

    useEffect(() => {
        const storedResult = ScannerService.getStoredResult();
        const storedImage = ScannerService.getStoredImage();
        if (storedResult) {
            setItemData({
                title: storedResult.item.objectName,
                image: storedImage || '',
                coins: storedResult.item.estimatedCoins
            });
        }
    }, []);

    const handleSubmit = async () => {
        if (!selectedArtist) return;
        setSubmitting(true);
        await DemoManager.simulateDelay(1500);
        DemoManager.createMakeoverRequest(itemData.title, itemData.image, itemData.coins * 2);
        setSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        const artist = artists.find(a => a.id === selectedArtist);
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full border-4 border-dark flex items-center justify-center mb-6"
                >
                    <span className="text-4xl">🎨</span>
                </motion.div>
                <h1 className="text-2xl font-black text-dark dark:text-white mb-2">Request Sent!</h1>
                <p className="text-dark/60 dark:text-white/60 mb-6 text-sm">
                    {artist?.name} will respond soon
                </p>

                {/* Compact Timeline */}
                <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark shadow-brutal-sm p-4 w-full mb-6">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-dark">
                                <span className="text-sm">✓</span>
                            </div>
                            <span className="text-dark/60 dark:text-white/60 font-bold">Sent</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                                <span className="text-sm">🔔</span>
                            </div>
                            <span className="text-dark/40 dark:text-white/40 font-bold">Accept</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                                <span className="text-sm">🤝</span>
                            </div>
                            <span className="text-dark/40 dark:text-white/40 font-bold">Meet</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-dark-bg rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                                <span className="text-sm">💰</span>
                            </div>
                            <span className="text-dark/40 dark:text-white/40 font-bold">Earn</span>
                        </div>
                    </div>
                </div>

                {/* Earnings Preview */}
                <div className="bg-card-yellow rounded-2xl border-2 border-dark shadow-brutal-sm p-4 w-full mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-dark/60">Your 30% share</p>
                        <p className="text-2xl font-black text-dark">~{Math.round(itemData.coins * 2 * 0.3)} coins</p>
                    </div>
                    <span className="text-4xl">🎨</span>
                </div>

                <button
                    onClick={() => router.push('/')}
                    className="w-full bg-dark text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal"
                >
                    Done
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Art Makeover" backHref="/scanner/results" />

            <motion.div
                className="px-5 pb-28 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {/* Compact Info Banner */}
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl border-2 border-dark shadow-brutal-sm px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">👩‍🎨</span>
                    <p className="text-sm font-bold text-dark dark:text-white flex-1">
                        Artists transform → sell → you get <span className="text-primary">30%</span>
                    </p>
                </motion.div>

                {/* Item Preview - Compact */}
                {itemData.image && (
                    <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface rounded-xl border-2 border-dark shadow-brutal-sm overflow-hidden flex">
                        <img src={itemData.image} alt={itemData.title} className="w-24 h-24 object-cover" />
                        <div className="p-3 flex-1 flex flex-col justify-center">
                            <p className="font-bold text-dark dark:text-white text-sm">{itemData.title}</p>
                            <p className="text-xs text-dark/50 dark:text-white/50">Est. after makeover: ~{itemData.coins * 2} coins</p>
                        </div>
                    </motion.div>
                )}

                {/* Artist Selection */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <p className="font-bold text-dark dark:text-white text-sm ml-1">Choose Artist</p>
                    {artists.map((artist) => (
                        <div
                            key={artist.id}
                            onClick={() => setSelectedArtist(artist.id)}
                            className={`bg-white dark:bg-dark-surface rounded-xl border-2 ${selectedArtist === artist.id
                                ? 'border-pink-500 ring-2 ring-pink-200'
                                : 'border-dark dark:border-gray-600'
                                } shadow-brutal-sm p-3 flex items-center gap-3 cursor-pointer transition-all`}
                        >
                            <img src={artist.avatar} alt={artist.name} className="w-12 h-12 rounded-xl border-2 border-dark object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-dark dark:text-white text-sm">{artist.name}</p>
                                    <span className="text-yellow-500 text-xs">★ {artist.rating}</span>
                                </div>
                                <p className="text-xs text-dark/50 dark:text-white/50 truncate">
                                    {artist.completedJobs} jobs · {artist.specialties.slice(0, 2).join(', ')}
                                </p>
                            </div>
                            {selectedArtist === artist.id && (
                                <div className="w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white text-sm">check</span>
                                </div>
                            )}
                        </div>
                    ))}
                </motion.div>

                {/* Revenue Split - Compact */}
                <motion.div variants={itemVariants} className="bg-card-yellow rounded-xl border-2 border-dark shadow-brutal-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-dark/60">Revenue Split</span>
                        <span className="text-xs font-bold text-dark">You: 30% · Artist: 70%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-[30%] h-2 bg-primary rounded-full border border-dark" />
                        <div className="flex-1 h-2 bg-purple-300 rounded-full border border-dark" />
                    </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedArtist || submitting}
                        className={`w-full py-4 rounded-2xl border-2 border-dark shadow-brutal font-black text-lg transition-all flex items-center justify-center gap-2 ${selectedArtist
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-symbols-outlined">brush</span>
                        {submitting ? 'Submitting...' : 'Request Makeover'}
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
