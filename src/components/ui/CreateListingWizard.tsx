'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
// StorageService removed - using base64 images directly in Firestore (no billing needed)
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { WebcamCaptureRef } from '@/components/scanner/WebcamCapture';
import { formatRupeeValue, coinsToRupees } from '@/lib/eco-coins';

// Dynamically import WebcamCapture to avoid SSR issues
const WebcamCapture = dynamic(
    () => import('@/components/scanner/WebcamCapture'),
    { ssr: false }
);

const CATEGORIES = [
    { id: 'electronics', label: 'Electronics', icon: 'devices' },
    { id: 'furniture', label: 'Furniture', icon: 'chair' },
    { id: 'clothing', label: 'Clothing', icon: 'apparel' },
    { id: 'books', label: 'Books', icon: 'menu_book' },
    { id: 'sports', label: 'Sports', icon: 'sports_soccer' },
    { id: 'other', label: 'Other', icon: 'more_horiz' },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'captured';

interface CreateListingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateListingWizard({ isOpen, onClose, onSuccess }: CreateListingWizardProps) {
    const router = useRouter();
    const { user } = useAuth();
    const webcamRef = useRef<WebcamCaptureRef>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggested, setAiSuggested] = useState(false);
    const [cameraState, setCameraState] = useState<CameraState>('idle');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        condition: 'Good',
        price: '',
        images: [] as File[]
    });

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFormData({
                category: '',
                title: '',
                description: '',
                condition: 'Good',
                price: '',
                images: []
            });
            setImagePreviews([]);
            setAiSuggested(false);
            setIsAnalyzing(false);
            setCameraState('idle');
            setCapturedImage(null);
        }
    }, [isOpen]);

    // Request camera access
    const requestCamera = useCallback(async () => {
        setCameraState('requesting');
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraState('denied');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(track => track.stop());
            setCameraState('ready');
        } catch (err) {
            console.error('Camera error:', err);
            setCameraState('denied');
        }
    }, []);

    // Capture photo and analyze
    const capturePhoto = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setCapturedImage(imageSrc);
        setCameraState('captured');
        setImagePreviews([imageSrc]);

        // Convert data URL to File for upload
        try {
            const blob = await fetch(imageSrc).then(r => r.blob());
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFormData(prev => ({ ...prev, images: [file] }));
        } catch (err) {
            console.error('Failed to convert image:', err);
        }

        // Analyze with AI
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageSrc })
            });
            const data = await res.json();
            if (data.success && data.item) {
                const categoryId = data.item.category?.toLowerCase() || 'other';
                const validCategory = CATEGORIES.find(c => c.id === categoryId)?.id || 'other';
                const condition = CONDITIONS.includes(data.item.condition) ? data.item.condition : 'Good';

                setFormData(prev => ({
                    ...prev,
                    title: data.item.objectName || prev.title,
                    category: validCategory,
                    condition: condition,
                    price: String(data.item.estimatedCoins || 50)
                }));
                setAiSuggested(true);
            }
        } catch (error) {
            console.error('AI analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // Handle file upload as fallback
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];

        // Set the file for upload
        setFormData(prev => ({ ...prev, images: [file] }));

        const reader = new FileReader();
        reader.onloadend = async () => {
            const imageSrc = reader.result as string;
            setCapturedImage(imageSrc);
            setCameraState('captured');
            setImagePreviews([imageSrc]);

            // Analyze with AI
            setIsAnalyzing(true);
            try {
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: imageSrc })
                });
                const data = await res.json();
                if (data.success && data.item) {
                    const categoryId = data.item.category?.toLowerCase() || 'other';
                    const validCategory = CATEGORIES.find(c => c.id === categoryId)?.id || 'other';
                    const condition = CONDITIONS.includes(data.item.condition) ? data.item.condition : 'Good';

                    setFormData(prev => ({
                        ...prev,
                        title: data.item.objectName || prev.title,
                        category: validCategory,
                        condition: condition,
                        price: String(data.item.estimatedCoins || 50)
                    }));
                    setAiSuggested(true);
                }
            } catch (error) {
                console.error('AI analysis failed:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        setCameraState('ready');
        setImagePreviews([]);
        setFormData(prev => ({ ...prev, title: '' }));
        setAiSuggested(false);
    };

    const handleNext = () => setStep(s => Math.min(s + 1, 3));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        console.log('[DEBUG] handleSubmit called');
        if (!user) {
            console.log('[DEBUG] No user, returning');
            return;
        }
        if (!formData.title || !formData.price || !formData.category) {
            console.log('[DEBUG] Missing form data', { title: formData.title, price: formData.price, category: formData.category });
            return;
        }

        setIsSubmitting(true);
        console.log('[DEBUG] Starting submit process');

        try {
            // Use base64 images directly from imagePreviews (no Firebase Storage needed)
            // This stores the image data directly in Firestore
            let imageUrls: string[] = [];

            if (imagePreviews.length > 0) {
                // Use base64 data URLs directly - works without Firebase Storage billing
                console.log('[DEBUG] Using', imagePreviews.length, 'base64 images');
                imageUrls = imagePreviews;
            } else {
                // Generate a category-based placeholder
                const placeholders: Record<string, string> = {
                    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
                    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
                    clothing: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
                    books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
                    sports: 'https://images.unsplash.com/photo-1461896836934- voices?w=400',
                    other: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
                };
                imageUrls = [placeholders[formData.category] || placeholders.other];
                console.log('[DEBUG] Using category placeholder image');
            }

            console.log('[DEBUG] Creating listing in Firestore...');
            await DBService.createListing({
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                condition: formData.condition || 'Good',
                category: formData.category,
                location: 'Campus',
                images: imageUrls,
                status: 'available',
                seller: {
                    id: user.uid,
                    name: user.name,
                    avatar: user.avatar,
                    itemsTraded: user.itemsTraded || 0,
                    co2Saved: user.co2Saved || 0,
                    responseTime: '1 hour'
                }
            });
            console.log('[DEBUG] Listing created successfully!');

            onSuccess?.();
            onClose();
            router.push('/marketplace');
        } catch (error) {
            console.error("[DEBUG] Failed to create listing:", error);
            alert("Failed to create listing. Please try again.");
        } finally {
            console.log('[DEBUG] Submit process finished');
            setIsSubmitting(false);
        }
    };

    const cardVariants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-md max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="bg-white dark:bg-dark-surface rounded-t-3xl p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => step === 1 ? onClose() : handleBack()}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-dark dark:text-white">
                                {step === 1 ? 'close' : 'arrow_back'}
                            </span>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-lg font-black text-dark dark:text-white uppercase tracking-tight">
                                Create Listing
                            </h1>
                            {/* Progress Dots */}
                            <div className="flex gap-2 mt-2">
                                {[1, 2, 3].map(s => (
                                    <div
                                        key={s}
                                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${s < step ? 'bg-primary' :
                                            s === step ? 'bg-primary animate-pulse' :
                                                'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Card 1: Scan Item */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={cardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-dark-surface rounded-b-3xl p-6"
                            >
                                {/* Hidden file input for fallback */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                />

                                <div className="text-center mb-4">
                                    <span className="text-4xl">📸</span>
                                    <h2 className="text-2xl font-black text-dark dark:text-white mt-2">Scan your item</h2>
                                    <p className="text-gray-500 text-sm mt-1">AI will identify it automatically</p>
                                </div>

                                {/* Camera Viewport */}
                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-4 border-dark bg-dark mb-4">

                                    {/* Idle State */}
                                    {cameraState === 'idle' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface">
                                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-3xl text-primary">photo_camera</span>
                                            </div>
                                            <p className="text-white/60 text-sm mb-4">Ready to scan</p>
                                            <button
                                                onClick={requestCamera}
                                                className="px-6 py-3 bg-primary text-dark font-bold rounded-full shadow-brutal-sm active:scale-95 transition-all"
                                            >
                                                Start Camera
                                            </button>
                                        </div>
                                    )}

                                    {/* Requesting State */}
                                    {cameraState === 'requesting' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface">
                                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                                            <p className="text-white/60 text-sm">Requesting camera...</p>
                                        </div>
                                    )}

                                    {/* Camera Ready */}
                                    {cameraState === 'ready' && (
                                        <>
                                            <WebcamCapture
                                                ref={webcamRef}
                                                onUserMediaError={() => setCameraState('denied')}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                            {/* Scan corners */}
                                            <div className="absolute inset-4 pointer-events-none">
                                                <div className="absolute top-0 left-0 w-8 h-8 border-l-3 border-t-3 border-primary rounded-tl-lg" />
                                                <div className="absolute top-0 right-0 w-8 h-8 border-r-3 border-t-3 border-primary rounded-tr-lg" />
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-3 border-b-3 border-primary rounded-bl-lg" />
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-3 border-b-3 border-primary rounded-br-lg" />
                                            </div>
                                        </>
                                    )}

                                    {/* Camera Denied */}
                                    {cameraState === 'denied' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface p-4">
                                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-3xl text-red-400">videocam_off</span>
                                            </div>
                                            <p className="text-white/60 text-sm text-center mb-4">Camera unavailable</p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-3 bg-primary text-dark font-bold rounded-full shadow-brutal-sm active:scale-95 transition-all"
                                            >
                                                Use Gallery
                                            </button>
                                        </div>
                                    )}

                                    {/* Captured - Show preview */}
                                    {cameraState === 'captured' && capturedImage && (
                                        <div className="absolute inset-0">
                                            <Image src={capturedImage} alt="Captured" fill className="object-cover" />
                                            {/* AI Analyzing Overlay */}
                                            {isAnalyzing && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                                    <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mb-3" />
                                                    <span className="text-white font-bold text-sm">🤖 AI Analyzing...</span>
                                                </div>
                                            )}
                                            {/* Retake button */}
                                            {!isAnalyzing && (
                                                <button
                                                    onClick={retakePhoto}
                                                    className="absolute bottom-2 left-2 px-3 py-1.5 bg-white/90 text-dark text-xs font-bold rounded-full shadow-lg flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">refresh</span>
                                                    Retake
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Capture Button */}
                                {cameraState === 'ready' && (
                                    <button
                                        onClick={capturePhoto}
                                        className="w-full py-4 bg-primary text-dark font-black uppercase tracking-wide rounded-2xl shadow-brutal hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
                                    >
                                        <span className="material-symbols-outlined">photo_camera</span>
                                        Capture
                                    </button>
                                )}

                                {/* Gallery fallback button */}
                                {(cameraState === 'idle' || cameraState === 'ready') && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-2 text-gray-500 text-sm font-bold hover:text-primary transition-colors"
                                    >
                                        Or upload from gallery
                                    </button>
                                )}

                                {/* Title Input (after capture) */}
                                {cameraState === 'captured' && !isAnalyzing && (
                                    <div className="mt-4">
                                        {aiSuggested && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-xs">✨</span>
                                                <span className="text-[10px] font-bold text-primary uppercase">AI Identified</span>
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Item name..."
                                            value={formData.title}
                                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className={`w-full p-4 rounded-2xl border-2 bg-gray-50 dark:bg-dark-bg focus:border-primary outline-none transition-all text-lg font-medium ${aiSuggested ? 'border-primary/50' : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                        />
                                    </div>
                                )}

                                {/* Next Button (after capture and title) */}
                                {cameraState === 'captured' && !isAnalyzing && (
                                    <button
                                        onClick={handleNext}
                                        disabled={!formData.title}
                                        className="w-full mt-4 py-4 bg-primary text-dark font-black uppercase tracking-wide rounded-2xl shadow-brutal hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        Next
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* Card 2: Category + Condition */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={cardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-dark-surface rounded-b-3xl p-6"
                            >
                                <div className="text-center mb-6">
                                    <span className="text-4xl">📦</span>
                                    <h2 className="text-2xl font-black text-dark dark:text-white mt-2">Tell us more!</h2>
                                    <p className="text-gray-500 text-sm mt-1">Select category and condition</p>
                                </div>

                                {/* Category Grid */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-2 uppercase">
                                        Category
                                        {aiSuggested && <span className="text-primary">✨</span>}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${formData.category === cat.id
                                                    ? 'bg-primary border-dark shadow-brutal-sm'
                                                    : 'bg-gray-50 dark:bg-dark-bg border-transparent hover:border-primary/50'
                                                    }`}
                                            >
                                                <span className={`material-symbols-outlined text-xl ${formData.category === cat.id ? 'text-dark' : 'text-gray-500'}`}>{cat.icon}</span>
                                                <span className={`text-[10px] font-bold ${formData.category === cat.id ? 'text-dark' : 'text-gray-500'}`}>{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Condition Pills */}
                                <div className="mb-6">
                                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-2 uppercase">
                                        Condition
                                        {aiSuggested && <span className="text-primary">✨</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {CONDITIONS.map(cond => (
                                            <button
                                                key={cond}
                                                onClick={() => setFormData(prev => ({ ...prev, condition: cond }))}
                                                className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${formData.condition === cond
                                                    ? 'bg-dark border-dark text-white'
                                                    : 'bg-white dark:bg-dark-bg border-gray-200 dark:border-gray-700 text-gray-500'
                                                    }`}
                                            >
                                                {cond}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!formData.category}
                                    className="w-full py-4 bg-primary text-dark font-black uppercase tracking-wide rounded-2xl shadow-brutal hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                >
                                    Next
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </motion.div>
                        )}

                        {/* Card 3: Price + Submit */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={cardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-dark-surface rounded-b-3xl p-6"
                            >
                                <div className="text-center mb-6">
                                    <span className="text-4xl">💰</span>
                                    <h2 className="text-2xl font-black text-dark dark:text-white mt-2">Set your price!</h2>
                                    <p className="text-gray-500 text-sm mt-1">How many coins?</p>
                                </div>

                                {/* Price Input */}
                                <div className="mb-4">
                                    {aiSuggested && (
                                        <div className="flex items-center justify-center gap-1 mb-2">
                                            <span className="text-xs">💡</span>
                                            <span className="text-[10px] font-medium text-gray-500">AI suggests {formData.price} coins</span>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🪙</span>
                                        <input
                                            type="number"
                                            placeholder="50"
                                            value={formData.price}
                                            onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            className={`w-full p-4 pl-14 rounded-2xl border-2 bg-gray-50 dark:bg-dark-bg focus:border-primary outline-none transition-all text-3xl font-black text-center ${aiSuggested ? 'border-primary/50' : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                        />
                                        {formData.price && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                                                = {formatRupeeValue(parseFloat(formData.price) || 0)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Optional Description */}
                                <div className="mb-4">
                                    <textarea
                                        rows={2}
                                        placeholder="Add a short description (optional)"
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg focus:border-primary outline-none transition-all resize-none text-sm"
                                    />
                                </div>

                                {/* Summary */}
                                <div className="bg-primary/10 rounded-xl p-3 mb-4 flex items-center gap-3">
                                    {(imagePreviews || [])[0] && (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-white">
                                            <Image src={(imagePreviews || [])[0]} alt="Preview" width={48} height={48} className="object-cover w-full h-full" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-dark dark:text-white truncate text-sm">{formData.title}</p>
                                        <p className="text-xs text-gray-500">{CATEGORIES.find(c => c.id === formData.category)?.label} • {formData.condition}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-primary">🪙 {formData.price || '0'}</p>
                                        <p className="text-xs text-gray-500">{formatRupeeValue(parseFloat(formData.price) || 0)}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.price || isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-primary to-green-400 text-dark font-black uppercase tracking-wide rounded-2xl shadow-brutal hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Post Listing
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
