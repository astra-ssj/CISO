import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30s

const MILITARY_CALLSIGN_PREFIXES = [
    'RCH', 'DUKE', 'EVAC', 'GOLD', 'JAKE', 'KING', 'NERO', 'REACH',
    'SPAR', 'TOPCAT', 'VIPER', 'WEASEL', 'WOLF', 'NATO', 'SAM',
    'AF1', 'AF2', 'AFORCE', 'NAVY', 'ARMY', 'GUARD', 'HAWK',
];

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const username = process.env.OPENSKY_USERNAME;
        const password = process.env.OPENSKY_PASSWORD;

        if (!username || !password) {
            return NextResponse.json({
                flights: [],
                message: 'Configure OPENSKY_USERNAME and OPENSKY_PASSWORD in Settings → Integrations to enable this layer.',
                configured: false,
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        const res = await fetch('https://opensky-network.org/api/states/all', {
            signal: controller.signal,
            headers: { 'Authorization': `Basic ${auth}` },
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json({ flights: [], message: 'OpenSky API error', configured: true }, { status: res.status });
        }

        const data = await res.json();
        const states = data.states || [];

        // Filter for military callsigns
        const flights = states
            .filter((s: (string | number | boolean | null)[]) => {
                const callsign = (s[1] as string || '').trim().toUpperCase();
                return MILITARY_CALLSIGN_PREFIXES.some((p) => callsign.startsWith(p));
            })
            .slice(0, 100)
            .map((s: (string | number | boolean | null)[]) => ({
                icao24: s[0],
                callsign: (s[1] as string || '').trim(),
                origin_country: s[2],
                latitude: s[6] || 0,
                longitude: s[5] || 0,
                altitude: s[7] || s[13] || 0,
                velocity: s[9] || 0,
                heading: s[10] || 0,
                on_ground: s[8] || false,
                last_contact: s[4] || 0,
            }));

        const response = { flights, count: flights.length, fetchedAt: new Date().toISOString(), configured: true };
        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[FLIGHTS API] Error:', error);
        if (cache) return NextResponse.json({ ...cache.data as object, stale: true });
        return NextResponse.json({ flights: [], error: 'Failed to fetch flight data' }, { status: 500 });
    }
}
