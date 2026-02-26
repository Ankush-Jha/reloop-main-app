'use client';

import { useEffect, useState } from 'react';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

interface BadgeRevealModalProps {
    isOpen: boolean;
    onClose: () => void;
    badge: Badge;
    onViewCollection?: () => void;
}

export function BadgeRevealModal({ isOpen, onClose, badge, onViewCollection }: BadgeRevealModalProps) {
    const [showBadge, setShowBadge] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowBadge(false);
            setShowSparkles(false);
            // Stagger the animations
            setTimeout(() => setShowBadge(true), 300);
            setTimeout(() => setShowSparkles(true), 800);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/90 backdrop-blur-sm">
            {/* Sparkle particles */}
            {showSparkles && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white dark:bg-dark-surface rounded-full animate-sparkle"
                            style={{
                                left: `${30 + Math.random() * 40}%`,
                                top: `${30 + Math.random() * 40}%`,
                                animationDelay: `${Math.random() * 2}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-dark-surface rounded-[2rem] border-[3px] border-dark dark:border-gray-600 shadow-brutal p-8 mx-4 max-w-sm w-full text-center">
                {/* Header */}
                <div className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">
                    New Badge Unlocked!
                </div>

                {/* Badge Container */}
                <div className={`relative inline-block mb-6 transition-all duration-700 ${showBadge ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    {/* Glow Ring */}
                    <div
                        className="absolute inset-0 rounded-full blur-xl animate-pulse-glow-badge"
                        style={{ backgroundColor: badge.color }}
                    />

                    {/* Badge Circle */}
                    <div
                        className="relative w-32 h-32 rounded-full border-4 border-dark dark:border-gray-600 flex items-center justify-center shadow-brutal"
                        style={{ backgroundColor: badge.color }}
                    >
                        <span className="text-6xl">{badge.icon}</span>
                    </div>

                    {/* Rotating Stars */}
                    <div className="absolute inset-0 animate-spin-slow">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">✨</span>
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-2xl">✨</span>
                        <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-2xl">✨</span>
                        <span className="absolute top-1/2 -right-3 -translate-y-1/2 text-2xl">✨</span>
                    </div>
                </div>

                {/* Badge Info */}
                <h2 className="text-2xl font-black text-dark dark:text-white mb-2">{badge.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">{badge.description}</p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 dark:bg-dark-surface text-dark dark:text-white rounded-full font-bold hover:bg-gray-200 dark:bg-gray-700 transition-colors"
                    >
                        Awesome!
                    </button>
                    {onViewCollection && (
                        <button
                            onClick={() => {
                                onViewCollection();
                                onClose();
                            }}
                            className="flex-1 py-3 bg-dark text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">military_tech</span>
                            Collection
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes sparkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-sparkle {
                    animation: sparkle 2s ease-in-out infinite;
                }
                @keyframes pulse-glow-badge {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(1.2);
                    }
                }
                .animate-pulse-glow-badge {
                    animation: pulse-glow-badge 2s ease-in-out infinite;
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
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default BadgeRevealModal;
