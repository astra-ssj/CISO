/**
 * GET /api/intelligence/stats
 * Combined stats for both OpenCTI and MISP.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { cacheGet, cacheSet } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:stats';
const CACHE_TTL = 120; // 2 minutes

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cached = cacheGet(CACHE_KEY, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json(cached.data);
        }

        const opencti = new OpenCTIClient();
        const misp = new MISPClient();

        const [openctiStats, mispStats] = await Promise.all([
            opencti.getStats(),
            misp.getStats(),
        ]);

        const payload = {
            opencti: openctiStats,
            misp: mispStats,
            combined: {
                totalCampaigns: openctiStats.campaigns,
                totalActors: openctiStats.actors,
                totalIndicators: openctiStats.indicators + mispStats.attributes,
                totalMalware: openctiStats.malware,
                totalReports: openctiStats.reports,
                totalEvents: mispStats.events,
                totalFeeds: mispStats.feeds,
            },
            timestamp: new Date().toISOString(),
        };

        cacheSet(CACHE_KEY, payload);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'IntelStats',
            description: 'Viewed combined intelligence statistics',
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json(payload);
    } catch (error) {
        console.error('[INTEL/STATS] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
