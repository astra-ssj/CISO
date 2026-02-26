/**
 * POST /api/intelligence/enrich
 * Enrich an IOC (IP, domain, hash, URL) by querying OpenCTI, MISP, and Abuse.ch.
 * Body: { value: string, type: 'ip'|'domain'|'hash'|'url' }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { AbuseCHClient } from '@/lib/intelligence/clients/abusech-client';
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
        const abusech = new AbuseCHClient();

        // ── Build Abuse.ch queries based on IOC type ──
        const abusechQueries: Promise<unknown[]>[] = [];

        if (type === 'ip' || type === 'domain') {
            // Search ThreatFox for IOCs matching the IP/domain
            abusechQueries.push(
                abusech.searchIOC(value).then((iocs) =>
                    iocs.map((ioc) => ({
                        source: 'ThreatFox',
                        ioc: ioc.ioc,
                        type: ioc.ioc_type,
                        malware: ioc.malware_printable,
                        confidence: ioc.confidence_level,
                        threat_type: ioc.threat_type_desc || ioc.threat_type,
                        tags: ioc.tags,
                        firstSeen: ioc.first_seen,
                    })),
                ).catch(() => []),
            );
        }

        if (type === 'url') {
            // Look up URL in URLhaus
            abusechQueries.push(
                abusech.lookupURL(value).then((result) =>
                    result.query_status === 'ok'
                        ? [{
                            source: 'URLhaus',
                            url: result.url,
                            host: result.host,
                            status: result.url_status,
                            threat: result.threat,
                            tags: result.tags,
                            date_added: result.date_added,
                            payloads: result.payloads?.length || 0,
                        }]
                        : [],
                ).catch(() => []),
            );
        }

        if (type === 'hash') {
            // Search ThreatFox + MalwareBazaar for hash
            abusechQueries.push(
                abusech.searchIOC(value).then((iocs) =>
                    iocs.map((ioc) => ({
                        source: 'ThreatFox',
                        ioc: ioc.ioc,
                        type: ioc.ioc_type,
                        malware: ioc.malware_printable,
                        confidence: ioc.confidence_level,
                        tags: ioc.tags,
                    })),
                ).catch(() => []),
            );
            abusechQueries.push(
                abusech.lookupHash(value).then((result) =>
                    result.query_status === 'ok' && result.data
                        ? result.data.map((s) => ({
                            source: 'MalwareBazaar',
                            sha256: s.sha256_hash,
                            file_type: s.file_type,
                            file_size: s.file_size,
                            signature: s.signature,
                            tags: s.tags,
                            firstSeen: s.first_seen,
                        }))
                        : [],
                ).catch(() => []),
            );
        }

        const [openctiResults, mispResults, ...abusechResults] = await Promise.allSettled([
            opencti.search(value),
            misp.searchAttributes(value),
            ...abusechQueries,
        ]);

        const openctiData = openctiResults.status === 'fulfilled' ? openctiResults.value : [];
        const mispData = mispResults.status === 'fulfilled' ? mispResults.value : [];

        // Flatten all abuse.ch results
        const abusechData: unknown[] = [];
        for (const r of abusechResults) {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                abusechData.push(...r.value);
            }
        }

        const totalHits = openctiData.length + mispData.length + abusechData.length;
        const sources: string[] = [
            ...(openctiData.length > 0 ? ['OPENCTI'] : []),
            ...(mispData.length > 0 ? ['MISP'] : []),
            ...(abusechData.length > 0 ? ['ABUSE.CH'] : []),
        ];

        let verdict = 'NOT_FOUND';
        if (totalHits > 0) {
            // If abuse.ch found it with high confidence, it's known malicious
            const hasHighConfidence = abusechData.some((d) =>
                typeof d === 'object' && d !== null && 'confidence' in d && Number((d as Record<string, unknown>).confidence) >= 70,
            );
            verdict = hasHighConfidence || openctiData.length > 0 ? 'KNOWN_MALICIOUS' : 'SUSPICIOUS';
        }

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
            abusech: {
                found: abusechData.length > 0,
                results: abusechData,
                count: abusechData.length,
            },
            combined: {
                totalHits,
                sources,
                verdict,
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
            description: `Enriched ${type}: ${value} — ${enrichment.combined.totalHits} hits (${sources.join(', ')})`,
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
