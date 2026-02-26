/**
 * GET /api/intelligence/health
 * Check OpenCTI + MISP connectivity and return stats.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const openctiClient = new OpenCTIClient();
        const mispClient = new MISPClient();

        const [openctiHealth, mispHealth, openctiStats, mispStats] = await Promise.all([
            openctiClient.healthCheck(),
            mispClient.healthCheck(),
            openctiClient.getStats(),
            mispClient.getStats(),
        ]);

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'IntelHealth',
            description: 'Checked threat intelligence platform health',
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({
            opencti: {
                connected: openctiHealth.connected,
                version: openctiHealth.version,
                lastSync: openctiHealth.lastSync,
                stats: openctiStats,
            },
            misp: {
                connected: mispHealth.connected,
                version: mispHealth.version,
                lastSync: mispHealth.lastSync,
                stats: mispStats,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[INTEL/HEALTH] Error:', error);
        return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
    }
}
