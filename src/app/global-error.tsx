'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-white">
                    <div className="max-w-md">
                        <h2 className="text-2xl font-black text-black mb-4">Critial Error</h2>
                        <p className="text-gray-600 mb-6">Something went critically wrong.</p>
                        <button
                            onClick={() => reset()}
                            className="bg-black text-white font-bold py-3 px-6 rounded-xl"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
