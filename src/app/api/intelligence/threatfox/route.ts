import { NextResponse } from 'next/server';
import { AbuseCHClient } from '@/lib/intelligence/clients/abusech-client';
import { recordUpdate, recordError } from '@/lib/intelligence/data-freshness';

const client = new AbuseCHClient();

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data, {
                headers: { 'Cache-Control': 'public, max-age=300' },
            });
        }

        const iocs = await client.getRecentIOCs(7);

        const response = {
            data: iocs.slice(0, 200).map((ioc) => ({
                id: String(ioc.id || ''),
                type: String(ioc.ioc_type || ''),
                value: String(ioc.ioc || ''),
                threatType: String(ioc.threat_type || ''),
                malware: String(ioc.malware_printable || ''),
                malwareAlias: String(ioc.malware_alias || ''),
                confidence: Number(ioc.confidence_level || 0),
                reporter: String(ioc.reporter || ''),
                tags: ioc.tags || [],
                firstSeen: String(ioc.first_seen || ''),
                lastSeen: String(ioc.last_seen || ''),
                reference: String(ioc.reference || ''),
            })),
            count: Math.min(iocs.length, 200),
            fetchedAt: new Date().toISOString(),
            cached: false,
            staleAt: new Date(Date.now() + CACHE_TTL).toISOString(),
        };

        cache = { data: response, timestamp: Date.now() };
        recordUpdate('threatfox');
        return NextResponse.json(response, {
            headers: { 'Cache-Control': 'public, max-age=300' },
        });
    } catch (error) {
        console.error('[THREATFOX API] Error:', error);
        recordError('threatfox', String(error));
        if (cache) {
            return NextResponse.json({ ...(cache.data as object), cached: true, stale: true });
        }
        return NextResponse.json(
            { data: [], error: 'Failed to fetch ThreatFox data', cached: false, staleAt: null },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, term } = body as { action?: string; term?: string };

        if (action === 'search' && term) {
            const results = await client.searchIOC(term);
            recordUpdate('threatfox');
            return NextResponse.json({
                data: results.slice(0, 100),
                count: Math.min(results.length, 100),
                query: term,
            });
        }

        return NextResponse.json(
            { error: 'Invalid action. Use { action: "search", term: "..." }' },
            { status: 400 },
        );
    } catch (error) {
        console.error('[THREATFOX API] POST Error:', error);
        recordError('threatfox', String(error));
        return NextResponse.json(
            { data: [], error: 'ThreatFox search failed', cached: false },
            { status: 500 },
        );
    }
}
