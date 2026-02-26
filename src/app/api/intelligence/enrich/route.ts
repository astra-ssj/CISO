/**
 * POST /api/intelligence/enrich
 * Enrich an IOC (IP, domain, hash, URL) by querying both OpenCTI and MISP.
 * Body: { value: string, type: 'ip'|'domain'|'hash'|'url' }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

type EnrichType = 'ip' | 'domain' | 'hash' | 'url';

const TYPE_MAP: Record<EnrichType, string> = {
    ip: 'ipv4',
    domain: 'domain',
    hash: 'hash',
    url: 'url',
};

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { value, type } = body as { value?: string; type?: EnrichType };

        if (!value || !type || !TYPE_MAP[type]) {
            return NextResponse.json(
                { error: 'Missing or invalid body. Expected: { value: string, type: "ip"|"domain"|"hash"|"url" }' },
                { status: 400 },
            );
        }

        const opencti = new OpenCTIClient();
        const misp = new MISPClient();

        const [openctiResults, mispResults] = await Promise.allSettled([
            opencti.search(value),
            misp.searchAttributes(value),
        ]);

        const openctiData = openctiResults.status === 'fulfilled' ? openctiResults.value : [];
        const mispData = mispResults.status === 'fulfilled' ? mispResults.value : [];

        const enrichment = {
            query: { value, type },
            opencti: {
                found: openctiData.length > 0,
                results: openctiData,
                count: openctiData.length,
            },
            misp: {
                found: mispData.length > 0,
                results: mispData,
                count: mispData.length,
            },
            combined: {
                totalHits: openctiData.length + mispData.length,
                sources: [
                    ...(openctiData.length > 0 ? ['OPENCTI'] : []),
                    ...(mispData.length > 0 ? ['MISP'] : []),
                ],
                verdict: openctiData.length + mispData.length > 0 ? 'KNOWN_MALICIOUS' : 'NOT_FOUND',
            },
            timestamp: new Date().toISOString(),
        };

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'IOCEnrichment',
            resourceId: value,
            description: `Enriched ${type}: ${value} — ${enrichment.combined.totalHits} hits`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json(enrichment);
    } catch (error) {
        console.error('[INTEL/ENRICH] Error:', error);
        return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
    }
}
