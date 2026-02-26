/**
 * GET /api/intelligence/dashboard
 * Aggregated dashboard data for the Threat Briefing tab.
 * Cached for 5 minutes; returns stale data with warning if providers are down.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { cacheGet, cacheSet, cacheAge } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:dashboard';
const CACHE_TTL = 300; // 5 minutes

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check cache first
        const cached = cacheGet(CACHE_KEY, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json(cached.data);
        }

        const opencti = new OpenCTIClient();
        const misp = new MISPClient();

        try {
            const [
                activeCampaigns,
                topThreatActors,
                recentIOCs,
                attackHeatmap,
                feedStatus,
            ] = await Promise.all([
                opencti.getActiveCampaigns(),
                opencti.getThreatActors(),
                opencti.getRecentIndicators(48),
                opencti.getAttackHeatmap(),
                misp.getFeedStatus(),
            ]);

            const dashboard = {
                activeCampaigns: activeCampaigns.slice(0, 5),
                topThreatActors: topThreatActors.slice(0, 5),
                recentIOCs: recentIOCs.slice(0, 20),
                trendingTTPs: attackHeatmap
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10),
                feedHealth: feedStatus,
                lastUpdated: new Date().toISOString(),
                stale: false,
            };

            cacheSet(CACHE_KEY, dashboard);

            await logAudit({
                userId: (session.user as { id?: string }).id,
                userName: session.user.name ?? undefined,
                userRole: (session.user as { role?: string }).role,
                action: 'READ',
                category: 'INTELLIGENCE',
                resource: 'IntelDashboard',
                description: 'Viewed threat intelligence dashboard',
                severity: 'INFO',
                ipAddress: getRequestIp(req),
                userAgent: getRequestUserAgent(req),
            });

            return NextResponse.json(dashboard);
        } catch {
            // If fresh fetch fails but we have stale cache, return it
            if (cached.hit) {
                const staleData = { ...cached.data as Record<string, unknown>, stale: true, cachedAt: cacheAge(CACHE_KEY) };
                return NextResponse.json(staleData);
            }
            throw new Error('No cached data available');
        }
    } catch (error) {
        console.error('[INTEL/DASHBOARD] Error:', error);
        return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
    }
}
