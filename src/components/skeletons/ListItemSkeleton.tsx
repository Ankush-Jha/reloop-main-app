import React from 'react';

interface ListItemSkeletonProps {
    count?: number;
    variant?: 'default' | 'compact';
}

export function ListItemSkeleton({ count = 3, variant = 'default' }: ListItemSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`bg-white dark:bg-dark-surface rounded-[24px] border-2 border-black dark:border-gray-600 shadow-brutal ${variant === 'compact' ? 'p-3' : 'p-4'
                        } animate-pulse`}
                >
                    <div className="flex items-center gap-3">
                        {/* Avatar skeleton */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />

                        {/* Content skeleton */}
                        <div className="flex-1 space-y-2">
                            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>

                        {/* Action skeleton (optional) */}
                        {variant === 'default' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}
