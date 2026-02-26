/**
 * GET /api/intelligence/actors
 * List threat actors from OpenCTI.
 * Query: targetSector, active
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { cacheGet, cacheSet } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:actors';
const CACHE_TTL = 120; // 2 minutes

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const targetSector = searchParams.get('targetSector');

        const cacheKey = `${CACHE_KEY}:${targetSector || 'all'}`;
        const cached = cacheGet(cacheKey, CACHE_TTL);
        if (cached.hit && !cached.stale) {
            return NextResponse.json({ actors: cached.data });
        }

        const opencti = new OpenCTIClient();
        let actors;

        if (targetSector) {
            actors = await opencti.getThreatActorsByTargetSector(targetSector);
        } else {
            actors = await opencti.getThreatActors();
        }

        cacheSet(cacheKey, actors);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'ThreatActors',
            description: `Listed threat actors${targetSector ? ` targeting sector: ${targetSector}` : ''}`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ actors });
    } catch (error) {
        console.error('[INTEL/ACTORS] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch threat actors' }, { status: 500 });
    }
}
