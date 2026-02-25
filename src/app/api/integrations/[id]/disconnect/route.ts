import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getIntegration } from '@/lib/integrations/registry';

export async function POST(
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

    const userId = (session.user as { id?: string }).id ?? 'unknown';

    // Clear the integration row
    await prisma.integration.upsert({
        where: { integrationId: id },
        create: {
            integrationId: id,
            category: def.category,
            status: 'available',
            config: '',
        },
        update: {
            status: 'available',
            config: '',
            connectedBy: null,
            connectedAt: null,
            lastTestedAt: null,
            lastTestResult: null,
            metadata: null,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            actor: userId,
            action: 'integration.disconnected',
            resource: `integration:${id}`,
            metadata: JSON.stringify({ category: def.category }),
        },
    });

    return NextResponse.json({ success: true });
}
