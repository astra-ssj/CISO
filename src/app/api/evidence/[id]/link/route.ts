import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

// GET /api/evidence/[id]/link — list links for evidence
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const role = (session?.user as { role?: string })?.role;
        if (!role || !['CISO', 'SEC_ENGINEER', 'AUDITOR'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const links = await prisma.evidenceLink.findMany({
            where: { evidenceId: id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(links);
    } catch (error: unknown) {
        console.error('EvidenceLink GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// POST /api/evidence/[id]/link — create link
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string; name?: string; role?: string };
        if (!user?.role || !['CISO', 'SEC_ENGINEER'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();

        if (!body.linkType || !body.linkId || !body.linkName) {
            return NextResponse.json({ error: 'linkType, linkId, and linkName are required' }, { status: 400 });
        }

        // Verify evidence exists
        const evidence = await prisma.evidence.findUnique({ where: { id } });
        if (!evidence) {
            return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
        }

        const link = await prisma.evidenceLink.create({
            data: {
                evidenceId: id,
                linkType: body.linkType,
                linkId: body.linkId,
                linkName: body.linkName,
            },
        });

        await logAudit({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'CREATE',
            category: 'EVIDENCE',
            resource: 'EvidenceLink',
            resourceId: link.id,
            description: `Linked evidence "${evidence.title}" to ${body.linkType}: ${body.linkName}`,
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return NextResponse.json(link, { status: 201 });
    } catch (error: unknown) {
        console.error('EvidenceLink POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
