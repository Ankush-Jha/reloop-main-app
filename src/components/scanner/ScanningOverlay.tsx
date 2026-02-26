'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ScanningOverlayProps {
    onCancel?: () => void;
    imageUrl?: string;
}

export const ScanningOverlay = ({ onCancel, imageUrl }: ScanningOverlayProps) => {
    const router = useRouter();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + 1;
            });
        }, 30); // ~3s total

        return () => clearInterval(timer);
    }, []);

    const handleBack = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
            {/* Background Pattern - subtle gradient to match app theme */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-b from-blue-50 to-white dark:from-dark-bg dark:to-dark-surface" />

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between p-6">
                <button
                    onClick={handleBack}
                    className="flex items-center justify-center w-12 h-12 bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 shadow-brutal-sm hover:translate-y-1 hover:shadow-none transition-all rounded-2xl active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl font-bold dark:text-white">arrow_back</span>
                </button>
                <div className="px-6 py-2 bg-primary border-2 border-dark dark:border-gray-600 shadow-brutal-sm rounded-full">
                    <span className="text-sm font-[900] tracking-wider uppercase text-dark">Atomic Analysis V2</span>
                </div>
                <Link
                    href="/help"
                    className="flex items-center justify-center w-12 h-12 bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 shadow-brutal-sm hover:translate-y-1 hover:shadow-none transition-all rounded-2xl active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl font-bold dark:text-white">help</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 w-full max-w-md mx-auto relative z-10">
                <div className="text-center mb-10 relative">
                    <h1 className="text-4xl sm:text-[40px] font-[900] uppercase leading-[0.95] tracking-tight text-dark dark:text-white">
                        Just a Moment,<br />I'm Thinking!
                    </h1>
                </div>

                {/* Central Analysis Graphic */}
                <div className="relative w-full aspect-square max-h-[360px] flex items-center justify-center mb-6">
                    {/* Spinning Rings */}
                    <div className="absolute inset-0 border-[3px] border-dashed border-dark/20 dark:border-white/20 rounded-full animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-6 border-[3px] border-dotted border-dark/40 dark:border-white/40 rounded-full opacity-30" />

                    {/* Floating Cards - Smoother, Rounded */}
                    {/* Structure Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-0 left-0 bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 shadow-brutal-sm rounded-2xl p-3 z-30 transform -translate-y-2 max-w-[140px]"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary bg-dark dark:bg-white dark:text-dark rounded-full p-0.5 text-sm">science</span>
                            <span className="text-xs font-[800] uppercase tracking-wider text-dark dark:text-white">STRUCTURE</span>
                        </div>
                        <span className="font-bold text-[10px] uppercase bg-primary/20 text-dark dark:text-white px-2 py-0.5 rounded-full border border-primary/30">Analyzing...</span>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 1 }}
                        className="absolute bottom-10 -right-2 bg-dark dark:bg-white text-white dark:text-dark border-2 border-dark dark:border-gray-600 shadow-brutal-sm rounded-2xl p-4 z-30"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Pixels Tasted</span>
                        </div>
                        <p className="font-[900] text-3xl leading-none">1,024</p>
                    </motion.div>

                    {/* Detection Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="absolute bottom-4 left-0 bg-primary text-dark border-2 border-dark dark:border-gray-600 shadow-brutal-sm rounded-2xl p-3 z-30 max-w-[120px]"
                    >
                        <p className="font-[800] text-xs leading-tight tracking-tight uppercase border-b border-dark/20 mb-1 pb-1">Detected</p>
                        <p className="font-[900] text-sm leading-none">98% SOLID</p>
                    </motion.div>

                    {/* Center Image */}
                    <div className="relative w-64 h-64 rounded-full bg-white dark:bg-dark-surface border-[6px] border-primary outline outline-4 outline-dark dark:outline-gray-600 shadow-brutal flex items-center justify-center overflow-hidden z-20">
                        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <img
                                alt="Analyzing"
                                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal contrast-125 brightness-110"
                                src={imageUrl || "https://images.unsplash.com/photo-1534081333815-ae5019106622?auto=format&fit=crop&w=400"}
                            />
                        </div>
                        {/* Scanlines */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                    </div>
                </div>

                {/* Did You Know? - Smoother look */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-auto w-full"
                >
                    <div className="bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 shadow-brutal-sm rounded-3xl p-5 flex items-start gap-4">
                        <div className="bg-card-yellow text-yellow-800 p-2 rounded-2xl border-2 border-dark dark:border-gray-600 flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl block">lightbulb</span>
                        </div>
                        <p className="text-sm font-bold text-dark dark:text-white leading-snug pt-1">
                            Did you know this item can save <span className="text-primary italic font-[900]">5 fish?</span> 🐟
                        </p>
                    </div>
                </motion.div>

                {/* Progress Bar - Rounded */}
                <div className="w-full mt-8">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-full">
                            <span className="text-primary-dark font-[900] tracking-widest text-[10px] uppercase">SCANNING...</span>
                        </div>
                        <span className="text-dark/50 dark:text-white/50 font-mono font-bold text-xs">AI_V2.0.4</span>
                    </div>
                    <div className="h-6 w-full bg-gray-100 dark:bg-dark-surface border-2 border-dark dark:border-gray-600 rounded-full relative overflow-hidden">
                        <motion.div
                            className="h-full bg-primary relative overflow-hidden rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear", duration: 0.5 }}
                        >
                            {/* Striped Pattern Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[pulse_2s_infinite]" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
