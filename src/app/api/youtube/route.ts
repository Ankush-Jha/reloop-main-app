import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        // Fetch YouTube search results page
        const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        const html = await response.text();

        // Extract Initial Data which contains video information
        // YouTube embeds JSON data inside a script tag var ytInitialData = ...
        const match = html.match(/var ytInitialData = ({.*?});/);

        if (!match || !match[1]) {
            throw new Error('Failed to parse YouTube data');
        }

        const data = JSON.parse(match[1]);

        const videos: any[] = [];

        // Navigate through the deeply nested JSON structure to find video items
        // contents -> twoColumnSearchResultsRenderer -> primaryContents -> sectionListRenderer -> contents -> itemSectionRenderer -> contents
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

        if (contents) {
            // Find the section that contains video results
            const videoList = contents.find((section: any) => section.itemSectionRenderer)?.itemSectionRenderer?.contents;

            if (videoList) {
                videoList.forEach((item: any) => {
                    const video = item.videoRenderer;
                    if (video && video.videoId) {
                        videos.push({
                            id: video.videoId,
                            title: video.title?.runs?.[0]?.text || 'Untitled',
                            channel: video.ownerText?.runs?.[0]?.text || 'Unknown Channel',
                            views: video.viewCountText?.simpleText || 'No views',
                            thumbnail: video.thumbnail?.thumbnails?.[0]?.url || '',
                        });
                    }
                });
            }
        }

        // Return top 10 videos
        return NextResponse.json({ videos: videos.slice(0, 10) });

    } catch (error) {
        console.error('YouTube Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}
