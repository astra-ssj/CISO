/**
 * POST /api/intelligence/shodan/vendor-scan
 * Scan a vendor's domain via Shodan → returns VendorScanResult
 * Body: { domain: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { shodanClient } from '@/lib/intelligence/clients/shodan-client';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';
import { recordObservation } from '@/lib/observations/record';

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
        const { domain } = body as { domain?: string };

        if (!domain) {
            return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
        }

        const result = await shodanClient.scanVendor(domain);
        await recordObservation({
            integrationId: 'shodan',
            operation: 'vendorScan',
            requestKey: domain.toLowerCase(),
            status: 'ok',
            payload: result,
            ttlMs: 24 * 60 * 60 * 1000,
            createdBy: (session.user as { id?: string }).id || 'system',
        });

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'VendorScan',
            resourceId: domain,
            description: `Vendor scan: ${domain} → risk score ${result.riskScore} (${result.riskLevel})`,
            severity: result.riskScore >= 70 ? 'WARNING' : 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('[SHODAN/VENDOR-SCAN] Error:', error);
        return NextResponse.json({ error: 'Vendor scan failed' }, { status: 500 });
    }
}
