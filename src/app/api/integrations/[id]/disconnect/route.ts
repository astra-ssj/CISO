import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/require-session';
import prisma from '@/lib/prisma';
import { getIntegration } from '@/lib/integrations/registry';

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await requirePermission('integration:manage');
    if (error) return error;

    const { id } = await params;
    const def = getIntegration(id);
    if (!def) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const userId = user?.id ?? 'unknown';

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
            userId: userId,
            action: 'CONFIGURE',
            category: 'INTEGRATION',
            resource: 'Integration',
            resourceId: id,
            description: `Disconnected integration: ${def.name}`,
            metadata: JSON.stringify({ category: def.category }),
        },
    });

    return NextResponse.json({ success: true });
}
