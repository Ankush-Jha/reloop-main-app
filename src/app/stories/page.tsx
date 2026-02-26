'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Varied story types: trade, charity, impact, leaderboard
const stories = [
    {
        id: '1',
        type: 'trade',
        title: 'The Textbook Swap',
        icon: 'handshake',
        impactIcon: 'eco',
        impactText: '5kg CO2 Saved',
        author: 'Priya & Arjun',
        quote: '"Saved ₹500 and kept these books out of the landfill! Thanks so much, Priya! 📚"',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&h=200&fit=crop',
        bgColor: 'from-emerald-400 to-teal-600',
    },
    {
        id: '2',
        type: 'charity',
        title: 'Donated to Akshaya Patra',
        icon: 'volunteer_activism',
        impactIcon: 'favorite',
        impactText: '20 Meals Funded',
        author: 'Sneha M.',
        quote: '"Used my Eco Coins to donate! Every bit helps. Feels good to give back to the community. 💚"',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        bgColor: 'from-pink-400 to-rose-600',
    },
    {
        id: '3',
        type: 'leaderboard',
        title: 'Hit Top 10!',
        icon: 'trophy',
        impactIcon: 'trending_up',
        impactText: 'Rank #8 Overall',
        author: 'Rahul K.',
        quote: '"Just made it to the campus Top 10! 🏆 Started recycling just 2 months ago. You can do it too!"',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
        bgColor: 'from-amber-400 to-orange-600',
    },
    {
        id: '4',
        type: 'impact',
        title: 'My Yearly Wrapped',
        icon: 'bar_chart',
        impactIcon: 'cloud_off',
        impactText: '120kg CO2 Saved',
        author: 'Ananya P.',
        quote: '"Can\'t believe my yearly stats! 🌍 Saved 120kg CO2 and planted 15 trees. Let\'s keep going!"',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
        bgColor: 'from-sky-400 to-blue-600',
    },
    {
        id: '5',
        type: 'trade',
        title: 'Vintage Kurta Find',
        icon: 'checkroom',
        impactIcon: 'water_drop',
        impactText: '700L Water Saved',
        author: 'Vikram S.',
        quote: '"Why buy new? This kurta fits perfectly and has so much character. #ThriftWin"',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        bgColor: 'from-violet-400 to-purple-600',
    },
];

export default function StoriesPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const currentStory = stories[currentIndex];
    const STORY_DURATION = 5000; // 5 seconds per story

    // Auto-advance stories
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    goToNext();
                    return 0;
                }
                return prev + (100 / (STORY_DURATION / 100));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentIndex, isPaused]);

    const goToNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setProgress(0);
        } else {
            router.push('/');
        }
    }, [currentIndex, router]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setProgress(0);
        }
    }, [currentIndex]);

    const handleTap = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeftSide = x < rect.width / 3;

        if (isLeftSide) {
            goToPrev();
        } else {
            goToNext();
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'trade': return '🔄 Trade';
            case 'charity': return '💝 Charity';
            case 'leaderboard': return '🏆 Achievement';
            case 'impact': return '🌍 Impact';
            default: return '';
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black z-50 select-none"
            onClick={handleTap}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {/* Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-3 pt-safe">
                {stories.map((_, index) => (
                    <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-100"
                            style={{
                                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    router.push('/');
                }}
                className="absolute top-12 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
            >
                <span className="material-symbols-outlined text-white text-2xl">close</span>
            </button>

            {/* Story Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStory.id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute inset-0 bg-gradient-to-b ${currentStory.bgColor}`}
                >
                    {/* Author Header */}
                    <div className="absolute top-16 left-0 right-0 px-5 z-40">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full border-2 border-white bg-cover bg-center"
                                style={{ backgroundImage: `url('${currentStory.image}')` }}
                            />
                            <div>
                                <p className="text-white font-black text-sm">{currentStory.author}</p>
                                <p className="text-white/70 text-xs font-bold">{getTypeLabel(currentStory.type)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                        {/* Icon Badge */}
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border-2 border-white/30">
                            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {currentStory.icon}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl font-black text-white uppercase text-center tracking-tight mb-4 leading-tight">
                            {currentStory.title}
                        </h1>

                        {/* Impact Pill */}
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-5 py-2 border border-white/30 mb-8">
                            <span className="material-symbols-outlined text-white text-lg">{currentStory.impactIcon}</span>
                            <span className="text-white font-bold uppercase tracking-wide text-sm">{currentStory.impactText}</span>
                        </div>

                        {/* Quote Card */}
                        <div className="bg-white/95 rounded-3xl p-6 max-w-sm shadow-2xl">
                            <p className="text-dark text-lg font-medium leading-relaxed text-center">
                                {currentStory.quote}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Navigation Hints */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                            Tap to continue
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
