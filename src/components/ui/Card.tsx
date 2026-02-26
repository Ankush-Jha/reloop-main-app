import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    shadow?: boolean;
    onClick?: () => void;
}

export function Card({ children, className, shadow = true, onClick }: CardProps) {
    return (
        <div
            className={cn(
                'relative bg-white dark:bg-dark-surface border-[3px] border-dark dark:border-gray-600 rounded-2xl',
                shadow && 'shadow-brutal',
                onClick && 'cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none transition-all',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-4 py-3 border-b-2 border-dark/10 dark:border-gray-700', className)}>
            {children}
        </div>
    );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('p-4', className)}>
            {children}
        </div>
    );
}

export default Card;
