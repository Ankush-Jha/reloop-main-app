'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanBagPage() {
    const router = useRouter();
    const { user, isDemo } = useAuth();
    const [scanning, setScanning] = useState(false);
    const [scannedQR, setScannedQR] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState('');
    const [manualInput, setManualInput] = useState('');
    const [cameraError, setCameraError] = useState('');
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerInitialized = useRef(false);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current && scannerInitialized.current) {
                html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
            }
        };
    }, []);

    // Initialize camera scanner when scanning state becomes true (after qr-reader div is in DOM)
    useEffect(() => {
        if (!scanning || isDemo || scannedQR) return;

        const initScanner = async () => {
            // Wait a small moment for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));

            const qrReaderEl = document.getElementById('qr-reader');
            if (!qrReaderEl) {
                console.error('qr-reader element not found');
                setCameraError('Scanner element not found. Please try again.');
                setScanning(false);
                return;
            }

            try {
                const html5QrCode = new Html5Qrcode('qr-reader');
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: 'environment' }, // Use back camera
                    config,
                    (decodedText) => {
                        // Success callback
                        setScannedQR(decodedText.toUpperCase());
                        html5QrCode.stop().then(() => {
                            scannerInitialized.current = false;
                            setScanning(false);
                        }).catch(err => console.error('Error stopping:', err));
                    },
                    () => {
                        // Scanning error callback (not critical, happens every frame without QR)
                    }
                );

                scannerInitialized.current = true;

            } catch (err: any) {
                console.error('Camera error:', err);
                setCameraError(err.message || 'Failed to access camera. Please allow camera permissions or use manual input.');
                setScanning(false);
            }
        };

        initScanner();
    }, [scanning, isDemo, scannedQR]);

    const handleScan = async () => {
        setError('');
        setCameraError('');

        if (isDemo) {
            // Demo mode - generate a random QR code
            setScanning(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const DemoManager = require('@/lib/demo-manager').default;
            const qr = DemoManager.getUnregisteredBagQR();
            setScannedQR(qr);
            setScanning(false);
            return;
        }

        // Set scanning to true - useEffect will initialize the camera after the qr-reader div renders
        setScanning(true);
    };

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            setScannedQR(manualInput.trim().toUpperCase());
        }
    };

    const handleRegister = async () => {
        if (!scannedQR || !user) return;

        setRegistering(true);
        setError('');

        try {
            if (isDemo) {
                // Demo mode
                const DemoManager = require('@/lib/demo-manager').default;
                await new Promise(resolve => setTimeout(resolve, 1000));
                const result = DemoManager.registerSmartBag(scannedQR);

                if (result.success) {
                    router.push(`/smart-bags/${result.bag.id}`);
                } else {
                    setError('This bag is already registered!');
                    setScannedQR(null);
                }
            } else {
                // Real Firebase registration
                const bagId = await DBService.createSmartBag({
                    qrCode: scannedQR,
                    userId: user.uid,
                    ownerName: user.name
                });
                router.push(`/smart-bags/${bagId}`);
            }
        } catch (err: any) {
            console.error('Error registering bag:', err);
            setError(err.message || 'Failed to register bag');
            // Don't clear scannedQR so user can see the error
        } finally {
            setRegistering(false);
        }
    };

    if (scannedQR) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-32 h-32 bg-green-500 rounded-full border-4 border-dark shadow-brutal flex items-center justify-center mb-6"
                >
                    <span className="material-symbols-outlined text-white text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6"
                >
                    <h1 className="text-2xl font-black text-dark dark:text-white mb-2">Bag Found!</h1>
                    <p className="text-dark/70 dark:text-white/70 text-sm max-w-xs">
                        Register this bag to your account to start earning coins
                    </p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-card-coral text-dark p-3 rounded-xl mb-4 text-sm font-bold border-2 border-dark w-full max-w-xs text-center"
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal p-6 mb-6 w-full max-w-xs"
                >
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-1">QR CODE</p>
                    <p className="text-lg font-black text-dark dark:text-white">{scannedQR}</p>

                    <div className="mt-4 pt-4 border-t-2 border-dashed border-dark/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-dark/70 dark:text-white/70">
                            <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Dynamic QR - Not assigned
                        </div>
                        <div className="flex items-center gap-2 text-sm text-dark/70 dark:text-white/70">
                            <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Ready for registration
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3 w-full max-w-xs"
                >
                    <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="w-full bg-green-500 text-white font-black py-4 rounded-2xl border-2 border-dark shadow-brutal flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform disabled:opacity-50"
                    >
                        {registering ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Registering...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">add_circle</span>
                                Register Bag
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => { setScannedQR(null); setError(''); }}
                        className="w-full bg-white dark:bg-dark-surface text-dark dark:text-white font-bold py-3 rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm"
                    >
                        Scan Different Bag
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Scan Smart Bag" backHref="/smart-bags" />

            <div className="px-5 pb-28 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
                {/* Camera View */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-full max-w-sm aspect-square bg-dark rounded-3xl border-4 border-dark shadow-brutal overflow-hidden mb-6"
                >
                    {scanning ? (
                        // Real QR Scanner
                        <div
                            id="qr-reader"
                            className="w-full h-full"
                            style={{ border: 'none' }}
                        ></div>
                    ) : (
                        // Placeholder when not scanning
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="w-48 h-48 border-4 border-green-400 rounded-2xl"
                            />
                        </div>
                    )}
                </motion.div>

                {/* Camera Error */}
                {cameraError && (
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-red-100 border-2 border-red-500 rounded-xl p-3 mb-4 w-full max-w-sm"
                    >
                        <p className="text-sm font-bold text-red-700">📷 {cameraError}</p>
                    </motion.div>
                )}

                <div className="text-center mb-6">
                    <p className="text-lg font-black text-dark dark:text-white mb-2">
                        {scanning ? 'Scanning...' : 'Ready to Scan'}
                    </p>
                    <p className="text-sm text-dark/60 dark:text-white/60 max-w-xs">
                        {scanning ? 'Point your camera at the QR code' : 'Tap the camera button to start scanning'}
                    </p>
                </div>

                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-20 h-20 bg-green-500 rounded-full border-4 border-dark shadow-brutal flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {scanning ? (
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="material-symbols-outlined text-white text-4xl"
                        >
                            refresh
                        </motion.span>
                    ) : (
                        <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                    )}
                </button>

                {/* Manual Input Option */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 w-full max-w-sm"
                >
                    <p className="text-xs font-bold text-dark/50 dark:text-white/50 text-center mb-2">Or enter QR code manually</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="e.g. BAG-ABC123"
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-dark dark:border-gray-600 bg-white dark:bg-dark-surface font-bold text-dark dark:text-white"
                        />
                        <button
                            onClick={handleManualSubmit}
                            disabled={!manualInput.trim()}
                            className="px-4 py-3 bg-primary text-dark font-black rounded-xl border-2 border-dark shadow-brutal-sm disabled:opacity-50"
                        >
                            Go
                        </button>
                    </div>
                </motion.div>

                {/* Demo Hint */}
                {isDemo && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 bg-card-yellow rounded-xl border-2 border-dark shadow-brutal-sm px-4 py-3 max-w-sm"
                    >
                        <p className="text-xs font-bold text-dark">💡 Demo Mode</p>
                        <p className="text-xs text-dark/70 mt-1">
                            Tap the camera button to simulate scanning a QR code.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
