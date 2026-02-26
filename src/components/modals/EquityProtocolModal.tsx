'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface EquityProtocolModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EquityProtocolModal({ isOpen, onClose }: EquityProtocolModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-dark-surface rounded-3xl border-[3px] border-dark dark:border-gray-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full max-h-[80vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-card-yellow border-b-[3px] border-dark dark:border-gray-600 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl border-2 border-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-dark">info</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-dark">14-Day Equity Protocol</h2>
                                <p className="text-xs font-bold text-dark/60">How it works</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white border-2 border-dark hover:bg-gray-100 transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-dark">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Why */}
                        <div>
                            <h3 className="font-black text-dark dark:text-white flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary">eco</span>
                                Why the 14-day rule?
                            </h3>
                            <p className="text-sm text-dark/70 dark:text-white/70 leading-relaxed">
                                To keep our campus marketplace fresh and prevent item hoarding, listings that don't sell within 14 days automatically enter the Equity Protocol.
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="bg-card-green rounded-2xl border-2 border-dark dark:border-gray-600 p-4 space-y-3">
                            <h4 className="font-bold text-dark text-sm">Timeline:</h4>
                            <div className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-dark flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs font-black text-dark">0</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-dark text-sm">Item Listed</p>
                                        <p className="text-xs text-dark/60">Available for trades</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-dark flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs font-black text-dark">7</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-dark text-sm">Halfway Mark</p>
                                        <p className="text-xs text-dark/60">You'll get a reminder</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-dark flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs font-black text-dark">12</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-dark text-sm">Last Call</p>
                                        <p className="text-xs text-dark/60">Final reminder sent</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-card-coral border-2 border-dark flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs font-black text-dark">14</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-dark text-sm">Equity Protocol</p>
                                        <p className="text-xs text-dark/60">You choose: Recycle or Donate</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Your Options */}
                        <div>
                            <h3 className="font-black text-dark dark:text-white flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">fork_right</span>
                                Your options on Day 14:
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-card-blue rounded-2xl border-2 border-dark p-3 text-center">
                                    <span className="material-symbols-outlined text-3xl text-dark mb-2 block">recycling</span>
                                    <p className="font-bold text-dark text-sm">Recycle</p>
                                    <p className="text-[10px] text-dark/60 mt-1">Earn 15 Eco Coins</p>
                                </div>
                                <div className="bg-card-pink rounded-2xl border-2 border-dark p-3 text-center">
                                    <span className="material-symbols-outlined text-3xl text-dark mb-2 block">volunteer_activism</span>
                                    <p className="font-bold text-dark text-sm">Donate</p>
                                    <p className="text-[10px] text-dark/60 mt-1">Earn 25 Eco Coins</p>
                                </div>
                            </div>
                        </div>

                        {/* No Loss Promise */}
                        <div className="bg-primary rounded-2xl border-2 border-dark dark:border-gray-600 p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-2xl text-dark">verified</span>
                                <div>
                                    <p className="font-black text-dark text-sm mb-1">You still earn coins!</p>
                                    <p className="text-xs text-dark/70 leading-relaxed">
                                        Even if your item doesn't sell, you'll earn Eco Coins when you recycle or donate it. Your impact matters! 🌍
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white dark:bg-dark-surface border-t-[3px] border-dark dark:border-gray-600 p-5">
                        <button
                            onClick={onClose}
                            className="w-full bg-dark text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-brutal active:translate-y-1 active:shadow-none transition-all"
                        >
                            Got it!
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
