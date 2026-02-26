'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiClient } from '@/lib/api-client';
import { Listing } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavStore } from '@/lib/store/nav-store';
import { EquityProtocolModal } from '@/components/modals/EquityProtocolModal';
import { useAuth } from '@/lib/contexts/AuthContext';

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports', 'Other'];
const CONDITIONS = ['Like New', 'Good', 'Used', 'Fair'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function CreateListingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setActions, reset } = useNavStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // Auto-fill from URL params (from scanner)
    const [title, setTitle] = useState(searchParams.get('title') || '');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [price, setPrice] = useState(searchParams.get('price') || '');
    const [location, setLocation] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoFilled, setAutoFilled] = useState(!!searchParams.get('title'));
    const [showEquityModal, setShowEquityModal] = useState(false);

    const [error, setError] = useState('');

    const isValid = title.trim() && category && condition && price && parseInt(price, 10) > 0;

    // Register nav action
    useEffect(() => {
        setActions({
            label: isSubmitting ? 'Listing...' : 'List Item',
            onClick: handleSubmit,
            icon: 'add_circle',
            disabled: !isValid || isSubmitting,
            loading: isSubmitting,
            variant: 'primary'
        });

        // Cleanup on unmount
        return () => reset();
    }, [isValid, isSubmitting, title, description, category, condition, price, location]);

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPhotos(prev => [...prev, base64].slice(0, 4)); // Max 4 photos
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be selected again
        event.target.value = '';
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError('');
        if (!title.trim()) { setError('Title is required'); return; }
        const priceNum = parseInt(price, 10);
        if (!priceNum || priceNum <= 0) { setError('Price must be greater than 0'); return; }
        if (!category) { setError('Select a category'); return; }
        if (!condition) { setError('Select a condition'); return; }

        setIsSubmitting(true);

        try {
            if (!user) {
                setError('You must be logged in to create a listing');
                return;
            }

            await ApiClient.listings.create({
                title: title.trim(),
                description: description.trim() || 'No description provided.',
                price: priceNum,
                condition,
                category,
                location: location.trim() || 'Campus',
                images: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500'],
                status: 'available',
                seller: {
                    id: user.uid,
                    name: user.name,
                    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
                    responseTime: '2h'
                }
            } as any);
            // Notifications are now handled by backend or could be added here if we had a Notification API
            // For now, just redirect
            router.push('/marketplace');
        } catch (error) {
            console.error("Failed to create listing", error);
            setError("Failed to create listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader title="Create Listing" backHref="/marketplace" />

            <motion.div
                className="px-5 pb-28 space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Photo Upload */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Photos</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />

                        {/* Add button */}
                        {photos.length < 4 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 shrink-0 bg-white dark:bg-dark-surface rounded-2xl border-2 border-dashed border-dark/30 flex flex-col items-center justify-center gap-1 hover:border-primary active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl text-dark/40 dark:text-white/40">add_a_photo</span>
                                <span className="text-[10px] font-bold text-dark/40 dark:text-white/40">Add</span>
                            </button>
                        )}

                        {/* Photo previews */}
                        {photos.map((photo, index) => (
                            <div key={index} className="relative w-24 h-24 shrink-0">
                                <img
                                    src={photo}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-2xl border-2 border-dark dark:border-gray-600"
                                />
                                <button
                                    onClick={() => removePhoto(index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-card-coral rounded-full border-2 border-dark flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm text-dark">close</span>
                                </button>
                            </div>
                        ))}

                        {/* Placeholder if no photos */}
                        {photos.length === 0 && (
                            <div className="w-24 h-24 shrink-0 bg-card-green rounded-2xl border-2 border-dark dark:border-gray-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-dark/30 dark:text-white/30">image</span>
                            </div>
                        )}
                    </div>
                </motion.div>


                {/* Title */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Title *</p>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Vintage Denim Jacket"
                        className="w-full h-14 rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 px-5 font-medium placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </motion.div>

                {/* Description */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Description</p>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your item..."
                        rows={3}
                        className="w-full rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 p-5 font-medium placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                </motion.div>

                {/* Category */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Category *</p>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${category === cat
                                    ? 'bg-primary border-dark dark:border-gray-600 text-dark dark:text-white'
                                    : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 text-dark/60 dark:text-white/60 hover:border-dark dark:border-gray-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Condition */}
                <motion.div variants={itemVariants}>
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Condition *</p>
                    <div className="flex gap-2">
                        {CONDITIONS.map(cond => (
                            <button
                                key={cond}
                                onClick={() => setCondition(cond)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${condition === cond
                                    ? 'bg-primary border-dark dark:border-gray-600 text-dark dark:text-white'
                                    : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 text-dark/60 dark:text-white/60 hover:border-dark dark:border-gray-600'
                                    }`}
                            >
                                {cond}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Price & Location */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Price (Eco Coins) *</p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🪙</span>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0"
                                className="w-full h-14 rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 pl-12 pr-5 font-bold placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-2">Location</p>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Campus Center"
                            className="w-full h-14 rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 px-5 font-medium placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </motion.div>

                {/* 14-Day Equity Protocol Warning */}
                <motion.div variants={itemVariants} className="bg-card-yellow rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-2xl text-dark">schedule</span>
                        <div className="flex-1">
                            <p className="font-bold text-dark text-sm mb-1">14-Day Equity Protocol</p>
                            <p className="text-xs text-dark/70 leading-relaxed">
                                Items unsold after 14 days will give you the option to recycle or donate for Eco Coins.
                                <button
                                    onClick={() => setShowEquityModal(true)}
                                    className="text-dark font-bold underline ml-1 hover:text-dark/70 transition-colors"
                                >
                                    Learn more →
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Eco Impact Info */}
                <motion.div variants={itemVariants} className="bg-card-green rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-dark dark:text-white">eco</span>
                    <div>
                        <p className="font-bold text-dark dark:text-white text-sm">Eco Impact</p>
                        <p className="text-xs text-dark/60 dark:text-white/60">Listing items saves an average of 5.2 kg CO₂</p>
                    </div>
                </motion.div>

                {/* Error */}
                {error && (
                    <motion.p variants={itemVariants} className="text-red-500 font-bold text-sm text-center">{error}</motion.p>
                )}

            </motion.div>

            {/* Equity Protocol Modal */}
            <EquityProtocolModal isOpen={showEquityModal} onClose={() => setShowEquityModal(false)} />
        </>
    );
}

function CreateListingLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function CreateListingPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<CreateListingLoading />}>
                <CreateListingContent />
            </Suspense>
        </div>
    );
}
