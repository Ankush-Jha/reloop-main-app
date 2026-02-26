'use client';

import { useEffect } from 'react';
import { useNavStore, NavContext } from '@/lib/store/nav-store';

/**
 * Hook for pages to declare their navigation context.
 * Automatically cleans up when the component unmounts.
 * 
 * @example
 * // In a page component:
 * useNavContext({
 *   mode: 'item-detail',
 *   centerAction: {
 *     icon: 'chat_bubble',
 *     label: 'Message',
 *     onClick: () => router.push(`/messages/new?item=${itemId}`),
 *     variant: 'primary'
 *   },
 *   onBack: () => router.back(),
 * });
 */
export function useNavContext(context: NavContext | null) {
    const { setNavContext, clearNavContext } = useNavStore();

    useEffect(() => {
        if (context) {
            setNavContext(context);
        } else {
            clearNavContext();
        }

        // Cleanup on unmount - restore standard navigation
        return () => {
            clearNavContext();
        };
    }, [
        context?.mode,
        context?.centerAction?.icon,
        context?.centerAction?.label,
        context?.title,
        setNavContext,
        clearNavContext
    ]);
}

/**
 * Preset context configurations for common pages
 */
export const NavPresets = {
    itemDetail: (options: {
        onMessage: () => void;
        onBack: () => void;
        onShare?: () => void;
        onSave?: () => void;
        isOwner?: boolean;
        onEdit?: () => void;
    }): NavContext => ({
        mode: 'item-detail',
        onBack: options.onBack,
        centerAction: options.isOwner
            ? {
                icon: 'edit',
                label: 'Edit',
                onClick: options.onEdit || (() => { }),
                variant: 'primary'
            }
            : {
                icon: 'chat_bubble',
                label: 'Message',
                onClick: options.onMessage,
                variant: 'primary'
            },
        actions: [
            { icon: 'arrow_back', onClick: options.onBack },
            { icon: 'bookmark_border', onClick: options.onSave || (() => { }) },
            // Center action is handled separately
            { icon: 'share', onClick: options.onShare || (() => { }) },
            { icon: 'more_horiz', onClick: () => { } },
        ]
    }),

    scanner: (options: {
        onCapture: () => void;
        onFlash?: () => void;
        onFlip?: () => void;
        onGallery?: () => void;
        flashOn?: boolean;
    }): NavContext => ({
        mode: 'scanner',
        centerAction: {
            icon: 'photo_camera',
            label: 'Capture',
            onClick: options.onCapture,
            variant: 'accent'
        },
        actions: [
            { icon: 'photo_library', onClick: options.onGallery || (() => { }) },
            { icon: options.flashOn ? 'flash_on' : 'flash_off', onClick: options.onFlash || (() => { }) },
            // Center
            { icon: 'flip_camera_ios', onClick: options.onFlip || (() => { }) },
            { icon: 'history', onClick: () => { } },
        ]
    }),

    chat: (options: {
        onOffer: () => void;
        onBack: () => void;
        onCall?: () => void;
        onAttach?: () => void;
    }): NavContext => ({
        mode: 'chat',
        onBack: options.onBack,
        centerAction: {
            icon: 'local_offer',
            label: 'Offer',
            onClick: options.onOffer,
            variant: 'accent'
        },
        actions: [
            { icon: 'arrow_back', onClick: options.onBack },
            { icon: 'call', onClick: options.onCall || (() => { }) },
            // Center
            { icon: 'attach_file', onClick: options.onAttach || (() => { }) },
            { icon: 'more_horiz', onClick: () => { } },
        ]
    }),

    createListing: (options: {
        onPublish: () => void;
        onCancel: () => void;
        onSaveDraft?: () => void;
        onPreview?: () => void;
        isLoading?: boolean;
    }): NavContext => ({
        mode: 'create',
        onBack: options.onCancel,
        centerAction: {
            icon: 'check',
            label: 'Publish',
            onClick: options.onPublish,
            variant: 'primary'
        },
        actions: [
            { icon: 'close', onClick: options.onCancel },
            { icon: 'save', onClick: options.onSaveDraft || (() => { }) },
            // Center
            { icon: 'visibility', onClick: options.onPreview || (() => { }) },
            { icon: 'more_horiz', onClick: () => { } },
        ]
    }),
};

export default useNavContext;
