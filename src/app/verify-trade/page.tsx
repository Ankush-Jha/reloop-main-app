'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavStore } from '@/lib/store/nav-store';
import { ScanningOverlay } from '@/components/scanner/ScanningOverlay';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const STEPS = [
    { icon: 'handshake', title: 'Meet Up', desc: 'Meet the trader at the agreed location' },
    { icon: 'check_circle', title: 'Inspect Item', desc: 'Check the item matches the listing' },
    { icon: 'qr_code_scanner', title: 'Verify Trade', desc: 'Scan QR code or enter verification code' },
];

export default function VerifyTradePage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [step, setStep] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const { setActions, reset } = useNavStore();

    // Register action when verified
    useEffect(() => {
        if (verified) {
            setActions({
                label: 'Done',
                onClick: () => router.push('/'),
                icon: 'check',
                variant: 'primary'
            });
        }
        return () => reset();
    }, [verified, router]);

    const handleVerify = async () => {
        if (!code) return;
        setIsVerifying(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setVerified(true);
        setIsVerifying(false);
    };

    // Simulate QR scan completion
    useEffect(() => {
        if (showScanner) {
            const timer = setTimeout(() => {
                setShowScanner(false);
                setCode('RELOOP-8821');
                // Auto verify after scan
                setTimeout(() => handleVerify(), 500);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [showScanner]);

    if (verified) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-100 to-white flex flex-col items-center justify-center px-8">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
                    className="w-32 h-32 bg-primary rounded-[2.5rem] border-[3px] border-dark dark:border-gray-600 shadow-brutal flex items-center justify-center mb-6"
                >
                    <span className="material-symbols-outlined text-6xl text-dark dark:text-white">verified</span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-[900] text-dark dark:text-white uppercase">Trade Verified!</h1>
                    <p className="text-dark/60 dark:text-white/60 mt-2">Eco Coins have been transferred successfully</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Verify Trade" backHref="/trade-history" />

            <motion.div
                className="px-5 pb-28 space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Steps */}
                <motion.div variants={itemVariants} className="space-y-3">
                    {STEPS.map((s, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${i <= step
                                ? 'bg-card-green border-dark dark:border-gray-600 shadow-brutal-sm'
                                : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 opacity-50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl border-2 border-dark dark:border-gray-600 flex items-center justify-center ${i < step ? 'bg-primary' : 'bg-white dark:bg-dark-surface'}`}>
                                {i < step ? (
                                    <span className="material-symbols-outlined text-dark dark:text-white">check</span>
                                ) : (
                                    <span className="material-symbols-outlined text-dark dark:text-white">{s.icon}</span>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-dark dark:text-white text-sm">{s.title}</p>
                                <p className="text-xs text-dark/60 dark:text-white/60">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Progress Buttons */}
                {step < 2 && (
                    <motion.div variants={itemVariants}>
                        <button
                            onClick={() => setStep(step + 1)}
                            className="w-full bg-primary text-dark py-4 rounded-2xl font-bold border-2 border-dark dark:border-gray-600 shadow-brutal active:translate-y-1 active:shadow-none transition-all"
                        >
                            {step === 0 ? 'I\'ve Met the Trader' : 'Item Looks Good'}
                        </button>
                    </motion.div>
                )}

                {/* Verification Code */}
                {step === 2 && (
                    <motion.div variants={itemVariants} className="space-y-4">
                        <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-5">
                            <p className="font-bold text-dark dark:text-white text-sm mb-3">Enter Verification Code</p>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g., RELOOP-1234"
                                maxLength={12}
                                className="w-full h-16 rounded-2xl bg-gray-100 dark:bg-dark-surface border-2 border-dark dark:border-gray-600 px-5 text-2xl font-black text-center tracking-widest uppercase placeholder:text-gray-300 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-dark/40 dark:text-white/40 mt-2 text-center">Ask the other trader for their code</p>
                        </div>

                        <button
                            onClick={handleVerify}
                            disabled={!code || isVerifying}
                            className="w-full bg-dark text-white py-5 rounded-2xl font-[900] uppercase tracking-wider shadow-brutal disabled:opacity-50 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            {isVerifying ? (
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">verified</span>
                                    Verify Trade
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* QR Alternative */}
                {step === 2 && (
                    <motion.div variants={itemVariants} className="text-center">
                        <p className="text-dark/40 dark:text-white/40 text-sm mb-3">or</p>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="px-6 py-3 bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 rounded-full font-bold text-dark dark:text-white shadow-brutal-sm active:scale-95 transition-transform flex items-center gap-2 mx-auto"
                        >
                            <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                            Scan QR Code
                        </button>
                    </motion.div>
                )}
            </motion.div>

            {/* Full Screen Scanner Overlay */}
            <AnimatePresence>
                {showScanner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                    >
                        <ScanningOverlay onCancel={() => setShowScanner(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
