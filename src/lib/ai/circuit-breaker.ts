/**
 * AI circuit breaker metrics for health checks and resilience.
 * Tracks state per provider: 'closed' = healthy, 'open' = failing, 'half-open' = probing.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

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
 */
export function getAllCircuitBreakerMetrics(): CircuitBreakerMetric[] {
    const entries = Array.from(metrics.entries());
    if (entries.length === 0) {
        return [{ state: 'closed', provider: getDefaultProvider() }];
    }
    return entries.map(([, m]) => ({ state: m.state, provider: m.provider }));
}

export function setCircuitState(provider: string, state: CircuitState): void {
    metrics.set(provider, { state, provider });
}

export function getCircuitState(provider: string): CircuitState {
    return metrics.get(provider)?.state ?? 'closed';
}
