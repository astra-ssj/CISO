import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/api/require-session';
import { runCaiqScore } from '@/lib/skills/caiq-score';
import { runGoNoGo } from '@/lib/skills/vendor-gonogo';
import { persistSkillRun } from '@/lib/skills/persist';
import { canonicalizeAssessmentAnswer } from '@/lib/caiq/answer-normalizer';

interface AssessmentQuestion {
    domain?: string;
    answer?: unknown;
    answerType?: unknown;
    matchedEntryId?: string;
}


/**
 * Finalize assessment computation.
 *
 * This endpoint intentionally computes and persists the assessment + SkillRuns,
 * but does NOT approve/reject the vendor. The returned go/no-go is a
 * recommendation for a human decision workflow.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { user, error } = await requirePermission('vendor:write');
    if (error) return error;

    try {
        const { id: vendorId } = await params;
        const body = await req.json() as { questions?: AssessmentQuestion[]; assessor?: string };
        const questions = body.questions;
        const assessor = body.assessor || user?.name || 'System';

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: 'questions array is required' }, { status: 400 });
        }

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        const domainScores: Record<string, {
            total: number;
            yes: number;
            no: number;
            partial: number;
            na: number;
            unknown: number;
            score: number;
        }> = {};

        let weightedPassed = 0;
        let scorableCount = 0;
        let criticalGaps = 0;

        for (const question of questions) {
            const domain = question.domain?.trim() || 'General';
            const state = canonicalizeAssessmentAnswer(question);
            domainScores[domain] ??= {
                total: 0, yes: 0, no: 0, partial: 0, na: 0, unknown: 0, score: 0,
            };
            const domainScore = domainScores[domain];
            domainScore.total += 1;

            if (state === 'NA') {
                domainScore.na += 1;
                continue;
            }

            scorableCount += 1;
            if (state === 'YES') {
                domainScore.yes += 1;
                weightedPassed += 1;
            } else if (state === 'PARTIAL') {
                domainScore.partial += 1;
                weightedPassed += 0.5;
            } else if (state === 'NO') {
                domainScore.no += 1;
                criticalGaps += 1;
            } else {
                // UNKNOWN is deliberately not a pass. Ambiguous prose must be
                // normalized by the user/AI-draft review flow first.
                domainScore.unknown += 1;
            }
        }

        for (const domain of Object.values(domainScores)) {
            const applicable = domain.yes + domain.no + domain.partial + domain.unknown;
            domain.score = applicable === 0
                ? 100
                : Math.round(((domain.yes + (domain.partial * 0.5)) / applicable) * 100);
        }

        const overallScore = scorableCount === 0
            ? 0
            : Math.round((weightedPassed / scorableCount) * 100);

        let riskTier = 'Low';
        if (overallScore <= 40) riskTier = 'Critical';
        else if (overallScore <= 60) riskTier = 'High';
        else if (overallScore <= 80) riskTier = 'Medium';

        await prisma.vendorAssessment.create({
            data: {
                vendorId,
                assessmentDate: new Date(),
                overallScore,
                domainScores: JSON.stringify(domainScores),
                criticalGaps,
                status: 'Complete',
                assessedBy: assessor,
            },
        });

        // Knowledge coverage means an approved KB match exists. A non-empty
        // free-text answer is not automatically treated as covered.
        const hits = questions.map((q) => ({
            entryId: q.matchedEntryId ? String(q.matchedEntryId) : null,
            confidence: (q.matchedEntryId ? 'high' : 'low') as 'high' | 'low',
            matchTier: (q.matchedEntryId ? 1 : 0) as 0 | 1,
        }));

        const scoreRun = runCaiqScore({ hits }, new Date().toISOString());
        const scoreRunId = await persistSkillRun(scoreRun);

        const lastScan = await prisma.observation.findFirst({
            where: {
                integrationId: 'shodan',
                operation: { in: ['vendorScan', 'attackSurface'] },
                status: 'ok',
            },
            orderBy: { fetchedAt: 'desc' },
        });

        let shodanRiskScore: number | null = null;
        if (lastScan?.payload) {
            try {
                const parsed = JSON.parse(lastScan.payload) as { riskScore?: number };
                if (typeof parsed.riskScore === 'number') shodanRiskScore = parsed.riskScore;
            } catch {
                // Corrupt/legacy observations are ignored rather than invented.
            }
        }

        const goNoGo = runGoNoGo({
            vendorName: vendor.name,
            coveragePct: scoreRun.output.coveragePct,
            riskTier,
            shodanRiskScore,
            criticalGaps,
        }, scoreRun.asOf);
        const goNoGoRunId = await persistSkillRun(goNoGo, lastScan ? [lastScan.id] : []);

        // Assessment facts may update immediately, but the recommendation must
        // not auto-approve/reject the vendor.
        const updatedVendor = await prisma.vendor.update({
            where: { id: vendorId },
            data: {
                riskScore: overallScore,
                riskTier,
                lastAssessedAt: new Date(),
                status: 'Under Review',
            },
        });

        const proposedStatus = goNoGo.output.decision === 'go'
            ? 'Approved'
            : goNoGo.output.decision === 'conditional'
                ? 'Conditionally Approved'
                : 'Requires Reassessment';

        const urgency = riskTier === 'Critical'
            ? 'CRITICAL'
            : riskTier === 'High'
                ? 'HIGH'
                : riskTier === 'Medium'
                    ? 'MEDIUM'
                    : 'LOW';

        const decision = await prisma.decision.create({
            data: {
                pillar: 'VENDOR',
                urgency,
                status: 'PENDING',
                title: `Vendor assessment: ${vendor.name}`,
                question: `Should ${vendor.name} be ${proposedStatus.toLowerCase()}?`,
                context: JSON.stringify({
                    overallScore,
                    riskTier,
                    criticalGaps,
                    coveragePct: scoreRun.output.coveragePct,
                    shodanRiskScore,
                }),
                recommendationAction: goNoGo.output.decision === 'go'
                    ? 'APPROVE'
                    : goNoGo.output.decision === 'conditional'
                        ? 'APPROVE_WITH_CONDITIONS'
                        : 'REJECT',
                recommendationSummary: `Recommended outcome: ${proposedStatus}`,
                recommendationRationale: goNoGo.output.reasons.join(' '),
                confidenceValue: 0,
                confidenceLabel: 'UNSCORED',
                source: 'SKILL',
                skillRunId: goNoGoRunId,
                sourceResourceType: 'VENDOR',
                sourceResourceId: vendor.id,
                evidenceIds: JSON.stringify(lastScan ? [lastScan.id] : []),
                executionType: 'VENDOR_STATUS',
                executionPayload: JSON.stringify({
                    vendorId: vendor.id,
                    status: proposedStatus,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            updatedVendor,
            assessment: {
                overallScore,
                riskTier,
                criticalGaps,
                domainScores,
            },
            coverage: scoreRun.output,
            recommendation: {
                ...goNoGo.output,
                proposedVendorStatus: proposedStatus,
                skillRunId: goNoGoRunId,
                coverageSkillRunId: scoreRunId,
            },
            decisionId: decision.id,
            requiresHumanDecision: true,
        });
    } catch (error: unknown) {
        console.error('Vendor finalize-assessment POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
