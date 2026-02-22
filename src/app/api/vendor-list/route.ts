import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const list = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
        const items = list.map((v) => ({
            id: v.id,
            name: v.name,
            serviceDescription: v.serviceDescription,
            tier: v.tier,
            status: v.status,
            lastAssessmentDate: v.lastAssessmentDate,
            inherentRiskScore: v.inherentRiskScore,
            contactEmail: v.contactEmail,
        }));
        return NextResponse.json(items);
    } catch (error: unknown) {
        console.error('Vendor list GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const v = await prisma.vendor.create({
            data: {
                name: body.name,
                serviceDescription: body.serviceDescription ?? '',
                tier: body.tier,
                status: body.status ?? 'ACTIVE',
                lastAssessmentDate: body.lastAssessmentDate ?? '-',
                inherentRiskScore: body.inherentRiskScore ?? 0,
                contactEmail: body.contactEmail ?? '',
            },
        });
        return NextResponse.json({
            id: v.id,
            name: v.name,
            serviceDescription: v.serviceDescription,
            tier: v.tier,
            status: v.status,
            lastAssessmentDate: v.lastAssessmentDate,
            inherentRiskScore: v.inherentRiskScore,
            contactEmail: v.contactEmail,
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Vendor list POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
