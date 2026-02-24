import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/companies/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: { products: { include: { _count: { select: { knowledgeOverrides: true } } } } },
        });
        if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(company);
    } catch (error) {
        console.error('[Companies API] GET/:id error:', error);
        return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
    }
}

// PUT /api/companies/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { name, legalEntity, jurisdiction, country, industry, size, certifications, primaryCloud, additionalContext } = body;

        const company = await prisma.company.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(legalEntity && { legalEntity }),
                ...(jurisdiction && { jurisdiction }),
                ...(country && { country }),
                ...(industry && { industry }),
                ...(size && { size }),
                ...(certifications !== undefined && {
                    certifications: typeof certifications === 'string' ? certifications : JSON.stringify(certifications),
                }),
                ...(primaryCloud && { primaryCloud }),
                ...(additionalContext !== undefined && { additionalContext }),
            },
            include: { products: true },
        });
        return NextResponse.json(company);
    } catch (error) {
        console.error('[Companies API] PUT/:id error:', error);
        return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
    }
}

// DELETE /api/companies/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.company.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Companies API] DELETE/:id error:', error);
        return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
