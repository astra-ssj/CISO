import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 300_000;

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const apiKey = process.env.NASA_FIRMS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                fires: [],
                message: 'Configure NASA_FIRMS_API_KEY in Settings → Integrations to enable this layer.',
                configured: false,
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/world/1`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json({ fires: [], message: 'NASA FIRMS API error', configured: true }, { status: res.status });
        }

        const text = await res.text();
        const lines = text.trim().split('\n');
        const headers = lines[0]?.split(',') || [];
        const latIdx = headers.indexOf('latitude');
        const lonIdx = headers.indexOf('longitude');
        const confIdx = headers.indexOf('confidence');
        const dateIdx = headers.indexOf('acq_date');
        const brightIdx = headers.indexOf('bright_ti4');

        const fires = lines.slice(1, 201).map((line, i) => {
            const cols = line.split(',');
            return {
                id: `fire-${i}`,
                latitude: Number(cols[latIdx] || 0),
                longitude: Number(cols[lonIdx] || 0),
                confidence: cols[confIdx] || 'nominal',
                brightness: Number(cols[brightIdx] || 0),
                date: cols[dateIdx] || '',
            };
        }).filter((f) => f.latitude !== 0);

        const response = { fires, count: fires.length, fetchedAt: new Date().toISOString(), configured: true };
        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[FIRES API] Error:', error);
        if (cache) return NextResponse.json({ ...cache.data as object, stale: true });
        return NextResponse.json({ fires: [], error: 'Failed to fetch fire data' }, { status: 500 });
    }
}
