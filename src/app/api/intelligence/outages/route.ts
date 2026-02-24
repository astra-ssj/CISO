import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        // Cloudflare Radar public API — outage data
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(
            'https://api.cloudflare.com/client/v4/radar/annotations/outages?limit=20&format=json',
            {
                signal: controller.signal,
                headers: { 'User-Agent': 'AstraCISO/1.0' },
            }
        );
        clearTimeout(timeout);

        if (!res.ok) {
            // Fallback: return empty with note
            const response = { outages: [], message: 'Cloudflare Radar API unavailable — requires API token for full access', fetchedAt: new Date().toISOString() };
            return NextResponse.json(response);
        }

        const data = await res.json();
        const annotations = data.result?.annotations || [];
        const outages = annotations.map((a: Record<string, unknown>, i: number) => ({
            id: `outage-${i}`,
            country: String(a.locations || a.asns || 'Unknown'),
            asn: String(a.asns || ''),
            provider: String(a.description || ''),
            severity: 'medium' as const,
            startTime: String(a.startDate || new Date().toISOString()),
            endTime: a.endDate ? String(a.endDate) : undefined,
            trafficDrop: 50,
        }));

        const response = { outages, count: outages.length, fetchedAt: new Date().toISOString() };
        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[OUTAGES API] Error:', error);
        if (cache) return NextResponse.json({ ...cache.data as object, stale: true });
        return NextResponse.json({ outages: [], error: 'Failed to fetch outage data' }, { status: 500 });
    }
}
