import { NextResponse } from 'next/server';
import { AbuseCHClient } from '@/lib/intelligence/clients/abusech-client';
import { recordUpdate, recordError } from '@/lib/intelligence/data-freshness';

const client = new AbuseCHClient();

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 min

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data, {
                headers: { 'Cache-Control': 'public, max-age=300' },
            });
        }

        const urls = await client.getRecentMaliciousURLs(150);

        // Group by threat type for display
        const threats: Record<string, number> = {};
        for (const u of urls) {
            const threat = u.threat || 'Unknown';
            threats[threat] = (threats[threat] || 0) + 1;
        }

        const response = {
            data: urls.map((u) => ({
                id: String(u.id || ''),
                url: String(u.url || ''),
                urlStatus: String(u.url_status || ''),
                host: String(u.host || ''),
                dateAdded: String(u.date_added || ''),
                threat: String(u.threat || ''),
                tags: u.tags || [],
                reporter: String(u.reporter || ''),
                urlhausReference: String(u.urlhaus_reference || ''),
            })),
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
        recordUpdate('urlhaus');
        return NextResponse.json(response, {
            headers: { 'Cache-Control': 'public, max-age=300' },
        });
    } catch (error) {
        console.error('[URLHAUS API] Error:', error);
        recordError('urlhaus', String(error));
        if (cache) {
            return NextResponse.json({ ...(cache.data as object), cached: true, stale: true });
        }
        return NextResponse.json(
            { data: [], error: 'Failed to fetch URLhaus data', cached: false, staleAt: null },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, url, host } = body as { action?: string; url?: string; host?: string };

        if (action === 'lookup' && url) {
            const result = await client.lookupURL(url);
            recordUpdate('urlhaus');
            return NextResponse.json(result);
        }

        if (action === 'lookup_host' && host) {
            // Use lookupURL with the host as best available
            const urls = await client.getRecentMaliciousURLs(150);
            const matches = urls.filter((u) => u.host === host);
            return NextResponse.json({
                host,
                urls: matches,
                count: matches.length,
            });
        }

        return NextResponse.json(
            { error: 'Invalid action. Use { action: "lookup", url: "..." } or { action: "lookup_host", host: "..." }' },
            { status: 400 },
        );
    } catch (error) {
        console.error('[URLHAUS API] POST Error:', error);
        recordError('urlhaus', String(error));
        return NextResponse.json(
            { data: [], error: 'URLhaus lookup failed', cached: false },
            { status: 500 },
        );
    }
}
