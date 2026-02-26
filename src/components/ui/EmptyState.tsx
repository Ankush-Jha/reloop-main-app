import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
    return (
        <div className={cn('text-center py-16', className)}>
            <div className="w-20 h-20 bg-white dark:bg-dark-surface rounded-2xl border-2 border-gray-200 dark:border-gray-700 mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-300">{icon}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">{title}</p>
            {description && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{description}</p>}
        </div>
    );
}

export default EmptyState;
