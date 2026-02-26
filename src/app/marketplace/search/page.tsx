'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { Listing } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function SearchContent() {
    const searchParams = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const [query, setQuery] = useState(queryParam);
    const [results, setResults] = useState<Listing[]>([]);
    const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high'>('relevance');

    useEffect(() => {
        const allListings = DemoManager.getMockListings();
        const q = query.toLowerCase();

        let filtered = q.length >= 2
            ? allListings.filter(l =>
                l.title.toLowerCase().includes(q) ||
                l.category.toLowerCase().includes(q) ||
                l.description.toLowerCase().includes(q)
            )
            : allListings;

        if (sortBy === 'price-low') {
            filtered = [...filtered].sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
            filtered = [...filtered].sort((a, b) => b.price - a.price);
        }

        setResults(filtered);
    }, [query, sortBy]);

    return (
        <>
            <PageHeader title="Search Results" backHref="/marketplace" />

            <div className="px-5 pb-28 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search marketplace..."
                        className="input-search"
                        autoFocus
                    />
                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" style={{ fontSize: 22 }}>
                        search
                    </span>
                </div>

                {/* Sort & Count */}
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-dark/60 dark:text-white/60">{results.length} items</p>
                    <div className="flex gap-2">
                        {(['relevance', 'price-low', 'price-high'] as const).map(sort => (
                            <button
                                key={sort}
                                onClick={() => setSortBy(sort)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${sortBy === sort ? 'bg-dark text-white' : 'bg-white dark:bg-dark-surface text-dark/60 dark:text-white/60 border border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {sort === 'relevance' ? 'Relevant' : sort === 'price-low' ? 'Low $' : 'High $'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                {results.length === 0 ? (
                    <EmptyState icon="search_off" title="No items found" description="Try different keywords" />
                ) : (
                    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="grid grid-cols-2 gap-3">
                        {results.map((listing) => (
                            <motion.div key={listing.id} variants={itemVariants}>
                                <Link href={`/marketplace/${listing.id}`}>
                                    <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm overflow-hidden hover-lift">
                                        <div className="aspect-square bg-gray-100 dark:bg-dark-surface relative">
                                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                            <span className="absolute top-2 right-2 px-3 py-1.5 bg-primary rounded-full text-xs font-bold text-dark dark:text-white">
                                                🪙 {listing.price}
                                            </span>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-bold text-sm text-dark dark:text-white truncate">{listing.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{listing.condition}</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </>
    );
}

export default function MarketplaceSearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                <SearchContent />
            </Suspense>
        </div>
    );
}
