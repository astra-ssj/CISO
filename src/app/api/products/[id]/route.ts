import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                company: true,
                _count: { select: { knowledgeOverrides: true } },
            },
        });
        if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(product);
    } catch (error) {
        console.error('[Products API] GET/:id error:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { name, description, type, dataTypes, hostingRegions, complianceScope, techStack } = body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(type && { type }),
                ...(dataTypes !== undefined && {
                    dataTypes: typeof dataTypes === 'string' ? dataTypes : JSON.stringify(dataTypes),
                }),
                ...(hostingRegions !== undefined && {
                    hostingRegions: typeof hostingRegions === 'string' ? hostingRegions : JSON.stringify(hostingRegions),
                }),
                ...(complianceScope !== undefined && {
                    complianceScope: typeof complianceScope === 'string' ? complianceScope : JSON.stringify(complianceScope),
                }),
                ...(techStack !== undefined && {
                    techStack: techStack ? (typeof techStack === 'string' ? techStack : JSON.stringify(techStack)) : null,
                }),
            },
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { knowledgeOverrides: true } },
            },
        });
        return NextResponse.json(product);
    } catch (error) {
        console.error('[Products API] PUT/:id error:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE /api/products/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Products API] DELETE/:id error:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
