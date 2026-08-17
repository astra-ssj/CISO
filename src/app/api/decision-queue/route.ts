import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api/require-session';
import prisma from '@/lib/prisma';
import { scoreEvidenceExpiry } from '@/lib/skills/evidence-expiry';
import { scoreFiveByFive } from '@/lib/skills/risk-five-by-five';

export interface DecisionQueueItem {
    id: string;
    kind: 'evidence_expired' | 'evidence_expiring' | 'open_risk' | 'skill_run';
    title: string;
    detail: string;
    href: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    skillRunId: string | null;
    asOf: string;
}

/**
 * GET /api/decision-queue
 * Real work that needs a human: expired evidence, open 5×5 risks, recent skill runs.
 * Empty is honest. No DEMO_TICKETS.
 */
export async function GET() {
    const { error } = await requireSession();
    if (error) return error;

    const asOf = new Date().toISOString();
    const items: DecisionQueueItem[] = [];

    const [evidence, risks, skillRuns] = await Promise.all([
        prisma.evidence.findMany({
            select: { id: true, title: true, status: true, expiresAt: true },
            take: 2000,
        }),
        prisma.risk.findMany({
            where: { status: { in: ['Open', 'Mitigating'] } },
            orderBy: { inherentScore: 'desc' },
            take: 50,
        }),
        prisma.skillRun.findMany({
            orderBy: { createdAt: 'desc' },
            take: 15,
        }),
    ]);

    const expiry = scoreEvidenceExpiry({
        asOf,
        windowDays: 30,
        items: evidence.map((e) => ({
            id: e.id,
            title: e.title,
            status: e.status,
            expiresAt: e.expiresAt ? e.expiresAt.toISOString() : null,
        })),
    });

    for (const hit of expiry.expired) {
        items.push({
            id: `evidence-expired-${hit.id}`,
            kind: 'evidence_expired',
            title: `Evidence expired: ${hit.title}`,
            detail: `Expired ${Math.abs(hit.daysUntil)} day(s) ago. Status ${hit.status}.`,
            href: '/governance',
            urgency: 'CRITICAL',
            skillRunId: null,
            asOf,
        });
    }
    for (const hit of expiry.expiring) {
        items.push({
            id: `evidence-expiring-${hit.id}`,
            kind: 'evidence_expiring',
            title: `Evidence expiring: ${hit.title}`,
            detail: `${hit.daysUntil} day(s) remaining (30-day window).`,
            href: '/governance',
            urgency: hit.daysUntil <= 7 ? 'HIGH' : 'MEDIUM',
            skillRunId: null,
            asOf,
        });
    }

    for (const risk of risks) {
        const scored = scoreFiveByFive({
            likelihood: risk.likelihood,
            impact: risk.impact,
        });
        items.push({
            id: `risk-${risk.id}`,
            kind: 'open_risk',
            title: `Open risk: ${risk.title}`,
            detail: `Inherent ${scored.inherentScore}/25 (${scored.inherentBand}). Owner ${risk.owner}.`,
            href: '/governance',
            urgency: scored.inherentBand === 'critical' ? 'CRITICAL'
                : scored.inherentBand === 'high' ? 'HIGH'
                : scored.inherentBand === 'medium' ? 'MEDIUM'
                : 'LOW',
            skillRunId: null,
            asOf,
        });
    }

    for (const run of skillRuns) {
        items.push({
            id: `skill-${run.id}`,
            kind: 'skill_run',
            title: `Skill ${run.skillId}@${run.skillVersion}`,
            detail: `inputHash ${run.inputHash.slice(0, 12)}…`,
            href: '/vendors',
            urgency: 'LOW',
            skillRunId: run.id,
            asOf: run.asOf.toISOString(),
        });
    }

    const urgencyRank: Record<DecisionQueueItem['urgency'], number> = {
        CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
    };
    items.sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency]);

    return NextResponse.json({
        asOf,
        empty: items.filter((i) => i.kind !== 'skill_run').length === 0,
        counts: {
            evidenceExpired: expiry.expired.length,
            evidenceExpiring: expiry.expiring.length,
            openRisks: risks.length,
            skillRuns: skillRuns.length,
        },
        items,
    });
}
