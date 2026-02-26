/**
 * POST /api/intelligence/search
 * Search across OpenCTI + MISP.
 * Body: { query: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OpenCTIClient } from '@/lib/intelligence/clients/opencti-client';
import { MISPClient } from '@/lib/intelligence/clients/misp-client';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { query } = body as { query?: string };

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Query must be at least 2 characters' },
                { status: 400 },
            );
        }

        const opencti = new OpenCTIClient();
        const misp = new MISPClient();

        const [openctiResults, mispResults] = await Promise.allSettled([
            opencti.search(query),
            misp.searchAttributes(query),
        ]);

        const openctiData = openctiResults.status === 'fulfilled' ? openctiResults.value : [];
        const mispData = mispResults.status === 'fulfilled' ? mispResults.value : [];

        // Normalize MISP attributes into search results shape
        const mispNormalized = mispData.map(a => ({
            id: `misp-attr-${a.id}`,
            entity_type: 'MISPAttribute',
            name: `${a.type}: ${a.value}`,
            description: a.comment || `Category: ${a.category}`,
            source: 'MISP' as const,
            created: a.timestamp,
            modified: a.timestamp,
        }));

        const combined = [
            ...openctiData.map(r => ({ ...r, source: 'OPENCTI' as const })),
            ...mispNormalized,
        ];

        await logAudit({
            userId: (session.user as { id?: string }).id,
            userName: session.user.name ?? undefined,
            userRole: (session.user as { role?: string }).role,
            action: 'READ',
            category: 'INTELLIGENCE',
            resource: 'IntelSearch',
            description: `Searched: "${query}" — ${combined.length} results`,
            severity: 'INFO',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json({
            results: combined,
            total: combined.length,
            query,
            sources: {
                opencti: openctiData.length,
                misp: mispNormalized.length,
            },
        });
    } catch (error) {
        console.error('[INTEL/SEARCH] Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
