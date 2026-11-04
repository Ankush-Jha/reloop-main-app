'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface QrScannerProps {
    /** Called once with the decoded text. The camera is released right after. */
    onScan: (text: string) => void;
    /** Called when the camera can't be opened (permission, no camera, insecure origin ...). */
    onError?: (message: string) => void;
    className?: string;
}

function friendlyCameraError(err: unknown): string {
    const e = err as { name?: string; message?: string } | string | undefined;
    const name = typeof e === 'object' ? e?.name : undefined;
    const message = typeof e === 'string' ? e : e?.message || '';
    if (name === 'NotAllowedError' || /permission/i.test(message)) {
        return 'Camera permission denied. Allow camera access in your browser settings, or enter the code manually.';
    }
    if (name === 'NotFoundError' || /requested device not found/i.test(message)) {
        return 'No camera found on this device. Enter the code manually instead.';
    }
    if (name === 'NotReadableError') {
        return 'The camera is being used by another app.';
    }
    if (!window.isSecureContext || /secure|https/i.test(message)) {
        return 'Camera needs HTTPS (or localhost). Enter the code manually instead.';
    }
    return message || 'Could not start the camera. Enter the code manually instead.';
}

/**
 * Live camera QR scanner.
 *
 * Handles the lifecycle problems the old inline scanners had: the camera is always
 * released on unmount (even if unmounted while still starting, and under React
 * strict-mode double effects) and a decoded code is only ever reported once.
 */
export function QrScanner({ onScan, onError, className }: QrScannerProps) {
    const reactId = useId();
    const elementId = `qr-reader-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const [starting, setStarting] = useState(true);

    // Keep latest callbacks without restarting the camera when parents re-render.
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onScanRef.current = onScan;
        onErrorRef.current = onError;
    });

    useEffect(() => {
        let cancelled = false;
        let reported = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let scanner: any = null;

        const release = async () => {
            if (!scanner) return;
            const s = scanner;
            scanner = null;
            try {
                if (s.isScanning) await s.stop();
            } catch {
                /* already stopped */
            }
            try {
                s.clear();
            } catch {
                /* element already gone */
            }
        };

        (async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                if (cancelled) return;

                scanner = new Html5Qrcode(elementId, false);
                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 220, height: 220 } },
                    (decodedText: string) => {
                        if (reported || cancelled) return;
                        reported = true;
                        // Release the camera first, then report.
                        release().finally(() => onScanRef.current(decodedText));
                    },
                    () => {
                        /* per-frame "no QR found" - not an error */
                    }
                );

                if (cancelled) {
                    await release();
                    return;
                }
                setStarting(false);
            } catch (err) {
                if (cancelled) return;
                setStarting(false);
                await release();
                onErrorRef.current?.(friendlyCameraError(err));
            }
        })();

        return () => {
            cancelled = true;
            void release();
        };
    }, [elementId]);

    return (
        <div className={`relative w-full h-full ${className || ''}`}>
            <div id={elementId} className="w-full h-full [&_video]:object-cover" />
            {starting && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark/70">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

export default QrScanner;
