import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/companies — list all companies with product count
export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                products: {
                    select: { id: true, name: true, type: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(companies);
    } catch (error) {
        console.error('[Companies API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

// POST /api/companies — create a new company
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, legalEntity, jurisdiction, country, industry, size, certifications, primaryCloud, additionalContext } = body;

        if (!name || !legalEntity || !jurisdiction || !country || !industry || !size || !primaryCloud) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const company = await prisma.company.create({
            data: {
                name,
                legalEntity,
                jurisdiction,
                country,
                industry,
                size,
                certifications: typeof certifications === 'string' ? certifications : JSON.stringify(certifications || []),
                primaryCloud,
                additionalContext: additionalContext || null,
            },
            include: { products: true },
        });

        return NextResponse.json(company, { status: 201 });
    } catch (error) {
        console.error('[Companies API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}
