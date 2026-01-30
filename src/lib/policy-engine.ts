import { COMPLIANCE_FRAMEWORKS, FrameworkID, FrameworkControl } from './compliance-frameworks';

export interface PolicyGap {
    controlId: string;
    frameworkName: string;
    policyTextFound: string | null;
    gapDescription: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    remediationSuggestion: string;
}

export interface AnalysisResult {
    score: number;
    vagueTermsCount: number;
    identifiedGaps: PolicyGap[];
    strongPoints: string[];
}

const VAGUE_TERMS = ['should', 'try', 'strive', 'best effort', 'as appropriate', 'where possible', 'encourage'];

export function analyzePolicy(policyText: string, targetFrameworks: FrameworkID[]): AnalysisResult {
    const findings: PolicyGap[] = [];
    let vagueCount = 0;
    const lowerText = policyText.toLowerCase();

    // 1. Vague Language Detection (Policy Theater Check)
    VAGUE_TERMS.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = policyText.match(regex);
        if (matches) {
            vagueCount += matches.length;
        }
    });

    // 2. Framework Gap Analysis
    targetFrameworks.forEach(fwId => {
        const framework = COMPLIANCE_FRAMEWORKS[fwId];
        if (!framework) return;

        framework.controls.forEach(control => {
            // Very basic keyword heuristic for "Does this policy mention this concept?"
            // In a real AI implementation, this would use semantic similarity/embedding search.
            // Here we simulate it with keyword matching on the control name/desc.
            const keywords = [...control.name.split(' '), ...control.description.split(' ')]
                .filter(w => w.length > 4)
                .map(w => w.toLowerCase());

            const hasCoverage = keywords.some(k => lowerText.includes(k));

            if (!hasCoverage) {
                findings.push(createGap(control, framework.name, "No explicit coverage found for this requirement."));
            } else if (vagueCount > 5 && control.riskLevel === 'CRITICAL') {
                // If policy is detected as vague, flag critical controls as potential gaps even if keywords exist
                findings.push(createGap(control, framework.name, "Topic mentioned, but detected vague language ('should', 'try') undermines enforcement."));
            }
        });
    });

    // Calculate Score (0-100)
    // Higher vague count reduces score. More gaps reduce score.
    const baseScore = 100;
    const gapPenalty = findings.reduce((acc, gap) => {
        switch (gap.riskLevel) {
            case 'CRITICAL': return acc + 20;
            case 'HIGH': return acc + 10;
            case 'MEDIUM': return acc + 5;
            default: return acc + 1;
        }
    }, 0);

    const finalScore = Math.max(0, baseScore - gapPenalty - (vagueCount * 2));

    return {
        score: finalScore,
        vagueTermsCount: vagueCount,
        identifiedGaps: findings,
        strongPoints: finalScore > 80 ? ['Policy appears robust against selected frameworks.'] : []
    };
}

function createGap(control: FrameworkControl, fwName: string, reason: string): PolicyGap {
    return {
        controlId: control.id,
        frameworkName: fwName,
        policyTextFound: null,
        gapDescription: reason,
        riskLevel: control.riskLevel,
        remediationSuggestion: `Explicitly define procedures for '${control.name}'. Ensure evidential artifacts like ${control.evidenceRequired.join(', ')} are mandated.`
    };
}
