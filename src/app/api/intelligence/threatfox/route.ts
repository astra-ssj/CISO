import { NextResponse } from 'next/server';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'get_iocs', days: 7 }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json(
                { data: [], error: 'ThreatFox API error', cached: false, staleAt: null },
                { status: res.status }
            );
        }

        const raw = await res.json();
        const iocs = (raw.data || []).slice(0, 200).map((ioc: Record<string, unknown>) => ({
            id: String(ioc.id || ''),
            type: String(ioc.ioc_type || ''),
            value: String(ioc.ioc || ''),
            threatType: String(ioc.threat_type || ''),
            malware: String(ioc.malware_printable || ''),
            malwareAlias: String(ioc.malware_alias || ''),
            confidence: Number(ioc.confidence_level || 0),
            reporter: String(ioc.reporter || ''),
            tags: ioc.tags || [],
            firstSeen: String(ioc.first_seen_utc || ''),
            lastSeen: String(ioc.last_seen_utc || ''),
            reference: String(ioc.reference || ''),
        }));

        const response = {
            data: iocs,
            count: iocs.length,
            fetchedAt: new Date().toISOString(),
            cached: false,
            staleAt: new Date(Date.now() + CACHE_TTL).toISOString(),
        };

        cache = { data: response, timestamp: Date.now() };
        return NextResponse.json(response);
    } catch (error) {
        console.error('[THREATFOX API] Error:', error);
        if (cache) {
            return NextResponse.json({ ...(cache.data as object), cached: true, stale: true });
        }
        return NextResponse.json(
            { data: [], error: 'Failed to fetch ThreatFox data', cached: false, staleAt: null },
            { status: 500 }
        );
    }
}
