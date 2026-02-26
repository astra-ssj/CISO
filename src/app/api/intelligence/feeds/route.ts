/**
 * GET /api/intelligence/feeds
 * MISP feed status.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { cacheGet, cacheSet } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:feeds';
const CACHE_TTL = 120; // 2 minutes

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cached = cacheGet(CACHE_KEY, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json({ feeds: cached.data });
        }

        const misp = new MISPClient();
        const feeds = await misp.getFeeds();
        const feedStatus = await misp.getFeedStatus();

        cacheSet(CACHE_KEY, feeds);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'Feeds',
            description: 'Listed MISP feeds',
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ feeds, feedStatus });
    } catch (error) {
        console.error('[INTEL/FEEDS] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 });
    }
}
