/**
 * POST /api/intelligence/shodan/attack-surface
 * Scan organization assets via Shodan → returns AttackSurfaceReport
 * Body: { ips: string[], domains: string[] }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { shodanClient } from '@/lib/intelligence/clients/shodan-client';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';
import { recordObservation } from '@/lib/observations/record';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!shodanClient.isConfigured()) {
            return NextResponse.json({
                error: 'Shodan API key not configured',
                configured: false,
            }, { status: 400 });
        }

        const body = await req.json();
        const { ips = [], domains = [] } = body as { ips?: string[]; domains?: string[] };

        if (ips.length === 0 && domains.length === 0) {
            return NextResponse.json({
                error: 'Provide at least one IP or domain to scan',
            }, { status: 400 });
        }

        const report = await shodanClient.scanOrgAssets(ips, domains);
        const userId = (session.user as { id?: string }).id || 'system';
        const requestKey = [...ips, ...domains].sort().join(',');

        const observationId = await recordObservation({
            integrationId: 'shodan',
            operation: 'attackSurface',
            requestKey,
            status: 'ok',
            payload: report,
            ttlMs: 24 * 60 * 60 * 1000,
            createdBy: userId,
        });

        await prisma.attackSurfaceScan.create({
            data: {
                totalAssets: report.totalAssets,
                totalVulns: report.totalVulnerabilities,
                riskScore: report.riskScore,
                results: JSON.stringify({ ...report, observationId }),
                createdBy: userId,
            },
        });

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'AttackSurfaceScan',
            resourceId: `ips:${ips.length},domains:${domains.length}`,
            description: `Attack surface scan: ${ips.length} IPs, ${domains.length} domains → ${report.totalAssets} assets, ${report.totalVulnerabilities} vulns`,
            severity: report.riskScore >= 70 ? 'WARNING' : 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ data: report });
    } catch (error) {
        console.error('[SHODAN/ATTACK-SURFACE] Error:', error);
        return NextResponse.json({ error: 'Attack surface scan failed' }, { status: 500 });
    }
}
