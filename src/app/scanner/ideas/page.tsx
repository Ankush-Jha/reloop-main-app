'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ScannerService from '@/lib/scanner-service';
import { ScanResult } from '@/types';

interface Video {
    id: string;
    title: string;
    channel: string;
    views: string;
    thumbnail?: string;
}

interface Pin {
    id: string;
    title: string;
    image: string;
    saves: string;
    link?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ReuseIdeasPage() {
    const router = useRouter();
    const [result, setResult] = useState<ScanResult | null>(null);
    const [activeTab, setActiveTab] = useState<'videos' | 'pins'>('videos');
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [pins, setPins] = useState<Pin[]>([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [isLoadingPins, setIsLoadingPins] = useState(false);

    useEffect(() => {
        const storedResult = ScannerService.getStoredResult();
        if (!storedResult) {
            router.push('/scanner');
            return;
        }
        setResult(storedResult);

        const query = storedResult.item.objectName + ' upcycle diy';

        // Fetch videos
        const fetchVideos = async () => {
            setIsLoadingVideos(true);
            try {
                const response = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.videos) {
                    setVideos(data.videos);
                }
            } catch (error) {
                console.error('Failed to fetch videos', error);
            } finally {
                setIsLoadingVideos(false);
            }
        };

        // Fetch pins
        const fetchPins = async () => {
            setIsLoadingPins(true);
            try {
                const response = await fetch(`/api/pins?query=${encodeURIComponent(storedResult.item.objectName)}`);
                const data = await response.json();
                if (data.pins) {
                    setPins(data.pins);
                }
            } catch (error) {
                console.error('Failed to fetch pins', error);
            } finally {
                setIsLoadingPins(false);
            }
        };

        fetchVideos();
        fetchPins();
    }, [router]);

    if (!result) {
        return (
            <div className="min-h-screen bg-[#d0f0fd] dark:bg-[#112118] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#4ce68a] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { item } = result;

    return (
        <div className="min-h-screen bg-[#d0f0fd] dark:bg-[#112118]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#d0f0fd] dark:bg-[#112118] border-b-[3px] border-black dark:border-white/20 px-4 py-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                        <span className="material-symbols-outlined text-2xl text-black dark:text-white">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-black dark:text-white">Reuse Ideas</h1>
                        <p className="text-xs text-black/60 dark:text-white/60">For your {item.objectName}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border-[3px] transition-all ${activeTab === 'videos'
                            ? 'bg-red-500 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white dark:bg-white/10 text-black dark:text-white border-black/20 dark:border-white/20'
                            }`}
                    >
                        ▶ Videos
                    </button>
                    <button
                        onClick={() => setActiveTab('pins')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border-[3px] transition-all ${activeTab === 'pins'
                            ? 'bg-[#E60023] text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white dark:bg-white/10 text-black dark:text-white border-black/20 dark:border-white/20'
                            }`}
                    >
                        📌 Pins
                    </button>
                </div>
            </header>

            {/* Content */}
            <motion.div className="px-4 py-4 pb-32" initial="hidden" animate="visible" variants={containerVariants} key={activeTab}>
                {/* Can't DIY Banner */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="bg-[#FFE5E5] dark:bg-[#2A1515] rounded-2xl border-[3px] border-black dark:border-white/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-black text-lg text-black dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500">handyman</span>
                                Can't do DIY?
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => router.push(`/marketplace/create?mode=trade&item=${encodeURIComponent(item.objectName)}`)}
                                className="bg-white dark:bg-white/10 rounded-xl border-2 border-black dark:border-white/20 p-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-black">
                                    <span className="material-symbols-outlined text-black">currency_exchange</span>
                                </div>
                                <div className="text-center">
                                    <span className="block font-bold text-xs text-black dark:text-white">Trade It</span>
                                    <span className="block text-[10px] text-black/60 dark:text-white/60">Get Eco Coins</span>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(`/community?search=${encodeURIComponent(item.objectName)}`)}
                                className="bg-white dark:bg-white/10 rounded-xl border-2 border-black dark:border-white/20 p-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#4ce68a] flex items-center justify-center border-2 border-black">
                                    <span className="material-symbols-outlined text-black">school</span>
                                </div>
                                <div className="text-center">
                                    <span className="block font-bold text-xs text-black dark:text-white">Get Help</span>
                                    <span className="block text-[10px] text-black/60 dark:text-white/60">From Students</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {activeTab === 'videos' ? (
                    /* 2-Column Video Grid */
                    <div className="space-y-4">
                        {isLoadingVideos ? (
                            /* Skeleton Loader */
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white/50 dark:bg-white/5 rounded-xl border-[3px] border-black/10 dark:border-white/10 h-40 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {videos.map((video) => (
                                    <motion.div
                                        key={video.id}
                                        variants={itemVariants}
                                        className="bg-white dark:bg-[#1a2e23] rounded-xl border-[3px] border-black dark:border-white/20 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                                    >
                                        {/* Thumbnail with Play Button */}
                                        <div
                                            className="relative aspect-video bg-black cursor-pointer group"
                                            onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)}
                                        >
                                            {playingVideo === video.id ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                                                    title={video.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="absolute inset-0 w-full h-full"
                                                />
                                            ) : (
                                                <>
                                                    <img
                                                        src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                            <span className="text-white text-lg ml-0.5">▶</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Video Info */}
                                        <div className="p-2">
                                            <h3 className="font-bold text-black dark:text-white text-xs leading-tight line-clamp-2">{video.title}</h3>
                                            <p className="text-[10px] text-black/50 dark:text-white/50 mt-1">{video.channel} • {video.views}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Search More */}
                        <motion.button
                            variants={itemVariants}
                            onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.objectName + ' upcycle DIY')}`, '_blank')}
                            className="w-full py-4 bg-red-500 text-white rounded-xl font-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                        >
                            ▶ More on YouTube
                        </motion.button>
                    </div>
                ) : (
                    /* Pinterest Masonry Grid */
                    <div className="space-y-4">
                        {isLoadingPins ? (
                            /* Skeleton Loader */
                            <div className="columns-2 gap-3 space-y-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="break-inside-avoid bg-white/50 dark:bg-white/5 rounded-xl border-[3px] border-black/10 dark:border-white/10 h-48 animate-pulse mb-3" />
                                ))}
                            </div>
                        ) : (
                            <div className="columns-2 gap-3 space-y-3">
                                {pins.map((pin) => (
                                    <motion.div
                                        key={pin.id}
                                        variants={itemVariants}
                                        className="break-inside-avoid bg-white dark:bg-[#1a2e23] rounded-xl border-[3px] border-black dark:border-white/20 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-pointer hover:shadow-[5px_5px_0px_0px_#E60023] transition-all"
                                        onClick={() => window.open(pin.link || `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(pin.title)}`, '_blank')}
                                    >
                                        <img src={pin.image} alt={pin.title} className="w-full object-cover" style={{ minHeight: '100px' }} />
                                        <div className="p-2">
                                            <h4 className="font-bold text-black dark:text-white text-xs leading-tight">{pin.title}</h4>
                                            <p className="text-[10px] text-[#E60023] mt-1">📌 {pin.saves} saves</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Search More */}
                        <motion.button
                            variants={itemVariants}
                            onClick={() => window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(item.objectName + ' upcycle DIY')}`, '_blank')}
                            className="w-full py-4 bg-[#E60023] text-white rounded-xl font-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                        >
                            📌 More on Pinterest
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
