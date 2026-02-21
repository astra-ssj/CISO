/**
 * CAIQ Metrics API — Returns last assessment date, coverage %, and answers pending review.
 * GET /api/vendors/caiq/metrics
 */

import { NextResponse } from 'next/server';
import { getCAIQMetrics } from '@/lib/caiq/caiq-metrics';

export async function GET() {
  const metrics = getCAIQMetrics();
  return NextResponse.json(metrics);
}
