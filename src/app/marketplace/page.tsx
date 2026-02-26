'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DBService } from '@/lib/firebase/db';
import DemoManager from '@/lib/demo-manager';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Listing } from '@/types';
import { ListingCard } from '@/components/marketplace/ListingCard';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const CATEGORIES = [
    { id: 'Books', icon: 'menu_book', color: 'bg-accent-blue' },
    { id: 'Tech', icon: 'devices', color: 'bg-primary' },
    { id: 'Decor', icon: 'potted_plant', color: 'bg-accent-yellow' },
    { id: 'Clothes', icon: 'checkroom', color: 'bg-white' },
    { id: 'More', icon: 'more_horiz', color: 'bg-white' }
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
];

type TabType = 'all' | 'my-listings';

export default function MarketplacePage() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const { user, isDemo } = useAuth();
    const currentUserId = isDemo ? 'demo-user-123' : user?.uid;

    const loadListings = async () => {
        setIsLoading(true);
        try {
            if (isDemo) {
                setListings(DemoManager.getMockListings());
            } else {
                const data = await DBService.getListings();
                setListings(data);
            }
        } catch (error) {
            console.error("Failed to load listings", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            // Don't clear listings immediately to prevent flash
            setIsLoading(true);
            try {
                if (isDemo) {
                    console.log('Marketplace loading in Demo Mode');
                    const mockData = DemoManager.getMockListings();
                    if (mounted) setListings(mockData);
                } else {
                    console.log('Marketplace loading in Firebase Mode');
                    const data = await DBService.getListings();
                    if (mounted) setListings(data);
                }
            } catch (error) {
                console.error("Failed to load listings", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        load();

        let unsubscribe = () => { };
        let pollInterval: NodeJS.Timeout | null = null;

        if (isDemo) {
            unsubscribe = DemoManager.subscribe(() => {
                if (mounted) {
                    console.log('Marketplace received DemoManager update');
                    setListings([...DemoManager.getMockListings()]);
                }
            });
        } else {
            // Poll Firebase every 5 seconds for real-time updates
            pollInterval = setInterval(() => {
                if (mounted) {
                    DBService.getListings().then(data => {
                        if (mounted) setListings(data);
                    });
                }
            }, 5000);
        }

        return () => {
            mounted = false;
            unsubscribe();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [isDemo]);

    // Handle edit action
    const handleEdit = (id: string) => {
        router.push(`/marketplace/${id}/edit`);
    };

    // Handle delete action
    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this listing?')) {
            if (isDemo) {
                setListings(prev => prev.filter(l => l.id !== id));
            } else if (currentUserId) {
                try {
                    const success = await DBService.deleteListing(id, currentUserId);
                    if (success) {
                        setListings(prev => prev.filter(l => l.id !== id));
                    } else {
                        alert('Failed to delete listing. You may not have permission.');
                    }
                } catch (error) {
                    console.error('Error deleting listing:', error);
                    alert('Failed to delete listing. Please try again.');
                }
            }
        }
    };


    // Filter and sort listings for marketplace (excludes user's own listings)
    const getFilteredListings = () => {
        let filtered = listings;

        // Exclude current user's listings from marketplace
        filtered = filtered.filter(l => l.seller?.id !== currentUserId);

        // Category and search filtering
        filtered = filtered
            .filter(l => {
                const matchesCategory = selectedCategory === 'All' || l.category.toLowerCase().includes(selectedCategory.toLowerCase());
                const matchesSearch = !searchQuery ||
                    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.description?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'price-asc':
                        return a.price - b.price;
                    case 'price-desc':
                        return b.price - a.price;
                    case 'newest':
                    default:
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
            });

        return filtered;
    };

    const filteredListings = getFilteredListings();

    return (
        <div className="min-h-screen bg-[#D0E8FF] dark:bg-dark-bg flex flex-col selection:bg-primary selection:text-black overflow-x-hidden text-black dark:text-white pb-32">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex flex-col gap-6 z-20 relative">
                {/* Title Row */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-black dark:text-white leading-none whitespace-nowrap">Market Hub</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* My Listings Icon */}
                        <Link
                            href="/my-listings"
                            aria-label="My Listings"
                            className="bg-[#FAFAFA] dark:bg-dark-surface w-12 h-12 rounded-full border-4 border-black dark:border-gray-600 shadow-[4px_4px_0px_0px_#000] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 hover:bg-primary"
                        >
                            <span className="material-symbols-outlined text-black dark:text-white" style={{ fontSize: '24px' }}>inventory_2</span>
                        </Link>
                        {/* Notifications Icon */}
                        <button
                            onClick={() => router.push('/notifications')}
                            aria-label="Notifications"
                            className="bg-[#FAFAFA] dark:bg-dark-surface w-12 h-12 rounded-full border-4 border-black dark:border-gray-600 shadow-[4px_4px_0px_0px_#000] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150"
                        >
                            <span className="material-symbols-outlined text-black dark:text-white" style={{ fontSize: '28px' }}>notifications</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                    <input
                        className="w-full h-14 bg-white dark:bg-dark-surface rounded-full border-4 border-black dark:border-gray-600 px-6 pr-14 text-lg font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_#000] uppercase"
                        placeholder="Search eco items..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="absolute right-2 top-2 h-10 w-10 bg-primary rounded-full border-4 border-black flex items-center justify-center hover:bg-green-400 active:translate-y-0.5 active:shadow-none transition-all">
                        <span className="material-symbols-outlined font-bold text-black">search</span>
                    </button>
                </div>
            </header>

            {/* Category Pills - Horizontal Scroll */}
            <div className="pl-6 pb-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 w-max pr-6">
                    {/* All Items Pill */}
                    <button
                        onClick={() => { setSelectedCategory('All'); setActiveTab('all'); }}
                        className={`px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black uppercase whitespace-nowrap active:translate-y-[2px] active:shadow-none transition-all text-sm ${selectedCategory === 'All' && activeTab === 'all'
                            ? 'bg-[#9747FF] text-white'
                            : 'bg-white hover:bg-yellow-100 text-black'
                            }`}
                    >
                        All Items
                    </button>
                    {/* Category Pills */}
                    {['Furniture', 'Clothing', 'Electronics', 'Books'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setActiveTab('all'); }}
                            className={`px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black uppercase whitespace-nowrap active:translate-y-[2px] active:shadow-none transition-all text-sm ${selectedCategory === cat
                                ? 'bg-[#9747FF] text-white'
                                : 'bg-white hover:bg-yellow-100 text-black'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="px-6 flex-grow">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black uppercase tracking-wide">
                        Fresh Picks
                    </h2>
                    <Link href="/my-listings" className="text-xs font-bold underline uppercase">
                        View All
                    </Link>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredListings.length === 0 ? (
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="w-20 h-20 bg-white dark:bg-dark-surface rounded-2xl border-2 border-gray-200 dark:border-gray-700 mx-auto flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-gray-300">
                                search_off
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No items found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different category or search term</p>
                        <Link
                            href="/sell"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-dark font-bold rounded-xl border-2 border-dark shadow-brutal-sm hover:scale-105 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            List an item
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-2 gap-4 pb-4"
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        {filteredListings.map((listing) => (
                            <motion.div key={listing.id} variants={itemVariants}>
                                <ListingCard
                                    listing={listing}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
