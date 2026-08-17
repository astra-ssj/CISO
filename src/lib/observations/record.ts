import { createHash } from 'crypto';
import prisma from '@/lib/prisma';

export type ObservationStatus = 'ok' | 'error' | 'stale' | 'empty';

export interface RecordObservationInput {
    integrationId: string;
    operation: string;
    requestKey: string;
    status: ObservationStatus;
    payload: unknown;
    httpStatus?: number;
    errorCode?: string;
    ttlMs?: number;
    createdBy?: string;
}

function payloadSha256(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload ?? null)).digest('hex');
}

/**
 * Append-only integration snapshot. Never updates an existing row.
 * Callers must read the latest Observation for a requestKey — not the live wire.
 */
export async function recordObservation(input: RecordObservationInput): Promise<string | null> {
    try {
        const now = new Date();
        const row = await prisma.observation.create({
            data: {
                integrationId: input.integrationId,
                operation: input.operation,
                requestKey: input.requestKey,
                fetchedAt: now,
                expiresAt: input.ttlMs ? new Date(now.getTime() + input.ttlMs) : null,
                status: input.status,
                httpStatus: input.httpStatus ?? null,
                errorCode: input.errorCode ?? null,
                payloadSha256: payloadSha256(input.payload),
                payload: JSON.stringify(input.payload ?? null),
                createdBy: input.createdBy ?? 'system',
            },
        });
        return row.id;
    } catch (err) {
        console.error('[Observation] failed to persist snapshot', err);
        return null;
    }
}

export async function latestObservation(integrationId: string, operation: string, requestKey: string) {
    try {
        return await prisma.observation.findFirst({
            where: { integrationId, operation, requestKey },
            orderBy: { fetchedAt: 'desc' },
        });
    } catch {
        return null;
    }
}
