import { NextResponse } from 'next/server';
import { requireInternalSecret } from '@/lib/api/require-session';
import { runWatcherTick } from '@/lib/watchers/tick';

/** POST /api/internal/watchers/tick — OpenNeko schedule. Skills compute here. */
export async function POST(req: Request) {
    const denied = requireInternalSecret(req);
    if (denied) return denied;

    const result = await runWatcherTick();
    return NextResponse.json(result);
}
