'use client';

import { motion } from 'framer-motion';

interface QuickRepliesProps {
    onSelect: (message: string) => void;
    listingTitle?: string;
    listingPrice?: number;
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

const defaultQuickReplies = [
    { icon: '❓', text: 'Is this still available?' },
    { icon: '💰', text: 'What\'s your best price?' },
    { icon: '📍', text: 'Where can we meet?' },
    { icon: '📅', text: 'Can we meet today?' },
];

export function QuickReplies({ onSelect, listingTitle, listingPrice }: QuickRepliesProps) {
    // Generate context-aware quick replies
    const getQuickReplies = () => {
        const replies = [...defaultQuickReplies];

        // Add price-specific suggestion
        if (listingPrice) {
            const suggestedPrice = Math.round(listingPrice * 0.85);
            replies.push({
                icon: '🏷️',
                text: `Would you accept ${formatPrice(suggestedPrice)}?`
            });
        }

        return replies;
    };

    const quickReplies = getQuickReplies();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-gray-800"
        >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Quick Replies
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickReplies.map((reply, index) => (
                    <motion.button
                        key={index}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(reply.text)}
                        className="shrink-0 px-3 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-dark dark:text-white hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
                    >
                        <span>{reply.icon}</span>
                        <span className="whitespace-nowrap">{reply.text}</span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

export default QuickReplies;
