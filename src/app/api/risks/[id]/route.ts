import { NextResponse } from 'next/server';
import { calculateRisk, type RiskScenario } from '@/lib/risk-engine/fair';
import prisma from '@/lib/prisma';

const THREAT_ACTORS: RiskScenario['threatActor'][] = ['NATION_STATE', 'CYBER_CRIMINAL', 'INSIDER', 'HACKTIVIST', 'SCRIPT_KIDDIE'];

function mapRiskToEntry(r: Awaited<ReturnType<typeof prisma.riskScenario.findUnique>> & { history: { date: Date; score: number; ale: number }[] }) {
    if (!r) return null;
    return {
        id: r.id,
        scenario: {
            id: r.id,
            assetName: r.title,
            threatActor: r.threatActor,
            threatEventFrequency: r.threatEventFreq,
            vulnerability: r.vulnerability,
            primaryLoss: r.primaryLoss,
            secondaryLoss: r.secondaryLoss,
            controlsEffective: r.controlsEffective,
        },
        analysis: calculateRisk({
            id: r.id,
            assetName: r.title,
            threatActor: THREAT_ACTORS.includes(r.threatActor as RiskScenario['threatActor']) ? r.threatActor as RiskScenario['threatActor'] : 'CYBER_CRIMINAL',
            threatEventFrequency: r.threatEventFreq,
            vulnerability: r.vulnerability,
            primaryLoss: r.primaryLoss,
            secondaryLoss: r.secondaryLoss,
            controlsEffective: r.controlsEffective,
        }),
        owner: r.ownerId,
        notes: r.description || '',
        status: r.status,
        history: r.history.map((h) => ({
            date: h.date.toISOString().split('T')[0],
            score: h.score,
            ale: h.ale,
        })),
        createdAt: r.createdAt.toISOString().split('T')[0],
        updatedAt: r.updatedAt.toISOString().split('T')[0],
    };
}

// PUT /api/risks/[id] — Update risk scenario (and optionally append history)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { scenario, owner, notes, status } = body;

        const existing = await prisma.riskScenario.findUnique({ where: { id }, include: { history: true } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let data: Parameters<typeof prisma.riskScenario.update>[0]['data'] = {};
        let createHistory: { score: number; ale: number } | null = null;

        if (scenario) {
            const analysis = calculateRisk(scenario);
            data = {
                title: scenario.assetName,
                threatActor: scenario.threatActor,
                threatEventFreq: scenario.threatEventFrequency,
                vulnerability: scenario.vulnerability,
                primaryLoss: scenario.primaryLoss,
                secondaryLoss: scenario.secondaryLoss,
                controlsEffective: scenario.controlsEffective,
                ale: analysis.annualizedLossExpectancy,
                riskScore: analysis.riskScore,
            };
            createHistory = { score: analysis.riskScore, ale: analysis.annualizedLossExpectancy };
        }
        if (owner !== undefined) data.ownerId = owner;
        if (notes !== undefined) data.description = notes;
        if (status !== undefined) data.status = status;

        const risk = await prisma.riskScenario.update({
            where: { id },
            data: {
                ...data,
                ...(createHistory && {
                    history: { create: createHistory },
                }),
            },
            include: { history: { orderBy: { date: 'asc' } } },
        });

        return NextResponse.json(mapRiskToEntry(risk));
    } catch (error: unknown) {
        console.error('Risk Update Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/risks/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.riskScenario.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        console.error('Risk Delete Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
