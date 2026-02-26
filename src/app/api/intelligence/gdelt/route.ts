import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const query = encodeURIComponent('conflict OR military OR terror OR cyber attack');
        const res = await fetch(
            `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=50&format=json`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json(
                { data: [], error: 'GDELT API error', cached: false, staleAt: null },
                { status: res.status }
            );
        }

        const raw = await res.json();
        const articles = (raw.articles || []).map((a: Record<string, unknown>) => ({
            url: String(a.url || ''),
            title: String(a.title || ''),
            source: String(a.domain || a.source || ''),
            language: String(a.language || ''),
            seenDate: String(a.seendate || ''),
            socialImage: String(a.socialimage || ''),
            // Extract tone data if available
            tone: typeof a.tone === 'string' ? parseFloat(a.tone) : null,
        }));

        const response = {
            data: articles,
            count: articles.length,
            fetchedAt: new Date().toISOString(),
            cached: false,
            staleAt: new Date(Date.now() + CACHE_TTL).toISOString(),
        };

        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[GDELT API] Error:', error);
        if (cache) {
            return NextResponse.json({ ...(cache.data as object), cached: true, stale: true });
        }
        return NextResponse.json(
            { data: [], error: 'Failed to fetch GDELT data', cached: false, staleAt: null },
            { status: 500 }
        );
    }
}
