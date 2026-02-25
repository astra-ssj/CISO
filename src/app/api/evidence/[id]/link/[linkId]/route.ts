import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

// DELETE /api/evidence/[id]/link/[linkId]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; linkId: string }> }
) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string; name?: string; role?: string };
        if (!user?.role || !['CISO', 'SEC_ENGINEER'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id, linkId } = await params;

        const link = await prisma.evidenceLink.findUnique({ where: { id: linkId } });
        if (!link || link.evidenceId !== id) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }

        await prisma.evidenceLink.delete({ where: { id: linkId } });

        await logAudit({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'DELETE',
            category: 'EVIDENCE',
            resource: 'EvidenceLink',
            resourceId: linkId,
            description: `Removed evidence link: ${link.linkName} (${link.linkType})`,
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        console.error('EvidenceLink DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
