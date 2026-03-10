import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: vendorId } = await params;
        const body = await req.json();
        const { date, score, findings, assessor } = body;
        
        const riskTier = score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low';
        
        await prisma.vendorAssessment.create({
            data: {
                vendorId,
                assessmentDate: date ? new Date(date) : new Date(),
                overallScore: score ?? 0,
                domainScores: JSON.stringify({}), // mock
                criticalGaps: findings ? findings.length : 0,
                status: 'Complete',
                assessedBy: assessor ?? '',
            },
        });
        
        const v = await prisma.vendor.update({
            where: { id: vendorId },
            data: { 
                lastAssessedAt: date ? new Date(date) : new Date(),
                riskScore: score ?? 0, 
                riskTier 
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
        
        return NextResponse.json(mapped, { status: 201 });
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('Vendor assessment POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
