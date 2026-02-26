'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface QRCodeMessageProps {
    type: 'dropoff' | 'pickup';
    qrData: {
        type: string;
        tradeId?: string;
        listingId: string;
        sellerId: string;
        buyerId?: string;
        amount?: number;
        listingTitle: string;
        createdAt: string;
    };
    isOwn: boolean;
    timestamp: Date;
}

export function QRCodeMessage({ type, qrData, isOwn, timestamp }: QRCodeMessageProps) {
    const config = {
        dropoff: {
            title: '📦 Drop-Off QR',
            instruction: 'Show this at any ReLoop Zone to drop off your item',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-300 dark:border-blue-700',
            icon: 'inventory_2',
        },
        pickup: {
            title: '🎉 Pickup QR',
            instruction: 'Show this at the ReLoop Zone to collect your item!',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-300 dark:border-green-700',
            icon: 'redeem',
        },
    };

    const c = config[type];
    const qrValue = JSON.stringify(qrData);

    const handleDownload = () => {
        // Create SVG element and convert to data URL
        const svg = document.querySelector(`#qr-${qrData.tradeId || qrData.listingId}`) as SVGElement;
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `reloop-${type}-${qrData.listingId}.svg`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-[90%] rounded-2xl border-2 ${c.borderColor} ${c.bgColor} overflow-hidden ${isOwn ? 'ml-auto' : 'mr-auto'}`}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-gray-600 dark:text-gray-400">{c.icon}</span>
                <span className="font-bold text-dark dark:text-white">{c.title}</span>
            </div>

            {/* QR Code */}
            <div className="p-6 flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <QRCodeSVG
                        id={`qr-${qrData.tradeId || qrData.listingId}`}
                        value={qrValue}
                        size={180}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#1a1a1a"
                    />
                </div>

                {/* Item Info */}
                <div className="text-center">
                    <p className="font-bold text-dark dark:text-white">{qrData.listingTitle}</p>
                    {qrData.amount && (
                        <p className="text-primary font-black text-lg mt-1">
                            🪙 {qrData.amount} coins
                        </p>
                    )}
                </div>

                {/* Instruction */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {c.instruction}
                </p>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Save QR
                </button>
            </div>

            {/* Timestamp */}
            <div className="px-4 pb-3 text-[10px] text-gray-500 dark:text-gray-400 text-right">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </motion.div>
    );
}
