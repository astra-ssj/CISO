import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const list = await prisma.vendor.findMany({
            include: { assessmentHistory: true },
            orderBy: { createdAt: 'desc' },
        });
        
        const mapped = list.map(v => ({
            ...v,
            dataAccess: v.dataAccess,
            complianceCertifications: JSON.parse(v.complianceCertifications || '[]') as string[],
            createdAt: v.createdAt.toISOString().split('T')[0],
            // map assessmentHistory
            assessmentHistory: v.assessmentHistory.map(a => ({
                id: a.id,
                date: a.assessmentDate.toISOString().split('T')[0],
                score: a.overallScore,
                findings: [], // we will deprecate findings later
                assessor: a.assessedBy
            }))
        }));
        
        return NextResponse.json(mapped);
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
        const v = await prisma.vendor.create({
            data: {
                name: body.name,
                category: body.category ?? 'OTHER',
                website: body.website ?? '',
                status: body.status ?? 'PENDING',
                riskTier,
                riskScore,
                dataAccess: body.dataAccess ?? 'None',
                complianceCertifications: JSON.stringify(body.complianceCertifications ?? []),
                contactName: body.contactName ?? '',
                contactEmail: body.contactEmail ?? '',
                notes: body.notes ?? '',
            },
            include: { assessmentHistory: true },
        });
        
        const mapped = {
            ...v,
            dataAccess: v.dataAccess,
            complianceCertifications: JSON.parse(v.complianceCertifications || '[]') as string[],
            createdAt: v.createdAt.toISOString().split('T')[0],
            assessmentHistory: []
        };
        
        return NextResponse.json(mapped, { status: 201 });
    } catch (error: unknown) {
        console.error('Vendor risk POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
