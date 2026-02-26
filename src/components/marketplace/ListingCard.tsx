'use client';

import Link from 'next/link';
import { Listing } from '@/types';
import { formatRupeeValue } from '@/lib/eco-coins';

interface ListingCardProps {
    listing: Listing;
    isOwner?: boolean;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export function ListingCard({ listing, isOwner, onEdit, onDelete }: ListingCardProps) {
    return (
        <Link href={`/marketplace/${listing.id}`} className="block h-full">
            <div className="bg-[#FAFAFA] rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden flex flex-col group active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all h-full">
                {/* Image Container */}
                <div className="aspect-square bg-white border-b-4 border-black relative flex items-center justify-center overflow-hidden">
                    <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Green Eco Dot */}
                    <div className="absolute top-3 right-3 w-4 h-4 bg-primary rounded-full border-2 border-black z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>

                    {/* Owner Actions Overlay */}
                    {isOwner && (
                        <div className="absolute top-3 left-3 flex gap-1" onClick={(e) => e.preventDefault()}>
                            <button
                                onClick={() => onEdit?.(listing.id)}
                                className="bg-white border-2 border-black rounded-full p-1.5 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <span className="material-symbols-outlined text-sm text-black">edit</span>
                            </button>
                            <button
                                onClick={() => onDelete?.(listing.id)}
                                className="bg-white border-2 border-black rounded-full p-1.5 hover:bg-rose-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <span className="material-symbols-outlined text-sm text-rose-500">delete</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col flex-grow justify-between gap-2">
                    <div>
                        {/* Title */}
                        <h3 className="font-bold text-sm leading-tight uppercase line-clamp-2 text-black">
                            {listing.title}
                        </h3>
                        {/* Category & Condition */}
                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">
                            {listing.category} • {listing.condition}
                        </p>
                    </div>
                    {/* Price - Coins with Rupee equivalent */}
                    <div className="flex flex-col">
                        <span className="font-black text-lg text-black">🪙 {listing.price}</span>
                        <span className="text-xs text-gray-500 font-bold">{formatRupeeValue(listing.price)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

