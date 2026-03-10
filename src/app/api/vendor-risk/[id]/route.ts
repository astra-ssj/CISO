import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const riskScore = body.riskScore ?? undefined;
        const riskTier = riskScore != null ? (riskScore >= 75 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 25 ? 'Medium' : 'Low') : undefined;
        
        const v = await prisma.vendor.update({
            where: { id },
            data: {
                ...(body.name != null && { name: body.name }),
                ...(body.category != null && { category: body.category }),
                ...(body.website != null && { website: body.website }),
                ...(body.status != null && { status: body.status }),
                ...(riskTier != null && { riskTier }),
                ...(riskScore != null && { riskScore }),
                ...(body.dataAccess != null && { dataAccess: body.dataAccess }),
                ...(body.complianceCertifications != null && { complianceCertifications: JSON.stringify(body.complianceCertifications) }),
                ...(body.lastAssessedAt != null && { lastAssessedAt: new Date(body.lastAssessedAt) }),
                ...(body.nextReviewDate != null && { nextReviewDate: new Date(body.nextReviewDate) }),
                ...(body.contactName != null && { contactName: body.contactName }),
                ...(body.contactEmail != null && { contactEmail: body.contactEmail }),
                ...(body.notes != null && { notes: body.notes }),
            },
            include: { assessmentHistory: true },
        });
        
        const mapped = {
            ...v,
            dataAccess: v.dataAccess,
            complianceCertifications: JSON.parse(v.complianceCertifications || '[]') as string[],
            createdAt: v.createdAt.toISOString().split('T')[0],
            assessmentHistory: v.assessmentHistory.map(a => ({
                id: a.id,
                date: a.assessmentDate.toISOString().split('T')[0],
                score: a.overallScore,
                findings: [],
                assessor: a.assessedBy
            }))
        };
        
        return NextResponse.json(mapped);
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor PUT:', error);
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
        console.error('Vendor DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
