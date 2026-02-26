'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
    {
        title: 'Scan & Discover',
        description: 'Point your camera at any item to get AI-powered upcycling ideas and earn eco-coins.',
        icon: 'photo_camera',
        color: 'bg-card-green',
        bgGradient: 'from-green-100 to-green-50',
    },
    {
        title: 'Trade & Swap',
        description: 'List items you no longer need and trade with fellow students on campus.',
        icon: 'swap_horiz',
        color: 'bg-card-yellow',
        bgGradient: 'from-yellow-100 to-yellow-50',
    },
    {
        title: 'Earn & Impact',
        description: 'Earn Eco Coins, climb leaderboards, and track your environmental impact.',
        icon: 'eco',
        color: 'bg-card-blue',
        bgGradient: 'from-blue-100 to-blue-50',
    },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [current, setCurrent] = useState(0);

    const next = () => {
        if (current < SLIDES.length - 1) {
            setCurrent(current + 1);
        } else {
            localStorage.setItem('reloop_onboarded', 'true');
            router.push('/');
        }
    };

    const skip = () => {
        localStorage.setItem('reloop_onboarded', 'true');
        router.push('/');
    };

    const slide = SLIDES[current];

    return (
        <div className={`min-h-screen bg-gradient-to-b ${slide.bgGradient} to-white flex flex-col`}>
            {/* Skip */}
            <div className="px-5 pt-6 flex justify-end">
                <button
                    onClick={skip}
                    className="text-sm font-bold text-dark/60 dark:text-white/60 hover:text-dark dark:text-white transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                        className="text-center"
                    >
                        <div className={`w-32 h-32 ${slide.color} rounded-[2.5rem] border-[3px] border-dark dark:border-gray-600 shadow-brutal mx-auto flex items-center justify-center mb-8`}>
                            <span className="material-symbols-outlined text-6xl text-dark dark:text-white">{slide.icon}</span>
                        </div>
                        <h2 className="text-4xl font-[900] text-dark dark:text-white tracking-tight mb-4 uppercase">
                            {slide.title}
                        </h2>
                        <p className="text-dark/70 dark:text-white/70 font-medium text-lg leading-relaxed max-w-[280px] mx-auto">
                            {slide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="px-8 pb-12 space-y-6">
                {/* Dots */}
                <div className="flex items-center justify-center gap-3">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-3 rounded-full border-2 border-dark dark:border-gray-600 transition-all ${i === current ? 'w-10 bg-primary' : 'w-3 bg-white dark:bg-dark-surface'
                                }`}
                        />
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={next}
                    className="w-full bg-dark text-white py-5 rounded-2xl font-[900] text-lg uppercase tracking-wider shadow-brutal active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                    {current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
