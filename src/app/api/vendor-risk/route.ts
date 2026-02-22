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

export async function GET() {
    try {
        const list = await prisma.vendorRisk.findMany({
            include: { assessmentHistory: true },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(list.map(mapVendorRisk));
    } catch (error: unknown) {
        console.error('Vendor risk GET:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const riskScore = body.riskScore ?? 0;
        const riskTier = riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';
        const v = await prisma.vendorRisk.create({
            data: {
                name: body.name,
                category: body.category ?? 'OTHER',
                description: body.description ?? '',
                status: body.status ?? 'PENDING',
                riskTier,
                riskScore,
                dataAccess: JSON.stringify(body.dataAccess ?? []),
                complianceCertifications: JSON.stringify(body.complianceCertifications ?? []),
                contractExpiry: body.contractExpiry ?? '',
                lastAssessment: body.lastAssessment ?? '',
                contactName: body.contactName ?? '',
                contactEmail: body.contactEmail ?? '',
                notes: body.notes ?? '',
            },
            include: { assessmentHistory: true },
        });
        return NextResponse.json(mapVendorRisk(v), { status: 201 });
    } catch (error: unknown) {
        console.error('Vendor risk POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
