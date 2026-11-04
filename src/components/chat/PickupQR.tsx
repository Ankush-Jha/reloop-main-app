'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DBService } from '@/lib/firebase/db';
import { encodePickupQr } from '@/lib/qr';

/**
 * The buyer's pickup QR. The secret code lives in trades/{id}/secrets/pickup
 * (buyer-only), so the seller can't generate or read it - they must scan this.
 */
export function PickupQR({ tradeId, buyerId, size = 180 }: { tradeId: string; buyerId: string; size?: number }) {
    const [code, setCode] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        DBService.getOrCreatePickupSecret(tradeId, buyerId)
            .then(c => { if (!cancelled) setCode(c); })
            .catch(e => { if (!cancelled) setError(e?.message || 'Could not load your pickup QR'); });
        return () => { cancelled = true; };
    }, [tradeId, buyerId]);

    if (error) return <p className="text-sm font-bold text-red-600 text-center">{error}</p>;
    if (!code) {
        return <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />;
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-xl border-2 border-dark">
                <QRCodeSVG value={encodePickupQr(tradeId, code)} size={size} level="H" bgColor="#ffffff" fgColor="#1a1a1a" />
            </div>
            <p className="text-xs text-dark/60 dark:text-white/60">Or tell the seller this code</p>
            <p className="font-black tracking-[0.3em] text-xl text-dark dark:text-white">{code}</p>
        </div>
    );
}

export default PickupQR;
