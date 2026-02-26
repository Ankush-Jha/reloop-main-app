'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { Tutorial } from '@/types';

export default function TutorialStepPage() {
    const params = useParams();
    const router = useRouter();
    const [tutorial, setTutorial] = useState<Tutorial | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);

    useEffect(() => {
        const id = params.id as string;
        const found = DemoManager.getTutorialById(id);
        if (!found) {
            router.push('/tutorials');
            return;
        }
        setTutorial(found);

        // Restore saved state from local storage
        const saved = localStorage.getItem(`tutorial_saved_${id}`);
        if (saved) setIsSaved(true);

        const following = localStorage.getItem(`artist_following_${found.author}`);
        if (following) setIsFollowing(true);

    }, [params.id, router]);

    const handleSave = () => {
        if (!tutorial) return;
        const newState = !isSaved;
        setIsSaved(newState);
        if (newState) {
            localStorage.setItem(`tutorial_saved_${tutorial.id}`, 'true');
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        } else {
            localStorage.removeItem(`tutorial_saved_${tutorial.id}`);
        }
    };

    const handleFollow = () => {
        if (!tutorial) return;
        const newState = !isFollowing;
        setIsFollowing(newState);
        if (newState) {
            localStorage.setItem(`artist_following_${tutorial.author}`, 'true');
        } else {
            localStorage.removeItem(`artist_following_${tutorial.author}`);
        }
    };

    if (!tutorial) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const step = tutorial.steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === tutorial.steps.length - 1;
    const progress = ((currentStep + 1) / tutorial.steps.length) * 100;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="px-5 pt-6 pb-4 flex items-center gap-4">
                <Link
                    href="/tutorials"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm shrink-0"
                >
                    <span className="material-symbols-outlined text-dark dark:text-white">arrow_back</span>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-dark dark:text-white text-sm truncate">{tutorial.title}</p>
                    <p className="text-xs text-dark/60 dark:text-white/60">Step {currentStep + 1} of {tutorial.steps.length}</p>
                </div>
                <button
                    onClick={handleSave}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm shrink-0 active:scale-95 transition-transform"
                >
                    <span className={`material-symbols-outlined ${isSaved ? 'text-primary' : 'text-dark dark:text-white'}`}>
                        {isSaved ? 'bookmark' : 'bookmark_border'}
                    </span>
                </button>
            </header>

            {/* Progress Bar */}
            <div className="px-5 mb-4">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-300">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pb-28">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                        className="space-y-5"
                    >
                        {/* Step Title */}
                        <div className="flex justify-between items-start gap-4">
                            <h2 className="text-2xl font-[900] text-dark dark:text-white">{step.title}</h2>
                            {isFirst && (
                                <button
                                    onClick={handleFollow}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${isFollowing
                                        ? 'bg-card-green border-dark text-dark'
                                        : 'bg-white border-dark text-dark'}`}
                                >
                                    {isFollowing ? 'Following' : '+ Follow Artist'}
                                </button>
                            )}
                        </div>

                        {/* Image */}
                        {step.image && (
                            <div className="rounded-2xl border-2 border-dark dark:border-gray-600 overflow-hidden shadow-brutal-sm">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-5">
                            <p className="text-dark/80 dark:text-white/80 text-sm leading-relaxed">{step.content}</p>
                        </div>

                        {/* Tip */}
                        {step.tip && (
                            <div className="bg-card-yellow rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-xl text-dark dark:text-white shrink-0 mt-0.5">lightbulb</span>
                                <div>
                                    <p className="font-bold text-dark dark:text-white text-sm">Pro Tip</p>
                                    <p className="text-xs text-dark/70 dark:text-white/70 mt-1">{step.tip}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Save Toast */}
            <AnimatePresence>
                {showSaveToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-dark text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl z-50 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-primary">bookmark</span>
                        Saved to library!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="sticky bottom-0 p-5 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-t-2 border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        disabled={isFirst}
                        className="flex-1 py-4 rounded-2xl font-bold border-2 border-dark dark:border-gray-600 text-dark dark:text-white disabled:opacity-30 active:scale-95 transition-all"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => {
                            if (isLast) {
                                router.push('/tutorials');
                            } else {
                                setCurrentStep(currentStep + 1);
                            }
                        }}
                        className="flex-[1.5] py-4 rounded-2xl font-[900] uppercase bg-dark text-white shadow-brutal-sm active:translate-y-1 active:shadow-none transition-all"
                    >
                        {isLast ? 'Complete' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}
