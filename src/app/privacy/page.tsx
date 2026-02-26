'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const SECTIONS = [
    {
        title: 'Information We Collect',
        content: 'We collect information you provide directly: name, email, campus, and profile photo. We also collect usage data including items scanned, trades completed, and environmental impact metrics.',
    },
    {
        title: 'How We Use Your Data',
        content: 'Your data is used to provide and improve the ReLoop experience — matching you with trade partners, calculating your environmental impact, and personalizing your feed. We never sell your personal data.',
    },
    {
        title: 'Camera & Photos',
        content: 'Camera access is used solely for scanning items. Photos are processed by our AI to identify items and suggest upcycling ideas. Images are not stored on our servers after processing.',
    },
    {
        title: 'Data Sharing',
        content: 'We share limited profile information (name, avatar, campus) with other users for marketplace functionality. We use Firebase for authentication and data storage, governed by Google\'s privacy policies.',
    },
    {
        title: 'Data Retention',
        content: 'Your account data is retained while your account is active. You can request deletion of your data at any time by contacting support@reloop.app.',
    },
    {
        title: 'Security',
        content: 'We use industry-standard security measures including Firebase Authentication, Firestore security rules, and HTTPS encryption for all data transmission.',
    },
    {
        title: 'Your Rights',
        content: 'You have the right to access, correct, or delete your personal data. You can export your data or request account deletion through the Settings page or by contacting our support team.',
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Privacy Policy" backHref="/settings" />

            <motion.div
                className="px-5 pb-28 space-y-3"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div
                    variants={itemVariants}
                    className="bg-card-green rounded-2xl border-2 border-dark shadow-brutal-sm p-4 flex items-center gap-3"
                >
                    <span className="material-symbols-outlined text-2xl text-dark">verified_user</span>
                    <div>
                        <p className="font-bold text-dark text-sm">Your Privacy Matters</p>
                        <p className="text-xs text-dark/60">Last updated: January 2026</p>
                    </div>
                </motion.div>

                {SECTIONS.map((section, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4"
                    >
                        <h3 className="font-bold text-dark dark:text-white text-sm mb-2">{section.title}</h3>
                        <p className="text-xs text-dark/70 dark:text-white/70 leading-relaxed">{section.content}</p>
                    </motion.div>
                ))}

                <motion.div variants={itemVariants} className="text-center pt-2">
                    <p className="text-dark/40 dark:text-white/40 text-xs font-medium">
                        Questions? Contact us at support@reloop.app
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
