import { describe, expect, it } from 'vitest';
import { decideGoNoGo, runGoNoGo, VENDOR_GO_NO_GO_VERSION } from '@/lib/skills/vendor-gonogo';

describe('skill vendor.goNoGo@1.0.0', () => {
    it('goes when coverage and snapshots are within appetite', () => {
        const out = decideGoNoGo({
            vendorName: 'Acme',
            coveragePct: 90,
            riskTier: 'Low',
            shodanRiskScore: 10,
            criticalGaps: 0,
        });
        expect(out.decision).toBe('go');
    });

    it('is no-go on critical tier', () => {
        expect(decideGoNoGo({
            vendorName: 'Acme',
            coveragePct: 100,
            riskTier: 'Critical',
            shodanRiskScore: 0,
            criticalGaps: 0,
        }).decision).toBe('no-go');
    });

    it('is conditional when coverage is below appetite', () => {
        expect(decideGoNoGo({
            vendorName: 'Acme',
            coveragePct: 40,
            riskTier: 'Medium',
            shodanRiskScore: null,
            criticalGaps: 1,
        }).decision).toBe('conditional');
    });

    it('same input hash for the same payload', () => {
        const input = { vendorName: 'Acme', coveragePct: 80, riskTier: 'Low', shodanRiskScore: 5, criticalGaps: 0 };
        const a = runGoNoGo(input, '2026-01-01T00:00:00.000Z');
        const b = runGoNoGo(input, '2026-01-01T00:00:00.000Z');
        expect(a.skillId).toBe('vendor.goNoGo');
        expect(a.skillVersion).toBe(VENDOR_GO_NO_GO_VERSION);
        expect(a.inputHash).toBe(b.inputHash);
        expect(a.output).toEqual(b.output);
    });
});
