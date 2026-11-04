'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { PickupQR } from './PickupQR';

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
    currentUserId?: string;
}

export function QRCodeMessage({ type, qrData, isOwn, timestamp, currentUserId }: QRCodeMessageProps) {
    const isBuyer = !!currentUserId && qrData.buyerId === currentUserId;
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

            {/* QR Code: only the buyer can generate it (the secret is buyer-only) */}
            <div className="p-6 flex flex-col items-center gap-4">
                {type === 'pickup' && qrData.tradeId && qrData.buyerId ? (
                    isBuyer ? (
                        <PickupQR tradeId={qrData.tradeId} buyerId={qrData.buyerId} />
                    ) : (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-4xl block mb-1">qr_code_scanner</span>
                            The buyer will show you a QR at pickup. Scan it from <b>Trade History → Scan Buyer&apos;s QR</b>.
                        </div>
                    )
                ) : (
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <QRCodeSVG
                            value={qrValue}
                            size={180}
                            level="H"
                            marginSize={2}
                            bgColor="#ffffff"
                            fgColor="#1a1a1a"
                        />
                    </div>
                )}

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

            </div>

            {/* Timestamp */}
            <div className="px-4 pb-3 text-[10px] text-gray-500 dark:text-gray-400 text-right">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </motion.div>
    );
}
