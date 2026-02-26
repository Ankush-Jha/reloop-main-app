'use client';

/**
 * Eco Coins Conversion Utility
 * Conversion Rate: 5 Eco Coins = ₹1
 */

export const COINS_PER_RUPEE = 5;

/**
 * Convert Eco Coins to Rupees
 * @param coins - Number of eco coins
 * @returns Rupee value as a number
 */
export function coinsToRupees(coins: number): number {
    return coins / COINS_PER_RUPEE;
}

/**
 * Convert Rupees to Eco Coins
 * @param rupees - Amount in rupees
 * @returns Number of eco coins
 */
export function rupeesToCoins(rupees: number): number {
    return rupees * COINS_PER_RUPEE;
}

/**
 * Format coin value with rupee equivalent
 * @param coins - Number of eco coins
 * @returns Formatted string like "100 (₹20)"
 */
export function formatCoinValue(coins: number): string {
    const rupees = coinsToRupees(coins);
    // Show whole numbers if no decimal, otherwise 2 decimal places
    const rupeeStr = Number.isInteger(rupees) ? rupees.toString() : rupees.toFixed(2);
    return `${coins} (₹${rupeeStr})`;
}

/**
 * Format just the rupee equivalent
 * @param coins - Number of eco coins
 * @returns Formatted string like "₹20"
 */
export function formatRupeeValue(coins: number): string {
    const rupees = coinsToRupees(coins);
    const rupeeStr = Number.isInteger(rupees) ? rupees.toString() : rupees.toFixed(2);
    return `₹${rupeeStr}`;
}
