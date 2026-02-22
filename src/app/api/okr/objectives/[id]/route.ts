import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const o = await prisma.objective.update({
            where: { id },
            data: {
                ...(body.title != null && { title: body.title }),
                ...(body.description != null && { description: body.description }),
                ...(body.quarter != null && { quarter: body.quarter }),
                ...(body.year != null && { year: body.year }),
                ...(body.owner != null && { owner: body.owner }),
                ...(body.status != null && { status: body.status }),
                ...(body.keyResults != null && { keyResults: JSON.stringify(body.keyResults) }),
                ...(body.linkedRisks !== undefined && { linkedRisks: body.linkedRisks ? JSON.stringify(body.linkedRisks) : null }),
            },
        });
        return NextResponse.json({
            id: o.id,
            title: o.title,
            description: o.description,
            quarter: o.quarter,
            year: o.year,
            owner: o.owner,
            status: o.status,
            keyResults: JSON.parse(o.keyResults || '[]'),
            linkedRisks: o.linkedRisks ? JSON.parse(o.linkedRisks) : undefined,
        });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('OKR objective PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
