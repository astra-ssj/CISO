/**
 * GET /api/intelligence/reports
 * Threat intelligence reports from OpenCTI.
 * Query: days, limit
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { cacheGet, cacheSet } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:reports';
const CACHE_TTL = 120; // 2 minutes

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const cacheKey = `${CACHE_KEY}:${days}`;
        const cached = cacheGet(cacheKey, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json({ reports: (cached.data as unknown[]).slice(0, limit) });
        }

        const opencti = new OpenCTIClient();
        const reports = await opencti.getRecentReports(days);

        cacheSet(cacheKey, reports);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'Reports',
            description: `Listed threat reports (last ${days} days)`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ reports: reports.slice(0, limit), total: reports.length });
    } catch (error) {
        console.error('[INTEL/REPORTS] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
