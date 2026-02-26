/**
 * GET /api/intelligence/campaigns
 * List active campaigns from OpenCTI.
 * Query: sector, region, limit
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { cacheGet, cacheSet } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:campaigns';
const CACHE_TTL = 120; // 2 minutes

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const region = searchParams.get('region');
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const cacheKey = `${CACHE_KEY}:${region || 'all'}`;
        const cached = cacheGet(cacheKey, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json({ campaigns: (cached.data as unknown[]).slice(0, limit) });
        }

        const opencti = new OpenCTIClient();
        let campaigns;

        if (region) {
            campaigns = await opencti.getCampaignsByRegion(region);
        } else {
            campaigns = await opencti.getActiveCampaigns();
        }

        cacheSet(cacheKey, campaigns);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'Campaigns',
            description: `Listed campaigns${region ? ` for region: ${region}` : ''}`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ campaigns: campaigns.slice(0, limit) });
    } catch (error) {
        console.error('[INTEL/CAMPAIGNS] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}
