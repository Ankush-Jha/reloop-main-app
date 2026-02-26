import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Scrape Indian scrap prices from RecycleInMe
// Note: This is for educational/personal use. Check TOS before production use.

interface ScrapedPrice {
    material: string;
    category: string;
    unit: string;
    price: number;
    previousPrice?: number;
    change?: number;
    region: string;
    source: string;
    scrapedAt: string;
}

// Map RecycleInMe categories to our app categories
const CATEGORY_MAP: Record<string, string> = {
    'copper': 'metal',
    'brass': 'metal',
    'aluminum': 'metal',
    'steel': 'metal',
    'iron': 'metal',
    'hms': 'metal',
    'zinc': 'metal',
    'paper': 'paper',
    'notebook': 'paper',
    'newspaper': 'paper',
    'occ': 'paper',
    'cardboard': 'paper',
    'plastic': 'plastic',
    'pet': 'plastic',
    'hdpe': 'plastic',
    'battery': 'ewaste',
    'glass': 'glass',
};

function classifyMaterial(materialName: string): string {
    const lower = materialName.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
        if (lower.includes(keyword)) return category;
    }
    return 'other';
}

export async function GET(request: NextRequest) {
    try {
        // Fetch Indian Scrap Prices page
        const response = await fetch('https://www.recycleinme.com/scrappricelisting/Indian%20Scrap%20Prices', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ReLoopBot/1.0; Educational)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const prices: ScrapedPrice[] = [];

        // The RecycleInMe page uses Vue.js, so static HTML may not have all data
        // We'll parse what's available from the initial HTML

        // Look for price table rows
        $('table tr, .price-row, .price-item').each((i, el) => {
            const $row = $(el);
            const cells = $row.find('td');

            if (cells.length >= 2) {
                const material = $(cells[0]).text().trim();
                const priceText = $(cells[1]).text().trim();
                const priceMatch = priceText.match(/[\d,]+(?:\.\d+)?/);

                if (material && priceMatch) {
                    const price = parseFloat(priceMatch[0].replace(',', ''));
                    if (!isNaN(price)) {
                        prices.push({
                            material,
                            category: classifyMaterial(material),
                            unit: 'kg',
                            price,
                            region: 'India',
                            source: 'RecycleInMe',
                            scrapedAt: new Date().toISOString()
                        });
                    }
                }
            }
        });

        // Also look for list items with prices
        $('li, .list-item').each((i, el) => {
            const text = $(el).text();
            const priceMatch = text.match(/₹?\s*([\d,]+(?:\.\d+)?)\s*(?:\/\s*kg|per\s*kg)?/i);

            if (priceMatch) {
                const material = text.split(/[₹\d]/)[0].trim();
                const price = parseFloat(priceMatch[1].replace(',', ''));

                if (material && material.length > 2 && material.length < 50 && !isNaN(price)) {
                    prices.push({
                        material,
                        category: classifyMaterial(material),
                        unit: 'kg',
                        price,
                        region: 'India',
                        source: 'RecycleInMe',
                        scrapedAt: new Date().toISOString()
                    });
                }
            }
        });

        // If Vue.js rendered content isn't available, return default prices with source note
        if (prices.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'RecycleInMe uses dynamic Vue.js content. Using cached/default prices.',
                note: 'For real-time prices, visit https://www.recycleinme.com/scrappricelisting/Indian%20Scrap%20Prices',
                prices: getDefaultPrices(),
                source: 'default',
                fetchedAt: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            count: prices.length,
            prices,
            source: 'RecycleInMe',
            fetchedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Scraping error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            prices: getDefaultPrices(),
            source: 'default',
            fetchedAt: new Date().toISOString()
        }, { status: 200 }); // Still return 200 with defaults
    }
}

function getDefaultPrices(): ScrapedPrice[] {
    const now = new Date().toISOString();
    // Only include materials relevant to campus recycling
    return [
        // Paper - common on campus
        { material: 'Newspaper', category: 'paper', unit: 'kg', price: 18, region: 'Pune', source: 'default', scrapedAt: now },
        { material: 'Cardboard/Boxes', category: 'paper', unit: 'kg', price: 12, region: 'Pune', source: 'default', scrapedAt: now },
        { material: 'Notebooks/Books', category: 'paper', unit: 'kg', price: 15, region: 'Pune', source: 'default', scrapedAt: now },

        // Plastic - bottles & containers
        { material: 'PET Bottles', category: 'plastic', unit: 'kg', price: 25, region: 'Pune', source: 'default', scrapedAt: now },
        { material: 'Plastic Containers', category: 'plastic', unit: 'kg', price: 18, region: 'Pune', source: 'default', scrapedAt: now },

        // Metal - cans mostly
        { material: 'Aluminum Cans', category: 'metal', unit: 'kg', price: 120, region: 'Pune', source: 'default', scrapedAt: now },
        { material: 'Steel/Tin Cans', category: 'metal', unit: 'kg', price: 30, region: 'Pune', source: 'default', scrapedAt: now },

        // Glass
        { material: 'Glass Bottles', category: 'glass', unit: 'kg', price: 3, region: 'Pune', source: 'default', scrapedAt: now },

        // E-waste
        { material: 'Mobile Phones', category: 'ewaste', unit: 'piece', price: 150, region: 'Pune', source: 'default', scrapedAt: now },
        { material: 'Cables & Chargers', category: 'ewaste', unit: 'kg', price: 80, region: 'Pune', source: 'default', scrapedAt: now },

        // Organic
        { material: 'Food Waste', category: 'organic', unit: 'kg', price: 2, region: 'Pune', source: 'default', scrapedAt: now },
    ];
}
