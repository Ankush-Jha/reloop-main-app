'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { QrScanner } from '@/components/scanner/QrScanner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DBService } from '@/lib/firebase/db';
import { parsePickupQr, isValidPickupCode } from '@/lib/qr';
import { Trade } from '@/types';

/**
 * Seller (or ReLoop staff) verifies a pickup: scan the buyer's QR, or type the 8-character
 * code they show. Coins move only after the code is verified, in one atomic settlement.
 */
function VerifyTradeInner() {
    const router = useRouter();
    const search = useSearchParams();
    const { user, isDemo, isLoading: authLoading } = useAuth();

    const [trades, setTrades] = useState<Trade[]>([]);
    const [tradeId, setTradeId] = useState<string>(search.get('trade') || '');
    const [loading, setLoading] = useState(true);
    const [cameraOn, setCameraOn] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState<{ coins: number; listingTitle: string } | null>(null);

    // Deals this user can verify: accepted deals where they are the seller.
    useEffect(() => {
        if (authLoading) return;
        if (isDemo || !user?.uid) { setLoading(false); return; }
        DBService.getUserTrades(user.uid)
            .then(all => setTrades(all.filter(t => t.status === 'accepted' && t.sellerId === user.uid)))
            .catch(() => setError('Could not load your deals.'))
            .finally(() => setLoading(false));
    }, [authLoading, isDemo, user?.uid]);

    const settle = async (id: string, code: string) => {
        if (!user?.uid || verifying) return;
        setVerifying(true);
        setError('');
        try {
            const result = await DBService.completeTrade({ tradeId: id, code, sellerId: user.uid });
            setDone(result);
        } catch (e: any) {
            setError(e?.message || 'Could not verify this pickup.');
        } finally {
            setVerifying(false);
        }
    };

    const onScan = (text: string) => {
        setCameraOn(false);
        const parsed = parsePickupQr(text);
        if (!parsed) {
            setError("That isn't a ReLoop pickup QR. Ask the buyer to open their pickup QR.");
            return;
        }
        if (tradeId && parsed.tradeId !== tradeId) {
            setError('This QR is for a different deal. Pick the right deal or scan again.');
            return;
        }
        setTradeId(parsed.tradeId);
        void settle(parsed.tradeId, parsed.code);
    };

    const onManual = () => {
        if (!tradeId) { setError('Choose which deal you are verifying first.'); return; }
        if (!isValidPickupCode(manualCode)) { setError('The code is 8 letters/numbers.'); return; }
        void settle(tradeId, manualCode.trim().toUpperCase());
    };

    if (done) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-100 to-white dark:from-dark-bg dark:to-dark-surface flex flex-col items-center justify-center px-8">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-32 h-32 bg-primary rounded-[2.5rem] border-[3px] border-dark shadow-brutal flex items-center justify-center mb-6"
                >
                    <span className="material-symbols-outlined text-6xl text-dark">verified</span>
                </motion.div>
                <h1 className="text-3xl font-[900] text-dark dark:text-white uppercase text-center">Trade Verified!</h1>
                <p className="text-dark/60 dark:text-white/60 mt-2 text-center">
                    &quot;{done.listingTitle}&quot; picked up.
                    {done.coins > 0 ? ` ${done.coins} coins moved from the buyer to you.` : ' Item swap complete.'}
                </p>
                <button
                    onClick={() => router.push('/trade-history')}
                    className="mt-8 w-full max-w-xs bg-dark text-white py-4 rounded-2xl font-black uppercase shadow-brutal"
                >
                    Done
                </button>
            </div>
        );
    }

    if (isDemo) {
        return (
            <div className="min-h-screen bg-background">
                <PageHeader title="Verify Trade" backHref="/trade-history" />
                <p className="px-5 text-sm text-dark/70 dark:text-white/70">
                    Trade verification needs a real account (it checks the buyer&apos;s QR against the database). Sign in to use it.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader title="Verify Trade" backHref="/trade-history" />
            <div className="px-5 pb-28 space-y-5">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : trades.length === 0 ? (
                    <div className="text-center py-10">
                        <span className="material-symbols-outlined text-5xl text-dark/30 dark:text-white/30">inventory_2</span>
                        <p className="font-bold text-dark dark:text-white mt-2">No accepted deals waiting for pickup</p>
                        <p className="text-sm text-dark/60 dark:text-white/60 mt-1">Accept an offer first, then verify it when the buyer arrives.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-dark/60 dark:text-white/60">Which deal?</p>
                            {trades.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTradeId(t.id); setError(''); }}
                                    className={`w-full text-left rounded-2xl border-2 p-4 ${tradeId === t.id ? 'bg-card-green border-dark shadow-brutal-sm' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700'}`}
                                >
                                    <p className="font-black text-dark dark:text-white">{t.listingTitle}</p>
                                    <p className="text-xs text-dark/60 dark:text-white/60">
                                        {t.traderName} · {t.agreedCoins ? `🪙 ${t.agreedCoins}` : t.offeredItem ? `swap: ${t.offeredItem}` : 'free'}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full aspect-square bg-dark rounded-3xl border-4 border-dark shadow-brutal overflow-hidden flex items-center justify-center">
                            {cameraOn ? (
                                <QrScanner onScan={onScan} onError={(m) => { setCameraOn(false); setError(m); }} />
                            ) : (
                                <div className="text-center px-6">
                                    <span className="material-symbols-outlined text-6xl text-white/40">videocam_off</span>
                                    <p className="text-white/60 text-sm font-bold">Camera is off</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { setError(''); setCameraOn(c => !c); }}
                            disabled={verifying}
                            className="w-full bg-primary text-dark py-4 rounded-2xl font-black border-2 border-dark shadow-brutal flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">{cameraOn ? 'stop_circle' : 'qr_code_scanner'}</span>
                            {cameraOn ? 'Stop Camera' : "Scan Buyer's QR"}
                        </button>

                        <div>
                            <p className="text-xs font-bold text-dark/50 dark:text-white/50 mb-2">Or enter the buyer&apos;s code</p>
                            <div className="flex gap-2">
                                <input
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    maxLength={8}
                                    placeholder="8-CHAR CODE"
                                    className="flex-1 h-14 rounded-2xl bg-white dark:bg-dark-surface border-2 border-dark px-4 text-xl font-black text-center tracking-widest uppercase text-dark dark:text-white"
                                />
                                <button
                                    onClick={onManual}
                                    disabled={verifying || manualCode.length !== 8}
                                    className="px-5 bg-dark text-white rounded-2xl font-black disabled:opacity-50"
                                >
                                    {verifying ? '…' : 'Verify'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="bg-card-coral text-dark p-3 rounded-xl text-sm font-bold border-2 border-dark">⚠️ {error}</div>
                )}
                {verifying && <p className="text-center text-sm font-bold text-dark/60 dark:text-white/60">Verifying…</p>}
            </div>
        </div>
    );
}

export default function VerifyTradePage() {
    return (
        <Suspense fallback={null}>
            <VerifyTradeInner />
        </Suspense>
    );
}
