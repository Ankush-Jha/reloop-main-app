'use client';

import { ScanResult, UpcycleIdea } from '@/types';
import DemoManager from './demo-manager';

const CLOUDFLARE_WORKER_URL = '/api/scan';

// Item database with curated YouTube-style DIY ideas
const itemDatabase: Record<string, { material: string; coinRange: [number, number]; upcycleIdeas: UpcycleIdea[] }> = {
    electronics: {
        material: 'Plastic & Electronics',
        coinRange: [40, 150],
        upcycleIdeas: [
            { title: 'Speaker Bluetooth Mod', description: 'Convert old headphones into a portable Bluetooth speaker', difficulty: 'Hard', thumbnail: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200&h=200&fit=crop', source: 'youtube' },
            { title: 'Cable Organizer DIY', description: 'Repurpose parts into a stylish cable management system', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop', source: 'pinterest' },
            { title: 'Tech Art Frame', description: 'Create modern wall art by mounting in a shadow box', difficulty: 'Medium', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop', source: 'youtube' }
        ]
    },
    books: {
        material: 'Paper & Cardboard',
        coinRange: [15, 60],
        upcycleIdeas: [
            { title: 'Secret Book Safe', description: 'Create a hidden compartment inside old books', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop', source: 'youtube' },
            { title: 'Book Page Art', description: 'Fold pages into stunning 3D sculptures', difficulty: 'Medium', thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop', source: 'pinterest' },
            { title: 'Vintage Book Lamp', description: 'Transform old books into a unique table lamp', difficulty: 'Hard', thumbnail: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=200&fit=crop', source: 'youtube' }
        ]
    },
    furniture: {
        material: 'Wood & Metal',
        coinRange: [50, 200],
        upcycleIdeas: [
            { title: 'Chalk Paint Makeover', description: 'Give furniture a farmhouse chic look with chalk paint', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop', source: 'youtube' },
            { title: 'Drawer Pet Bed', description: 'Convert old drawers into cozy pet beds', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop', source: 'pinterest' },
            { title: 'Pallet Coffee Table', description: 'Build a rustic coffee table from reclaimed wood', difficulty: 'Hard', thumbnail: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=200&h=200&fit=crop', source: 'youtube' }
        ]
    },
    clothing: {
        material: 'Fabric & Textile',
        coinRange: [20, 100],
        upcycleIdeas: [
            { title: 'No-Sew Tote Bag', description: 'Transform old t-shirts into reusable shopping bags', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&h=200&fit=crop', source: 'youtube' },
            { title: 'Denim Patchwork', description: 'Create trendy patchwork designs from old jeans', difficulty: 'Medium', thumbnail: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=200&h=200&fit=crop', source: 'pinterest' },
            { title: 'Fabric Hair Scrunchies', description: '5-minute scrunchies from fabric scraps', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', source: 'youtube' }
        ]
    },
    other: {
        material: 'Various Materials',
        coinRange: [10, 60],
        upcycleIdeas: [
            { title: 'Decorative Storage Box', description: 'Transform into beautiful organization solutions', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop', source: 'pinterest' },
            { title: 'Garden Art Piece', description: 'Create whimsical outdoor decorations', difficulty: 'Medium', thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop', source: 'youtube' },
            { title: 'Donation Ready', description: 'Clean and prepare items for local charities', difficulty: 'Easy', thumbnail: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200&h=200&fit=crop', source: 'pinterest' }
        ]
    }
};

const SCAN_RESULT_KEY = 'reloop_scan_result';
const SCAN_IMAGE_KEY = 'reloop_scan_image';

export const ScannerService = {
    // Main analysis function
    async analyzeImage(imageData: string): Promise<ScanResult> {
        // Demo mode bypass
        // Demo mode bypass - DISABLED for Phase 2 API Testing
        // if (DemoManager.isEnabled) {
        //     console.log('🤖 [Demo Mode] Simulating AI analysis...');
        //     await DemoManager.simulateDelay(2000);
        //     const result = DemoManager.getMockScanResult();
        //     this.storeResult(result, imageData);
        //     DemoManager.saveScan(result);
        //     return result;
        // }

        // Real AI analysis
        try {
            console.log('Analyzing image with API...');
            const resized = await this.resizeImage(imageData, 800);
            const result = await this.analyzeWithCloudflare(resized);
            this.storeResult(result, imageData);
            DemoManager.saveScan(result); // Persist to history
            return result;
        } catch (error) {
            console.error('AI Analysis failed:', error);
            // Fallback to local analysis
            const result = this.localFallbackAnalysis();
            this.storeResult(result, imageData);
            return result;
        }
    },

    // Cloudflare Workers AI
    async analyzeWithCloudflare(imageData: string): Promise<ScanResult> {
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        const data = await response.json();

        if (data.success && data.item) {
            const categoryKey = (data.item.category || 'other').toLowerCase();
            const categoryData = itemDatabase[categoryKey] || itemDatabase.other;

            return {
                success: true,
                classification: 'safe' as const,
                xpEarned: 15,
                item: {
                    objectName: data.item.objectName || 'Scanned Item',
                    category: this.capitalize(categoryKey),
                    material: data.item.material || categoryData.material,
                    condition: data.item.condition || 'Good',
                    confidence: 0.85 + Math.random() * 0.1,
                    estimatedCoins: data.item.estimatedCoins || this.estimateCoins(categoryData.coinRange),
                    co2Savings: Number(((data.item.estimatedCoins || 50) * 0.05).toFixed(1)),
                    upcycleIdeas: categoryData.upcycleIdeas,
                    recyclable: data.item.recyclable !== false,
                    recycleInfo: 'Recyclable in most areas'
                }
            };
        }

        throw new Error(data.error || 'Invalid response from AI');
    },

    // Local fallback
    localFallbackAnalysis(): ScanResult {
        const categories = Object.keys(itemDatabase);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryData = itemDatabase[randomCategory];

        return {
            success: true,
            classification: 'safe' as const,
            xpEarned: 15,
            item: {
                objectName: 'Unknown Item',
                category: this.capitalize(randomCategory),
                material: categoryData.material,
                condition: 'Unknown',
                confidence: 0.7,
                estimatedCoins: this.estimateCoins(categoryData.coinRange),
                co2Savings: 5.0,
                upcycleIdeas: categoryData.upcycleIdeas,
                recyclable: true,
                recycleInfo: 'Check local recycling guidelines'
            }
        };
    },

    // Resize image
    async resizeImage(imageData: string, maxSize: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = imageData;
        });
    },

    // Store result
    storeResult(result: ScanResult, imageData?: string): void {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(result));
        if (imageData) {
            sessionStorage.setItem(SCAN_IMAGE_KEY, imageData);
        }
    },

    // Get stored result
    getStoredResult(): ScanResult | null {
        if (typeof window === 'undefined') return null;
        const stored = sessionStorage.getItem(SCAN_RESULT_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // Get stored image
    getStoredImage(): string | null {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(SCAN_IMAGE_KEY);
    },

    // Helper functions
    capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    estimateCoins(range: [number, number]): number {
        return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    }
};

export default ScannerService;
