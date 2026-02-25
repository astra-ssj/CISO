import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getIntegration } from '@/lib/integrations/registry';
import { encrypt } from '@/lib/crypto';

export async function POST(
    req: NextRequest,
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

    let body: { config?: Record<string, unknown> };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const configInput = body.config ?? {};

    // Validate config against the integration's Zod schema
    const parsed = def.configSchema.safeParse({
        ...configInput,
        // Coerce port to number if present
        ...(configInput.port !== undefined ? { port: Number(configInput.port) } : {}),
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid configuration', details: parsed.error.flatten() },
            { status: 422 }
        );
    }

    // Encrypt the config blob
    const encryptedConfig = encrypt(JSON.stringify(parsed.data));

    const userId = (session.user as { id?: string }).id ?? 'unknown';

    // Upsert integration row
    const row = await prisma.integration.upsert({
        where: { integrationId: id },
        create: {
            integrationId: id,
            category: def.category,
            status: 'connected',
            config: encryptedConfig,
            connectedBy: userId,
            connectedAt: new Date(),
        },
        update: {
            status: 'connected',
            config: encryptedConfig,
            connectedBy: userId,
            connectedAt: new Date(),
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
            description: `Connected integration: ${def.name}`,
            metadata: JSON.stringify({ category: def.category }),
        },
    });

    return NextResponse.json({ success: true, status: row.status });
}
