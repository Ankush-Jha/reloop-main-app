'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ScannerService from '@/lib/scanner-service';
import { ScanResult } from '@/types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const RECYCLE_TIPS = [
    { icon: 'delete', title: 'Clean Before Recycling', desc: 'Rinse containers and remove food residue', color: 'bg-card-blue' },
    { icon: 'compress', title: 'Flatten Cardboard', desc: 'Break down boxes to save bin space', color: 'bg-card-yellow' },
    { icon: 'block', title: 'No Plastic Bags', desc: 'Loose recyclables only — no bag liners', color: 'bg-card-pink' },
    { icon: 'check_circle', title: 'Check Local Rules', desc: 'Recycling rules vary by location', color: 'bg-card-green' },
];

const NEARBY_BINS = [
    { name: 'Campus Center', distance: '50m', types: ['Paper', 'Plastic', 'Glass'] },
    { name: 'Library Entrance', distance: '120m', types: ['Paper', 'Plastic'] },
    { name: 'Dorm Building A', distance: '200m', types: ['Paper', 'Plastic', 'Metal', 'Glass'] },
];

export default function RecyclePage() {
    const router = useRouter();
    const [result, setResult] = useState<ScanResult | null>(null);

    useEffect(() => {
        const stored = ScannerService.getStoredResult();
        if (!stored) {
            router.push('/scanner');
            return;
        }
        setResult(stored);
    }, [router]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="px-5 pt-6 pb-4 flex items-center gap-4">
                <Link
                    href="/scanner/results"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm"
                >
                    <span className="material-symbols-outlined text-dark dark:text-white">arrow_back</span>
                </Link>
                <div>
                    <h1 className="font-black text-dark dark:text-white text-xl">Recycle Guide</h1>
                    {result && <p className="text-sm text-dark/60 dark:text-white/60">For your {result.item.objectName}</p>}
                </div>
            </header>

            <motion.div
                className="px-5 pb-28 space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Recyclability Card */}
                {result && (
                    <motion.div variants={itemVariants} className={`rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal p-5 text-center ${result.item.recyclable ? 'bg-card-green' : 'bg-card-coral'}`}>
                        <span className="material-symbols-outlined text-5xl text-dark dark:text-white mb-2">
                            {result.item.recyclable ? 'recycling' : 'do_not_disturb'}
                        </span>
                        <h2 className="text-xl font-[900] text-dark dark:text-white">
                            {result.item.recyclable ? 'Recyclable!' : 'Not Recyclable'}
                        </h2>
                        <p className="text-sm text-dark/70 dark:text-white/70 mt-1">{result.item.recycleInfo || 'Check local guidelines'}</p>
                        {result.item.material && (
                            <span className="inline-block mt-3 px-3 py-1 bg-white dark:bg-dark-surface rounded-full border border-dark dark:border-gray-600 text-xs font-bold text-dark dark:text-white">
                                Material: {result.item.material}
                            </span>
                        )}
                    </motion.div>
                )}

                {/* Recycling Tips */}
                <motion.div variants={itemVariants}>
                    <p className="font-extrabold text-dark dark:text-white text-lg mb-3 ml-1">Recycling Tips</p>
                    <div className="grid grid-cols-2 gap-3">
                        {RECYCLE_TIPS.map((tip, i) => (
                            <div key={i} className={`${tip.color} rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4`}>
                                <span className="material-symbols-outlined text-2xl text-dark dark:text-white mb-2">{tip.icon}</span>
                                <p className="font-black text-dark dark:text-white text-xs">{tip.title}</p>
                                <p className="text-[10px] text-dark/60 dark:text-white/60 mt-1">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Nearby Recycling Bins */}
                <motion.div variants={itemVariants}>
                    <p className="font-extrabold text-dark dark:text-white text-lg mb-3 ml-1">Nearby Recycling Bins</p>
                    <div className="space-y-3">
                        {NEARBY_BINS.map((bin, i) => (
                            <div key={i} className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-card-green rounded-xl border-2 border-dark dark:border-gray-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-xl text-dark dark:text-white">location_on</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-dark dark:text-white text-sm">{bin.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {bin.types.map(type => (
                                            <span key={type} className="px-2 py-0.5 bg-gray-100 dark:bg-dark-surface rounded text-[10px] font-bold text-dark/60 dark:text-white/60">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-primary">{bin.distance}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div variants={itemVariants} className="space-y-3">
                    <Link
                        href="/scanner/ideas"
                        className="w-full bg-primary text-dark py-4 rounded-2xl font-[900] uppercase tracking-wider border-2 border-dark dark:border-gray-600 shadow-brutal active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                    >
                        <span className="material-symbols-outlined">recycling</span>
                        Upcycle Instead
                    </Link>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-dark text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform"
                    >
                        Done
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
