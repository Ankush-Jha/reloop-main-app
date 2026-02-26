'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ScannerService from '@/lib/scanner-service';
import { ScanResult, ItemClassification } from '@/types';
import { useNavStore } from '@/lib/store/nav-store';
import { PageHeader } from '@/components/ui/PageHeader';

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};


export default function ScanResultPage() {
    const router = useRouter();
    const [result, setResult] = useState<ScanResult | null>(null);
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const { setActions, reset } = useNavStore();

    useEffect(() => {
        const storedResult = ScannerService.getStoredResult();
        const storedImage = ScannerService.getStoredImage();

        if (!storedResult) {
            router.push('/scanner');
            return;
        }

        setResult(storedResult);
        setScannedImage(storedImage); // Allow fallback to demo image if null
    }, [router]);

    // Hide global nav for full immersion
    useEffect(() => {
        setActions({ label: '', onClick: () => { }, hidden: true } as any);
        return () => reset();
    }, [setActions, reset]);

    if (!result) {
        return (
            <div className="min-h-screen bg-[#d0f0fd] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#4ce68a] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { item } = result;
    const classification = result.classification || 'safe';
    const xpEarned = result.xpEarned || 15;
    const co2Saved = result.item.co2Savings || 0.5;

    // Logic for badge text
    const badgeText = classification === 'non_reusable' ? 'RECYCLE ONLY' :
        classification === 'hazardous' ? 'HAZARDOUS' : '98% RECYCLABLE';

    // Background Image logic - use stored image or a placeholder
    const bgImage = scannedImage || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop';

    // Action Links
    const sellLink = `/marketplace/create?title=${encodeURIComponent(item.objectName)}&category=${encodeURIComponent(item.category)}&price=${item.estimatedCoins || 10}`;
    const reuseLink = `/scanner/ideas`; // Could pass query params if needed
    const donateLink = `/charity`; // Link to charity page
    const recycleLink = `/scanner/recycle`; // Link to recycling centers

    return (
        <div className="min-h-screen bg-[#d0f0fd] dark:bg-[#112118] text-[#111714] dark:text-white overflow-x-hidden selection:bg-[#4ce68a] selection:text-[#111714]">
            <div className="relative flex min-h-screen flex-col w-full max-w-md mx-auto bg-[#d0f0fd] dark:bg-[#112118] border-x-2 border-[#111714]/5 dark:border-white/5 shadow-2xl pb-28">

                {/* Header */}
                <header className="flex items-center justify-between pt-8 pb-4 px-6 w-full z-10">
                    <button
                        onClick={() => router.push('/')}
                        aria-label="Close"
                        className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">close</span>
                    </button>
                    <span className="font-extrabold text-sm tracking-widest uppercase text-[#111714]/60 dark:text-white/60">AI Scan Result</span>
                    <div className="w-10"></div>
                </header>

                <main className="flex-1 flex flex-col px-6 pt-2 w-full gap-6">
                    {/* Hero Card */}
                    <div className="w-full relative bg-white dark:bg-[#1e2a24] rounded-[2rem] border-[3px] border-[#111714] dark:border-white shadow-[8px_8px_0px_0px_rgba(17,23,20,1)] p-6 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div
                                className="w-48 h-48 rounded-full border-4 border-[#111714] dark:border-white bg-cover bg-center overflow-hidden shadow-sm"
                                style={{ backgroundImage: `url('${bgImage}')` }}
                            >
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#4ce68a] border-[3px] border-[#111714] px-4 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(17,23,20,1)] -rotate-3 z-10 whitespace-nowrap">
                                <span className="text-[#111714] text-sm font-black tracking-wider">{badgeText}</span>
                            </div>
                            <span className="material-symbols-outlined absolute -top-2 -right-4 text-[#111714] text-4xl animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>spark</span>
                        </div>
                        <div className="mt-2 space-y-2">
                            <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tight text-[#111714] dark:text-white">
                                Ready<br />To Loop!
                            </h1>
                            <p className="text-lg font-bold leading-tight text-[#111714]/80 dark:text-white/80 max-w-[240px] mx-auto mt-3">
                                You earned <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 rounded">+{xpEarned} COINS</span> and saved {co2Saved}kg of CO2!
                            </p>
                        </div>
                    </div>

                    {/* Options Grid */}
                    <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="material-symbols-outlined text-[#111714]/60 dark:text-white/60 text-xl">alt_route</span>
                            <span className="text-[#111714]/60 dark:text-white/60 font-bold text-sm uppercase tracking-wider">Choose your path</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            {/* Reuse Option */}
                            <Link href={reuseLink} className="group relative w-full h-auto active:scale-95 transition-transform">
                                <div className="absolute inset-0 bg-white dark:bg-white/10 rounded-2xl border-[3px] border-[#111714] dark:border-white shadow-[4px_4px_0px_0px_rgba(17,23,20,1)] group-hover:shadow-[8px_8px_0px_0px_#4ce68a] transition-all"></div>
                                <div className="relative p-5 flex flex-col items-center justify-center gap-2 z-10 text-center min-h-[140px]">
                                    <span className="material-symbols-outlined text-4xl text-[#111714] dark:text-white">palette</span>
                                    <span className="text-[#111714] dark:text-white font-black text-lg uppercase tracking-wide leading-tight">Reuse<br />It</span>
                                </div>
                            </Link>

                            {/* Trade Option */}
                            <Link href={sellLink} className="group relative w-full h-auto active:scale-95 transition-transform">
                                <div className="absolute inset-0 bg-white dark:bg-white/10 rounded-2xl border-[3px] border-[#111714] dark:border-white shadow-[4px_4px_0px_0px_rgba(17,23,20,1)] group-hover:shadow-[8px_8px_0px_0px_#4ce68a] transition-all"></div>
                                <div className="relative p-5 flex flex-col items-center justify-center gap-2 z-10 text-center min-h-[140px]">
                                    <span className="material-symbols-outlined text-4xl text-[#111714] dark:text-white">handshake</span>
                                    <span className="text-[#111714] dark:text-white font-black text-lg uppercase tracking-wide leading-tight">Trade<br />It</span>
                                </div>
                            </Link>

                            {/* Donate Option */}
                            <Link href={donateLink} className="group relative w-full h-auto active:scale-95 transition-transform">
                                <div className="absolute inset-0 bg-white dark:bg-white/10 rounded-2xl border-[3px] border-[#111714] dark:border-white shadow-[4px_4px_0px_0px_rgba(17,23,20,1)] group-hover:shadow-[8px_8px_0px_0px_#4ce68a] transition-all"></div>
                                <div className="relative p-5 flex flex-col items-center justify-center gap-2 z-10 text-center min-h-[140px]">
                                    <span className="material-symbols-outlined text-4xl text-[#111714] dark:text-white">favorite</span>
                                    <span className="text-[#111714] dark:text-white font-black text-lg uppercase tracking-wide leading-tight">Donate<br />It</span>
                                </div>
                            </Link>

                            {/* Recycle Option */}
                            <Link href={recycleLink} className="group relative w-full h-auto active:scale-95 transition-transform">
                                <div className="absolute inset-0 bg-white dark:bg-white/10 rounded-2xl border-[3px] border-[#111714] dark:border-white shadow-[4px_4px_0px_0px_rgba(17,23,20,1)] group-hover:shadow-[8px_8px_0px_0px_#4ce68a] transition-all"></div>
                                <div className="relative p-5 flex flex-col items-center justify-center gap-2 z-10 text-center min-h-[140px]">
                                    <span className="material-symbols-outlined text-4xl text-[#111714] dark:text-white">recycling</span>
                                    <span className="text-[#111714] dark:text-white font-black text-lg uppercase tracking-wide leading-tight">Recycle<br />It</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </main>

                {/* Sticky Save Button */}
                <div className="fixed bottom-6 w-full max-w-md px-6 z-50 pointer-events-none left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => router.push('/')}
                        className="pointer-events-auto active:scale-95 transition-transform group relative w-full h-16 cursor-pointer flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-[#4ce68a] rounded-xl translate-y-1.5 translate-x-1.5 border-2 border-[#111714] transition-transform group-hover:translate-y-2 group-hover:translate-x-2"></div>
                        <div className="absolute inset-0 bg-[#111714] dark:bg-white rounded-xl border-2 border-[#111714] flex items-center justify-center gap-2 transition-transform group-active:translate-y-1 group-active:translate-x-1">
                            <span className="material-symbols-outlined text-white dark:text-[#111714] text-2xl">save</span>
                            <span className="text-white dark:text-[#111714] text-xl font-black tracking-widest uppercase">Save Result</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
