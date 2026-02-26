'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const STORIES = [
    { id: '4', name: 'Ankush', image: '/images/ankush.png', hasStory: true },
    { id: '1', name: 'Unnati', image: '/images/unnati.png', hasStory: true },
    { id: '2', name: 'Uransh', image: '/images/uransh.png', hasStory: true },
    { id: '3', name: 'Rudraksh', image: '/images/rudraksh.png', hasStory: true },
    { id: '5', name: 'You', image: '', isAdd: true },
];

export function StoriesBar() {
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
            {STORIES.map((story) => (
                <Link href={story.isAdd ? '/stories/create' : `/stories/${story.id}`} key={story.id} className="flex flex-col items-center gap-1 shrink-0">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-16 h-16 rounded-full p-[3px] ${story.isAdd ? 'border-2 border-dashed border-gray-400' : 'bg-gradient-to-tr from-yellow-400 to-primary'}`}
                    >
                        <div className="w-full h-full rounded-full border-2 border-white dark:border-dark-bg overflow-hidden relative bg-gray-200">
                            {story.isAdd ? (
                                <div className="w-full h-full flex items-center justify-center bg-white dark:bg-dark-surface">
                                    <span className="material-symbols-outlined text-dark dark:text-white">add</span>
                                </div>
                            ) : (
                                <img
                                    src={story.image}
                                    alt={story.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </motion.div>
                    <span className="text-xs font-bold text-dark dark:text-white">{story.name}</span>
                </Link>
            ))}
        </div>
    );
}
