import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const apiKey = process.env.VESSELFINDER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                vessels: [],
                message: 'Configure VESSELFINDER_API_KEY in Settings → Integrations to enable this layer.',
                configured: false,
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`https://api.vesselfinder.com/vessels?userkey=${apiKey}`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json({ vessels: [], message: 'VesselFinder API error', configured: true }, { status: res.status });
        }

        const data = await res.json();
        const vessels = (Array.isArray(data) ? data : data.vessels || []).slice(0, 100).map((v: Record<string, unknown>) => ({
            mmsi: String(v.MMSI || v.mmsi || ''),
            name: String(v.SHIPNAME || v.name || 'Unknown'),
            type: String(v.SHIPTYPE || v.type || 'Unknown'),
            flag: String(v.FLAG || v.flag || ''),
            latitude: Number(v.LAT || v.latitude || 0),
            longitude: Number(v.LON || v.longitude || 0),
            speed: Number(v.SPEED || v.speed || 0),
            course: Number(v.COURSE || v.course || 0),
            destination: String(v.DESTINATION || v.destination || ''),
            lastUpdate: new Date().toISOString(),
        }));

        const response = { vessels, count: vessels.length, fetchedAt: new Date().toISOString(), configured: true };
        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[VESSELS API] Error:', error);
        if (cache) return NextResponse.json({ ...cache.data as object, stale: true });
        return NextResponse.json({ vessels: [], error: 'Failed to fetch vessel data' }, { status: 500 });
    }
}
