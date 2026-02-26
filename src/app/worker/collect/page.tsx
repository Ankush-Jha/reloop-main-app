'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import DemoManager from '@/lib/demo-manager';

export default function WorkerCollectPage() {
    const router = useRouter();
    const { user, isDemo, isLoading: authLoading } = useAuth();
    const [step, setStep] = useState<'scan' | 'weigh' | 'confirm' | 'success'>('scan');
    const [scanning, setScanning] = useState(false);
    const [scannedBag, setScannedBag] = useState<any | null>(null);
    const [weight, setWeight] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [coinsAwarded, setCoinsAwarded] = useState(0);
    const [allBags, setAllBags] = useState<any[]>([]);

    // Load all bags on mount
    useEffect(() => {
        // Wait for auth to finish loading before fetching data
        if (authLoading) return;

        const loadBags = async () => {
            try {
                if (isDemo) {
                    // Demo mode - use mock data
                    setAllBags(DemoManager.getAllSmartBags());
                } else if (user?.uid) {
                    // Firebase mode
                    const bags = await DBService.getUserSmartBags(user.uid);
                    setAllBags(bags);
                }
            } catch (error) {
                console.error('Error loading bags:', error);
                setAllBags(DemoManager.getAllSmartBags());
            }
        };
        loadBags();
    }, [user, isDemo, authLoading]);

    const handleScan = async () => {
        setScanning(true);

        try {
            if (!isDemo) {
                // Simulate scanning - in real app this would use camera
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Find a filled bag from Firebase
                const filledBag = allBags.find(b => b.status === 'filled');
                if (filledBag) {
                    setScannedBag(filledBag);
                    setStep('weigh');
                } else {
                    alert('No filled bags available. Please mark a bag as filled first.');
                }
            } else {
                await DemoManager.simulateDelay(1500);
                const demoBags = DemoManager.getAllSmartBags();
                const filledBag = demoBags.find(b => b.status === 'filled');

                if (filledBag) {
                    setScannedBag(filledBag);
                    setStep('weigh');
                } else {
                    alert('No filled bags available for demo. Please mark a bag as filled first.');
                }
            }
        } catch (error) {
            console.error('Error scanning:', error);
            alert('An error occurred while scanning.');
        }

        setScanning(false);
    };

    const handleWeighSubmit = () => {
        if (parseFloat(weight) > 0) {
            setStep('confirm');
        }
    };

    const handleConfirm = async () => {
        if (!scannedBag || !weight) return;

        setConfirming(true);

        try {
            const weightKg = parseFloat(weight);
            const coins = Math.floor(weightKg * 10);

            if (!isDemo && scannedBag.userId) {
                // Update bag status in Firebase
                await DBService.updateSmartBagStatus(scannedBag.id, 'collected');

                // Add coins to bag owner
                await DBService.addCoinsToUser(scannedBag.userId, coins, 'Smart bag collection');

                setCoinsAwarded(coins);
                setStep('success');
            } else {
                await DemoManager.simulateDelay(1500);
                const result = DemoManager.collectSmartBag(scannedBag.qrCode, weightKg);

                if (result.success) {
                    setCoinsAwarded(result.coinsAwarded || 0);
                    setStep('success');
                }
            }
        } catch (error) {
            console.error('Error confirming collection:', error);
            alert('An error occurred. Please try again.');
        }

        setConfirming(false);
    };

    const resetFlow = () => {
        setStep('scan');
        setScannedBag(null);
        setWeight('');
        setCoinsAwarded(0);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="bg-dark text-white px-5 py-4 border-b-4 border-dark-surface">
                <button onClick={() => router.back()} className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="font-bold">Back</span>
                </button>
                <h1 className="text-2xl font-black">Worker Collection</h1>
                <p className="text-sm text-white/70 mt-1">Scan, weigh, and process smart bags</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Scan */}
                    {step === 'scan' && (
                        <motion.div
                            key="scan"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md text-center"
                        >
                            <div className="w-full aspect-square bg-dark rounded-3xl border-4 border-dark shadow-brutal mb-6 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-48 h-48 border-4 border-green-400 rounded-2xl"
                                />
                            </div>

                            <p className="text-lg font-black text-dark dark:text-white mb-2">
                                {scanning ? 'Scanning QR...' : 'Scan Bag QR Code'}
                            </p>
                            <p className="text-sm text-dark/60 dark:text-white/60 mb-6 max-w-xs mx-auto">
                                Position the QR code on the smart bag within the frame
                            </p>

                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="w-full bg-green-500 text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">qr_code_scanner</span>
                                {scanning ? 'Scanning...' : 'Scan QR Code'}
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: Weigh */}
                    {step === 'weigh' && scannedBag && (
                        <motion.div
                            key="weigh"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md"
                        >
                            <div className="bg-white dark:bg-dark-surface rounded-2xl border-3 border-dark shadow-brutal p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-dark dark:text-white">Bag Identified</p>
                                        <p className="text-sm text-dark/60 dark:text-white/60">{scannedBag.qrCode || scannedBag.id}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-100 dark:bg-dark-bg rounded-xl px-3 py-2">
                                    <p className="text-xs text-dark/50 dark:text-white/50">Owner</p>
                                    <p className="text-sm font-bold text-dark dark:text-white">{scannedBag.ownerName || 'User'}</p>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <span className="material-symbols-outlined text-8xl mb-4">monitor_weight</span>
                                <p className="text-lg font-black text-dark dark:text-white mb-2">Enter Weight</p>
                                <p className="text-sm text-dark/60 dark:text-white/60">Weigh the bag and input the weight</p>
                            </div>

                            <div className="relative mb-6">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full text-4xl font-black text-center bg-white dark:bg-dark-surface border-3 border-dark rounded-2xl py-6 px-4 shadow-brutal focus:ring-4 focus:ring-green-200 dark:text-white"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-dark/40 dark:text-white/40">kg</div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleWeighSubmit}
                                    disabled={!weight || parseFloat(weight) <= 0}
                                    className="w-full bg-green-500 text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                    Continue
                                </button>
                                <button
                                    onClick={resetFlow}
                                    className="w-full bg-white dark:bg-dark-surface text-dark dark:text-white font-bold py-3 rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 'confirm' && scannedBag && weight && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md"
                        >
                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl border-4 border-dark shadow-brutal p-6 mb-6 text-center">
                                <span className="material-symbols-outlined text-7xl text-dark mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
                                <p className="text-sm font-black uppercase text-dark/70 tracking-wider">Confirm Collection</p>
                            </div>

                            <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-6 mb-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-dark/60 dark:text-white/60">Bag QR</span>
                                    <span className="text-sm font-bold text-dark dark:text-white">{scannedBag.qrCode || scannedBag.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-dark/60 dark:text-white/60">Owner</span>
                                    <span className="text-sm font-bold text-dark dark:text-white">{scannedBag.ownerName || 'User'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-dark/60 dark:text-white/60">Weight</span>
                                    <span className="text-sm font-bold text-dark dark:text-white">{parseFloat(weight).toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-dark/10">
                                    <span className="text-sm text-dark/60 dark:text-white/60">Coins to Award</span>
                                    <span className="text-3xl font-black text-green-600 dark:text-green-400">+{Math.floor(parseFloat(weight) * 10)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleConfirm}
                                    disabled={confirming}
                                    className="w-full bg-dark text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    {confirming ? 'Processing...' : 'Confirm Collection'}
                                </button>
                                <button
                                    onClick={() => setStep('weigh')}
                                    className="w-full bg-white dark:bg-dark-surface text-dark dark:text-white font-bold py-3 rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm"
                                >
                                    Edit Weight
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && scannedBag && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-32 h-32 bg-green-500 rounded-full border-4 border-dark shadow-brutal flex items-center justify-center mb-6 mx-auto"
                            >
                                <span className="material-symbols-outlined text-white text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </motion.div>

                            <h1 className="text-3xl font-black text-dark dark:text-white mb-2">Collected!</h1>
                            <p className="text-dark/70 dark:text-white/70 mb-6">Bag processed successfully</p>

                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl border-3 border-dark shadow-brutal p-6 mb-6">
                                <p className="text-sm font-black uppercase text-dark/70 tracking-wider mb-1">Coins Awarded</p>
                                <p className="text-6xl font-black text-dark">+{coinsAwarded}</p>
                                <p className="text-sm font-bold text-dark/70 mt-2">to {scannedBag.ownerName || 'User'}</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={resetFlow}
                                    className="w-full bg-dark text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">qr_code_scanner</span>
                                    Scan Next Bag
                                </button>
                                <button
                                    onClick={() => router.push('/smart-bags')}
                                    className="w-full bg-white dark:bg-dark-surface text-dark dark:text-white font-bold py-3 rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm"
                                >
                                    View All Bags
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
