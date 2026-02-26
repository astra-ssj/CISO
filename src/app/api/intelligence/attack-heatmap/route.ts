/**
 * GET /api/intelligence/attack-heatmap
 * MITRE ATT&CK heatmap data from OpenCTI.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { cacheGet, cacheSet } from '@/lib/intelligence/cache';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

const CACHE_KEY = 'intel:attack-heatmap';
const CACHE_TTL = 300; // 5 minutes

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
        const heatmap = await opencti.getAttackHeatmap();

        const payload = {
            techniques: heatmap.map(t => ({
                id: t.techniqueId,
                name: t.technique,
                count: t.count,
                tactic: t.tactic,
            })),
            total: heatmap.length,
            lastUpdated: new Date().toISOString(),
        };

        cacheSet(CACHE_KEY, payload);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'AttackHeatmap',
            description: 'Viewed MITRE ATT&CK heatmap',
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json(payload);
    } catch (error) {
        console.error('[INTEL/ATTACK-HEATMAP] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch attack heatmap' }, { status: 500 });
    }
}
