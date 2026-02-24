/**
 * Anomaly Detector — Welford's online algorithm for streaming baseline
 * deviation (z-score) analysis.
 *
 * Tracks signal type × region × weekday × month baselines.
 * Requires minimum 10 samples before reporting anomalies.
 */

import type { SignalType, Severity, IntelligenceSignal } from './signal-aggregator';

// ── Types ─────────────────────────────────────────────────────

interface WelfordState {
    count: number;
    mean: number;
    m2: number; // sum of squared differences from mean
}

export interface AnomalyResult {
    id: string;
    signalType: SignalType;
    region: string;
    zScore: number;
    severity: Severity;
    observed: number;
    expected: number;
    stdDev: number;
    description: string;
    timestamp: Date;
}

// ── In-Memory Baseline Store ──────────────────────────────────
// Key format: `${signalType}:${region}:${weekday}:${month}`

const baselines = new Map<string, WelfordState>();

function baselineKey(type: SignalType, region: string, date: Date): string {
    return `${type}:${region}:${date.getUTCDay()}:${date.getUTCMonth()}`;
}

// ── Welford's Online Algorithm ────────────────────────────────

function welfordUpdate(state: WelfordState, value: number): WelfordState {
    const count = state.count + 1;
    const delta = value - state.mean;
    const mean = state.mean + delta / count;
    const delta2 = value - mean;
    const m2 = state.m2 + delta * delta2;
    return { count, mean, m2 };
}

function welfordVariance(state: WelfordState): number {
    if (state.count < 2) return 0;
    return state.m2 / (state.count - 1);
}

function welfordStdDev(state: WelfordState): number {
    return Math.sqrt(welfordVariance(state));
}

// ── Public API ────────────────────────────────────────────────

/**
 * Update the baseline for a given signal type and region.
 * Call this with the count of events for the current observation period.
 */
export function updateBaseline(type: SignalType, region: string, eventCount: number, date = new Date()): void {
    const key = baselineKey(type, region, date);
    const state = baselines.get(key) ?? { count: 0, mean: 0, m2: 0 };
    baselines.set(key, welfordUpdate(state, eventCount));
}

/**
 * Check if a current observation deviates significantly from baseline.
 * Returns null if insufficient samples (< 10).
 */
export function checkAnomaly(
    type: SignalType,
    region: string,
    currentCount: number,
    date = new Date()
): AnomalyResult | null {
    const key = baselineKey(type, region, date);
    const state = baselines.get(key);

    if (!state || state.count < 10) return null;

    const stdDev = welfordStdDev(state);
    if (stdDev === 0) return null;

    const zScore = (currentCount - state.mean) / stdDev;

    if (zScore <= 1.5) return null; // Within normal range

    const severity: Severity =
        zScore > 3.0 ? 'CRITICAL' :
            zScore > 2.0 ? 'HIGH' :
                'MEDIUM';

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
        id: `anom-${type}-${region}-${Date.now()}`,
        signalType: type,
        region,
        zScore: Number(zScore.toFixed(2)),
        severity,
        observed: currentCount,
        expected: Number(state.mean.toFixed(1)),
        stdDev: Number(stdDev.toFixed(2)),
        description: `${type.replace('_', ' ')} in ${region} is ${zScore.toFixed(1)}x above ${weekdays[date.getUTCDay()]} baseline for ${months[date.getUTCMonth()]}`,
        timestamp: date,
    };
}

/**
 * Bulk anomaly detection across signal types and regions.
 */
export function detectAnomalies(signals: IntelligenceSignal[]): AnomalyResult[] {
    // Group signals by type and region
    const groups = new Map<string, { type: SignalType; region: string; count: number }>();
    for (const s of signals) {
        const key = `${s.type}:${s.region}`;
        if (!groups.has(key)) {
            groups.set(key, { type: s.type, region: s.region, count: 0 });
        }
        groups.get(key)!.count++;
    }

    const anomalies: AnomalyResult[] = [];
    const now = new Date();

    for (const { type, region, count } of groups.values()) {
        // Update baseline with current observation
        updateBaseline(type, region, count, now);

        // Check for anomaly
        const anomaly = checkAnomaly(type, region, count, now);
        if (anomaly) anomalies.push(anomaly);
    }

    return anomalies.sort((a, b) => b.zScore - a.zScore);
}

/**
 * Seed baselines with historical data for immediate anomaly detection.
 * Call this once at startup with representative counts.
 */
export function seedBaseline(
    type: SignalType,
    region: string,
    historicalCounts: number[]
): void {
    for (const count of historicalCounts) {
        // Distribute across different dates for realistic baselines
        const date = new Date();
        updateBaseline(type, region, count, date);
    }
}

/**
 * Get baseline stats for debugging/display.
 */
export function getBaselineStats(): { key: string; count: number; mean: number; stdDev: number }[] {
    return Array.from(baselines.entries()).map(([key, state]) => ({
        key,
        count: state.count,
        mean: Number(state.mean.toFixed(2)),
        stdDev: Number(welfordStdDev(state).toFixed(2)),
    }));
}
