import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return <div className={cn('skeleton rounded-xl', className)} />;
}

export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                    <Skeleton className="aspect-square w-full rounded-none" />
                    <div className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Skeleton;
