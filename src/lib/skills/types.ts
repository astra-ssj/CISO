export const SKILL_IDS = {
    CAIQ_MATCH: 'caiq.match',
    CAIQ_SCORE: 'caiq.score',
    CAIQ_DRAFT: 'caiq.draft',
    RISK_FIVE_BY_FIVE: 'risk.fiveByFive',
    EVIDENCE_EXPIRY: 'evidence.expiry',
    VENDOR_GO_NO_GO: 'vendor.goNoGo',
    TABLETOP_SCORE: 'tabletop.score',
    INTEL_CORRELATE: 'intel.correlate',
    PLAYBOOK_NEXT_STEP: 'playbook.nextStep',
} as const;

export type SkillId = (typeof SKILL_IDS)[keyof typeof SKILL_IDS];

/** Exact HTTP paths OpenNeko must call (not a naive skillId slug). */
export const SKILL_HTTP_PATHS: Record<SkillId, string> = {
    'caiq.match': '/api/skills/caiq-match',
    'caiq.score': '/api/skills/caiq-score',
    'caiq.draft': '/api/skills/caiq-draft',
    'risk.fiveByFive': '/api/skills/risk-five-by-five',
    'evidence.expiry': '/api/skills/evidence-expiry',
    'vendor.goNoGo': '/api/skills/vendor-gonogo',
    'tabletop.score': '/api/skills/tabletop-score',
    'intel.correlate': '/api/skills/intel-correlate',
    'playbook.nextStep': '/api/skills/playbook-next-step',
};

export type SkillConfidence = 'high' | 'medium' | 'low';

export interface SkillRunResult<T> {
    skillId: SkillId;
    skillVersion: string;
    inputHash: string;
    output: T;
    asOf: string;
}
