import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 min

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json(
                { data: [], error: 'URLhaus API error', cached: false, staleAt: null },
                { status: res.status }
            );
        }

        const raw = await res.json();
        const urls = (raw.urls || []).slice(0, 150).map((u: Record<string, unknown>) => ({
            id: String(u.id || ''),
            url: String(u.url || ''),
            urlStatus: String(u.url_status || ''),
            host: String(u.host || ''),
            dateAdded: String(u.date_added || ''),
            threat: String(u.threat || ''),
            tags: u.tags || [],
            reporter: String(u.reporter || ''),
            urlhausReference: String(u.urlhaus_reference || ''),
        }));

        // Group by threat type for display
        const threats: Record<string, number> = {};
        for (const u of urls) {
            const threat = u.threat || 'Unknown';
            threats[threat] = (threats[threat] || 0) + 1;
        }

        const response = {
            data: urls,
            threats: Object.entries(threats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20)
                .map(([name, count]) => ({ name, count })),
            count: urls.length,
            fetchedAt: new Date().toISOString(),
            cached: false,
            staleAt: new Date(Date.now() + CACHE_TTL).toISOString(),
        };

        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[URLHAUS API] Error:', error);
        if (cache) {
            return NextResponse.json({ ...(cache.data as object), cached: true, stale: true });
        }
        return NextResponse.json(
            { data: [], error: 'Failed to fetch URLhaus data', cached: false, staleAt: null },
            { status: 500 }
        );
    }
}
