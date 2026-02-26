'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-12 h-12 rounded-full border-2 border-dark dark:border-white bg-white dark:bg-dark-surface flex items-center justify-center shadow-brutal-sm hover:scale-105 transition-transform"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
                {theme === 'dark' ? (
                    <span className="material-symbols-outlined text-xl text-white">dark_mode</span>
                ) : (
                    <span className="material-symbols-outlined text-xl text-dark">light_mode</span>
                )}
            </motion.div>
        </button>
    );
}
