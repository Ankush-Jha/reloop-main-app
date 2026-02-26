'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ScannerService from '@/lib/scanner-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useNavStore } from '@/lib/store/nav-store';
import { ScanningOverlay } from '@/components/scanner/ScanningOverlay';
import { MissionCompleteToast } from '@/components/ui/MissionCompleteToast';
import { Mission } from '@/types';
import type { WebcamCaptureRef } from '@/components/scanner/WebcamCapture';

// Dynamically import WebcamCapture to avoid SSR issues
const WebcamCapture = dynamic(
    () => import('@/components/scanner/WebcamCapture'),
    { ssr: false }
);

type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'error';

export default function ScannerPage() {
    const router = useRouter();
    const { user } = useAuth();
    const webcamRef = useRef<WebcamCaptureRef>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [cameraState, setCameraState] = useState<CameraState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { setActions, reset } = useNavStore();
    const [completedMission, setCompletedMission] = useState<Mission | null>(null);

    const requestCamera = useCallback(async () => {
        setCameraState('requesting');
        setErrorMessage(null);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraState('denied');
                setErrorMessage('Camera requires HTTPS. Tap Gallery to take a photo instead.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            stream.getTracks().forEach(track => track.stop());
            setCameraState('ready');
        } catch (err: any) {
            console.error('Camera error:', err);
            setCameraState('denied');

            if (err.name === 'NotAllowedError') {
                setErrorMessage('Camera permission denied. Please allow access in browser settings.');
            } else if (err.name === 'NotFoundError') {
                setErrorMessage('No camera found on this device.');
            } else if (err.name === 'NotReadableError') {
                setErrorMessage('Camera is in use by another app.');
            } else if (err.name === 'TypeError' || err.message?.includes('secure')) {
                setErrorMessage('Camera requires HTTPS. Use localhost, ngrok, or tap Gallery to take a photo.');
            } else {
                setErrorMessage('Camera unavailable. Tap Gallery to take or select a photo.');
            }
        }
    }, []);

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) {
            setErrorMessage('Failed to capture image. Please try again.');
            return;
        }

        setIsAnalyzing(true);
        setErrorMessage(null);

        try {
            const result = await ScannerService.analyzeImage(imageSrc);

            if (result.success) {
                const params = new URLSearchParams();
                params.set('result', JSON.stringify(result));
                router.push(`/scanner/ideas?${params.toString()}`);
            } else {
                setErrorMessage('Unable to analyze item. Please try again.');
            }
        } catch (err) {
            console.error('Scan error:', err);
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [router]);

    // Auto-request camera on page load for better UX
    useEffect(() => {
        // Only auto-request if we're in idle state and haven't requested before in this session
        const hasAutoRequested = sessionStorage.getItem('cameraAutoRequested');

        if (cameraState === 'idle' && !hasAutoRequested) {
            sessionStorage.setItem('cameraAutoRequested', 'true');
            // Small delay to let the page render smoothly
            const timer = setTimeout(() => {
                requestCamera();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [requestCamera, cameraState]);

    useEffect(() => {
        setActions({
            label: 'Capture',
            onClick: capture,
            icon: 'camera',
            disabled: isAnalyzing || cameraState !== 'ready',
            loading: isAnalyzing,
            variant: 'primary'
        });

        return () => reset();
    }, [capture, isAnalyzing, cameraState, setActions, reset]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setErrorMessage(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const imageSrc = reader.result as string;
                const result = await ScannerService.analyzeImage(imageSrc);

                if (result.success) {
                    const params = new URLSearchParams();
                    params.set('result', JSON.stringify(result));
                    router.push(`/scanner/ideas?${params.toString()}`);
                } else {
                    setErrorMessage('Unable to analyze item. Please try again.');
                }
            } catch (err) {
                console.error('Scan error:', err);
                setErrorMessage('An error occurred. Please try again.');
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-sky flex flex-col p-4 gap-4">
            {/* Floating Pill Header */}
            <header className="z-20 w-full pt-2">
                <div className="flex justify-between items-center bg-white neo-border rounded-full px-5 py-3 shadow-brutal-sm">
                    <Link
                        href="/"
                        className="flex items-center justify-center text-dark hover:bg-gray-100 rounded-full p-1 transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>arrow_back</span>
                    </Link>
                    <div className="text-sm font-black uppercase tracking-widest text-dark">Scan Item</div>
                    <button
                        onClick={() => {
                            setErrorMessage('Flashlight control coming soon! Use your device\'s flashlight for now.');
                            setTimeout(() => setErrorMessage(null), 3000);
                        }}
                        className="flex items-center justify-center text-dark hover:bg-gray-100 rounded-full p-1 transition-colors"
                        aria-label="Toggle flashlight"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>flash_on</span>
                    </button>
                </div>
            </header>

            {/* Camera Viewport */}
            <main className="relative z-10 flex-grow w-full">
                <div className="absolute inset-0 w-full h-full">
                    <div className="relative w-full h-full rounded-[2.5rem] border-4 border-dark overflow-hidden bg-dark shadow-brutal">

                        {/* Idle State */}
                        {cameraState === 'idle' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-dark-surface">
                                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 neo-border">
                                    <span className="material-symbols-outlined text-5xl text-primary">photo_camera</span>
                                </div>
                                <h2 className="text-white font-black text-2xl mb-2 uppercase tracking-tight">Ready to Scan</h2>
                                <p className="text-white/60 text-sm mb-8 max-w-xs">Tap below to start the camera and identify recyclable items</p>
                                <button
                                    onClick={requestCamera}
                                    className="px-10 py-4 bg-primary text-dark font-black rounded-full neo-border shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 transition-all uppercase tracking-wider"
                                >
                                    Start Camera
                                </button>
                            </div>
                        )}

                        {/* Requesting State */}
                        {cameraState === 'requesting' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-white/60 font-bold uppercase tracking-wider">Requesting camera access...</p>
                            </div>
                        )}

                        {/* Camera Ready - Show Webcam */}
                        {cameraState === 'ready' && (
                            <>
                                <WebcamCapture
                                    ref={webcamRef}
                                    onUserMediaError={() => {
                                        setCameraState('error');
                                        setErrorMessage('Camera stopped unexpectedly.');
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                {/* Dark Overlay */}
                                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                                {/* Scan Frame Corners - Animated */}
                                {!isAnalyzing && (
                                    <div className="absolute inset-8 pointer-events-none animate-pulse">
                                        <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-primary rounded-tl-xl" style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.5)' }} />
                                        <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-primary rounded-tr-xl" style={{ boxShadow: '-2px 2px 0px 0px rgba(0,0,0,0.5)' }} />
                                        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-primary rounded-bl-xl" style={{ boxShadow: '2px -2px 0px 0px rgba(0,0,0,0.5)' }} />
                                        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-primary rounded-br-xl" style={{ boxShadow: '-2px -2px 0px 0px rgba(0,0,0,0.5)' }} />
                                    </div>
                                )}

                                {/* Scanning Laser Line */}
                                {!isAnalyzing && (
                                    <div
                                        className="absolute left-4 right-4 h-1 bg-primary rounded-full z-20"
                                        style={{
                                            boxShadow: '0 0 15px rgba(37, 244, 120, 0.8)',
                                            animation: 'scan 3s ease-in-out infinite'
                                        }}
                                    />
                                )}

                                {/* Grid Overlay */}
                                <div
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{
                                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                                        backgroundSize: '40px 40px'
                                    }}
                                />
                            </>
                        )}

                        {/* Error/Denied State */}
                        {(cameraState === 'denied' || cameraState === 'error') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-dark-surface">
                                <div className="w-24 h-24 bg-card-coral/30 rounded-full flex items-center justify-center mb-6 neo-border border-card-coral">
                                    <span className="material-symbols-outlined text-5xl text-card-coral">videocam_off</span>
                                </div>
                                <h2 className="text-white font-black text-2xl mb-2 uppercase">Camera Unavailable</h2>
                                <p className="text-white/60 text-sm mb-6 max-w-xs">{errorMessage}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={requestCamera}
                                        className="px-6 py-3 bg-white/10 text-white font-bold rounded-full border-2 border-white/20 active:scale-95 transition-transform"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-3 bg-primary text-dark font-bold rounded-full neo-border shadow-brutal-sm active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                                    >
                                        Use Gallery
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error Message Toast */}
                        {errorMessage && cameraState === 'ready' && (
                            <div className="absolute bottom-4 left-4 right-4 bg-card-coral text-dark p-4 rounded-2xl text-center font-bold neo-border z-30">
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Controls */}
            <footer className="relative z-20 w-full flex flex-col items-center gap-4 pb-4">
                {/* Tip Pill */}
                <div className="bg-white neo-border rounded-full px-6 py-2 shadow-brutal-sm transform transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-dark" style={{ fontSize: 20 }}>info</span>
                        <p className="text-dark text-sm font-bold">
                            {cameraState === 'ready' ? 'Tip: Hold steady' : 'Tip: Start camera or use gallery'}
                        </p>
                    </div>
                </div>

                {/* Capture Button */}
                <div className="w-full px-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                    />

                    {cameraState === 'ready' ? (
                        <button
                            onClick={capture}
                            disabled={isAnalyzing}
                            className="group relative w-full flex items-center justify-center h-16 bg-primary border-4 border-dark rounded-full shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150 overflow-hidden disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 text-dark text-lg font-black tracking-widest uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                                {isAnalyzing ? 'Analyzing...' : 'Tap to Capture'}
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative w-full flex items-center justify-center h-16 bg-primary border-4 border-dark rounded-full shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 text-dark text-lg font-black tracking-widest uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                                Upload from Gallery
                            </span>
                        </button>
                    )}
                </div>

                {/* Secondary Links */}
                <div className="flex gap-6 mt-1">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-dark/60 font-bold text-xs uppercase hover:text-dark transition-colors"
                    >
                        Gallery
                    </button>
                    <div className="w-1 h-4 bg-dark/20" />
                    <button
                        onClick={() => router.push('/scanner/history')}
                        className="text-dark/60 font-bold text-xs uppercase hover:text-dark transition-colors"
                    >
                        History
                    </button>
                </div>
            </footer>

            {/* Scanning Overlay */}
            {isAnalyzing && <ScanningOverlay />}

            {/* Mission Toast */}
            <MissionCompleteToast
                mission={completedMission}
                onClose={() => setCompletedMission(null)}
            />

            {/* Scan Animation Keyframes */}
            <style jsx>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0.5; }
                    50% { top: 90%; opacity: 1; }
                    100% { top: 10%; opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
