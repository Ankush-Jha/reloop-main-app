'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId?: string; // Optional if videoSrc is provided
    videoSrc?: string; // Local video path
}

export default function VideoModal({ isOpen, onClose, videoId, videoSrc }: VideoModalProps) {
    // Determine embed URL if no source provided
    const embedUrl = videoId ? `https://www.instagram.com/p/${videoId}/embed/captioned/` : '';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-[340px] bg-black rounded-3xl overflow-hidden border-2 border-dark/50 shadow-2xl"
                    >
                        {/* Header/Close */}
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Player Container */}
                        <div className="w-full aspect-[9/16] bg-black flex items-center justify-center relative">
                            {videoSrc ? (
                                <video
                                    src={videoSrc}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    playsInline
                                    loop
                                />
                            ) : (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-0"
                                    scrolling="no"
                                    allowTransparency={true}
                                    allow="encrypted-media"
                                />
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
