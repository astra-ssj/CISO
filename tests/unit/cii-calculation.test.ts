/**
 * Unit test — Country Instability Index (CII) calculation
 * Tests the computeCII function with various signal scenarios.
 */

import { describe, it, expect, vi } from 'vitest';

vi.unmock('@/lib/intelligence/instability-index');

import { computeCII, computeAllCII, ciiColor } from '@/lib/intelligence/instability-index';
import type { IntelligenceSignal } from '@/lib/intelligence/signal-aggregator';

// ── Fixtures ────────────────────────────────────────────────────
const recentTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1h ago

function makeSignal(country: string, type: string, severity: string, extra?: Record<string, unknown>): IntelligenceSignal {
    return {
        id: `sig-${Math.random().toString(36).slice(2)}`,
        type, severity, country,
        timestamp: recentTime,
        title: 'Test signal',
        source: 'test',
        latitude: 0, longitude: 0, region: 'test', description: 'test', metadata: {},
        ...extra,
    } as IntelligenceSignal;
}

// ── Tests ───────────────────────────────────────────────────────
describe('Unit: computeCII', () => {
    it('returns baseline score for country with no signals', () => {
        const result = computeCII('UA', []);
        // Ukraine baseline is 90, weighted at 40% → 36
        expect(result.score).toBe(36);
        expect(result.countryCode).toBe('UA');
        expect(result.riskLevel).toBe('medium');
    });

    it('returns default baseline for unknown country codes', () => {
        const result = computeCII('XX', []);
        // Default baseline is 20, weighted at 40% → 8
        expect(result.score).toBe(8);
        expect(result.riskLevel).toBe('low');
    });

    it('handles case-insensitive country codes', () => {
        const a = computeCII('ua', []);
        const b = computeCII('UA', []);
        expect(a.score).toBe(b.score);
    });

    it('increases score with unrest signals (PROTEST)', () => {
        const protests = Array.from({ length: 10 }, () =>
            makeSignal('CH', 'PROTEST', 'HIGH')
        );
        const withSignals = computeCII('CH', protests);
        const baseline = computeCII('CH', []);
        expect(withSignals.score).toBeGreaterThan(baseline.score);
    });

    it('increases score with military activity', () => {
        const military = Array.from({ length: 10 }, () =>
            makeSignal('UA', 'MILITARY_FLIGHT', 'HIGH', { metadata: { origin_country: 'RU' } })
        );
        const withSignals = computeCII('UA', military);
        const baseline = computeCII('UA', []);
        expect(withSignals.score).toBeGreaterThan(baseline.score);
        expect(withSignals.factors).toContain('military_activity');
        expect(withSignals.factors).toContain('foreign_military_presence');
    });

    it('increases score with high news velocity', () => {
        const news = Array.from({ length: 15 }, () =>
            makeSignal('DE', 'NEWS', 'CRITICAL')
        );
        const withSignals = computeCII('DE', news);
        const baseline = computeCII('DE', []);
        expect(withSignals.score).toBeGreaterThan(baseline.score);
    });

    it('clamps score between 0 and 100', () => {
        const massive = Array.from({ length: 100 }, () =>
            makeSignal('AF', 'PROTEST', 'CRITICAL')
        );
        const result = computeCII('AF', massive);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('respects custom threshold', () => {
        const result = computeCII('CH', [], { threshold: 10 });
        expect(result.threshold).toBe(10);
        expect(result.exceedsThreshold).toBe(result.score >= 10);
    });

    it('detects cyber threat factor', () => {
        const signals = [makeSignal('UA', 'CYBER', 'HIGH')];
        const result = computeCII('UA', signals);
        expect(result.factors).toContain('cyber_threat');
    });

    it('returns correct breakdown structure', () => {
        const result = computeCII('US', []);
        expect(result.breakdown).toHaveProperty('baseline');
        expect(result.breakdown).toHaveProperty('unrest');
        expect(result.breakdown).toHaveProperty('security');
        expect(result.breakdown).toHaveProperty('infoVelocity');
    });

    it('identifies high baseline countries', () => {
        const result = computeCII('AF', []); // Afghanistan baseline 85
        expect(result.factors).toContain('high_baseline_risk');
    });
});

describe('Unit: computeAllCII', () => {
    it('returns results sorted by score descending', () => {
        const results = computeAllCII(['CH', 'UA', 'AF'], []);
        for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
        }
    });

    it('returns one result per country', () => {
        const results = computeAllCII(['US', 'GB', 'DE'], []);
        expect(results).toHaveLength(3);
        const codes = results.map(r => r.countryCode);
        expect(new Set(codes).size).toBe(3);
    });
});

describe('Unit: ciiColor', () => {
    it('returns red for critical (>= 80)', () => {
        const [r] = ciiColor(85);
        expect(r).toBe(239);
    });

    it('returns orange for high (60-79)', () => {
        const [r] = ciiColor(65);
        expect(r).toBe(249);
    });

    it('returns yellow for medium (30-59)', () => {
        const [r] = ciiColor(45);
        expect(r).toBe(250);
    });

    it('returns green for low (< 30)', () => {
        const [r] = ciiColor(10);
        expect(r).toBe(34);
    });
});
