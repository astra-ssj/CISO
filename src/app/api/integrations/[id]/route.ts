import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getIntegration } from '@/lib/integrations/registry';
import { decrypt, maskSecret } from '@/lib/crypto';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const def = getIntegration(id);
    if (!def) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const row = await prisma.integration.findUnique({ where: { integrationId: id } });

    let config: Record<string, string> = {};
    if (row?.config && row.config.trim() !== '') {
        try {
            const decrypted = decrypt(row.config);
            const parsed = JSON.parse(decrypted) as Record<string, string>;
            // Mask all secret-looking fields
            for (const [k, v] of Object.entries(parsed)) {
                const isSecret = /secret|password|token|key/i.test(k);
                config[k] = isSecret ? maskSecret(v) : v;
            }
        } catch {
            config = {};
        }
    }

    return NextResponse.json({
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        logo: def.logo,
        phase1: def.phase1,
        status: row?.status ?? 'available',
        config,
        connectedAt: row?.connectedAt ?? null,
        connectedBy: row?.connectedBy ?? null,
        lastTestedAt: row?.lastTestedAt ?? null,
        lastTestResult: row?.lastTestResult ?? null,
        metadata: row?.metadata ? JSON.parse(row.metadata) : null,
    });
}
