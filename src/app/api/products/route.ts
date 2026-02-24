import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products — list products, optionally filtered by companyId
export async function GET(req: NextRequest) {
    try {
        const companyId = req.nextUrl.searchParams.get('companyId');
        const products = await prisma.product.findMany({
            where: companyId ? { companyId } : undefined,
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { knowledgeOverrides: true } },
            },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('[Products API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST /api/products — create a new product
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, type, dataTypes, hostingRegions, complianceScope, techStack, companyId } = body;

        if (!name || !type || !companyId) {
            return NextResponse.json({ error: 'Missing required fields (name, type, companyId)' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || null,
                type,
                dataTypes: typeof dataTypes === 'string' ? dataTypes : JSON.stringify(dataTypes || []),
                hostingRegions: typeof hostingRegions === 'string' ? hostingRegions : JSON.stringify(hostingRegions || []),
                complianceScope: typeof complianceScope === 'string' ? complianceScope : JSON.stringify(complianceScope || []),
                techStack: techStack ? (typeof techStack === 'string' ? techStack : JSON.stringify(techStack)) : null,
                companyId,
            },
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { knowledgeOverrides: true } },
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('[Products API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
