'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const slides = [
    {
        id: 1,
        tag: 'UPCYCLING TIP OF THE DAY',
        tagColor: 'bg-[#10B981]', // Green
        title: 'Turn Old Bottles into Planters!',
        description: 'Scan your plastic waste for easy DIY guides and earn 50 coins. Save 0.5kg CO2 per project.',
        cta: 'TRY NOW',
        ctaColor: 'bg-[#FDE047]', // Yellow
        ctaText: 'text-black',
        bg: 'bg-[#ECFDF5]', // Light Green
        graphic: (
            <div className="relative w-32 h-44 mx-auto mt-4">
                {/* Bottle Body */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-32 bg-[#A0522D] rounded-b-2xl rounded-t-lg border-3 border-dark z-10 overflow-hidden">
                    {/* Soil/Liquid */}
                    <div className="absolute top-1/2 w-full h-full bg-[#8B4513] opacity-20"></div>
                    <div className="absolute top-8 left-2 w-2 h-2 rounded-full bg-black/20"></div>
                    <div className="absolute top-12 right-2 w-3 h-3 rounded-full bg-black/20"></div>
                </div>
                {/* Bottle Neck */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-12 h-6 bg-[#D1FAE5] border-3 border-b-0 border-dark z-0"></div>
                {/* Plant Leaf */}
                <div className="absolute -top-4 right-[-20px] rotate-12">
                    <span className="material-symbols-outlined text-green-300 text-[60px] drop-shadow-sm">eco</span>
                </div>
                {/* Badge */}
                <div className="absolute -top-8 left-[-40px] rotate-[-12deg] z-20">
                    <span className="bg-primary text-dark text-[10px] font-black px-2 py-1 rounded border-2 border-dark shadow-sm">
                        Recycle
                    </span>
                </div>
            </div>
        )
    },
    {
        id: 2,
        tag: 'COMMUNITY SPOTLIGHT',
        tagColor: 'bg-[#A78BFA]', // Purple
        title: 'User @EcoWarrior\'s Epic Upcycle Win',
        description: 'Transformed old clothes into bags, saving 2kg CO2. Share your story in DIY Community for bonus coins.',
        cta: 'VIEW GALLERY',
        ctaColor: 'bg-[#FDE047]', // Yellow
        ctaText: 'text-dark',
        bg: 'bg-blue-50', // Light Blue
        graphic: (
            <div className="relative w-full h-full flex items-end justify-center pb-4">
                {/* Placeholder for Tote Bag Image */}
                <div className="w-40 h-48 bg-amber-100 rounded-lg border-3 border-dark relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900 to-transparent"></div>
                    <span className="material-symbols-outlined text-6xl text-amber-800/20">shopping_bag</span>
                </div>
                <div className="absolute bottom-6 right-8 bg-dark/80 text-white text-[8px] font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">photo_camera</span>
                    by @EcoWarrior
                </div>
            </div>
        )
    },
    {
        id: 3,
        tag: 'REWARD ALERT',
        tagColor: 'bg-dark', // Black
        textColor: 'text-white',
        title: 'New Redeems: Eco-Bags for 500 Coins',
        description: 'Shop sustainable goodies and give back. Limited stock—redeem before it\'s gone!',
        cta: 'SHOP NOW',
        ctaColor: 'bg-black', // Black
        ctaText: 'text-white',
        bg: 'bg-[#C084FC]', // Purple base
        graphic: (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dot-grid.png')] opacity-20"></div>
                {/* Shopping Bag */}
                <div className="relative">
                    <div className="w-32 h-36 bg-[#Fef9c3] rounded-sm border-3 border-dark transform -rotate-6 shadow-brutal flex items-center justify-center relative z-10">
                        <span className="material-symbols-outlined text-5xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
                        <div className="absolute bottom-4 w-full h-4 bg-emerald-600 opacity-80"></div>
                    </div>
                    {/* Handle */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-12 rounded-t-full border-3 border-dark border-b-0 z-0 transform -rotate-6"></div>

                    {/* Tag */}
                    <div className="absolute -bottom-2 -right-8 bg-white border-2 border-dark px-2 py-1 transform rotate-6 z-20 shadow-sm">
                        <span className="text-[10px] font-black text-dark">500 COINS</span>
                    </div>
                </div>
            </div>
        )
    }
];

export const ReloopBuzz = () => {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrent((prev) => {
            if (newDirection === 1) return (prev + 1) % slides.length;
            return (prev - 1 + slides.length) % slides.length;
        });
    };

    const currentSlide = slides[current];

    return (
        <section className="w-full max-w-md mx-auto mt-8 mb-4 px-4">
            <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="font-black text-2xl uppercase italic text-dark dark:text-white tracking-tight">Reloop Buzz</h2>
                <span className="text-[10px] font-bold bg-dark text-white px-2 py-0.5 rounded-md">NEW</span>
            </div>

            <div className="relative w-full aspect-[4/5] max-h-[500px]">
                {/* Navigation Buttons - Absolute centered vertically on edges */}
                <button
                    onClick={() => paginate(-1)}
                    className="absolute left-0 top-[55%] -translate-y-1/2 -translate-x-3 z-30 w-12 h-12 bg-[#FDE047] border-3 border-dark rounded-full flex items-center justify-center shadow-brutal hover:scale-105 active:scale-95 transition-all"
                    aria-label="Previous slide"
                >
                    <span className="material-symbols-outlined text-dark font-bold">arrow_back_ios_new</span>
                </button>
                <button
                    onClick={() => paginate(1)}
                    className="absolute right-0 top-[55%] -translate-y-1/2 translate-x-3 z-30 w-12 h-12 bg-[#FDE047] border-3 border-dark rounded-full flex items-center justify-center shadow-brutal hover:scale-105 active:scale-95 transition-all"
                    aria-label="Next slide"
                >
                    <span className="material-symbols-outlined text-dark font-bold">arrow_forward_ios</span>
                </button>


                {/* Background Decorative Cards for Stacking Effect */}
                <div className="absolute inset-x-4 top-2 bottom-0 bg-white dark:bg-zinc-800 border-3 border-dark dark:border-gray-500 rounded-[2.5rem] transform rotate-2 z-0"></div>
                <div className="absolute inset-x-4 top-2 bottom-0 bg-white dark:bg-zinc-800 border-3 border-dark dark:border-gray-500 rounded-[2.5rem] transform -rotate-1 z-0"></div>

                {/* Main Card */}
                <div className="relative w-full h-full z-10 overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={current}
                            custom={direction}
                            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full h-full bg-white dark:bg-zinc-900 border-3 border-dark dark:border-white rounded-[2.5rem] shadow-[8px_8px_0px_0px_#000] flex flex-col overflow-hidden"
                        >
                            {/* Top Graphic Section (45% height) */}
                            <div className={`h-[45%] ${currentSlide.bg} border-b-3 border-dark relative overflow-hidden`}>
                                {/* Tag Pill */}
                                <div className="absolute top-4 left-4 z-20">
                                    <span className={`${currentSlide.tagColor || 'bg-primary'} ${currentSlide.textColor || 'text-dark'} text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 border-dark shadow-[2px_2px_0px_0px_#000] tracking-wide`}>
                                        {currentSlide.tag}
                                    </span>
                                </div>

                                {/* Graphic Content */}
                                {currentSlide.graphic}
                            </div>

                            {/* Bottom Text Section (55% height) */}
                            <div className="flex-1 p-6 flex flex-col justify-between bg-white dark:bg-dark-surface">
                                <div className="space-y-3">
                                    <h3 className="font-black text-xl leading-[1.1] text-dark dark:text-white">
                                        {currentSlide.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-[1.4]">
                                        {currentSlide.description}
                                    </p>
                                </div>

                                <button className={`w-full mt-4 ${currentSlide.ctaColor} ${currentSlide.ctaText} font-black text-sm uppercase tracking-widest py-3.5 rounded-xl border-3 border-dark shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 group`}>
                                    {currentSlide.cta}
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                                        {currentSlide.cta === 'SHOP NOW' ? 'shopping_cart' : 'arrow_forward'}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Pagination Container (Outside card) */}
            <div className="flex justify-center mt-6 gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > current ? 1 : -1);
                            setCurrent(idx);
                        }}
                        className={`w-3 h-3 rounded-full border-2 border-dark transition-all ${idx === current
                            ? 'bg-dark dark:bg-white scale-125'
                            : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default ReloopBuzz;
