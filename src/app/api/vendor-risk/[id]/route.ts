import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function mapVendorRisk(v: { id: string; name: string; category: string; description: string; status: string; riskTier: string; riskScore: number; dataAccess: string; complianceCertifications: string; contractExpiry: string; lastAssessment: string; contactName: string; contactEmail: string; notes: string; createdAt: Date; assessmentHistory: { id: string; date: string; score: number; findings: string; assessor: string }[] }) {
    return {
        id: v.id,
        name: v.name,
        category: v.category,
        description: v.description,
        status: v.status,
        riskTier: v.riskTier,
        riskScore: v.riskScore,
        dataAccess: JSON.parse(v.dataAccess || '[]') as string[],
        complianceCertifications: JSON.parse(v.complianceCertifications || '[]') as string[],
        contractExpiry: v.contractExpiry,
        lastAssessment: v.lastAssessment,
        assessmentHistory: v.assessmentHistory.map((a) => ({
            id: a.id,
            date: a.date,
            score: a.score,
            findings: (typeof a.findings === 'string' ? JSON.parse(a.findings || '[]') : a.findings) as string[],
            assessor: a.assessor,
        })),
        contactName: v.contactName,
        contactEmail: v.contactEmail,
        notes: v.notes,
        createdAt: v.createdAt.toISOString().split('T')[0],
    };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const riskScore = body.riskScore ?? undefined;
        const riskTier = riskScore != null ? (riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW') : undefined;
        const v = await prisma.vendorRisk.update({
            where: { id },
            data: {
                ...(body.name != null && { name: body.name }),
                ...(body.category != null && { category: body.category }),
                ...(body.description != null && { description: body.description }),
                ...(body.status != null && { status: body.status }),
                ...(riskTier != null && { riskTier }),
                ...(riskScore != null && { riskScore }),
                ...(body.dataAccess != null && { dataAccess: JSON.stringify(body.dataAccess) }),
                ...(body.complianceCertifications != null && { complianceCertifications: JSON.stringify(body.complianceCertifications) }),
                ...(body.contractExpiry != null && { contractExpiry: body.contractExpiry }),
                ...(body.lastAssessment != null && { lastAssessment: body.lastAssessment }),
                ...(body.contactName != null && { contactName: body.contactName }),
                ...(body.contactEmail != null && { contactEmail: body.contactEmail }),
                ...(body.notes != null && { notes: body.notes }),
            },
            include: { assessmentHistory: true },
        });
        return NextResponse.json(mapVendorRisk(v));
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor risk PUT:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.vendorRisk.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor risk DELETE:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
