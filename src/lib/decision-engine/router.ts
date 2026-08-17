/**
 * Aegis v2 — Decision Router
 * 
 * Central nervous system of the CISO Decision OS.
 * Generates, routes, and manages decisions from all 10 pillars.
 * Consumes data from all Zustand stores to produce actionable decisions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    type Decision, type DecisionPillar, type DecisionUrgency, type DecisionStatus,
    type DecisionFilter,
    filterDecisions
} from './types';

// ────────────────────────────────────────────
// Decision Store
// ────────────────────────────────────────────

interface DecisionStore {
    decisions: Decision[];
    addDecision: (decision: Omit<Decision, 'id' | 'createdAt' | 'status'>) => string;
    resolveDecision: (id: string, status: DecisionStatus, notes?: string) => void;
    getFiltered: (filter: DecisionFilter) => Decision[];
    getPending: () => Decision[];
    getPendingByPillar: (pillar: DecisionPillar) => Decision[];
    getDecisionById: (id: string) => Decision | undefined;
    getStats: () => DecisionStats;
}

export interface DecisionStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    deferred: number;
    byPillar: Record<DecisionPillar, number>;
    byUrgency: Record<DecisionUrgency, number>;
    avgConfidence: number;
    avgTimeToDecide: number; // hours
}

// Operator-created decisions only. Never seed FAIR/CVE theater.
const DEMO_DECISIONS: Omit<Decision, 'id' | 'createdAt'>[] = [];

// ────────────────────────────────────────────
// Store Implementation
// ────────────────────────────────────────────

export const useDecisionStore = create<DecisionStore>()(
    persist(
        (set, get) => ({
            decisions: DEMO_DECISIONS.map((d, i) => ({
                ...d,
                id: `DEC-${String(i + 1).padStart(3, '0')}`,
                createdAt: new Date(Date.now() - (i * 86400000 * (i + 1))).toISOString()
            })) as Decision[],

            addDecision: (decision) => {
                const id = `DEC-${Date.now().toString(36).toUpperCase()}`;
                set(state => ({
                    decisions: [{
                        ...decision,
                        id,
                        status: 'PENDING' as const,
                        createdAt: new Date().toISOString()
                    }, ...state.decisions]
                }));
                return id;
            },

            resolveDecision: (id, status, notes) => set(state => ({
                decisions: state.decisions.map(d =>
                    d.id === id ? {
                        ...d, status, decisionNotes: notes,
                        decidedAt: new Date().toISOString(), decidedBy: 'CISO'
                    } : d
                )
            })),

            getFiltered: (filter) => filterDecisions(get().decisions, filter),

            getPending: () => get().decisions
                .filter(d => d.status === 'PENDING')
                .sort((a, b) => {
                    const urgencyOrder: Record<DecisionUrgency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                }),

            getPendingByPillar: (pillar) => get().getPending().filter(d => d.pillar === pillar),

            getDecisionById: (id) => get().decisions.find(d => d.id === id),

            getStats: () => {
                const decisions = get().decisions;
                const pending = decisions.filter(d => d.status === 'PENDING');
                const resolved = decisions.filter(d => d.decidedAt);

                const byPillar = {} as Record<DecisionPillar, number>;
                const byUrgency = {} as Record<DecisionUrgency, number>;
                decisions.forEach(d => {
                    byPillar[d.pillar] = (byPillar[d.pillar] || 0) + 1;
                    byUrgency[d.urgency] = (byUrgency[d.urgency] || 0) + 1;
                });

                const avgConfidence = decisions.length > 0
                    ? Math.round(decisions.reduce((s, d) => s + d.recommendation.confidence.value, 0) / decisions.length)
                    : 0;

                const avgTimeToDecide = resolved.length > 0
                    ? resolved.reduce((s, d) => {
                        const created = new Date(d.createdAt).getTime();
                        const decided = new Date(d.decidedAt!).getTime();
                        return s + (decided - created) / 3600000;
                    }, 0) / resolved.length
                    : 0;

                return {
                    total: decisions.length,
                    pending: pending.length,
                    approved: decisions.filter(d => d.status === 'APPROVED').length,
                    rejected: decisions.filter(d => d.status === 'REJECTED').length,
                    deferred: decisions.filter(d => d.status === 'DEFERRED').length,
                    byPillar, byUrgency, avgConfidence,
                    avgTimeToDecide: Math.round(avgTimeToDecide * 10) / 10
                };
            }
        }),
        { name: 'astra-v3-decision-store' }
    )
);
