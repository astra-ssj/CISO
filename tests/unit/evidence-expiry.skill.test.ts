import { describe, expect, it } from 'vitest';
import { scoreEvidenceExpiry, runEvidenceExpiry, EVIDENCE_EXPIRY_VERSION } from '@/lib/skills/evidence-expiry';

const items = [
    { id: 'e-expired', title: 'ISO cert 2024', status: 'ACTIVE', expiresAt: '2026-01-01T00:00:00.000Z' },
    { id: 'e-soon', title: 'SOC2 2026', status: 'ACTIVE', expiresAt: '2026-08-20T00:00:00.000Z' },
    { id: 'e-ok', title: 'Pen test 2027', status: 'ACTIVE', expiresAt: '2027-01-01T00:00:00.000Z' },
    { id: 'e-none', title: 'Screenshot', status: 'ACTIVE', expiresAt: null },
];

describe('skill evidence.expiry@1.0.0', () => {
    it('splits expired / expiring / current using asOf as the clock', () => {
        const out = scoreEvidenceExpiry({
            asOf: '2026-08-17T00:00:00.000Z',
            windowDays: 30,
            items,
        });

        expect(out.expired.map((e) => e.id)).toEqual(['e-expired']);
        expect(out.expiring.map((e) => e.id)).toEqual(['e-soon']);
        expect(out.current).toBe(1);
        expect(out.unscored).toBe(1);
        expect(out.expired[0].daysUntil).toBe(-228);
        expect(out.expiring[0].daysUntil).toBe(3);
    });

    it('is deterministic for the same asOf', () => {
        const input = { asOf: '2026-08-17T12:00:00.000Z', windowDays: 14, items };
        expect(scoreEvidenceExpiry(input)).toEqual(scoreEvidenceExpiry(input));
    });

    it('same input hash for the same skill run payload regardless of item order', () => {
        const asOf = '2026-08-17T00:00:00.000Z';
        const a = runEvidenceExpiry({ asOf, windowDays: 30, items }, asOf);
        const b = runEvidenceExpiry({ asOf, windowDays: 30, items: [...items].reverse() }, asOf);
        expect(a.skillId).toBe('evidence.expiry');
        expect(a.skillVersion).toBe(EVIDENCE_EXPIRY_VERSION);
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output.expired).toEqual(b.output.expired);
    });
});
