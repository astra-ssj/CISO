import { describe, expect, it } from 'vitest';
import { scoreTabletop, runTabletopScore } from '@/lib/skills/tabletop-score';
import type { SessionState } from '@/lib/exercises/types';

const state: SessionState = {
    sessionId: 's1',
    scenarioSlug: 'ransomware',
    mode: 'decision',
    currentStep: 1,
    dollars: -200000,
    repInternal: 80,
    repExternal: 85,
    decisions: {},
    responses: {},
    commsDrafts: {},
    history: [
        {
            stepId: 1,
            time: 'T+0',
            title: 'First call',
            choiceId: 'a',
            choiceLabel: 'Notify board',
            role: 'cfo',
            dollars: -200000,
            repInt: 10,
            repExt: 20,
            consequence: 'Board is informed.',
            confidence: 'high',
        },
    ],
};

describe('skill tabletop.score@1.0.0', () => {
    it('scores the same session twice identically', () => {
        const input = { state, scenario: { id: 'sc-1', slug: 'ransomware', title: 'Ransomware' } };
        expect(scoreTabletop(input)).toEqual(scoreTabletop(input));
        expect(scoreTabletop(input).grade).toMatch(/^[A-F]$/);
    });

    it('same input hash for the same history', () => {
        const input = { state, scenario: { id: 'sc-1', slug: 'ransomware', title: 'Ransomware' } };
        const a = runTabletopScore(input, '2026-01-01T00:00:00.000Z');
        const b = runTabletopScore(input, '2026-01-01T00:00:00.000Z');
        expect(a.skillId).toBe('tabletop.score');
        expect(a.inputHash).toBe(b.inputHash);
    });
});
