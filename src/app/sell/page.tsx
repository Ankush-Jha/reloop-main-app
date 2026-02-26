'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CreateListingWizard } from '@/components/ui/CreateListingWizard';

export default function SellPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login?redirect=/sell');
        }
    }, [isLoading, user, router]);

    const handleClose = () => {
        setIsOpen(false);
        router.back();
    };

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <CreateListingWizard
                isOpen={isOpen}
                onClose={handleClose}
            />
        </div>
    );
}
