export const SKILL_IDS = {
    CAIQ_MATCH: 'caiq.match',
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
