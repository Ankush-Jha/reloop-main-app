'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatRupeeValue, coinsToRupees } from '@/lib/eco-coins';

// Animated counter
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString());
    const [displayValue, setDisplayValue] = useState('0');

    useEffect(() => {
        const controls = animate(count, value, { duration });
        const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
        return () => { controls.stop(); unsubscribe(); };
    }, [value, count, rounded, duration]);

    return <span>{displayValue}</span>;
}

// Impact Hero Section
function ImpactHero({ stats, userCoins, totalDonated }: { stats: any; userCoins: number; totalDonated: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border-3 border-dark shadow-brutal"
        >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500">
                <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 20%, #fff 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 80%, #fff 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 20%, #fff 0%, transparent 50%)',
                        ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
            </div>

            <div className="relative p-5">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <motion.span
                            className="text-3xl"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            💚
                        </motion.span>
                        <div>
                            <h2 className="font-black text-white text-lg drop-shadow-md">Community Impact</h2>
                            <p className="text-[10px] text-white/70 font-bold">Real change, powered by you</p>
                        </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30">
                        <p className="text-[10px] text-white/70 font-bold">Your Balance</p>
                        <p className="text-lg font-black text-white">🪙 {userCoins}</p>
                        <p className="text-[10px] text-white/70 font-bold">{formatRupeeValue(userCoins)}</p>
                    </div>
                </div>

                {/* Impact Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 shadow-lg"
                    >
                        <motion.span
                            className="text-2xl block"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        >
                            🌳
                        </motion.span>
                        <p className="text-xl font-black text-dark"><AnimatedCounter value={stats?.treesPlanted || 0} /></p>
                        <p className="text-[9px] font-bold text-dark/50 uppercase">Trees Planted</p>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 shadow-lg"
                    >
                        <motion.span
                            className="text-2xl block"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        >
                            🍎
                        </motion.span>
                        <p className="text-xl font-black text-dark"><AnimatedCounter value={stats?.mealsProvided || 0} /></p>
                        <p className="text-[9px] font-bold text-dark/50 uppercase">Meals Given</p>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 shadow-lg"
                    >
                        <motion.span
                            className="text-2xl block"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        >
                            🌊
                        </motion.span>
                        <p className="text-xl font-black text-dark"><AnimatedCounter value={stats?.plasticRemoved || 0} /></p>
                        <p className="text-[9px] font-bold text-dark/50 uppercase">Kg Plastic</p>
                    </motion.div>
                </div>

                {/* Your Contribution */}
                {totalDonated > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⭐</span>
                                <div>
                                    <p className="text-[10px] text-white/70 font-bold uppercase">You've Contributed</p>
                                    <p className="font-black text-white">🪙 {totalDonated} <span className="text-sm text-white/70">({formatRupeeValue(totalDonated)})</span></p>
                                </div>
                            </div>
                            <div className="bg-amber-400 text-dark px-2 py-1 rounded-lg text-xs font-black">
                                🏆 Hero
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// Story bar - Instagram style with real images
function StoryBar({ stories, onStoryClick }: { stories: any[]; onStoryClick: (story: any) => void }) {
    return (
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-3 pb-1">
                {stories.map((story, i) => (
                    <motion.button
                        key={story.id}
                        onClick={() => onStoryClick(story)}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                        <div className={`w-18 h-18 rounded-2xl overflow-hidden border-3 shadow-lg ${story.viewed
                            ? 'border-gray-300'
                            : 'border-primary'
                            }`}
                            style={{ width: '72px', height: '72px' }}
                        >
                            {story.thumbnail.startsWith('http') ? (
                                <img
                                    src={story.thumbnail}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-3xl">
                                    {story.thumbnail}
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-bold text-dark/60 max-w-18 truncate text-center" style={{ maxWidth: '72px' }}>
                            {story.donorName || story.charityName.split(' ')[0]}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// Story viewer modal with real images
function StoryViewer({ story, onClose }: { story: any; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={onClose}
        >
            {/* Background Image */}
            {story.impactImage && (
                <div className="absolute inset-0">
                    <img
                        src={story.impactImage}
                        alt={story.title}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
                </div>
            )}

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 p-3 z-10">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 6, ease: 'linear' }}
                        onAnimationComplete={onClose}
                    />
                </div>
            </div>

            {/* Header */}
            <div className="relative p-4 pt-8 flex items-center gap-3 z-10">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/30">
                    {story.charityLogo}
                </div>
                <div className="flex-1">
                    <p className="text-white font-black text-sm drop-shadow-lg">{story.charityName}</p>
                    <p className="text-white/70 text-xs">{story.timeAgo}</p>
                </div>
                <button onClick={onClose} className="text-white/70 text-3xl hover:text-white transition-colors">×</button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-end px-6 pb-16 relative z-10">
                {/* Thank You Badge */}
                {story.donorName && story.donorName !== 'Community' && (
                    <motion.div
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 mb-4 border border-white/30"
                    >
                        <p className="text-white/80 text-sm font-bold text-center">Special thanks to</p>
                        <p className="text-white text-2xl font-black text-center">{story.donorName} 🙏</p>
                    </motion.div>
                )}

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-white text-3xl font-black text-center drop-shadow-lg mb-2"
                >
                    {story.title}
                </motion.h2>

                {/* Subtitle */}
                {story.subtitle && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/80 text-base text-center font-medium drop-shadow-md"
                    >
                        {story.subtitle}
                    </motion.p>
                )}

                {/* Impact Message */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 flex items-center gap-2 bg-primary/80 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                    <span className="text-xl">💚</span>
                    <span className="text-dark font-black text-sm">Made possible by ReLoop community</span>
                </motion.div>
            </div>
        </motion.div>
    );
}

// Enhanced Charity Card with Impact Calculator
function CharityCard({ charity, onClick, userCoins }: { charity: any; onClick: () => void; userCoins: number }) {
    const progress = (charity.current / charity.goal) * 100;
    const [showCalculator, setShowCalculator] = useState(false);

    const colorMap: Record<string, { bg: string; accent: string; gradient: string }> = {
        green: { bg: 'from-green-50 to-emerald-100', accent: 'bg-green-500', gradient: 'from-green-400 to-emerald-500' },
        blue: { bg: 'from-blue-50 to-cyan-100', accent: 'bg-blue-500', gradient: 'from-blue-400 to-cyan-500' },
        orange: { bg: 'from-orange-50 to-amber-100', accent: 'bg-orange-500', gradient: 'from-orange-400 to-amber-500' },
    };
    const colors = colorMap[charity.color] || colorMap.green;

    // Calculate impact preview
    const impactPerCoin = charity.impactPerCoin || 0.1;
    const potentialImpact = Math.floor(userCoins * impactPerCoin);

    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-br ${colors.bg} rounded-2xl border-3 border-dark shadow-brutal overflow-hidden`}
        >
            {/* Main Card Content */}
            <button onClick={onClick} className="w-full p-4 text-left">
                <div className="flex items-start gap-4">
                    <motion.div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg border-2 border-white/50`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <span className="text-3xl drop-shadow-md">{charity.logo}</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-dark text-lg">{charity.name}</h3>
                            {progress >= 80 && (
                                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                    🔥 Almost There!
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-dark/60 font-medium leading-snug">{charity.description}</p>
                    </div>
                    <span className="material-symbols-outlined text-dark/30">chevron_right</span>
                </div>

                {/* Progress Section */}
                <div className="mt-4">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-2xl font-black text-dark">{charity.current}</span>
                            <span className="text-sm text-dark/50 font-bold"> / {charity.goal}</span>
                            <p className="text-[10px] text-dark/40 font-bold">{charity.impactMetric}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-dark/40 font-bold uppercase">Progress</p>
                            <p className="text-lg font-black text-dark">{Math.round(progress)}%</p>
                        </div>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden border-2 border-dark/10 shadow-inner">
                        <motion.div
                            className={`h-full ${colors.accent}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                        />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-2 mt-3">
                    <div className="flex-1 bg-white/80 rounded-xl px-3 py-2 border border-dark/10">
                        <p className="text-lg font-black text-dark">{Math.floor(charity.current * 0.8)}</p>
                        <p className="text-[9px] text-dark/50 font-bold uppercase">Donors</p>
                    </div>
                    <div className="flex-1 bg-white/80 rounded-xl px-3 py-2 border border-dark/10">
                        <p className="text-lg font-black text-dark">🪙 {charity.minDonation}</p>
                        <p className="text-[9px] text-dark/50 font-bold uppercase">Min Donate</p>
                    </div>
                    <div className="flex-1 bg-white/80 rounded-xl px-3 py-2 border border-dark/10">
                        <p className="text-lg font-black text-dark">{formatRupeeValue(charity.minDonation)}</p>
                        <p className="text-[9px] text-dark/50 font-bold uppercase">Value</p>
                    </div>
                </div>
            </button>

            {/* Impact Calculator Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); setShowCalculator(!showCalculator); }}
                className={`w-full py-2 text-center text-xs font-bold border-t-2 border-dark/10 transition-colors ${showCalculator ? 'bg-primary text-dark' : 'bg-white/50 text-dark/60 hover:bg-white/80'}`}
            >
                <span className="material-symbols-outlined text-sm align-middle mr-1">calculate</span>
                {showCalculator ? 'Hide' : 'Show'} Impact Calculator
            </button>

            {/* Impact Calculator Panel */}
            <AnimatePresence>
                {showCalculator && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white border-t-2 border-dark/10 overflow-hidden"
                    >
                        <div className="p-4">
                            <p className="text-xs text-dark/60 font-bold mb-3">See your potential impact:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[charity.minDonation, charity.minDonation * 2, charity.minDonation * 5].map((amount) => {
                                    const impact = Math.floor(amount * impactPerCoin);
                                    const canAfford = userCoins >= amount;
                                    return (
                                        <div
                                            key={amount}
                                            className={`rounded-xl p-3 text-center border-2 ${canAfford ? 'border-primary bg-primary/10' : 'border-gray-200 bg-gray-50'}`}
                                        >
                                            <p className="font-black text-dark">🪙 {amount}</p>
                                            <p className="text-[9px] text-dark/50 font-bold">{formatRupeeValue(amount)}</p>
                                            <div className="mt-2 pt-2 border-t border-dark/10">
                                                <p className="text-lg">={impact > 0 ? `${impact}` : '1'}</p>
                                                <p className="text-[8px] text-dark/40 font-bold uppercase">{charity.impactMetric}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Charity popup modal with enhanced design
function CharityModal({
    charity,
    userCoins,
    onDonate,
    isDonating,
    onClose
}: {
    charity: any;
    userCoins: number;
    onDonate: (amount: number) => void;
    isDonating: boolean;
    onClose: () => void;
}) {
    const [customAmount, setCustomAmount] = useState('');
    const progress = (charity.current / charity.goal) * 100;
    const colorMap: Record<string, { gradient: string; btn: string }> = {
        green: { gradient: 'from-green-400 to-emerald-500', btn: 'bg-green-500 hover:bg-green-600' },
        blue: { gradient: 'from-blue-400 to-cyan-500', btn: 'bg-blue-500 hover:bg-blue-600' },
        orange: { gradient: 'from-orange-400 to-amber-500', btn: 'bg-orange-500 hover:bg-orange-600' },
    };
    const colors = colorMap[charity.color] || colorMap.green;

    const handleCustomDonate = () => {
        const amount = parseInt(customAmount);
        if (amount > 0 && amount <= userCoins) {
            onDonate(amount);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border-t-3 sm:border-3 border-dark shadow-brutal overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className={`bg-gradient-to-br ${colors.gradient} p-6 relative`}>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 transition-colors rounded-full backdrop-blur-md">
                        <span className="material-symbols-outlined text-dark">close</span>
                    </button>

                    <motion.span
                        className="text-6xl block mb-3 drop-shadow-lg"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {charity.logo}
                    </motion.span>
                    <h2 className="text-2xl font-black text-dark">{charity.name}</h2>
                    <p className="text-sm text-dark/80 font-medium mt-1">{charity.description}</p>

                    {/* Progress */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mt-4 border border-dark/10 shadow-lg">
                        <div className="flex justify-between text-xs font-black text-dark/50 mb-2 uppercase">
                            <span>Goal Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden border border-black/5">
                            <motion.div
                                className={`h-full ${colors.btn.split(' ')[0]}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                        <p className="text-xs font-bold text-dark/60 text-right mt-1">
                            {charity.current} / {charity.goal} {charity.impactMetric}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Balance */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-dark/40 font-black">Your Balance</p>
                            <p className="text-2xl font-black text-dark">🪙 {userCoins}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-dark/40 font-black">Value</p>
                            <p className="text-xl font-black text-primary">{formatRupeeValue(userCoins)}</p>
                        </div>
                    </div>

                    {/* Quick Donate Buttons */}
                    <p className="text-center text-xs font-bold text-dark/40 mb-3 uppercase tracking-wide">Quick Donate</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[1, 2, 5].map((multiplier) => {
                            const amount = charity.minDonation * multiplier;
                            const canAfford = userCoins >= amount;
                            return (
                                <motion.button
                                    key={multiplier}
                                    onClick={() => onDonate(amount)}
                                    disabled={!canAfford || isDonating}
                                    whileTap={{ scale: 0.95 }}
                                    className={`py-4 rounded-2xl font-black border-3 transition-all ${canAfford
                                        ? `${colors.btn} text-white border-dark shadow-brutal-sm active:shadow-none active:translate-y-1`
                                        : 'bg-gray-100 text-gray-400 border-gray-200'
                                        }`}
                                >
                                    {isDonating ? (
                                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-lg block">🪙 {amount}</span>
                                            <span className="text-[10px] opacity-80">{formatRupeeValue(amount)}</span>
                                        </>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Custom Amount */}
                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-center text-xs font-bold text-dark/40 mb-3 uppercase tracking-wide">Or Custom Amount</p>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🪙</span>
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder={`Max: ${userCoins}`}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none font-bold text-lg"
                                />
                            </div>
                            <button
                                onClick={handleCustomDonate}
                                disabled={!customAmount || parseInt(customAmount) > userCoins || parseInt(customAmount) <= 0 || isDonating}
                                className={`px-6 rounded-xl font-black transition-all ${parseInt(customAmount) > 0 && parseInt(customAmount) <= userCoins
                                    ? `${colors.btn} text-white border-3 border-dark shadow-brutal-sm`
                                    : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                Give
                            </button>
                        </div>
                        {customAmount && (
                            <p className="text-center text-xs text-dark/50 mt-2">
                                = {formatRupeeValue(parseInt(customAmount) || 0)}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Success modal with confetti effect
function SuccessModal({ donation, onClose }: { donation: any; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
            onClick={onClose}
        >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-2xl"
                        initial={{
                            x: '50vw',
                            y: '30vh',
                            scale: 0,
                            rotate: 0
                        }}
                        animate={{
                            x: `${Math.random() * 100}vw`,
                            y: `${Math.random() * 100}vh`,
                            scale: [0, 1, 1],
                            rotate: Math.random() * 360
                        }}
                        transition={{ duration: 1.5, delay: i * 0.05 }}
                    >
                        {['💚', '🌱', '✨', '🎉', '⭐'][i % 5]}
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-3xl border-3 border-dark shadow-brutal p-6 text-center relative z-10"
            >
                <motion.div
                    className="text-7xl mb-4"
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 0.6 }}
                >
                    💚
                </motion.div>
                <h2 className="text-2xl font-black text-dark">Thank You!</h2>
                <p className="text-sm text-dark/60 font-bold mt-1">{donation.impact}</p>

                <div className="mt-4 bg-gradient-to-r from-primary/20 to-emerald-100 rounded-2xl p-4 border-2 border-primary/30">
                    <p className="text-xs text-dark/50 font-bold">Donated to {donation.charity}</p>
                    <p className="text-3xl font-black text-dark mt-1">🪙 {donation.amount}</p>
                    <p className="text-sm text-dark/60 font-bold">{formatRupeeValue(donation.amount)}</p>
                </div>

                <motion.button
                    onClick={onClose}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 w-full py-4 bg-dark text-white font-black rounded-2xl border-3 border-dark shadow-brutal-sm active:shadow-none active:translate-y-1 transition-all"
                >
                    Done ✓
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// Top Donors Mini Leaderboard
function TopDonors() {
    const donors = [
        { name: 'Ankush J.', amount: 500, avatar: '🦸' },
        { name: 'Rudraksh B.', amount: 350, avatar: '🧑‍💻' },
        { name: 'Unnati A.', amount: 200, avatar: '👩‍🎓' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl border-3 border-dark shadow-brutal-sm p-4"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <h3 className="font-black text-dark">Top Donors This Week</h3>
                </div>
            </div>
            <div className="space-y-2">
                {donors.map((donor, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl p-2 border border-dark/10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-dark' : i === 1 ? 'bg-gray-300 text-dark' : 'bg-amber-700 text-white'}`}>
                            {i + 1}
                        </div>
                        <span className="text-xl">{donor.avatar}</span>
                        <span className="flex-1 font-bold text-dark text-sm">{donor.name}</span>
                        <span className="font-black text-primary">🪙 {donor.amount}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export default function GiveBackPage() {
    const [userCoins, setUserCoins] = useState(DemoManager.user.coins);
    const [charities, setCharities] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [stories, setStories] = useState<any[]>([]);
    const [activeStory, setActiveStory] = useState<any>(null);
    const [selectedCharity, setSelectedCharity] = useState<any>(null);
    const [donating, setDonating] = useState(false);
    const [successModal, setSuccessModal] = useState<any>(null);
    const [totalDonated, setTotalDonated] = useState(125);

    useEffect(() => {
        setCharities(DemoManager.getCharityGoals());
        setStats(DemoManager.getGiveBackStats());
        setStories(DemoManager.getCharityStories());
        setUserCoins(DemoManager.user.coins);
    }, []);

    const handleDonate = async (amount: number) => {
        if (!selectedCharity || userCoins < amount) return;
        setDonating(true);
        await DemoManager.simulateDelay(600);

        const result = DemoManager.donateToCharity(selectedCharity.id, amount);
        if (result.success) {
            setUserCoins(result.remainingCoins);
            setTotalDonated(prev => prev + amount);
            setSelectedCharity(null);
            setSuccessModal({
                charity: selectedCharity.name,
                amount,
                impact: `You just ${selectedCharity.impact.split(' per')[0]}!`
            });
        }
        setDonating(false);
    };

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Give Back" backHref="/" />

            <div className="px-4 pb-32 space-y-5">
                {/* Impact Hero */}
                <ImpactHero stats={stats} userCoins={userCoins} totalDonated={totalDonated} />

                {/* Story bar */}
                {stories.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-dark/50 mb-2 ml-1">Recent Updates</p>
                        <StoryBar stories={stories} onStoryClick={setActiveStory} />
                    </div>
                )}

                {/* Top Donors */}
                <TopDonors />

                {/* Charity cards */}
                <div>
                    <p className="text-xs font-bold text-dark/50 mb-3 ml-1">Choose a Cause</p>
                    <div className="space-y-4">
                        {charities.map((charity, i) => (
                            <motion.div
                                key={charity.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <CharityCard
                                    charity={charity}
                                    onClick={() => setSelectedCharity(charity)}
                                    userCoins={userCoins}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <p className="text-center text-xs text-dark/40 font-bold">
                    100% of donations go directly to verified partners 💚
                </p>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
                {selectedCharity && (
                    <CharityModal
                        charity={selectedCharity}
                        userCoins={userCoins}
                        onDonate={handleDonate}
                        isDonating={donating}
                        onClose={() => setSelectedCharity(null)}
                    />
                )}
                {successModal && <SuccessModal donation={successModal} onClose={() => setSuccessModal(null)} />}
            </AnimatePresence>
        </div>
    );
}
