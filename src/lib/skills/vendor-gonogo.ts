import { hashCanonical } from './hash';
import { SKILL_IDS, type SkillRunResult } from './types';

export const VENDOR_GO_NO_GO_VERSION = '1.0.0';

export type GoNoGoDecision = 'go' | 'conditional' | 'no-go';

export interface VendorGoNoGoAppetite {
    minCoveragePct: number;
    maxShodanRisk: number;
}

export interface VendorGoNoGoInput {
    vendorName: string;
    coveragePct: number;
    riskTier: string;
    shodanRiskScore: number | null;
    criticalGaps: number;
    appetite?: VendorGoNoGoAppetite;
}

export interface VendorGoNoGoOutput {
    decision: GoNoGoDecision;
    reasons: string[];
    appetite: VendorGoNoGoAppetite;
}

const DEFAULT_APPETITE: VendorGoNoGoAppetite = {
    minCoveragePct: 70,
    maxShodanRisk: 60,
};

/**
 * Deterministic vendor go/no-go. Rules, not a prompt.
 * Same score + snapshot + appetite → same decision.
 */
export function decideGoNoGo(input: VendorGoNoGoInput): VendorGoNoGoOutput {
    const appetite = {
        minCoveragePct: input.appetite?.minCoveragePct ?? DEFAULT_APPETITE.minCoveragePct,
        maxShodanRisk: input.appetite?.maxShodanRisk ?? DEFAULT_APPETITE.maxShodanRisk,
    };
    const reasons: string[] = [];
    const tier = input.riskTier.toLowerCase();

    if (tier === 'critical') {
        reasons.push(`Assessment tier is Critical.`);
    }
    if (input.criticalGaps > 0) {
        reasons.push(`${input.criticalGaps} critical questionnaire gap(s).`);
    }
    if (input.coveragePct < appetite.minCoveragePct) {
        reasons.push(`KB coverage ${input.coveragePct}% is below appetite ${appetite.minCoveragePct}%.`);
    }
    if (input.shodanRiskScore !== null && input.shodanRiskScore > appetite.maxShodanRisk) {
        reasons.push(`Shodan snapshot risk ${input.shodanRiskScore} exceeds appetite ${appetite.maxShodanRisk}.`);
    }

    let decision: GoNoGoDecision = 'go';
    if (tier === 'critical' || (input.shodanRiskScore !== null && input.shodanRiskScore >= 80)) {
        decision = 'no-go';
    } else if (reasons.length > 0 || tier === 'high') {
        decision = 'conditional';
    }

    if (decision === 'go') {
        reasons.push('Coverage, tier, and last Shodan snapshot are within appetite.');
    }

    return { decision, reasons, appetite };
}

export function runGoNoGo(input: VendorGoNoGoInput, asOf: string = '1970-01-01T00:00:00.000Z'): SkillRunResult<VendorGoNoGoOutput> {
    const output = decideGoNoGo(input);
    return {
        skillId: SKILL_IDS.VENDOR_GO_NO_GO,
        skillVersion: VENDOR_GO_NO_GO_VERSION,
        inputHash: hashCanonical({
            skillVersion: VENDOR_GO_NO_GO_VERSION,
            vendorName: input.vendorName,
            coveragePct: input.coveragePct,
            riskTier: input.riskTier,
            shodanRiskScore: input.shodanRiskScore,
            criticalGaps: input.criticalGaps,
            appetite: output.appetite,
        }),
        output,
        asOf,
    };
}
