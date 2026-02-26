// ReLoop TypeScript Types

export interface User {
    uid: string; // Firebase UID
    name: string;
    email: string;
    avatar: string;
    coins: number;
    xp: number;
    level: number;
    levelTitle: string;
    itemsTraded: number;
    co2Saved: number;
    badges: string[];
    campus?: string;
    hostel?: string; // Student hostel/accommodation
    room?: string; // Room number
    isArtist?: boolean; // For art student makeover feature
    streak?: number;
    totalScans?: number; // Total items scanned
    fcmTokens?: string[]; // Push notification tokens
    tradesCompleted?: number; // Number of completed trades
    donationsMade?: number; // Number of donations made
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

// Item Classification from AI scan
export type ItemClassification = 'safe' | 'hazardous' | 'non_reusable';

// User Level System
export interface UserLevel {
    level: 1 | 2 | 3 | 4 | 5;
    name: 'Seedling' | 'Sprout' | 'Sapling' | 'Tree' | 'Forest';
    xpRequired: number;
    xpCurrent: number;
    perks: string[];
}

// Art Student Makeover Request
export interface MakeoverRequest {
    id: string;
    itemId: string;
    itemTitle: string;
    itemImage: string;
    ownerId: string;
    ownerName: string;
    artistId?: string;
    artistName?: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'sold';
    estimatedCoins: number;
    createdAt: Date;
    completedAt?: Date;
}

// Charity Partner
export interface CharityPartner {
    id: string;
    name: string;
    logo: string;
    category: string;
    description: string;
    itemsReceived: number;
    location: string;
}

// Recycling Zone
export interface RecycleZone {
    id: string;
    name: string;
    location: string;
    hours: string;
    acceptedMaterials: string[];
    distance?: string;
}

export interface UpcycleIdea {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    thumbnail?: string;
    source?: 'youtube' | 'pinterest';
}

export interface ScanResult {
    success: boolean;
    classification: ItemClassification;
    xpEarned: number;
    item: {
        objectName: string;
        category: string;
        material?: string;
        condition?: string;
        confidence: number;
        estimatedCoins: number;
        co2Savings: number;
        upcycleIdeas: UpcycleIdea[];
        recyclable?: boolean;
        recycleInfo?: string;
        isHazardous?: boolean;
    };
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    category: string;
    images: string[];
    location?: string;
    isTopImpact?: boolean;
    co2Saved?: number;
    seller: {
        id: string;
        name: string;
        avatar?: string;
        co2Saved?: number;
        itemsTraded?: number;
        responseTime?: string;
    };
    status: 'available' | 'sold' | 'pending';
    createdAt: Date;
    // 14-Day Liquidity Protocol
    droppedAt?: Date;
    expiresAt?: Date;
    reloopPointId?: string;
    equityStatus?: 'active' | 'expired' | 'recycled' | 'donated';
    equityChoice?: 'recycle' | 'donate';
}


export interface Mission {
    id: string;
    title: string;
    icon: string;
    target: number;
    progress: number;
    xpReward: number;
    coinsReward: number;
    completed: boolean;
    claimed: boolean;
}

export interface LeaderboardEntry {
    uid: string;
    name: string;
    xp: number;
    level: number;
    avatar?: string;
    co2Saved?: number;
    // Campus specific
    rank?: number;
    type?: 'student' | 'campus';
    logo?: string;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    lastMessage: string;
    timestamp: Date;
    unread: boolean;
    listingId?: string;
    listingTitle?: string;
    listingImage?: string;
    listingPrice?: number;
    conversationType: 'marketplace' | 'community';
    projectId?: string;
    projectTitle?: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    text: string;
    timestamp: Date;
    isOwn: boolean;
    read?: boolean;
    // For message types
    type?: 'text' | 'offer' | 'system' | 'qr';
    // For offer messages
    offerAmount?: number;
    offerStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
    counterAmount?: number;
    // For QR code messages
    qrType?: 'dropoff' | 'pickup';
    qrData?: {
        type: string;
        tradeId?: string;
        listingId: string;
        listingTitle: string;
        sellerId: string;
        buyerId?: string;
        amount?: number;
        createdAt: string;
    };
}

export interface Notification {
    id: string;
    type: 'trade' | 'achievement' | 'system' | 'coin' | 'level';
    title: string;
    message: string;
    icon: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
}

export interface Trade {
    id: string;
    listingId: string;
    listingTitle: string;
    listingImage: string;
    sellerId: string;
    sellerName: string;
    sellerAvatar: string;
    traderId: string;
    traderName: string;
    traderAvatar: string;
    offeredItem?: string;
    offeredCoins?: number;
    status: 'pending' | 'accepted' | 'completed' | 'declined';
    createdAt: Date;
    completedAt?: Date;
    co2Saved?: number;
}

export interface Story {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    authorAvatar: string;
    campus: string;
    image: string;
    co2Saved: number;
    itemsTraded: number;
    category: string;
    createdAt: Date;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    progress: number;
    target: number;
    unlocked: boolean;
    unlockedAt?: Date;
    xpReward: number;
    category: 'scanning' | 'trading' | 'social' | 'streak' | 'impact';
}

export interface Reward {
    id: string;
    title: string;
    description: string;
    icon: string;
    cost: number;
    category: 'voucher' | 'merch' | 'donation' | 'experience';
    available: boolean;
    partnerLogo?: string;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    icon: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    color: string;
    steps: TutorialStep[];
    estimatedTime: string;
    author?: string;
    authorAvatar?: string;
    thumbnail?: string;
    duration?: string;
    difficulty?: string;
    category?: string;
    xpReward?: number;
}

export interface TutorialStep {
    title: string;
    content: string;
    image?: string;
    tip?: string;
}

export interface WrappedStats {
    totalScans: number;
    totalTrades: number;
    totalCo2Saved: number;
    totalCoinsEarned: number;
    topCategory: string;
    rank: number;
    totalUsers: number;
    streakRecord: number;
    badgesEarned: number;
    impactEquivalent: string;
}

// Smart Bags System
export interface SmartBag {
    id: string;
    qrCode: string;
    ownerId?: string;
    ownerName?: string;
    status: 'unregistered' | 'registered' | 'filled' | 'collected' | 'processed';
    registeredAt?: Date;
    filledAt?: Date;
    collectedAt?: Date;
    estimatedWeight?: number;
    coinsAwarded?: number;
    wasteType?: 'recyclable' | 'organic' | 'mixed';
}

// Reloop Points (Collection Hubs)
export interface ReloopPoint {
    id: string;
    name: string;
    location: string;
    type: 'collection' | 'dropoff' | 'both';
    hours: string;
    itemsCollected: number;
    bagsProcessed: number;
    icon?: string;
}
