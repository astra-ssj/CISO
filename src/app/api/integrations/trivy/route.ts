import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api/require-session';

/**
 * GET /api/integrations/trivy
 * Live Trivy only. Missing CLI → empty, never a mock CVE list.
 */
export async function GET() {
    const { error } = await requireSession();
    if (error) return error;

    return NextResponse.json({
        empty: true,
        reason: 'trivy_not_wired',
        message: 'Trivy is not a live Astra skill yet. No sample CVEs.',
        Results: [],
    });
}
