import { NextResponse } from 'next/server';

// In-memory cache
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 300_000; // 5 min

const RSS_FEEDS = [
    { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'The Hacker News', category: 'cyber' },
    { url: 'https://www.bleepingcomputer.com/feed/', source: 'Bleeping Computer', category: 'cyber' },
    { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security', category: 'cyber' },
    { url: 'https://www.darkreading.com/rss.xml', source: 'Dark Reading', category: 'cyber' },
    { url: 'https://threatpost.com/feed/', source: 'Threatpost', category: 'cyber' },
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World', category: 'geopolitics' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYT World', category: 'geopolitics' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', category: 'geopolitics' },
    { url: 'https://feeds.reuters.com/reuters/worldNews', source: 'Reuters World', category: 'geopolitics' },
    { url: 'https://www.cisa.gov/uscert/ncas/alerts.xml', source: 'CISA Alerts', category: 'cyber' },
];

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const articles: {
            id: string; title: string; source: string;
            category: string; url: string; published: string; summary?: string;
        }[] = [];

        // Fetch feeds with timeout
        const results = await Promise.allSettled(
            RSS_FEEDS.map(async (feed) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                try {
                    const res = await fetch(feed.url, {
                        signal: controller.signal,
                        headers: { 'User-Agent': 'AstraCISO/1.0 Intelligence Feed Aggregator' },
                    });
                    clearTimeout(timeout);
                    if (!res.ok) return [];

                    const text = await res.text();
                    // Simple XML parsing for RSS items
                    const items = text.match(/<item[\s\S]*?<\/item>/gi) || [];
                    return items.slice(0, 5).map((item, i) => {
                        const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]
                            || item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Untitled';
                        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
                        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
                        const desc = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]
                            || item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
                        return {
                            id: `${feed.source}-${i}-${Date.now()}`,
                            title: title.replace(/<[^>]*>/g, '').trim(),
                            source: feed.source,
                            category: feed.category,
                            url: link.trim(),
                            published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                            summary: desc.replace(/<[^>]*>/g, '').trim().slice(0, 200),
                        };
                    });
                } catch {
                    clearTimeout(timeout);
                    return [];
                }
            })
        );

        for (const result of results) {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                articles.push(...result.value);
            }
        }

        // Sort by date
        articles.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

        const response = { articles: articles.slice(0, 50), fetchedAt: new Date().toISOString(), totalFeeds: RSS_FEEDS.length };
        cache = { data: response, timestamp: Date.now() };

        return NextResponse.json(response);
    } catch (error) {
        console.error('[NEWS API] Error:', error);
        if (cache) return NextResponse.json({ ...cache.data as object, stale: true });
        return NextResponse.json({ articles: [], error: 'Failed to fetch news feeds' }, { status: 500 });
    }
}
