'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { z } from 'zod';

// Zod Schema
const listingSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
    category: z.string(),
    condition: z.string(),
    description: z.string().min(10, "Description must be at least 10 characters")
});

interface CreateListingModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Home', 'Furniture', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export const CreateListingModal = ({ onClose, onSuccess }: CreateListingModalProps) => {
    const { user } = useAuth();
    const [images, setImages] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: CATEGORIES[0],
        condition: CONDITIONS[2],
        description: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validate with Zod
        const result = listingSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach(err => {
                if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        if (images.length === 0) {
            alert("Please add at least one photo");
            return;
        }

        setIsSubmitting(true);
        try {
            if (!user) {
                alert('Please log in to create a listing');
                return;
            }

            await ApiClient.listings.create({
                title: formData.title,
                description: formData.description,
                price: parseInt(formData.price),
                condition: formData.condition,
                category: formData.category,
                images: images,
                status: 'available',
                seller: {
                    id: user.uid,
                    name: user.name,
                    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
                    responseTime: '2h'
                }
            } as any);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create listing", error);
            alert("Failed to create listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-dark"
            >
                {/* Header */}
                <div className="p-5 border-b-2 border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-[900] text-dark dark:text-white uppercase tracking-wide">
                        Create Listing
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-dark dark:text-gray-300">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Image Upload Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-dark dark:text-white mb-2">PHOTOS</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all text-gray-400 hover:text-primary shrink-0"
                            >
                                <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                <span className="text-[10px] font-bold">Add Photo</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24 rounded-xl border-2 border-gray-200 overflow-hidden shrink-0 group">
                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-dark dark:text-white mb-1">TITLE</label>
                            <input
                                value={formData.title}
                                onChange={e => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (errors.title) setErrors({ ...errors, title: '' });
                                }}
                                placeholder="What are you trading?"
                                className={`w-full p-3 rounded-xl border-2 bg-transparent focus:outline-none font-medium dark:text-white transition-colors ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-primary'
                                    }`}
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1 font-bold">{errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-dark dark:text-white mb-1">PRICE (COINS)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🪙</span>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => {
                                            setFormData({ ...formData, price: e.target.value });
                                            if (errors.price) setErrors({ ...errors, price: '' });
                                        }}
                                        className={`w-full pl-10 p-3 rounded-xl border-2 bg-transparent focus:outline-none font-bold dark:text-white transition-colors ${errors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-primary'
                                            }`}
                                    />
                                </div>
                                {errors.price && <p className="text-red-500 text-xs mt-1 font-bold">{errors.price}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-dark dark:text-white mb-1">CATEGORY</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-primary focus:outline-none font-medium dark:text-white transition-colors appearance-none"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-dark dark:text-white mb-1">CONDITION</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CONDITIONS.slice(0, 3).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFormData({ ...formData, condition: c })}
                                        className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all ${formData.condition === c
                                            ? 'bg-primary border-dark text-dark'
                                            : 'border-gray-200 text-gray-500 hover:border-primary/50'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-dark dark:text-white mb-1">DESCRIPTION</label>
                            <textarea
                                value={formData.description}
                                onChange={e => {
                                    setFormData({ ...formData, description: e.target.value });
                                    if (errors.description) setErrors({ ...errors, description: '' });
                                }}
                                placeholder="Add details about condition, dimensions, etc."
                                rows={3}
                                className={`w-full p-3 rounded-xl border-2 bg-transparent focus:outline-none font-medium dark:text-white transition-colors resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-primary'
                                    }`}
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1 font-bold">{errors.description}</p>}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t-2 border-gray-100 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 font-bold text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] py-3 bg-primary text-dark font-black uppercase tracking-wide rounded-xl shadow-brutal hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Post Listing</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
