/**
 * CAIQ Organization Context API — Returns org context for CAIQ assessment config.
 * GET /api/vendors/caiq/org-context
 */

import { NextResponse } from 'next/server';
import { buildOrgContext } from '@/lib/caiq/caiq-org-context';

export async function GET() {
  try {
    const context = await buildOrgContext();
    return NextResponse.json(context);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message || 'Failed to build organization context.' },
      { status: 500 }
    );
  }
}
