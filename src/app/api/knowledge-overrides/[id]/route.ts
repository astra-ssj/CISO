import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/knowledge-overrides/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const override = await prisma.knowledgeOverride.findUnique({
            where: { id },
            include: {
                knowledgeEntry: true,
                product: { include: { company: true } },
            },
        });
        if (!override) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(override);
    } catch (error) {
        console.error('[KnowledgeOverrides API] GET/:id error:', error);
        return NextResponse.json({ error: 'Failed to fetch override' }, { status: 500 });
    }
}

// PUT /api/knowledge-overrides/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { questionText, answerType, answerText, evidence, frameworks, notes, approvedBy } = body;

        const override = await prisma.knowledgeOverride.update({
            where: { id },
            data: {
                ...(questionText && { questionText }),
                ...(answerType && { answerType }),
                ...(answerText && { answerText }),
                ...(evidence !== undefined && { evidence }),
                ...(frameworks !== undefined && {
                    frameworks: typeof frameworks === 'string' ? frameworks : JSON.stringify(frameworks),
                }),
                ...(notes !== undefined && { notes }),
                ...(approvedBy !== undefined && { approvedBy, approvedAt: approvedBy ? new Date() : null }),
            },
            include: {
                knowledgeEntry: { select: { id: true, questionText: true, domain: true, category: true } },
                product: { select: { id: true, name: true, company: { select: { id: true, name: true } } } },
            },
        });
        return NextResponse.json(override);
    } catch (error) {
        console.error('[KnowledgeOverrides API] PUT/:id error:', error);
        return NextResponse.json({ error: 'Failed to update override' }, { status: 500 });
    }
}

// DELETE /api/knowledge-overrides/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.knowledgeOverride.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[KnowledgeOverrides API] DELETE/:id error:', error);
        return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 });
    }
}
