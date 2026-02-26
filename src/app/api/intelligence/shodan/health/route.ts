/**
 * GET /api/intelligence/shodan/health
 * Health check: returns account info, credits, connection status
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { shodanClient } from '@/lib/intelligence/clients/shodan-client';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const health = await shodanClient.healthCheck();
        return NextResponse.json(health);
    } catch (error) {
        console.error('[SHODAN/HEALTH] Error:', error);
        return NextResponse.json({
            connected: false,
            plan: '',
            credits: 0,
            error: 'Health check failed',
        });
    }
}
