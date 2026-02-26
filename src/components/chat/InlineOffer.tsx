'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InlineOfferProps {
    listingPrice: number;
    onSubmit: (amount: number) => void;
    onCancel: () => void;
}

// Format price as Indian Rupees
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export function InlineOffer({ listingPrice, onSubmit, onCancel }: InlineOfferProps) {
    const suggestedPrice = Math.round(listingPrice * 0.9);
    const [amount, setAmount] = useState(suggestedPrice.toString());

    const handleSubmit = () => {
        const numAmount = parseInt(amount);
        if (numAmount > 0) {
            onSubmit(numAmount);
        }
    };

    const presetPercentages = [0.8, 0.85, 0.9, 0.95];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-gradient-to-r from-primary/10 to-yellow-100/50 dark:from-primary/20 dark:to-yellow-900/20 border-t-2 border-primary"
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">local_offer</span>
                <span className="font-bold text-dark dark:text-white text-sm">Make an Offer</span>
                <span className="text-xs text-gray-500 ml-auto">Asking: {formatPrice(listingPrice)}</span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex gap-2 mb-3">
                {presetPercentages.map((pct) => {
                    const presetAmount = Math.round(listingPrice * pct);
                    const isSelected = amount === presetAmount.toString();
                    return (
                        <button
                            key={pct}
                            onClick={() => setAmount(presetAmount.toString())}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${isSelected
                                    ? 'border-primary bg-primary text-dark'
                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:border-primary/50'
                                }`}
                        >
                            {formatPrice(presetAmount)}
                        </button>
                    );
                })}
            </div>

            {/* Custom amount input */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-bg text-dark dark:text-white font-bold focus:border-primary focus:outline-none transition-all"
                    />
                </div>
                <button
                    onClick={onCancel}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!amount || parseInt(amount) <= 0}
                    className="px-6 py-3 bg-primary text-dark font-bold rounded-xl border-2 border-dark shadow-brutal-sm hover:scale-[1.02] active:scale-95 active:shadow-none disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
                >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-lg">send</span>
                </button>
            </div>
        </motion.div>
    );
}

export default InlineOffer;
