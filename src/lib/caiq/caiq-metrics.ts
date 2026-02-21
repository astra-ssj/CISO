/**
 * CAIQ metrics — in-memory store for dashboard (last assessment, coverage, pending review).
 * Updated by assess API and POST /api/vendors/caiq when an assessment completes.
 */

export interface CAIQMetricsSnapshot {
  lastAssessmentAt: string | null; // ISO date
  coveragePercent: number;
  answersPendingReview: number;
}

let metrics: CAIQMetricsSnapshot = {
  lastAssessmentAt: null,
  coveragePercent: 0,
  answersPendingReview: 0,
};

export function getCAIQMetrics(): CAIQMetricsSnapshot {
  return { ...metrics };
}

export function setCAIQMetrics(snapshot: Partial<CAIQMetricsSnapshot>): void {
  metrics = { ...metrics, ...snapshot };
}
