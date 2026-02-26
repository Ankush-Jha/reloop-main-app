'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DBService } from '@/lib/firebase/db';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Listing } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

const CATEGORIES = [
    { id: 'electronics', label: 'Electronics', icon: 'devices' },
    { id: 'furniture', label: 'Furniture', icon: 'chair' },
    { id: 'clothing', label: 'Clothing', icon: 'apparel' },
    { id: 'books', label: 'Books', icon: 'menu_book' },
    { id: 'sports', label: 'Sports', icon: 'sports_soccer' },
    { id: 'other', label: 'Other', icon: 'more_horiz' },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export default function EditListingPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isDemo } = useAuth();
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        condition: 'Good'
    });

    useEffect(() => {
        const loadListing = async () => {
            const id = params.id as string;
            try {
                const data = await DBService.getListingById(id);
                if (!data) {
                    setError('Listing not found');
                    setIsLoading(false);
                    return;
                }

                // Check ownership
                const currentUserId = isDemo ? 'demo-user-123' : user?.uid;
                if (data.seller?.id !== currentUserId) {
                    setError('You are not authorized to edit this listing');
                    setIsLoading(false);
                    return;
                }

                setListing(data);
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    price: String(data.price || ''),
                    category: data.category?.toLowerCase() || '',
                    condition: data.condition || 'Good'
                });
            } catch (err) {
                console.error('Error loading listing:', err);
                setError('Failed to load listing');
            }
            setIsLoading(false);
        };

        if (user || isDemo) {
            loadListing();
        }
    }, [params.id, user, isDemo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!listing || !user) return;

        setIsSaving(true);
        setError('');

        try {
            const success = await DBService.updateListing(listing.id, user.uid, {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                condition: formData.condition
            });

            if (success) {
                router.push(`/marketplace/${listing.id}`);
            } else {
                setError('Failed to update listing. Please try again.');
            }
        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update listing. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !listing) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark shadow-brutal p-6 text-center max-w-sm">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
                    <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Oops!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-dark font-bold rounded-xl border-2 border-dark shadow-brutal-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-28">
            <PageHeader title="Edit Listing" backHref={`/marketplace/${listing?.id}`} />

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface focus:border-primary outline-none transition-all text-dark dark:text-white font-medium"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface focus:border-primary outline-none transition-all resize-none text-dark dark:text-white"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
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

                {/* Condition */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Condition</label>
                    <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map(cond => (
                            <button
                                key={cond}
                                type="button"
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

                {/* Price */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (Coins)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🪙</span>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            required
                            className="w-full p-4 pl-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface focus:border-primary outline-none transition-all text-2xl font-black text-dark dark:text-white"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSaving || !formData.title || !formData.price || !formData.category}
                    className="w-full py-4 bg-primary text-dark font-black uppercase tracking-wide rounded-xl border-2 border-dark shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined">save</span>
                            Save Changes
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
