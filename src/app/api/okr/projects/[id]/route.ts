import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const p = await prisma.project.update({
            where: { id },
            data: {
                ...(body.title != null && { title: body.title }),
                ...(body.description != null && { description: body.description }),
                ...(body.owner != null && { owner: body.owner }),
                ...(body.status != null && { status: body.status }),
                ...(body.priority != null && { priority: body.priority }),
                ...(body.budgetAllocated != null && { budgetAllocated: body.budgetAllocated }),
                ...(body.budgetSpent != null && { budgetSpent: body.budgetSpent }),
                ...(body.linkedObjectives != null && { linkedObjectives: JSON.stringify(body.linkedObjectives) }),
                ...(body.linkedRisks != null && { linkedRisks: JSON.stringify(body.linkedRisks) }),
                ...(body.startDate != null && { startDate: body.startDate }),
                ...(body.targetEndDate != null && { targetEndDate: body.targetEndDate }),
                ...(body.tags != null && { tags: JSON.stringify(body.tags) }),
                ...(body.phases != null && { phases: JSON.stringify(body.phases) }),
            },
        });
        return NextResponse.json({
            id: p.id,
            title: p.title,
            description: p.description,
            owner: p.owner,
            status: p.status,
            priority: p.priority,
            budgetAllocated: p.budgetAllocated,
            budgetSpent: p.budgetSpent,
            linkedObjectives: JSON.parse(p.linkedObjectives || '[]'),
            linkedRisks: JSON.parse(p.linkedRisks || '[]'),
            startDate: p.startDate,
            targetEndDate: p.targetEndDate,
            tags: JSON.parse(p.tags || '[]'),
            phases: JSON.parse(p.phases || '[]'),
        });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('OKR project PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
