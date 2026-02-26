import { db } from './firebase/client';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';

// Material categories relevant to campus recycling
export interface ScrapPrice {
    material: string;
    category: string;
    unit: string;
    price: number;        // INR per kg
    previousPrice?: number;
    change?: number;      // percentage change
    region: string;
    lastUpdated: Date;
}

export interface ScrapPriceCache {
    prices: ScrapPrice[];
    fetchedAt: Date;
    source: string;
}

// Default prices for campus recyclables (Pune area, Feb 2026)
// Only items students would commonly recycle on campus
const DEFAULT_PRICES: ScrapPrice[] = [
    // Paper - common on campus
    { material: 'Newspaper', category: 'paper', unit: 'kg', price: 18, region: 'Pune', lastUpdated: new Date() },
    { material: 'Cardboard/Boxes', category: 'paper', unit: 'kg', price: 12, region: 'Pune', lastUpdated: new Date() },
    { material: 'Notebooks/Books', category: 'paper', unit: 'kg', price: 15, region: 'Pune', lastUpdated: new Date() },

    // Plastic - bottles & containers
    { material: 'PET Bottles', category: 'plastic', unit: 'kg', price: 25, region: 'Pune', lastUpdated: new Date() },
    { material: 'Plastic Containers', category: 'plastic', unit: 'kg', price: 18, region: 'Pune', lastUpdated: new Date() },

    // Metal - cans mostly
    { material: 'Aluminum Cans', category: 'metal', unit: 'kg', price: 120, region: 'Pune', lastUpdated: new Date() },
    { material: 'Steel/Tin Cans', category: 'metal', unit: 'kg', price: 30, region: 'Pune', lastUpdated: new Date() },

    // Glass
    { material: 'Glass Bottles', category: 'glass', unit: 'kg', price: 3, region: 'Pune', lastUpdated: new Date() },

    // E-waste
    { material: 'Mobile Phones', category: 'ewaste', unit: 'piece', price: 150, region: 'Pune', lastUpdated: new Date() },
    { material: 'Cables/Chargers', category: 'ewaste', unit: 'kg', price: 80, region: 'Pune', lastUpdated: new Date() },

    // Organic
    { material: 'Food Waste', category: 'organic', unit: 'kg', price: 2, region: 'Pune', lastUpdated: new Date() },
];

// Calculate coins per kg based on market price (simplified formula)
// Higher value materials = more coins per kg
export function calculateCoinsPerKg(pricePerKg: number): number {
    if (pricePerKg >= 500) return 50;      // High value (copper, brass)
    if (pricePerKg >= 100) return 25;      // Medium-high (aluminum)
    if (pricePerKg >= 30) return 15;       // Medium (steel, some plastics)
    if (pricePerKg >= 15) return 10;       // Lower (paper, basic plastic)
    return 5;                               // Minimum (glass, organic)
}

export const ScrapPriceService = {
    // Get cached prices from Firebase (refresh if older than 24 hours)
    async getPrices(): Promise<ScrapPrice[]> {
        try {
            const cacheRef = doc(db, 'config', 'scrapPrices');
            const cacheSnap = await getDoc(cacheRef);

            if (cacheSnap.exists()) {
                const data = cacheSnap.data();
                const fetchedAt = data.fetchedAt && typeof data.fetchedAt.toDate === 'function'
                    ? data.fetchedAt.toDate()
                    : new Date(data.fetchedAt);
                const hoursSinceFetch = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);

                // Use cache if less than 24 hours old
                if (hoursSinceFetch < 24) {
                    return data.prices.map(p => ({
                        ...p,
                        lastUpdated: new Date(p.lastUpdated)
                    }));
                }
            }

            // Return defaults, admin can update manually
            return DEFAULT_PRICES;
        } catch (error) {
            console.error('Error fetching prices:', error);
            return DEFAULT_PRICES;
        }
    },

    // Admin function to manually update prices
    async updatePrices(prices: ScrapPrice[]): Promise<boolean> {
        try {
            const cacheRef = doc(db, 'config', 'scrapPrices');
            await setDoc(cacheRef, {
                prices: prices.map(p => ({
                    ...p,
                    lastUpdated: p.lastUpdated.toISOString()
                })),
                fetchedAt: serverTimestamp(),
                source: 'manual'
            });
            return true;
        } catch (error) {
            console.error('Error updating prices:', error);
            return false;
        }
    },

    // Get price for specific material
    async getMaterialPrice(materialName: string): Promise<ScrapPrice | null> {
        const prices = await this.getPrices();
        return prices.find(p =>
            p.material.toLowerCase().includes(materialName.toLowerCase())
        ) || null;
    },

    // Get prices by category
    async getPricesByCategory(category: string): Promise<ScrapPrice[]> {
        const prices = await this.getPrices();
        return prices.filter(p => p.category === category);
    },

    // Calculate estimated value for a bag
    async calculateBagValue(weights: { category: string; weightKg: number }[]): Promise<{
        totalValue: number;
        breakdown: { category: string; weight: number; price: number; value: number }[];
        coins: number;
    }> {
        const prices = await this.getPrices();
        let totalValue = 0;
        let totalCoins = 0;
        const breakdown: { category: string; weight: number; price: number; value: number }[] = [];

        for (const item of weights) {
            // Get average price for category
            const categoryPrices = prices.filter(p => p.category === item.category);
            const avgPrice = categoryPrices.length > 0
                ? categoryPrices.reduce((sum, p) => sum + p.price, 0) / categoryPrices.length
                : 10; // fallback

            const value = item.weightKg * avgPrice;
            const coins = item.weightKg * calculateCoinsPerKg(avgPrice);

            breakdown.push({
                category: item.category,
                weight: item.weightKg,
                price: avgPrice,
                value
            });

            totalValue += value;
            totalCoins += coins;
        }

        return { totalValue, breakdown, coins: Math.round(totalCoins) };
    },

    // Get default prices (for initial setup)
    getDefaultPrices(): ScrapPrice[] {
        return DEFAULT_PRICES;
    }
};
