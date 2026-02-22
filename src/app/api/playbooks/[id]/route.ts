import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const p = await prisma.playbook.update({
            where: { id },
            data: {
                ...(body.title != null && { title: body.title }),
                ...(body.description != null && { description: body.description }),
                ...(body.severity != null && { severity: body.severity }),
                ...(body.status != null && { status: body.status }),
                ...(body.phases != null && { phases: JSON.stringify(body.phases) }),
                ...(body.startTime !== undefined && { startTime: body.startTime ?? null }),
                ...(body.endTime !== undefined && { endTime: body.endTime ?? null }),
                ...(body.evidenceLog != null && { evidenceLog: JSON.stringify(body.evidenceLog) }),
            },
        });
        return NextResponse.json({
            id: p.id,
            title: p.title,
            description: p.description,
            severity: p.severity,
            status: p.status,
            phases: JSON.parse(p.phases || '[]'),
            startTime: p.startTime ?? undefined,
            endTime: p.endTime ?? undefined,
            evidenceLog: JSON.parse(p.evidenceLog || '[]'),
        });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Playbooks PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.playbook.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Playbooks DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
