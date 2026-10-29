import { NextResponse } from 'next/server';

/**
 * KPI document upload is intentionally outside the v0.1 Community Preview.
 *
 * The previous implementation pulled an Office document parser into the
 * production bundle even though Strategy/KPI is not part of the supported
 * product surface. Keep the route explicit and honest rather than shipping an
 * unmaintained parser path.
 */
export async function POST() {
    return NextResponse.json(
        {
            error: 'KPI document upload is experimental and not available in the v0.1 Community Preview.',
            code: 'FEATURE_NOT_AVAILABLE',
        },
        { status: 410 },
    );
}
