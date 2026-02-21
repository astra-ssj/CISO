import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAllCircuitBreakerMetrics } from '@/lib/ai/circuit-breaker';
import { readFileSync } from 'fs';
import { join } from 'path';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

function getVersion(): string {
    try {
        const envVersion = process.env.VERSION;
        if (envVersion) return envVersion;
        const cwd = process.cwd();
        const pkgPath = join(cwd, 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return (pkg as { version?: string }).version ?? '0.0.0';
    } catch {
        return '0.0.0';
    }
}

export async function GET() {
    let status: HealthStatus = 'healthy';
    let databaseOk = false;
    let aiState = 'closed';
    let aiProvider = 'unknown';

    try {
        // Database check: simple Prisma query
        try {
            await prisma.$queryRaw`SELECT 1`;
            databaseOk = true;
        } catch {
            databaseOk = false;
            status = 'unhealthy';
        }

        // AI circuit breaker state (AI down = degraded, not unhealthy)
        try {
            const metrics = getAllCircuitBreakerMetrics();
            const primary = metrics[0];
            if (primary) {
                aiState = primary.state;
                aiProvider = primary.provider;
                if (primary.state === 'open' && status !== 'unhealthy') status = 'degraded';
            }
        } catch {
            aiState = 'unknown';
            aiProvider = 'unknown';
            if (status === 'healthy') status = 'degraded';
        }

        const body = {
            status,
            timestamp: new Date().toISOString(),
            version: getVersion(),
            jurisdiction: process.env.ASTRA_JURISDICTION ?? '',
            services: {
                database: databaseOk,
                ai: { state: aiState, provider: aiProvider },
            },
            uptime: process.uptime(),
        };

        const httpStatus = status === 'unhealthy' ? 503 : 200;
        return NextResponse.json(body, { status: httpStatus });
    } catch (err) {
        // Health endpoint must never crash: return 503 with minimal safe body
        const body = {
            status: 'unhealthy' as const,
            timestamp: new Date().toISOString(),
            version: getVersion(),
            jurisdiction: process.env.ASTRA_JURISDICTION ?? '',
            services: { database: false, ai: { state: 'unknown', provider: 'unknown' } },
            uptime: process.uptime(),
        };
        return NextResponse.json(body, { status: 503 });
    }
}
