'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { Tutorial } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function TutorialsPage() {
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);

    useEffect(() => {
        setTutorials(DemoManager.getMockTutorials());
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="DIY Tutorials" subtitle="Learn sustainable crafting" />

            <motion.div
                className="px-5 pb-28 space-y-3"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {tutorials.map((tutorial) => (
                    <motion.div key={tutorial.id} variants={itemVariants}>
                        <Link href={`/tutorials/${tutorial.id}`}>
                            <div className={`${tutorial.color} rounded-2xl border-2 border-dark shadow-brutal-sm p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer`}>
                                <div className="w-14 h-14 bg-white rounded-xl border-2 border-dark flex items-center justify-center text-2xl">
                                    {tutorial.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-dark">{tutorial.title}</h3>
                                    <p className="text-xs text-dark/60 mb-2 line-clamp-1">{tutorial.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 bg-white rounded-lg border border-dark text-xs font-bold text-dark">
                                            {tutorial.level}
                                        </span>
                                        <span className="text-xs text-dark/40 font-bold">{tutorial.estimatedTime}</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-dark/40 text-lg">chevron_right</span>
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {/* Coming Soon */}
                <motion.div variants={itemVariants} className="text-center py-6">
                    <p className="text-dark/40 text-sm font-medium">More tutorials coming soon!</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
