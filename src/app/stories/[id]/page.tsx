'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { Story } from '@/types';

export default function StoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [story, setStory] = useState<Story | null>(null);

    useEffect(() => {
        const id = params.id as string;
        const found = DemoManager.getStoryById(id);
        if (!found) {
            router.push('/stories');
            return;
        }
        setStory(found);
    }, [params.id, router]);

    if (!story) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Image */}
            <div className="relative h-64">
                <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-6 left-5">
                    <Link
                        href="/stories"
                        className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl shadow-sm"
                    >
                        <span className="material-symbols-outlined text-dark dark:text-white">arrow_back</span>
                    </Link>
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="px-3 py-1 bg-primary text-dark rounded-full text-xs font-bold">{story.category}</span>
                </div>
            </div>

            <motion.div
                className="px-5 -mt-4 relative z-10 pb-28 space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {/* Content Card */}
                <div className="bg-white dark:bg-dark-surface rounded-3xl border-2 border-dark dark:border-gray-600 shadow-brutal p-6">
                    <h1 className="text-2xl font-[900] text-dark dark:text-white leading-tight">{story.title}</h1>

                    {/* Author */}
                    <div className="flex items-center gap-3 mt-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
                        <div className="w-10 h-10 rounded-full border-2 border-dark dark:border-gray-600 overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <img src={story.authorAvatar} alt={story.author} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="font-bold text-dark dark:text-white text-sm">{story.author}</p>
                            <p className="text-xs text-dark/60 dark:text-white/60">{story.campus}</p>
                        </div>
                    </div>

                    {/* Impact Stats */}
                    <div className="grid grid-cols-2 gap-3 my-5">
                        <div className="bg-card-green rounded-xl p-3 text-center">
                            <p className="text-xl font-[900] text-dark dark:text-white">{story.co2Saved}kg</p>
                            <p className="text-[10px] font-bold text-dark/60 dark:text-white/60">CO₂ Saved</p>
                        </div>
                        <div className="bg-card-yellow rounded-xl p-3 text-center">
                            <p className="text-xl font-[900] text-dark dark:text-white">{story.itemsTraded}</p>
                            <p className="text-[10px] font-bold text-dark/60 dark:text-white/60">Items Traded</p>
                        </div>
                    </div>

                    {/* Story Content */}
                    <div className="text-dark/80 dark:text-white/80 text-sm leading-relaxed space-y-4">
                        {story.content.split('\n\n').map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                </div>

                {/* Share */}
                <div className="flex gap-3">
                    <button className="flex-1 bg-dark text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-brutal-sm active:translate-y-1 active:shadow-none transition-all">
                        <span className="material-symbols-outlined text-lg">share</span>
                        Share Story
                    </button>
                    <button className="flex-1 bg-card-pink text-dark dark:text-white py-4 rounded-2xl font-bold border-2 border-dark dark:border-gray-600 shadow-brutal-sm flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none transition-all">
                        <span className="material-symbols-outlined text-lg">favorite</span>
                        Inspire Me
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
