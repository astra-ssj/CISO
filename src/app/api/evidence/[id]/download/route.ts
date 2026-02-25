import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { readFile, fileExists } from '@/lib/evidence/storage';
import { logAudit, getRequestIp, getRequestUserAgent } from '@/lib/audit/audit-service';

// GET /api/evidence/[id]/download — file download
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        const user = session?.user as { id?: string; name?: string; role?: string };
        if (!user?.role || !['CISO', 'SEC_ENGINEER', 'AUDITOR'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const evidence = await prisma.evidence.findUnique({ where: { id } });

        if (!evidence) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (!evidence.filePath || !(await fileExists(evidence.filePath))) {
            return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
        }

        const buffer = await readFile(evidence.filePath);

        // Log every download
        await logAudit({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'EXPORT',
            category: 'EVIDENCE',
            resource: 'Evidence',
            resourceId: evidence.id,
            description: `Downloaded evidence: ${evidence.title} (${evidence.fileName})`,
            ipAddress: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': evidence.mimeType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${evidence.fileName}"`,
                'Content-Length': String(buffer.length),
            },
        });
    } catch (error: unknown) {
        console.error('Evidence download:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
