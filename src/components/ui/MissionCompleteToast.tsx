'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mission } from '@/types';

interface MissionCompleteToastProps {
    mission: Mission | null;
    onClose: () => void;
}

export const MissionCompleteToast = ({ mission, onClose }: MissionCompleteToastProps) => {
    if (!mission) return null;

    return (
        <AnimatePresence onExitComplete={onClose}>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none"
            >
                <div className="bg-dark text-white rounded-2xl shadow-2xl border-2 border-primary p-4 flex items-center gap-4 relative overflow-hidden">
                    {/* Background Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shine" />

                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 border-2 border-white/20">
                        <span className="text-2xl">🏆</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Mission Complete!</p>
                        <h3 className="font-black text-lg truncate leading-tight">{mission.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-white/80 flex items-center gap-1">
                                <span className="text-yellow-400">⚡</span> {mission.xpReward} XP
                            </span>
                            <span className="text-xs font-bold text-white/80 flex items-center gap-1">
                                <span className="text-yellow-400">🪙</span> {mission.coinsReward} Coins
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
