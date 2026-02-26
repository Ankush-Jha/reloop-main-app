'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border-2 border-red-200 dark:border-red-900 max-w-md">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-4">error</span>
                <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Something went wrong!</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    We've encountered an unexpected error. Our team has been notified.
                </p>
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-brutal-sm border-2 border-dark"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
