import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 300_000; // 5 min

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        // USGS public API — no key required
        const res = await fetch(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json({ earthquakes: [], error: 'USGS API error' }, { status: res.status });
        }

        const data = await res.json();
        const earthquakes = (data.features || []).map((f: { id: string; properties: Record<string, unknown>; geometry: { coordinates: number[] } }) => ({
            id: f.id,
            magnitude: Number(f.properties.mag || 0),
            location: String(f.properties.place || ''),
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            depth: f.geometry.coordinates[2],
            timestamp: new Date(Number(f.properties.time || 0)).toISOString(),
            significance: Number(f.properties.sig || 0),
            alert: f.properties.alert || null,
            tsunami: Number(f.properties.tsunami || 0),
            url: String(f.properties.url || ''),
        }));

        const response = { earthquakes, count: earthquakes.length, fetchedAt: new Date().toISOString() };
        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[EARTHQUAKES API] Error:', error);
        if (cache) return NextResponse.json({ ...cache.data as object, stale: true });
        return NextResponse.json({ earthquakes: [], error: 'Failed to fetch earthquake data' }, { status: 500 });
    }
}
