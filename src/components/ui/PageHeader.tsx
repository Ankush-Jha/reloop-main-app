'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    backHref?: string;
    rightAction?: ReactNode;
    subtitle?: string;
    className?: string;
}

export function PageHeader({ title, backHref = '/', rightAction, subtitle, className }: PageHeaderProps) {
    return (
        <header className={cn('px-5 pt-6 pb-4 flex items-center gap-4', className)}>
            <Link
                href={backHref}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-surface rounded-xl border-2 border-dark dark:border-gray-600 shadow-brutal-sm shrink-0"
            >
                <span className="material-symbols-outlined text-dark dark:text-white">arrow_back</span>
            </Link>
            <div className="flex-1 min-w-0">
                <h1 className="font-black text-dark dark:text-white text-xl truncate">{title}</h1>
                {subtitle && <p className="text-sm text-dark/60 dark:text-white/60 truncate">{subtitle}</p>}
            </div>
            {rightAction && <div className="shrink-0">{rightAction}</div>}
        </header>
    );
}

export default PageHeader;
