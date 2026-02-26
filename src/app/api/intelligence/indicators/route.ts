/**
 * GET /api/intelligence/indicators
 * IOCs from OpenCTI + MISP combined.
 * Query: type (ipv4|domain|hash|url), source (OPENCTI|MISP|COMBINED), hours, limit
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { cacheGet, cacheSet, cacheAge } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';
import type { IndicatorTypeShort } from '@/lib/intelligence/types';

const CACHE_KEY = 'intel:indicators';
const CACHE_TTL = 60; // 1 minute

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as IndicatorTypeShort | null;
        const source = searchParams.get('source') || 'COMBINED';
        const hours = parseInt(searchParams.get('hours') || '48', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const cacheKey = `${CACHE_KEY}:${type || 'all'}:${source}:${hours}`;
        const cached = cacheGet(cacheKey, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json({
                indicators: (cached.data as unknown[]).slice(0, limit),
                source,
                stale: false,
            });
        }

        const opencti = new OpenCTIClient();
        const misp = new MISPClient();
        let indicators: unknown[] = [];

        try {
            const results = await Promise.allSettled([
                source !== 'MISP'
                    ? (type ? opencti.getIndicatorsByType(type) : opencti.getRecentIndicators(hours))
                    : Promise.resolve([]),
                source !== 'OPENCTI'
                    ? misp.getAttributes()
                    : Promise.resolve([]),
            ]);

            const openctiIOCs = results[0].status === 'fulfilled' ? results[0].value : [];
            const mispAttrs = results[1].status === 'fulfilled' ? results[1].value : [];

            // Normalize MISP attributes into a compatible shape
            const normalizedMISP = mispAttrs.map(a => ({
                id: `misp-${a.id}`,
                name: `${a.type}: ${a.value}`,
                value: a.value,
                type: a.type,
                source: 'MISP' as const,
                category: a.category,
                timestamp: a.timestamp,
                to_ids: a.to_ids,
                comment: a.comment,
            }));

            const normalizedOpenCTI = openctiIOCs.map(i => ({
                ...i,
                source: 'OPENCTI' as const,
            }));

            indicators = [...normalizedOpenCTI, ...normalizedMISP];
            cacheSet(cacheKey, indicators);
        } catch {
            if (cached.hit) {
                return NextResponse.json({
                    indicators: (cached.data as unknown[]).slice(0, limit),
                    source,
                    stale: true,
                    cachedAt: cacheAge(cacheKey),
                });
            }
            indicators = [];
        }

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'Indicators',
            description: `Listed IOCs — source: ${source}, type: ${type || 'all'}, hours: ${hours}`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({
            indicators: indicators.slice(0, limit),
            source,
            total: indicators.length,
            stale: false,
        });
    } catch (error) {
        console.error('[INTEL/INDICATORS] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch indicators' }, { status: 500 });
    }
}
