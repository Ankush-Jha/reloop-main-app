'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import DemoManager from '@/lib/demo-manager';
import { ScanResult } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import ScannerService from '@/lib/scanner-service';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ScanHistoryPage() {
    const router = useRouter();
    const { user, isDemo } = useAuth();
    const [history, setHistory] = useState<ScanResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            try {
                if (user?.uid && !isDemo) {
                    const scans = await DBService.getUserScans(user.uid);
                    if (scans.length > 0) {
                        // Convert Firebase scan format to ScanResult format
                        const mappedScans = scans.map(scan => ({
                            success: true,
                            item: scan.item,
                            classification: scan.classification || 'safe',
                            xpEarned: scan.xpEarned || 0
                        }));
                        setHistory(mappedScans);
                    } else {
                        setHistory([]);
                    }
                } else {
                    // Demo mode fallback
                    setHistory(DemoManager.getScanHistory());
                }
            } catch (error) {
                console.error('Error loading scan history:', error);
                setHistory(DemoManager.getScanHistory());
            }
            setIsLoading(false);
        };

        loadHistory();
    }, [user, isDemo]);

    const handleItemClick = (result: ScanResult) => {
        ScannerService.storeResult(result);
        router.push('/scanner/results');
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Electronics': return 'devices';
            case 'Clothing': return 'apparel';
            case 'Books': return 'menu_book';
            default: return 'recycling';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Scan History" backHref="/scanner" />

            <div className="px-5 pb-28 space-y-3">
                {isLoading ? (
                    <motion.div
                        className="flex items-center justify-center py-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </motion.div>
                ) : history.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <EmptyState
                            icon="history"
                            title="No scans yet"
                            description="Items you scan will appear here."
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-3"
                    >
                        {history.map((scan, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleItemClick(scan)}
                                className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark shadow-brutal-sm p-4 flex items-center gap-4 cursor-pointer"
                            >
                                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 border-2 border-dark">
                                    <span className="material-symbols-outlined text-2xl text-dark dark:text-white">
                                        {getCategoryIcon(scan.item.category)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-dark dark:text-white truncate">{scan.item.objectName}</h3>
                                    <p className="text-xs text-dark/60 dark:text-white/60">{scan.item.category}</p>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                                            🪙 +{scan.item.estimatedCoins}
                                        </span>
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                                            🌱 {scan.item.co2Savings}kg
                                        </span>
                                    </div>
                                </div>
                                <motion.div
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
                                    whileHover={{ x: 3 }}
                                >
                                    <span className="material-symbols-outlined text-sm text-dark dark:text-white">arrow_forward</span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
