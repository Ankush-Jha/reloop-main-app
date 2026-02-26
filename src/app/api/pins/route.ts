import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        // Fetch real Pinterest images by scraping Google Images restricted to pinterest.com
        // We use a specific Google Images URL that returns results for "site:pinterest.com {query}"
        const searchQuery = encodeURIComponent(`site:pinterest.com ${query} upcycle diy`);
        const googleUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch`; // tbm=isch for Images

        try {
            const response = await fetch(googleUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const html = await response.text();

            // Google Images (Legacy/Basic) return valid img src urls inside the HTML
            // We look for typical image display patterns
            // Note: Modern Google Images heavily relies on JS, so simple fetch might get the "Basic Version"
            // which is actually GOOD for scraping as it has direct simple img tags.

            // Regex to find image sources in the basic HTML response
            // Look for: src="https://encrypted-tbn0.gstatic.com/images?q=..."
            const imageRegex = /src="(https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=[^"]+)"/g;
            const matches = Array.from(html.matchAll(imageRegex));

            // Also try to extract the original context URL if possible to get the deep link
            // But usually Google Basic embeds it in a complex way. 
            // We can just construct a safe "search on pinterest" link for all of them or guess.

            if (matches.length >= 3) {
                const pins = matches.slice(0, 8).map((match, i) => {
                    // For links, we don't have the exact deep link easily from basic HTML
                    // So we point to a Pinterest search specific to this item
                    // Or just generic search.

                    // We can try to make titles unique
                    const titleVariations = [
                        `${query} Inspiration`,
                        `DIY ${query} Project`,
                        `Upcycled ${query}`,
                        `Repurposing ${query}`,
                        `${query} Crafts`,
                        `Easy ${query} Hack`
                    ];

                    return {
                        id: `pin_scraped_${i}`,
                        title: titleVariations[i % titleVariations.length],
                        image: match[1], // This is the thumbnail URL
                        saves: `${Math.floor(Math.random() * 50 + 10)}k`, // Simulated social proof
                        link: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
                    };
                });

                return NextResponse.json({ pins });
            }

        } catch (scrapeError) {
            console.error('Scraping error:', scrapeError);
        }

        // Final Fallback: Only if scraping fails completely (e.g. IP block)
        // We use valid Pinterest CDN images for generic DIY categories
        const fallbackPins = [
            {
                id: 'pin_fallback_1',
                title: `${query} DIY Ideas`,
                image: 'https://i.pinimg.com/736x/0a/63/fc/0a63fc65551927c3fe3f699042223877.jpg',
                saves: '12k',
                link: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
            },
            {
                id: 'pin_fallback_2',
                title: `Easy ${query} Crafts`,
                image: 'https://i.pinimg.com/736x/d4/d2/d0/d4d2d0577d338ce245a443720745582c.jpg',
                saves: '8.4k',
                link: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
            },
            {
                id: 'pin_fallback_3',
                title: `${query} Recycling`,
                image: 'https://i.pinimg.com/236x/88/2c/3f/882c3f46215320505b82218041498b0d.jpg',
                saves: '5.6k',
                link: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
            },
            {
                id: 'pin_fallback_4',
                title: `Upcycled ${query}`,
                image: 'https://i.pinimg.com/236x/2b/95/9b/2b959b89791845184646700877907577.jpg',
                saves: '15k',
                link: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
            }
        ];

        return NextResponse.json({ pins: fallbackPins });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch pins' }, { status: 500 });
    }
}
