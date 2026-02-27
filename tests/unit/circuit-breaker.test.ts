/**
 * Unit test — AI circuit breaker state machine
 * Tests state transitions: closed → open → half-open → closed.
 *
 * Note: vi.unmock is needed because setup.ts may mock this module globally.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure we get the real implementation, not the global mock
vi.unmock('@/lib/ai/circuit-breaker');

import {
    getAllCircuitBreakerMetrics,
    setCircuitState,
    getCircuitState,
} from '@/lib/ai/circuit-breaker';

describe('Unit: Circuit breaker state machine', () => {
    beforeEach(() => {
        setCircuitState('GEMINI', 'closed');
        setCircuitState('ANTHROPIC', 'closed');
    });

    it('defaults to closed state for unknown providers', () => {
        expect(getCircuitState('UNKNOWN_PROVIDER_XYZ')).toBe('closed');
    });

    it('tracks state per provider independently', () => {
        setCircuitState('GEMINI', 'open');
        setCircuitState('ANTHROPIC', 'half-open');

        expect(getCircuitState('GEMINI')).toBe('open');
        expect(getCircuitState('ANTHROPIC')).toBe('half-open');
    });

    it('transitions closed → open', () => {
        setCircuitState('GEMINI', 'closed');
        expect(getCircuitState('GEMINI')).toBe('closed');

        setCircuitState('GEMINI', 'open');
        expect(getCircuitState('GEMINI')).toBe('open');
    });

    it('transitions open → half-open', () => {
        setCircuitState('GEMINI', 'open');
        setCircuitState('GEMINI', 'half-open');
        expect(getCircuitState('GEMINI')).toBe('half-open');
    });

    it('transitions half-open → closed (recovery)', () => {
        setCircuitState('GEMINI', 'half-open');
        setCircuitState('GEMINI', 'closed');
        expect(getCircuitState('GEMINI')).toBe('closed');
    });

    it('transitions half-open → open (probe failure)', () => {
        setCircuitState('GEMINI', 'half-open');
        setCircuitState('GEMINI', 'open');
        expect(getCircuitState('GEMINI')).toBe('open');
    });
});

describe('Unit: getAllCircuitBreakerMetrics', () => {
    beforeEach(() => {
        setCircuitState('GEMINI', 'closed');
    });

    it('returns at least one metric entry', () => {
        const metrics = getAllCircuitBreakerMetrics();
        expect(metrics.length).toBeGreaterThanOrEqual(1);
    });

    it('each metric has state and provider fields', () => {
        setCircuitState('GEMINI', 'open');
        const metrics = getAllCircuitBreakerMetrics();

        for (const m of metrics) {
            expect(m).toHaveProperty('state');
            expect(m).toHaveProperty('provider');
            expect(['closed', 'open', 'half-open']).toContain(m.state);
        }
    });

    it('reflects current state for each provider', () => {
        setCircuitState('GEMINI', 'open');
        setCircuitState('ANTHROPIC', 'half-open');

        const metrics = getAllCircuitBreakerMetrics();
        const gemini = metrics.find(m => m.provider === 'GEMINI');
        const claude = metrics.find(m => m.provider === 'ANTHROPIC');

        expect(gemini?.state).toBe('open');
        expect(claude?.state).toBe('half-open');
    });
});
