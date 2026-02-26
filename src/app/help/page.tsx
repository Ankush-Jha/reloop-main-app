'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const FAQ = [
    { q: 'How do I scan items?', a: 'Tap the Scan button on the home screen or navigate to the Scanner tab. Point your camera at any item and tap the capture button. Our AI will identify the item and suggest upcycling ideas.' },
    { q: 'What are Eco Coins?', a: 'Eco Coins are the virtual currency in ReLoop. You earn them by scanning items, completing trades, and finishing missions. Use them to trade for items or redeem rewards.' },
    { q: 'How does trading work?', a: 'Browse the marketplace, find an item you like, and send a trade request. You can offer Eco Coins or propose an item swap. Once both parties agree, meet on campus to complete the trade.' },
    { q: 'How is CO₂ savings calculated?', a: 'We calculate CO₂ savings based on the environmental impact of keeping items in use versus manufacturing new ones. Each item category has a research-backed carbon footprint estimate.' },
    { q: 'Is my data safe?', a: 'Yes! We use Firebase Authentication and Firestore with strict security rules. Your personal data is never shared with third parties. See our Privacy Policy for details.' },
    { q: 'How do I earn badges?', a: 'Badges are unlocked by completing specific milestones — scanning your first item, completing trades, maintaining login streaks, and saving CO₂. Check the Achievements page to see all available badges.' },
];

const CONTACT_OPTIONS = [
    { icon: 'email', title: 'Email Us', desc: 'support@reloop.app', color: 'bg-card-blue' },
    { icon: 'forum', title: 'Community', desc: 'Join the discussion', color: 'bg-card-green' },
    { icon: 'bug_report', title: 'Report Bug', desc: 'Help us improve', color: 'bg-card-pink' },
];

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Help & Support" backHref="/settings" />

            <motion.div
                className="px-5 pb-28 space-y-6"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Contact Options */}
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                    {CONTACT_OPTIONS.map((opt) => (
                        <button
                            key={opt.icon}
                            className={`${opt.color} rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform`}
                        >
                            <span className="material-symbols-outlined text-2xl text-dark dark:text-white">{opt.icon}</span>
                            <span className="text-xs font-[800] text-dark dark:text-white text-center">{opt.title}</span>
                        </button>
                    ))}
                </motion.div>

                {/* FAQ */}
                <motion.div variants={itemVariants}>
                    <p className="font-extrabold text-dark dark:text-white text-lg mb-3 ml-1">Frequently Asked Questions</p>
                    <div className="space-y-2">
                        {FAQ.map((faq, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-4 flex items-center justify-between text-left"
                                >
                                    <p className="font-bold text-dark dark:text-white text-sm pr-4">{faq.q}</p>
                                    <span className={`material-symbols-outlined text-dark/40 dark:text-white/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="px-4 pb-4"
                                    >
                                        <p className="text-sm text-dark/70 dark:text-white/70 leading-relaxed">{faq.a}</p>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* App Info */}
                <motion.div variants={itemVariants} className="text-center py-4">
                    <p className="text-dark/40 dark:text-white/40 text-sm font-bold">ReLoop v2.0.0</p>
                    <p className="text-dark/30 dark:text-white/30 text-xs mt-1">Made with love for sustainability</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
