/**
 * AI circuit breaker — Tracks state per provider for health checks and resilience.
 * States: 'closed' = healthy, 'open' = failing (no calls), 'half-open' = probing.
 * Used by CAIQ answer engine and validator to skip or fallback when AI is unavailable.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Snapshot of circuit state for a single AI provider (for health API).
 */
export interface CircuitBreakerMetric {
    state: CircuitState;
    provider: string;
}

const metrics: Map<string, CircuitBreakerMetric> = new Map();

function getDefaultProvider(): string {
    return process.env.AI_PROVIDER || 'GEMINI';
}

/**
 * Returns current circuit breaker metrics for all known AI providers.
 * Used by the health check API to report AI availability.
 * @returns Array of { state, provider } for each tracked provider; defaults to one closed entry if none set
 */
export function getAllCircuitBreakerMetrics(): CircuitBreakerMetric[] {
    const entries = Array.from(metrics.entries());
    if (entries.length === 0) {
        return [{ state: 'closed', provider: getDefaultProvider() }];
    }
    return entries.map(([, m]) => ({ state: m.state, provider: m.provider }));
}

/**
 * Sets the circuit state for an AI provider (e.g. after failure → 'open').
 * @param provider - Provider name (e.g. GEMINI, ANTHROPIC)
 * @param state - New state: closed, open, or half-open
 */
export function setCircuitState(provider: string, state: CircuitState): void {
    metrics.set(provider, { state, provider });
}

/**
 * Returns the current circuit state for an AI provider.
 * @param provider - Provider name
 * @returns 'closed' if never set or healthy, otherwise the last set state
 */
export function getCircuitState(provider: string): CircuitState {
    return metrics.get(provider)?.state ?? 'closed';
}
