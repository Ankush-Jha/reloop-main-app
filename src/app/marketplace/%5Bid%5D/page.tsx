'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DemoManager from '@/lib/demo-manager';
import { Listing } from '@/types';

export default function ItemDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        const loadListing = async () => {
            setIsLoading(true);
            await DemoManager.simulateDelay(300);

            const id = params.id as string;
            const found = DemoManager.getListingById(id);

            if (!found) {
                router.push('/marketplace');
                return;
            }

            setListing(found);
            setIsLoading(false);
        };

        loadListing();
    }, [params.id, router]);

    if (isLoading || !listing) {
        return (
            <div className="min-h-screen bg-[#f6f8f7] dark:bg-[#112118] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#4ce68a] border-t-transparent animate-spin" />
            </div>
        );
    }

    // Dynamic stats based on listing category/co2
    const waterSaved = listing.co2Saved ? Math.round(listing.co2Saved * 40) : 500; // Mock calculation
    const wasteDiverted = listing.co2Saved ? (listing.co2Saved / 5).toFixed(1) : '2.5';
    const ecoPoints = Math.round((listing.price || 0) * 1.5);

    return (
        <div className="relative min-h-screen flex flex-col pb-24 bg-[#f6f8f7] dark:bg-[#112118] overflow-x-hidden selection:bg-[#4ce68a] selection:text-black font-sans">
            {/* Hero Section with Gradient */}
            <div className="relative w-full pt-6 pb-20 px-6 flex flex-col items-center justify-start bg-gradient-to-b from-[#e0f2fe] via-[#dbeafe] to-[#f6f8f7] dark:from-[#1e3a8a] dark:via-[#172554] dark:to-[#112118]">
                {/* Navbar */}
                <div className="w-full flex items-center justify-between mb-8 z-10">
                    <Link
                        href="/marketplace"
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-[#1c2a23] rounded-full border border-gray-100 dark:border-gray-700 shadow-sm hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[#111714] dark:text-white" style={{ fontSize: 24 }}>arrow_back</span>
                    </Link>
                    <h2 className="text-sm font-bold tracking-widest uppercase opacity-50 text-[#111714] dark:text-white">Item Detail</h2>
                    <button
                        onClick={() => setIsFavorited(!isFavorited)}
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-[#1c2a23] rounded-full border border-gray-100 dark:border-gray-700 shadow-sm hover:scale-105 transition-transform group"
                    >
                        <span className="material-symbols-outlined transition-colors group-hover:text-red-500 text-[#111714] dark:text-white" style={{ fontSize: 24, fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>
                            favorite
                        </span>
                    </button>
                </div>

                {/* Main Image & Badge */}
                <div className="relative group z-0">
                    <div className="w-64 h-64 md:w-72 md:h-72 rounded-full border-[3px] border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden relative bg-gray-200 dark:bg-gray-700">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                            style={{ backgroundImage: `url('${listing.images[0]}')` }}
                        />
                    </div>
                    {listing.isTopImpact && (
                        <div className="absolute -bottom-4 right-0 md:-right-4 bg-[#4ce68a] text-[#111714] pl-4 pr-5 py-2 rounded-full border-2 border-white dark:border-[#112118] shadow-lg flex items-center gap-2 rotate-[-4deg] hover:rotate-0 transition-transform cursor-help">
                            <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>eco</span>
                            <span className="text-sm font-extrabold tracking-wide">TOP IMPACT</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 w-full px-4 -mt-6 z-10">
                <div className="bg-white dark:bg-[#1c1c1e] w-full rounded-[32px] border-[3px] border-[#111714] dark:border-gray-600 p-6 md:p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden">
                    <div className="flex flex-col gap-5">
                        {/* ECO IMPACT Badge */}
                        <div className="w-full bg-[#16a34a] text-white p-5 rounded-3xl border-[3px] border-[#111714] dark:border-white shadow-[4px_4px_0px_0px_#111714] dark:shadow-[4px_4px_0px_0px_#ffffff] flex flex-col justify-center items-start relative overflow-hidden group">
                            <div className="absolute right-[-10px] top-[-10px] opacity-20 transform rotate-12">
                                <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1 z-10">
                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                                <p className="text-xs font-extrabold uppercase tracking-widest opacity-90">ECO IMPACT</p>
                            </div>
                            <h3 className="text-2xl font-[800] tracking-tight leading-none z-10">YOU SAVE {listing.co2Saved || '12.5'}kg CO₂</h3>
                        </div>

                        <h1 className="text-[#111714] dark:text-white text-[2.5rem] leading-[1.1] font-[800] tracking-tight uppercase">
                            {listing.title}
                        </h1>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#4ce68a] pl-5 pr-6 border-2 border-transparent">
                                <span className="text-xl">🪙</span>
                                <p className="text-[#111714] text-lg font-bold leading-normal">{listing.price} COINS</p>
                            </div>
                            {listing.location && (
                                <div className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-100 dark:bg-white/10 pl-4 pr-4 border border-transparent">
                                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-300" style={{ fontSize: 20 }}>location_on</span>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm font-bold leading-normal">{listing.location}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full mt-2">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-blue-100 border-[3px] border-[#111714] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                                    <span className="material-symbols-outlined text-[#111714] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wide text-center leading-tight">{waterSaved}L<br />Water</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-orange-100 border-[3px] border-[#111714] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                                    <span className="material-symbols-outlined text-[#111714] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wide text-center leading-tight">{wasteDiverted}kg<br />Waste</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-green-100 border-[3px] border-[#111714] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                                    <span className="material-symbols-outlined text-[#111714] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>forest</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wide text-center leading-tight">+{ecoPoints}<br />Points</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gray-100 dark:bg-white/10" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <span className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Condition</span>
                            <span className="text-[#111714] dark:text-white text-lg font-bold">{listing.condition}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <span className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Category</span>
                            <span className="text-[#111714] dark:text-white text-lg font-bold">{listing.category}</span>
                        </div>
                        <div className="col-span-2 mt-2">
                            <p className="text-[#111714] dark:text-gray-300 text-base font-medium leading-relaxed opacity-90">
                                {listing.description}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-blue-200 border-2 border-white dark:border-gray-700 overflow-hidden shadow-sm">
                                    <img
                                        alt={listing.seller.name}
                                        className="w-full h-full object-cover"
                                        src={listing.seller.avatar}
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4ce68a] rounded-full border-2 border-white dark:border-gray-800" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[#111714] dark:text-white font-bold text-base">{listing.seller.name}</span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[#4ce68a]" style={{ fontSize: 14 }}>bolt</span>
                                    Usually responds in {listing.seller.responseTime || '2h'}
                                </span>
                            </div>
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/10 text-[#111714] dark:text-white border border-gray-200 dark:border-transparent shadow-sm">
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble_outline</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-[#112118]/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <Link href={`/messages/${listing.seller.id}`} className="flex-1 h-14 rounded-full border-[3px] border-[#111714] dark:border-white bg-transparent text-[#111714] dark:text-white text-base font-bold tracking-wide hover:bg-gray-50 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center">
                        MESSAGE SELLER
                    </Link>
                    <Link href={`/marketplace/${listing.id}/trade`} className="flex-[1.5] h-14 rounded-full bg-[#111714] dark:bg-[#4ce68a] text-white dark:text-[#111714] text-base font-bold tracking-wide shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span>REQUEST TRADE</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>swap_horiz</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
