import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { runCaiqScore } from '@/lib/skills/caiq-score';
import { runGoNoGo } from '@/lib/skills/vendor-gonogo';
import { runFiveByFive } from '@/lib/skills/risk-five-by-five';
import { persistSkillRun } from '@/lib/skills/persist';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: vendorId } = await params;
        const body = await req.json();
        const { questions, assessor } = body; // expecting questions array from Quick Answer
        
        if (!questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: 'questions array is required' }, { status: 400 });
        }

        // Auto-scoring logic
        // 1. Calculate domain completeness and compliance
        // Here we do a simplified score based on how many questions were answered 'YES' or explicitly passed vs total
        // We simulate a breakdown per domain
        const domainScores: Record<string, { total: number; passed: number; score: number }> = {};
        let totalPassed = 0;
        let criticalGaps = 0;

        questions.forEach((q: { domain?: string; answer?: unknown }) => {
            const domain = q.domain || 'General';
            if (!domainScores[domain]) {
                domainScores[domain] = { total: 0, passed: 0, score: 0 };
            }
            domainScores[domain].total++;
            
            // Basic simplistic grading rule
            // In a real scenario, this relies on proper answer mappings
            const answer = String(q.answer).toLowerCase();
            const isPassed = ['yes', 'true', 'implemented', 'compliant'].some(keyword => answer.includes(keyword));
            const isFailed = ['no', 'false', 'not implemented', 'non-compliant'].some(keyword => answer.includes(keyword));
            
            if (isPassed || (!isFailed && answer.length > 5)) {
                domainScores[domain].passed++;
                totalPassed++;
            } else if (isFailed) {
                // assume failed equals a critical gap for this prototype
                criticalGaps++;
            }
        });

        // Calculate overall score 0-100
        const overallScore = questions.length > 0 
            ? Math.round((totalPassed / questions.length) * 100) 
            : 0;

        // Auto risk scoring to Tier
        // 0-40 Critical, 41-60 High, 61-80 Medium, 81-100 Low
        let riskTier = 'Low';
        if (overallScore <= 40) riskTier = 'Critical';
        else if (overallScore <= 60) riskTier = 'High';
        else if (overallScore <= 80) riskTier = 'Medium';

        // 2. Grab vendor to know their data access
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        // 3. Create Assessment Record
        await prisma.vendorAssessment.create({
            data: {
                vendorId,
                assessmentDate: new Date(),
                overallScore,
                domainScores: JSON.stringify(domainScores),
                criticalGaps,
                status: 'Complete',
                assessedBy: assessor || 'System',
            }
        });

        // 4. Update the Vendor
        const hits = (questions as Array<{ answer?: unknown; matchedEntryId?: string }>).map((q) => ({
            entryId: q.matchedEntryId ? String(q.matchedEntryId) : (String(q.answer || '').length > 0 ? 'answered' : null),
            confidence: 'medium' as const,
            matchTier: (q.matchedEntryId ? 1 : 0) as 0 | 1 | 2 | 3,
        }));
        const scoreRun = runCaiqScore({ hits }, new Date().toISOString());
        await persistSkillRun(scoreRun);

        const lastScan = await prisma.observation.findFirst({
            where: { integrationId: 'shodan', operation: { in: ['vendorScan', 'attackSurface'] }, status: 'ok' },
            orderBy: { fetchedAt: 'desc' },
        });
        let shodanRiskScore: number | null = null;
        if (lastScan?.payload) {
            try {
                const parsed = JSON.parse(lastScan.payload) as { riskScore?: number };
                if (typeof parsed.riskScore === 'number') shodanRiskScore = parsed.riskScore;
            } catch { /* ignore */ }
        }

        const goNoGo = runGoNoGo({
            vendorName: vendor.name,
            coveragePct: scoreRun.output.coveragePct,
            riskTier,
            shodanRiskScore,
            criticalGaps,
        }, scoreRun.asOf);
        await persistSkillRun(goNoGo, lastScan ? [lastScan.id] : []);

        const vendorStatus = goNoGo.output.decision === 'go'
            ? 'Approved'
            : goNoGo.output.decision === 'conditional'
                ? 'Conditionally Approved'
                : 'Requires Reassessment';

        const updatedVendor = await prisma.vendor.update({
            where: { id: vendorId },
            data: {
                riskScore: overallScore,
                riskTier,
                lastAssessedAt: new Date(),
                status: vendorStatus,
            }
        });

        // 5. Auto Create Risk Register entry if High or Critical
        if (riskTier === 'Critical' || riskTier === 'High') {
            // High data access + Critical score = likelihood 5, impact 5
            
            // parse data access to impact 1-5
            const accessImpactMap: Record<string, number> = {
                'None': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Critical': 5
            };
            const impact = accessImpactMap[vendor.dataAccess] || 3;
            
            // Risk tier to likelihood 1-5
            const likelihood = riskTier === 'Critical' ? 5 : 4;

            const scored = runFiveByFive({ likelihood, impact }, goNoGo.asOf);
            await persistSkillRun(scored);

            await prisma.risk.create({
                data: {
                    title: `Third-Party Risk: ${vendor.name}`,
                    description: `Created from ${riskTier} vendor assessment. Overall score: ${overallScore}. Critical Gaps: ${criticalGaps}. goNoGo=${goNoGo.output.decision}.`,
                    category: 'ThirdParty',
                    likelihood,
                    impact,
                    inherentScore: scored.output.inherentScore,
                    owner: assessor || 'System',
                    status: 'Open',
                    reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    vendorId: vendor.id,
                }
            });
        } else {
            // If they improved to Medium/Low, could update residual score of existing risk.
            const existingRisk = await prisma.risk.findFirst({
                where: { vendorId: vendor.id, status: 'Open' }
            });
            if (existingRisk) {
                await prisma.risk.update({
                    where: { id: existingRisk.id },
                    data: {
                        residualScore: (riskTier === 'Low' ? 1 : 2) * (existingRisk.impact || 3),
                        status: 'Mitigating',
                        description: existingRisk.description + `\n[Auto Update] Vendor reassessed with improved score: ${overallScore} (${riskTier}).`
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            updatedVendor,
            newScore: overallScore,
            riskTier,
            goNoGo: goNoGo.output,
            coverage: scoreRun.output,
        });

    } catch (error: unknown) {
        console.error('Vendor finalize-assessment POST:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
