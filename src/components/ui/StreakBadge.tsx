'use client';

import { motion } from 'framer-motion';

interface StreakBadgeProps {
    streak: number;
    className?: string;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
    if (streak < 1) return null;

    let intensityColor = 'text-orange-500';
    let bgColor = 'bg-orange-100 dark:bg-orange-900/30';
    let borderColor = 'border-orange-200 dark:border-orange-800/40';

    if (streak >= 30) {
        intensityColor = 'text-red-500';
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        borderColor = 'border-red-200 dark:border-red-800/40';
    } else if (streak >= 7) {
        intensityColor = 'text-orange-600';
        bgColor = 'bg-orange-100 dark:bg-orange-900/30';
        borderColor = 'border-orange-200 dark:border-orange-800/40';
    }

    return (
        <motion.div
            className={`flex items-center gap-1 px-3 py-1 rounded-full ${bgColor} border ${borderColor}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
            <motion.span
                className={`material-symbols-outlined text-[20px] ${intensityColor} material-symbols-filled`}
                animate={{
                    scale: [1, 1.2, 1],
                    filter: streak >= 7 ? ["brightness(1)", "brightness(1.3)", "brightness(1)"] : "none"
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                local_fire_department
            </motion.span>
            <span className={`font-bold text-sm ${intensityColor}`}>
                {streak}
            </span>
        </motion.div>
    );
}

export default StreakBadge;
