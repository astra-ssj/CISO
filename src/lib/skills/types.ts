export const SKILL_IDS = {
    CAIQ_MATCH: 'caiq.match',
    CAIQ_SCORE: 'caiq.score',
    RISK_FIVE_BY_FIVE: 'risk.fiveByFive',
    EVIDENCE_EXPIRY: 'evidence.expiry',
} as const;

export type SkillId = (typeof SKILL_IDS)[keyof typeof SKILL_IDS];

export type SkillConfidence = 'high' | 'medium' | 'low';

export interface SkillRunResult<T> {
    skillId: SkillId;
    skillVersion: string;
    inputHash: string;
    output: T;
    asOf: string;
}
