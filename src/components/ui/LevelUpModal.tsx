'use client';

import { useEffect, useState } from 'react';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    newLevel: number;
    levelTitle: string;
}

// Level perks by level
const LEVEL_PERKS: Record<number, string[]> = {
    2: ['Unlock Trading', 'Profile Badge'],
    3: ['Custom Avatar Frame', '10% Bonus Coins'],
    4: ['Priority Support', 'Trade Boost'],
    5: ['Eco Champion Badge', '15% Bonus Coins'],
    6: ['Featured Profile', 'Special Emotes'],
    7: ['Exclusive Items Access', '20% Bonus Coins'],
    8: ['Trade Assistant', 'Premium Badge'],
    9: ['VIP Status', 'Double XP Events'],
    10: ['Legend Status', 'All Perks Unlocked'],
};

export function LevelUpModal({ isOpen, onClose, newLevel, levelTitle }: LevelUpModalProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            // Generate confetti particles
            const newParticles = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: ['#4ce68a', '#fde047', '#93c5fd', '#f9a8d4', '#fb923c'][Math.floor(Math.random() * 5)],
                delay: Math.random() * 2,
            }));
            setParticles(newParticles);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const perks = LEVEL_PERKS[newLevel] || ['New Rewards Unlocked!'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/90 backdrop-blur-sm">
            {/* Confetti */}
            {showConfetti && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {particles.map((p) => (
                        <div
                            key={p.id}
                            className="absolute w-3 h-3 rounded-sm animate-confetti"
                            style={{
                                left: `${p.x}%`,
                                backgroundColor: p.color,
                                animationDelay: `${p.delay}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-dark-surface rounded-[2rem] border-[3px] border-dark dark:border-gray-600 shadow-brutal p-8 mx-4 max-w-sm w-full text-center animate-bounce-in">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-card-yellow/20 to-primary/20 rounded-[2rem] blur-xl -z-10" />

                {/* Crown */}
                <div className="text-6xl mb-2 animate-bounce">👑</div>

                {/* Level Badge */}
                <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 border-4 border-dark dark:border-gray-600 flex items-center justify-center shadow-brutal animate-pulse-glow">
                        <span className="text-4xl font-black text-dark dark:text-white">{newLevel}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 text-3xl animate-spin-slow">⭐</div>
                </div>

                {/* Text */}
                <h2 className="text-3xl font-black text-dark dark:text-white uppercase mb-1">Level Up!</h2>
                <p className="text-lg font-bold text-primary mb-4">{levelTitle}</p>

                {/* Unlocked Perks */}
                <div className="bg-gray-50 dark:bg-dark-bg rounded-2xl p-4 mb-6 border-2 border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Unlocked Perks</p>
                    <div className="space-y-2">
                        {perks.map((perk, i) => (
                            <div key={i} className="flex items-center gap-2 text-left">
                                <span className="text-primary">✓</span>
                                <span className="text-sm font-bold text-dark dark:text-white">{perk}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 dark:bg-dark-surface text-dark dark:text-white rounded-full font-bold hover:bg-gray-200 dark:bg-gray-700 transition-colors"
                    >
                        Continue
                    </button>
                    <button
                        onClick={() => {
                            // Share functionality placeholder
                            if (navigator.share) {
                                navigator.share({
                                    title: 'ReLoop Level Up!',
                                    text: `I just reached Level ${newLevel} on ReLoop! 🎉`,
                                });
                            }
                            onClose();
                        }}
                        className="flex-1 py-3 bg-dark text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">share</span>
                        Share
                    </button>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(-10vh) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                .animate-confetti {
                    animation: confetti 3s ease-in-out forwards;
                }
                @keyframes bounce-in {
                    0% {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.5s ease-out forwards;
                }
                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(34, 195, 88, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(34, 195, 88, 0.8);
                    }
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default LevelUpModal;
