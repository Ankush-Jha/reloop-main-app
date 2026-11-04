'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import DemoManager from '@/lib/demo-manager';
import { QrScanner } from '@/components/scanner/QrScanner';
import { normalizeBagCode, bagPayout, BAG_MAX_WEIGHT_KG } from '@/lib/qr';

export default function WorkerCollectPage() {
    const router = useRouter();
    const { user, isDemo, isLoading: authLoading } = useAuth();
    const [step, setStep] = useState<'scan' | 'weigh' | 'confirm' | 'success'>('scan');
    const [cameraOn, setCameraOn] = useState(false);
    const [scannedBag, setScannedBag] = useState<any | null>(null);
    const [weight, setWeight] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [coinsAwarded, setCoinsAwarded] = useState(0);
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState('');

    // Only staff may collect bags (role is set in the Firebase console). Demo mode is open.
    const isStaff = isDemo || user?.role === 'worker' || user?.role === 'admin';

    const weightKg = Math.round((parseFloat(weight) || 0) * 10) / 10;
    const validWeight = weightKg > 0 && weightKg <= BAG_MAX_WEIGHT_KG;

    // A QR code (camera or typed) was read: look the bag up for real.
    const handleCode = async (raw: string) => {
        setCameraOn(false);
        setError('');

        const code = normalizeBagCode(raw);
        if (!code) {
            setError("That QR isn't a ReLoop bag code. Try again.");
            return;
        }

        try {
            const bag = isDemo
                ? DemoManager.getAllSmartBags().find(b => b.qrCode === code)
                : await DBService.getSmartBagByQR(code);

            if (!bag) {
                setError(`No registered bag found for ${code}.`);
            } else if (bag.status === 'processed' || bag.status === 'collected') {
                setError('This bag was already collected.');
            } else if (bag.status !== 'filled') {
                setError("This bag hasn't been marked as filled by its owner yet.");
            } else if (!isDemo && bag.ownerId === user?.uid) {
                setError("You can't collect your own bag.");
            } else {
                setScannedBag(bag);
                setStep('weigh');
            }
        } catch (e) {
            console.error('Bag lookup failed:', e);
            setError('Could not look up this bag. Check your connection and permissions.');
        }
    };

    const handleWeighSubmit = () => {
        if (validWeight) setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!scannedBag || !validWeight || confirming) return;
        setConfirming(true);
        setError('');

        try {
            if (isDemo) {
                await DemoManager.simulateDelay(800);
                const result = DemoManager.collectSmartBag(scannedBag.qrCode, weightKg);
                if (!result.success) throw new Error('Demo collection failed');
                setCoinsAwarded(result.coinsAwarded || 0);
            } else {
                if (!user?.uid) throw new Error('Not signed in');
                const result = await DBService.collectSmartBag(scannedBag.id, user.uid, weightKg);
                setCoinsAwarded(result.coinsAwarded);
            }
            setStep('success');
        } catch (e: any) {
            console.error('Error confirming collection:', e);
            setError(e?.message || 'Something went wrong. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    const resetFlow = () => {
        setStep('scan');
        setScannedBag(null);
        setWeight('');
        setCoinsAwarded(0);
        setManualCode('');
        setError('');
        setCameraOn(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isStaff) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-dark/30 dark:text-white/30 mb-4">lock</span>
                <h1 className="text-xl font-black text-dark dark:text-white mb-2">Workers only</h1>
                <p className="text-sm text-dark/60 dark:text-white/60 max-w-xs mb-6">
                    Bag collection is limited to ReLoop collection staff.
                </p>
                <button
                    onClick={() => router.push('/smart-bags')}
                    className="bg-primary text-dark font-black px-6 py-3 rounded-xl border-2 border-dark shadow-brutal-sm"
                >
                    Back to my bags
                </button>
            </div>
        );
    }

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
                                {cameraOn ? (
                                    <QrScanner
                                        onScan={handleCode}
                                        onError={(msg) => { setCameraOn(false); setError(msg); }}
                                    />
                                ) : (
                                    <div className="text-center px-6">
                                        <span className="material-symbols-outlined text-6xl text-white/40 mb-2">videocam_off</span>
                                        <p className="text-white/60 text-sm font-bold">Camera is off</p>
                                    </div>
                                )}
                            </div>

                            <p className="text-lg font-black text-dark dark:text-white mb-2">
                                {cameraOn ? 'Scanning...' : 'Scan Bag QR Code'}
                            </p>
                            <p className="text-sm text-dark/60 dark:text-white/60 mb-4 max-w-xs mx-auto">
                                {cameraOn
                                    ? 'Point the camera at the QR code on the smart bag'
                                    : 'Turn on the camera and point it at the QR code on the smart bag'}
                            </p>

                            {error && (
                                <div className="bg-card-coral text-dark p-3 rounded-xl mb-4 text-sm font-bold border-2 border-dark">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                onClick={() => { setError(''); setCameraOn(c => !c); }}
                                className="w-full bg-green-500 text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
                            >
                                <span className="material-symbols-outlined">{cameraOn ? 'stop_circle' : 'qr_code_scanner'}</span>
                                {cameraOn ? 'Stop Camera' : 'Start Camera'}
                            </button>

                            <div className="mt-6">
                                <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2">Or enter the bag code manually</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. BAG-ABC123"
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-dark dark:border-gray-600 bg-white dark:bg-dark-surface font-bold text-dark dark:text-white"
                                    />
                                    <button
                                        onClick={() => handleCode(manualCode)}
                                        disabled={!manualCode.trim()}
                                        className="px-4 py-3 bg-primary text-dark font-black rounded-xl border-2 border-dark shadow-brutal-sm disabled:opacity-50"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
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
                                    min="0"
                                    max={BAG_MAX_WEIGHT_KG}
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
                                    disabled={!validWeight}
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
                                    <span className="text-sm font-bold text-dark dark:text-white">{weightKg.toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-dark/10">
                                    <span className="text-sm text-dark/60 dark:text-white/60">Coins to Award</span>
                                    <span className="text-3xl font-black text-green-600 dark:text-green-400">+{bagPayout(weightKg)}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-card-coral text-dark p-3 rounded-xl mb-4 text-sm font-bold border-2 border-dark">
                                    ⚠️ {error}
                                </div>
                            )}

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
