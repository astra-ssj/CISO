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

/**
 * Live fetch envelope: success writes an Observation; failure returns the last
 * ok snapshot (labeled stale) or `empty`. Never invents a payload.
 */
export async function liveOrEmpty<T>(
    meta: {
        integrationId: string;
        operation: string;
        requestKey: string;
        ttlMs?: number;
        createdBy?: string;
    },
    fetchFn: () => Promise<T>,
    empty: T,
): Promise<T> {
    try {
        const data = await fetchFn();
        await recordObservation({
            integrationId: meta.integrationId,
            operation: meta.operation,
            requestKey: meta.requestKey,
            status: 'ok',
            payload: data,
            ttlMs: meta.ttlMs,
            createdBy: meta.createdBy,
        });
        return data;
    } catch (err) {
        const last = await latestObservation(meta.integrationId, meta.operation, meta.requestKey);
        const errorCode = err instanceof Error ? err.message.slice(0, 200) : 'fetch_failed';

        if (last?.status === 'ok' && last.payload) {
            try {
                const restored = JSON.parse(last.payload) as T;
                await recordObservation({
                    integrationId: meta.integrationId,
                    operation: meta.operation,
                    requestKey: meta.requestKey,
                    status: 'stale',
                    errorCode,
                    payload: { restoredFrom: last.id, fetchedAt: last.fetchedAt.toISOString() },
                    createdBy: meta.createdBy,
                });
                return restored;
            } catch {
                // corrupt snapshot — fall through to empty
            }
        }

        await recordObservation({
            integrationId: meta.integrationId,
            operation: meta.operation,
            requestKey: meta.requestKey,
            status: 'empty',
            errorCode,
            payload: null,
            createdBy: meta.createdBy,
        });
        return empty;
    }
}
