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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: vendorRiskId } = await params;
        const body = await req.json();
        const { date, score, findings, assessor } = body;
        const findingsArr = Array.isArray(findings) ? findings : [findings].filter(Boolean);
        const riskTier = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
        await prisma.vendorAssessment.create({
            data: {
                vendorRiskId,
                date: date ?? new Date().toISOString().split('T')[0],
                score: score ?? 0,
                findings: JSON.stringify(findingsArr),
                assessor: assessor ?? '',
            },
        });
        const v = await prisma.vendorRisk.update({
            where: { id: vendorRiskId },
            data: { lastAssessment: date ?? new Date().toISOString().split('T')[0], riskScore: score ?? 0, riskTier },
            include: { assessmentHistory: true },
        });
        return NextResponse.json(mapVendorRisk(v), { status: 201 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor risk assessment POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
