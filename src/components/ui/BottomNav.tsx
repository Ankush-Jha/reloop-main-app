'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNavStore } from '@/lib/store/nav-store';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import DemoManager from '@/lib/demo-manager';
import { CreateListingWizard } from './CreateListingWizard';

// Navigation items - symmetric 2-1-2 layout around center FAB
const navItems = [
    { href: '/', icon: 'home', label: 'Home' },
    { href: '/marketplace', icon: 'storefront', label: 'Market' },
    { href: '/sell', icon: 'add', label: 'Sell', isFab: true },
    { href: '/community', icon: 'lightbulb', label: 'DIY' },
    { href: '/messages', icon: 'chat', label: 'Chat' },
];

// Quick actions for swipe-up panel
const quickActions = [
    { icon: 'add_circle', label: 'New Trade', action: 'openListing', color: 'bg-green-500' },
    { icon: 'qr_code_scanner', label: 'Quick Scan', href: '/scanner', color: 'bg-blue-500' },
    { icon: 'favorite', label: 'Donate', href: '/charity', color: 'bg-pink-500' },
    { icon: 'recycling', label: 'Recycle', href: '/recycle', color: 'bg-emerald-500' },
];

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { navContext, primaryAction } = useNavStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
    const [isListingWizardOpen, setIsListingWizardOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    // Track unread messages for badge
    useEffect(() => {
        const updateUnread = () => {
            const messages = DemoManager.getMockMessages();
            const count = messages.filter(m => m.unread).length;
            setUnreadCount(count);
        };
        updateUnread();
        const unsubscribe = DemoManager.subscribe(updateUnread);
        return unsubscribe;
    }, []);

    // Hide nav on auth pages, scanner, and item detail pages (they have custom nav)
    const hiddenRoutes = ['/login', '/register', '/onboarding', '/scanner'];
    const hiddenPatterns = [
        /^\/marketplace\/[^/]+$/, // /marketplace/[id] - item detail
        /^\/marketplace\/[^/]+\/trade$/, // /marketplace/[id]/trade
    ];

    const shouldHideNav = hiddenRoutes.some(route => pathname.startsWith(route)) ||
        hiddenPatterns.some(pattern => pattern.test(pathname));

    if (shouldHideNav) {
        return null;
    }

    // Check if in scanner flow (show minimal nav)
    const isInScanner = pathname.startsWith('/scanner');

    // Handle swipe up gesture
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -50 && info.velocity.y < -100) {
            setIsQuickPanelOpen(true);
        }
    };

    // Context mode check
    const isContextMode = navContext && navContext.mode !== 'standard';

    return (
        <>
            {/* Quick Actions Panel (Swipe Up) */}
            <AnimatePresence>
                {isQuickPanelOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsQuickPanelOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
                        >
                            <div className="bg-white dark:bg-[#1a2e23] rounded-t-[32px] border-t-[3px] border-x-[3px] border-black dark:border-white/20 p-6 pb-8 shadow-2xl">
                                {/* Handle */}
                                <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/30 rounded-full mx-auto mb-6" />

                                {/* Title */}
                                <h3 className="text-lg font-black text-center mb-4 uppercase tracking-wider text-black dark:text-white">
                                    Quick Actions
                                </h3>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-4 gap-3">
                                    {quickActions.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => {
                                                setIsQuickPanelOpen(false);
                                                if (action.action === 'openListing') {
                                                    setIsListingWizardOpen(true);
                                                } else if (action.href) {
                                                    router.push(action.href);
                                                }
                                            }}
                                            aria-label={action.label}
                                            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95 group"
                                        >
                                            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                                <span className="material-symbols-outlined text-white text-2xl">
                                                    {action.icon}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-black/70 dark:text-white/70 text-center leading-tight">
                                                {action.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Close hint */}
                                <p className="text-center text-xs text-gray-400 mt-4">Tap outside to close</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Navigation */}
            <motion.nav
                ref={navRef}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
            >
                {/* Floating Pill Container */}
                <motion.div
                    layout
                    className={`
                        bg-white dark:bg-[#1a2e23] 
                        border-[3px] border-black dark:border-white/20
                        rounded-full px-3 py-2
                        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(76,230,138,0.3)]
                        flex items-center gap-1
                        ${isInScanner ? 'opacity-90' : ''}
                    `}
                >
                    {/* Context Mode Actions */}
                    {isContextMode ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="context"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2 px-2"
                            >
                                {navContext.actions?.map((action, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={action.onClick}
                                        className={`
                                            h-12 px-4 rounded-full flex items-center gap-2 font-bold text-sm
                                            transition-all
                                            ${action.variant === 'primary'
                                                ? 'bg-[#4ce68a] text-black'
                                                : action.variant === 'danger'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-gray-100 dark:bg-white/10 text-black dark:text-white'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {action.icon}
                                        </span>
                                        {action.label && (
                                            <span className="hidden sm:inline">{action.label}</span>
                                        )}
                                    </motion.button>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        /* Standard Navigation */
                        navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/' && pathname.startsWith(item.href));

                            // Center FAB Button (Scan)
                            if (item.isFab) {
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="relative -mt-6 mx-1"
                                        aria-label={item.label}
                                    >
                                        <motion.div
                                            whileTap={{ scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                            className={`
                                                w-14 h-14 rounded-full 
                                                flex items-center justify-center
                                                border-[3px] border-black dark:border-white
                                                shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                                                transition-colors
                                                ${isActive
                                                    ? 'bg-[#4ce68a]'
                                                    : 'bg-black dark:bg-[#4ce68a]'
                                                }
                                            `}
                                        >
                                            <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-black' : 'text-white dark:text-black'}`}>
                                                {item.icon}
                                            </span>
                                        </motion.div>
                                    </Link>
                                );
                            }

                            // Standard Nav Items
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative"
                                    aria-label={item.label}
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={`
                                            w-12 h-12 rounded-full
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${isActive
                                                ? 'bg-black dark:bg-[#4ce68a]'
                                                : 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <span
                                            className={`
                                                material-symbols-outlined text-2xl
                                                transition-colors
                                                ${isActive
                                                    ? 'text-white dark:text-black'
                                                    : 'text-black/50 dark:text-white/50'
                                                }
                                            `}
                                            style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'wght' 400" }}
                                        >
                                            {item.icon}
                                        </span>
                                    </motion.div>

                                    {/* Unread Badge */}
                                    {item.href === '/messages' && unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#1a2e23]">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })
                    )}

                    {/* Primary Action Override (if set) */}
                    {primaryAction && !isContextMode && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.disabled || primaryAction.loading}
                            aria-label={primaryAction.label}
                            className="ml-2 h-10 px-4 bg-[#4ce68a] text-black rounded-full font-bold text-sm flex items-center gap-2 shadow-md"
                        >
                            {primaryAction.loading ? (
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">
                                        {primaryAction.icon || 'check'}
                                    </span>
                                    <span>{primaryAction.label}</span>
                                </>
                            )}
                        </motion.button>
                    )}
                </motion.div>

                {/* Swipe Hint (subtle) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                >
                    <span className="material-symbols-outlined text-sm text-gray-400 dark:text-white/30 animate-bounce">
                        keyboard_arrow_up
                    </span>
                </motion.div>
            </motion.nav>

            {/* Create Listing Wizard Modal */}
            <CreateListingWizard
                isOpen={isListingWizardOpen}
                onClose={() => setIsListingWizardOpen(false)}
            />
        </>
    );
}

export default BottomNav;
