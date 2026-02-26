import React from 'react';

interface ProductCardSkeletonProps {
    count?: number;
}

export function ProductCardSkeleton({ count = 1 }: ProductCardSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-[2rem] border-[3px] border-[#111714] p-4 flex flex-col items-center relative shadow-brutal h-full animate-pulse"
                >
                    {/* Image skeleton */}
                    <div className="w-full aspect-square border-[3px] border-[#111714] overflow-hidden mb-3 bg-gray-200 shrink-0 rounded-2xl" />

                    {/* Title skeleton */}
                    <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                    <div className="w-1/2 h-4 bg-gray-200 rounded mb-4" />

                    {/* Price skeleton */}
                    <div className="mt-auto w-20 h-8 bg-gray-200 rounded-full" />
                </div>
            ))}
        </>
    );
}
