import { NextResponse } from 'next/server';
import { calculateRisk, type RiskScenario } from '@/lib/risk-engine/fair';
import prisma from '@/lib/prisma';

const THREAT_ACTORS: RiskScenario['threatActor'][] = ['NATION_STATE', 'CYBER_CRIMINAL', 'INSIDER', 'HACKTIVIST', 'SCRIPT_KIDDIE'];

// GET /api/risks — Fetch all risk scenarios with history
export async function GET() {
    try {
        const risks = await prisma.riskScenario.findMany({
            include: { history: { orderBy: { date: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });

        // Map DB rows → frontend RiskEntry shape
        const entries = risks.map((r) => ({
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
        }));

        return NextResponse.json(entries);
    } catch (error: unknown) {
        console.error('Risk API Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/risks — Create a new risk scenario
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { scenario, owner, notes } = body;

        const analysis = calculateRisk(scenario);

        const risk = await prisma.riskScenario.create({
            data: {
                title: scenario.assetName,
                description: notes,
                ownerId: owner,
                status: 'OPEN',
                threatActor: scenario.threatActor,
                threatEventFreq: scenario.threatEventFrequency,
                vulnerability: scenario.vulnerability,
                primaryLoss: scenario.primaryLoss,
                secondaryLoss: scenario.secondaryLoss,
                controlsEffective: scenario.controlsEffective,
                ale: analysis.annualizedLossExpectancy,
                riskScore: analysis.riskScore,
                history: {
                    create: {
                        score: analysis.riskScore,
                        ale: analysis.annualizedLossExpectancy,
                    },
                },
            },
            include: { history: true },
        });

        // Return same shape as GET for client
        const r = risk;
        const entry = {
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
        return NextResponse.json(entry, { status: 201 });
    } catch (error: unknown) {
        console.error('Risk Create Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
