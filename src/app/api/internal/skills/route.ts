import { NextResponse } from 'next/server';
import { requireInternalSecret } from '@/lib/api/require-session';
import { SKILL_HTTP_PATHS, SKILL_IDS } from '@/lib/skills/types';

/** GET /api/internal/skills — catalog OpenNeko registers. Not a prompt list. */
export async function GET(req: Request) {
    const denied = requireInternalSecret(req);
    if (denied) return denied;

    return NextResponse.json({
        owner: 'astra',
        defaultAutonomy: 'SUPERVISED',
        skills: Object.values(SKILL_IDS).map((id) => ({
            id,
            invoke: SKILL_HTTP_PATHS[id],
        })),
        watchers: [{ id: 'tick', invoke: '/api/internal/watchers/tick' }],
        approvals: '/api/internal/approvals',
    });
}
