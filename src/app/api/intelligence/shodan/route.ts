/**
 * POST /api/intelligence/shodan
 * Multi-action Shodan endpoint: lookup_ip, search, domain, cve
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { shodanClient } from '@/lib/intelligence/clients/shodan-client';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

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
        const { action } = body as { action?: string };

        let data: unknown;
        let target = '';

        switch (action) {
            case 'lookup_ip': {
                const { ip } = body as { ip?: string };
                if (!ip) return NextResponse.json({ error: 'Missing ip parameter' }, { status: 400 });
                target = ip;
                data = await shodanClient.lookupIP(ip);
                break;
            }
            case 'search': {
                const { query, page } = body as { query?: string; page?: number };
                if (!query) return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
                target = query;
                data = await shodanClient.search(query, page ?? 1);
                break;
            }
            case 'domain': {
                const { domain } = body as { domain?: string };
                if (!domain) return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
                target = domain;
                data = await shodanClient.getDomainInfo(domain);
                break;
            }
            case 'cve': {
                const { cve } = body as { cve?: string };
                if (!cve) return NextResponse.json({ error: 'Missing cve parameter' }, { status: 400 });
                target = cve;
                data = await shodanClient.getCVEInfo(cve);
                break;
            }
            default:
                return NextResponse.json({ error: 'Unknown action. Valid: lookup_ip, search, domain, cve' }, { status: 400 });
        }

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'ShodanLookup',
            resourceId: target,
            description: `Shodan ${action} performed on ${target}`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({ data, cached: false });
    } catch (error) {
        console.error('[SHODAN] Error:', error);
        return NextResponse.json({ error: 'Shodan lookup failed' }, { status: 500 });
    }
}
