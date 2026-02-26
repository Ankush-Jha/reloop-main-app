'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

interface LevelUpModalProps {
    level: number;
    title: string;
    xp: number;
    onClose: () => void;
}

export const LevelUpModal = ({ level, title, xp, onClose }: LevelUpModalProps) => {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-dark/90 backdrop-blur-md"
            >
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    numberOfPieces={200}
                    recycle={false}
                    colors={['#CCFF00', '#FFFFFF', '#000000']}
                />

                <motion.div
                    initial={{ scale: 0.5, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.5, y: 100 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="relative w-full max-w-sm"
                >
                    {/* Level Badge */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary rounded-full border-4 border-white flex items-center justify-center shadow-brutal z-10">
                        <div className="text-center">
                            <div className="text-xs font-black uppercase tracking-wider text-dark">Level</div>
                            <div className="text-5xl font-black text-dark leading-none">{level}</div>
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="bg-white rounded-3xl pt-20 pb-8 px-6 text-center shadow-2xl border-4 border-primary">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-3xl font-black uppercase italic mb-2 text-dark">Level Up!</h2>
                            <div className="inline-block bg-dark text-primary px-4 py-1 rounded-full font-bold text-sm uppercase tracking-wider mb-6">
                                {title}
                            </div>

                            <p className="text-gray-600 mb-8 font-medium">
                                You've earned enough XP to reach the next level. Keep saving the planet!
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="text-2xl font-black text-dark mb-1">+{xp}</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Total XP</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="text-2xl font-black text-dark mb-1">New</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Unlocks</div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-primary text-dark font-black uppercase tracking-widest rounded-xl shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
                            >
                                Awesome!
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
