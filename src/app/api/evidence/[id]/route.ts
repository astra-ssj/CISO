import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

// GET /api/evidence/[id] — single evidence with links
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'SEC_ENGINEER', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const evidence = await prisma.evidence.findUnique({
            where: { id },
            include: { links: true },
        });

        if (!evidence) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...evidence,
            tags: evidence.tags ? JSON.parse(evidence.tags) : [],
            frameworks: evidence.frameworks ? JSON.parse(evidence.frameworks) : [],
            metadata: evidence.metadata ? JSON.parse(evidence.metadata) : null,
        });
    } catch (error: unknown) {
        console.error('Evidence GET [id]:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// DELETE /api/evidence/[id] — soft delete (set status to ARCHIVED)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string; name?: string; role?: string };
        if (!user?.role || user.role !== 'CISO') {
            return NextResponse.json({ error: 'Forbidden — CISO only' }, { status: 403 });
        }

        const { id } = await params;
        const evidence = await prisma.evidence.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });

        await logAudit({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'DELETE',
            category: 'EVIDENCE',
            resource: 'Evidence',
            resourceId: evidence.id,
            description: `Archived evidence: ${evidence.title}`,
            severity: 'WARNING',
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        console.error('Evidence DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
