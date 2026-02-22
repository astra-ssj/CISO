import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const v = await prisma.vendor.update({
            where: { id },
            data: {
                ...(body.name != null && { name: body.name }),
                ...(body.serviceDescription != null && { serviceDescription: body.serviceDescription }),
                ...(body.tier != null && { tier: body.tier }),
                ...(body.status != null && { status: body.status }),
                ...(body.lastAssessmentDate != null && { lastAssessmentDate: body.lastAssessmentDate }),
                ...(body.inherentRiskScore != null && { inherentRiskScore: body.inherentRiskScore }),
                ...(body.contactEmail != null && { contactEmail: body.contactEmail }),
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
        });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor list PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.vendor.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor list DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
