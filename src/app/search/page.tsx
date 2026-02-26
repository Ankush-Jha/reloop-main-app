'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DBService } from '@/lib/firebase/db';
import DemoManager from '@/lib/demo-manager';
import { Listing } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const RECENT_SEARCHES = ['Textbooks', 'Denim Jacket', 'Headphones', 'Plants'];
const TRENDING = ['Electronics', 'Books', 'Clothing', 'Furniture'];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [allListings, setAllListings] = useState<Listing[]>([]);
    const [results, setResults] = useState<Listing[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        priceRange: [0, 100],
        condition: 'all',
        sortBy: 'newest'
    });

    // Load listings on mount
    useEffect(() => {
        const loadListings = async () => {
            setIsLoading(true);
            try {
                const firebaseListings = await DBService.getListings();
                if (firebaseListings.length > 0) {
                    setAllListings(firebaseListings);
                } else {
                    setAllListings(DemoManager.getMockListings());
                }
            } catch (error) {
                console.error('Error loading listings:', error);
                setAllListings(DemoManager.getMockListings());
            }
            setIsLoading(false);
        };
        loadListings();
    }, []);

    // Search effect
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setHasSearched(true);
        const q = query.toLowerCase();
        const filtered = allListings.filter(
            l =>
                l.title.toLowerCase().includes(q) ||
                l.category.toLowerCase().includes(q) ||
                l.description.toLowerCase().includes(q)
        );
        setResults(filtered);
    }, [query, allListings]);

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Search" />

            <div className="px-5 pb-28 space-y-6">
                {/* Search Input */}
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search items, categories..."
                            className="input-search pr-10"
                            autoFocus
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" style={{ fontSize: 22 }}>
                            search
                        </span>
                    </div>
                    <button
                        onClick={() => setShowFilters(true)}
                        className="w-12 h-12 bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-dark dark:text-white">tune</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !hasSearched ? (
                    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
                        {/* Recent Searches */}
                        <motion.div variants={itemVariants}>
                            <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-3">Recent Searches</p>
                            <div className="flex flex-wrap gap-2">
                                {RECENT_SEARCHES.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => setQuery(term)}
                                        className="px-4 py-2 bg-white dark:bg-dark-surface rounded-full border-2 border-dark dark:border-gray-600 text-sm font-bold text-dark dark:text-white hover:bg-gray-50 dark:bg-dark-bg transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm text-dark/40 dark:text-white/40">history</span>
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Trending */}
                        <motion.div variants={itemVariants}>
                            <p className="text-sm font-bold text-dark/60 dark:text-white/60 mb-3">Trending Categories</p>
                            <div className="grid grid-cols-2 gap-3">
                                {TRENDING.map((cat, i) => {
                                    const colors = ['bg-card-green', 'bg-card-yellow', 'bg-card-pink', 'bg-card-blue'];
                                    const icons = ['devices', 'menu_book', 'checkroom', 'chair'];
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setQuery(cat)}
                                            className={`${colors[i]} rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-3 hover:-translate-y-1 transition-transform`}
                                        >
                                            <span className="material-symbols-outlined text-2xl text-dark dark:text-white">{icons[i]}</span>
                                            <span className="font-bold text-dark dark:text-white text-sm">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                ) : results.length === 0 ? (
                    <EmptyState icon="search_off" title="No results found" description={`Try different keywords for "${query}"`} />
                ) : (
                    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-dark/60 dark:text-white/60">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                            <button onClick={() => setShowFilters(true)} className="text-xs font-bold text-primary">Filter & Sort</button>
                        </div>
                        <div className="space-y-3">
                            {results.map((listing) => (
                                <motion.div key={listing.id} variants={itemVariants}>
                                    <Link href={`/marketplace/${listing.id}`}>
                                        <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm p-4 flex items-center gap-4 hover:-translate-y-1 transition-transform">
                                            <div className="w-16 h-16 rounded-xl border-2 border-dark dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-dark-surface shrink-0">
                                                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-dark dark:text-white truncate">{listing.title}</h3>
                                                <p className="text-xs text-dark/60 dark:text-white/60 truncate">{listing.condition} &middot; {listing.category}</p>
                                                <span className="inline-flex items-center gap-1 mt-1 text-sm font-bold text-primary">
                                                    <span>🪙</span> {listing.price}
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined text-dark/40 dark:text-white/40">chevron_right</span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Filter Modal */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-dark/80 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setShowFilters(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white dark:bg-dark-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-dark shadow-brutal p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-dark dark:text-white">Filters</h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 -mr-2">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-dark mb-2 block">Sort By</label>
                                    <div className="flex gap-2">
                                        {['Newest', 'Price: Low to High', 'Price: High to Low'].map((opt) => (
                                            <button
                                                key={opt}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${activeFilters.sortBy === opt.toLowerCase() ? 'bg-primary border-dark text-dark' : 'bg-gray-100 dark:bg-dark-bg border-transparent text-gray-500'}`}
                                                onClick={() => setActiveFilters({ ...activeFilters, sortBy: opt.toLowerCase() })}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-dark mb-2 block">Condition</label>
                                    <div className="flex gap-2">
                                        {['Any', 'New', 'Like New', 'Good', 'Fair'].map((opt) => (
                                            <button
                                                key={opt}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${activeFilters.condition === opt.toLowerCase() ? 'bg-primary border-dark text-dark' : 'bg-gray-100 dark:bg-dark-bg border-transparent text-gray-500'}`}
                                                onClick={() => setActiveFilters({ ...activeFilters, condition: opt.toLowerCase() })}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="w-full py-4 bg-dark text-white rounded-xl font-bold uppercase tracking-wide shadow-brutal active:scale-95 transition-transform"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
