import { create } from 'zustand';

// Individual action button for context nav
export interface NavAction {
    label: string;
    onClick: () => void;
    icon?: string;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    hidden?: boolean;
}

// Context action for dynamic nav items
export interface ContextAction {
    icon: string;
    label?: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'accent' | 'danger';
    badge?: number | string;
}

// Navigation context modes
export type NavMode =
    | 'standard'      // Default navigation
    | 'item-detail'   // Viewing a marketplace item
    | 'scanner'       // Camera/scanner active
    | 'create'        // Creating/editing listing
    | 'chat'          // In a conversation
    | 'tutorial'      // Viewing a tutorial
    | 'profile';      // Profile page

// Full navigation context configuration
export interface NavContext {
    mode: NavMode;
    // Array of 5 actions: [left1, left2, center, right1, right2]
    actions?: ContextAction[];
    // Override center action specifically
    centerAction?: ContextAction;
    // Title to show in center (optional)
    title?: string;
    // Back navigation handler
    onBack?: () => void;
    // Metadata for context (e.g., item ID, price)
    metadata?: Record<string, any>;
}

interface NavState {
    // Legacy action mode
    view: 'nav' | 'action';
    primaryAction: NavAction | null;
    secondaryAction: NavAction | null;

    // New context system
    navContext: NavContext | null;

    // Legacy actions
    setActions: (primary: NavAction, secondary?: NavAction) => void;
    reset: () => void;

    // New context actions
    setNavContext: (context: NavContext) => void;
    clearNavContext: () => void;
}

export const useNavStore = create<NavState>((set) => ({
    // Legacy state
    view: 'nav',
    primaryAction: null,
    secondaryAction: null,

    // New context state
    navContext: null,

    // Legacy methods
    setActions: (primary, secondary) => set({
        view: 'action',
        primaryAction: primary,
        secondaryAction: secondary || null
    }),

    reset: () => set({
        view: 'nav',
        primaryAction: null,
        secondaryAction: null,
        navContext: null
    }),

    // New context methods
    setNavContext: (context) => set({
        navContext: context,
        // When context is set, switch to action view
        view: context.mode !== 'standard' ? 'action' : 'nav'
    }),

    clearNavContext: () => set({
        navContext: null,
        view: 'nav'
    }),
}));
