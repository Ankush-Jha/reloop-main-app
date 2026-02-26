'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import VideoModal from '@/components/ui/VideoModal';

// Trending creators data with real users
const trendingCreators = [
    {
        id: '4',
        username: '@Ankush',
        image: '/images/ankush.png',
        featured: true,
    },
    {
        id: '1',
        username: '@Unnati',
        image: '/images/unnati.png',
        featured: false,
    },
    {
        id: '2',
        username: '@Uransh',
        image: '/images/uransh.png',
        featured: false,
    },
    {
        id: '3',
        username: '@Rudraksh',
        image: '/images/rudraksh.png',
        featured: false,
    },
];

const projects = [
    {
        id: 'new-pista',
        tutorialId: 'tutorial-pista',
        title: 'Diy bottle painting - Pista shell tulip 🧿🌷',
        author: '@Ankush_Makes',
        authorImage: '/images/ankush.png',
        image: '/videos/thumb-pista.png',
        time: 'Just now',
        tags: [{ name: '#Tulip', color: 'bg-pink-100' }, { name: '#Upcycle', color: 'bg-green-100' }],
        description: 'Pista shell tulip bottle painting craft tutorial.',
        link: '#',
        videoId: 'pista-tulip',
        videoSrc: '/videos/pista-shell-tulip.mp4'
    },
    {
        id: '4',
        tutorialId: 'tutorial-4',
        title: 'Cardboard Bangle Box',
        author: '@Ankush_Makes',
        authorImage: '/images/ankush.png',
        image: '/videos/thumb-2.png',
        time: '2h ago',
        tags: [{ name: '#Storage', color: 'bg-indigo-100' }, { name: '#Cardboard', color: 'bg-red-100' }],
        description: 'Create a segmented jewelry organizer using waste cardboard boxes. 📦💍',
        link: 'https://www.instagram.com/reel/DTc9Um6EUJO/',
        videoId: 'DTc9Um6EUJO',
        videoSrc: '/videos/tutorial-2.mp4'
    },

    {
        id: '2',
        tutorialId: 'tutorial-2',
        title: 'Aesthetic Minimalist Crafts',
        author: '@Uransh_Designs',
        authorImage: '/images/uransh.png',
        image: '/videos/thumb-2.png',
        time: '1d ago',
        tags: [{ name: '#Decor', color: 'bg-pink-100' }, { name: '#Paper', color: 'bg-blue-100' }],
        description: 'Simple and clean DIY paper craft ideas for modern desk decor. ✂️�',
        link: 'https://www.instagram.com/p/DLwADuaRPq4/',
        videoId: 'DLwADuaRPq4',
        videoSrc: '/videos/tutorial-2.mp4'
    },
    {
        id: '3',
        tutorialId: 'tutorial-3',
        title: 'Family DIY Studio Day',
        author: '@Rudraksh_Art',
        authorImage: '/images/rudraksh.png',
        image: '/videos/thumb-1.png',
        time: '2d ago',
        tags: [{ name: '#Family', color: 'bg-orange-100' }, { name: '#Kids', color: 'bg-yellow-100' }],
        description: 'Fun crafting activities for kids and family at a creative 2D studio! 🎨👨‍�‍�',
        link: 'https://www.instagram.com/reel/DSxN0sOgRNd/',
        videoId: 'DSxN0sOgRNd',
        videoSrc: '/videos/tutorial-1.mp4'
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
};

export default function CommunityPage() {
    const [selectedVideo, setSelectedVideo] = useState<{ videoId?: string, videoSrc?: string } | null>(null);

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pb-32 relative">
            <VideoModal
                isOpen={!!selectedVideo}
                onClose={() => setSelectedVideo(null)}
                videoId={selectedVideo?.videoId}
                videoSrc={selectedVideo?.videoSrc}
            />
            {/* ... (rest of the component) */}

            {/* Dot Grid Background */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="flex items-center justify-center w-10 h-10 bg-[#fde047] border-2 border-dark rounded-lg shadow-brutal-sm active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
                            >
                                <span className="material-symbols-outlined text-dark">arrow_back</span>
                            </Link>
                            <h1 className="text-2xl font-extrabold tracking-tight text-dark dark:text-white italic">DIY HUB</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center justify-center w-10 h-10 bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 rounded-full shadow-brutal-sm active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all relative">
                                <span className="material-symbols-outlined text-dark dark:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                                <span className="absolute top-0 right-0 w-3 h-3 bg-primary border border-dark rounded-full" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scan & Earn - Moved from Home */}
                <div className="px-4 pt-4">
                    <Link href="/scanner" className="block">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-dark rounded-2xl translate-x-1 translate-y-1"></div>
                            <div className="relative bg-gradient-to-br from-primary via-green-400 to-emerald-500 rounded-2xl border-4 border-dark overflow-hidden transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-dark rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-dark uppercase tracking-tight text-base leading-tight">Scan to<br />DIY!</p>
                                            <p className="text-[10px] font-bold text-dark/60 mt-0.5">Get upcycling ideas</p>
                                        </div>
                                    </div>
                                    <div className="bg-dark text-white rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                        <span className="material-symbols-outlined text-lg">photo_camera</span>
                                        <span className="font-black text-xs uppercase tracking-wide">Scan</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Trending Creators */}
                <section className="mt-6 pl-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-dark dark:text-white">local_fire_department</span>
                        <h2 className="text-lg font-extrabold uppercase tracking-wide text-dark dark:text-white">Trending Creators</h2>
                    </div>
                    <div className="flex overflow-x-auto gap-4 pb-4 pr-4 no-scrollbar">
                        {trendingCreators.map((creator) => (
                            <div key={creator.id} className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
                                <div className="w-16 h-16 rounded-full border-2 border-dark overflow-hidden bg-white shadow-brutal-sm group-active:shadow-none group-active:translate-y-[2px] group-active:translate-x-[2px] transition-all">
                                    <img
                                        src={creator.image}
                                        alt={creator.username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className={`text-[10px] font-bold uppercase text-center px-2 py-0.5 rounded-md ${creator.featured
                                    ? 'bg-dark text-white'
                                    : 'border border-dark bg-white text-dark dark:bg-dark-surface dark:text-white dark:border-gray-600'
                                    }`}>
                                    {creator.username}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Main Feed */}
                <motion.main
                    className="flex flex-col gap-8 px-4 mt-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-dark dark:text-white">Fresh Projects</h1>
                        <Link href="/tutorials" className="text-sm font-bold underline decoration-2 decoration-primary underline-offset-4 text-dark dark:text-white">View All</Link>
                    </div>

                    {/* Project Cards - 2 Column Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={(e) => {
                                    if (project.videoSrc || project.videoId) {
                                        e.preventDefault();
                                        setSelectedVideo({ videoId: project.videoId, videoSrc: project.videoSrc });
                                    }
                                }}
                            >
                                <motion.article
                                    variants={itemVariants}
                                    className="bg-white dark:bg-dark-surface border-2 border-dark dark:border-gray-600 rounded-2xl shadow-brutal overflow-hidden flex flex-col group cursor-pointer hover:shadow-brutal-lg transition-shadow"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-square w-full border-b-2 border-dark dark:border-gray-600 overflow-hidden">
                                        <img
                                            src={project.image}
                                            alt={project.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-2 right-2 bg-white border border-dark px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            {project.time}
                                        </div>
                                        {/* Tags overlay */}
                                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                                            {project.tags.slice(0, 1).map((tag) => (
                                                <span key={tag.name} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tag.color} text-dark border border-dark`}>
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3 flex flex-col gap-2">
                                        <h3 className="text-sm font-extrabold uppercase leading-tight tracking-tight text-dark dark:text-white line-clamp-2">
                                            {project.title}
                                        </h3>

                                        {/* User */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full border border-dark overflow-hidden bg-gray-200">
                                                <img src={project.authorImage} alt={project.author} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{project.author}</span>
                                        </div>

                                        {/* View Tutorial CTA */}
                                        <div className="flex items-center justify-center gap-1 h-8 bg-primary text-dark font-bold text-xs border-2 border-dark rounded-lg mt-1">
                                            <span className="material-symbols-outlined text-[16px]">play_circle</span>
                                            View Tutorial
                                        </div>
                                    </div>
                                </motion.article>
                            </div>
                        ))}
                    </div>

                </motion.main>
            </div>

            {/* Floating Add Button */}
            <button className="fixed bottom-24 right-4 w-16 h-16 bg-[#fde047] neo-border rounded-full shadow-brutal flex items-center justify-center z-40 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                <span className="material-symbols-outlined text-dark text-4xl">add</span>
            </button>
        </div>
    );
}
