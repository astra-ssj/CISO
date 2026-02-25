import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { INTEGRATIONS_REGISTRY } from '@/lib/integrations/registry';
import { decrypt, maskSecret } from '@/lib/crypto';

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all connected integrations from DB
    const dbRows = await prisma.integration.findMany();
    const dbMap = new Map(dbRows.map((r) => [r.integrationId, r]));

    // Merge registry with DB status
    const integrations = INTEGRATIONS_REGISTRY.map((def) => {
        const row = dbMap.get(def.id);
        return {
            id: def.id,
            name: def.name,
            description: def.description,
            category: def.category,
            logo: def.logo,
            popular: def.popular ?? false,
            phase1: def.phase1,
            status: row?.status ?? 'available',
            connectedAt: row?.connectedAt ?? null,
            connectedBy: row?.connectedBy ?? null,
            lastTestedAt: row?.lastTestedAt ?? null,
            lastTestResult: row?.lastTestResult ?? null,
        };
    });

    return NextResponse.json({ integrations });
}
