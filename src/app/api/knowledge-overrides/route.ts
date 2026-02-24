import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/knowledge-overrides — list overrides, filtered by scope/company/product
export async function GET(req: NextRequest) {
    try {
        const scope = req.nextUrl.searchParams.get('scope');
        const companyId = req.nextUrl.searchParams.get('companyId');
        const productId = req.nextUrl.searchParams.get('productId');
        const knowledgeEntryId = req.nextUrl.searchParams.get('knowledgeEntryId');

        const where: Record<string, unknown> = {};
        if (scope) where.scope = scope;
        if (companyId) where.companyId = companyId;
        if (productId) where.productId = productId;
        if (knowledgeEntryId) where.knowledgeEntryId = knowledgeEntryId;

        const overrides = await prisma.knowledgeOverride.findMany({
            where: where as any,
            include: {
                knowledgeEntry: { select: { id: true, questionText: true, domain: true, category: true } },
                product: { select: { id: true, name: true, company: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(overrides);
    } catch (error) {
        console.error('[KnowledgeOverrides API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
    }
}

// POST /api/knowledge-overrides — create a new override
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            knowledgeEntryId, scope, companyId, productId,
            questionText, answerType, answerText,
            evidence, frameworks, notes, approvedBy,
        } = body;

        if (!scope || !questionText || !answerType || !answerText) {
            return NextResponse.json({ error: 'Missing required fields (scope, questionText, answerType, answerText)' }, { status: 400 });
        }

        if (scope === 'PRODUCT' && !productId) {
            return NextResponse.json({ error: 'productId required for PRODUCT scope' }, { status: 400 });
        }
        if (scope === 'COMPANY' && !companyId) {
            return NextResponse.json({ error: 'companyId required for COMPANY scope' }, { status: 400 });
        }

        const override = await prisma.knowledgeOverride.create({
            data: {
                knowledgeEntryId: knowledgeEntryId || null,
                scope,
                companyId: companyId || null,
                productId: productId || null,
                questionText,
                answerType,
                answerText,
                evidence: evidence || null,
                frameworks: typeof frameworks === 'string' ? frameworks : JSON.stringify(frameworks || null),
                notes: notes || null,
                approvedBy: approvedBy || null,
                approvedAt: approvedBy ? new Date() : null,
            },
            include: {
                knowledgeEntry: { select: { id: true, questionText: true, domain: true, category: true } },
                product: { select: { id: true, name: true, company: { select: { id: true, name: true } } } },
            },
        });

        return NextResponse.json(override, { status: 201 });
    } catch (error) {
        console.error('[KnowledgeOverrides API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create override' }, { status: 500 });
    }
}
