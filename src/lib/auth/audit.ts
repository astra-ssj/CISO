import { UserProfile } from './rbac';
import type { CAIQAnswer, CAIQStats } from '@/lib/caiq/types';
import prisma from '@/lib/prisma';

// =============================================================================
// Legacy audit (backward compatible)
// =============================================================================

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'POLICY_UPDATE'
    | 'INCIDENT_RESOLVED'
    | 'SETTINGS_CHANGED'
    | 'EXPORT_GENERATED'
    // CAIQ-specific
    | 'CAIQ_RUN_STARTED'
    | 'CAIQ_ANSWER_GENERATED'
    | 'CAIQ_ANSWER_REVIEWED'
    | 'CAIQ_ANSWER_APPROVED'
    | 'CAIQ_ANSWER_REJECTED'
    | 'CAIQ_EXPORT'
    // AI resilience
    | 'AI_CIRCUIT_BREAKER_TRIPPED'
    | 'AI_CIRCUIT_BREAKER_RECOVERED';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    action: AuditAction;
    details: string;
    ip?: string;
    userAgent?: string;
}

/** Immutable audit fabric entry: append-only, never update or delete. */
export interface AuditFabricEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    resource: string;
    resourceId: string | null;
    metadata: Record<string, unknown> | null;
}

/** Input for appending to the audit fabric (id and timestamp are set by the system). */
export interface AuditFabricInput {
    actor: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
}

// In-memory store for legacy MVP (will reset on restart)
// In production, legacy logAction also appends to the fabric
const AUDIT_STORE: AuditLogEntry[] = [];

// -----------------------------------------------------------------------------
// Legacy logAction (unchanged behavior; optionally appends to fabric)
// -----------------------------------------------------------------------------

export async function logAction(
    user: UserProfile,
    action: AuditAction,
    details: string,
    reqInfo?: { ip?: string; userAgent?: string }
) {
    const entry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action,
        details,
        ip: reqInfo?.ip || 'unknown',
        userAgent: reqInfo?.userAgent || 'unknown',
    };

    console.log(`[AUDIT] ${entry.timestamp} | ${entry.actorRole}:${entry.actorName} -> ${action}: ${details}`);

    AUDIT_STORE.unshift(entry);

    if (AUDIT_STORE.length > 1000) {
        AUDIT_STORE.pop();
    }

    // Append to immutable fabric (best-effort; does not affect legacy behavior)
    appendToFabric({
        actor: user.id,
        action,
        resource: 'legacy',
        resourceId: entry.id,
        metadata: {
            details,
            actorName: user.name,
            actorRole: user.role,
            ip: entry.ip,
            userAgent: entry.userAgent,
        },
    }).catch(() => {});
}

// -----------------------------------------------------------------------------
// Immutable audit fabric (append-only)
// -----------------------------------------------------------------------------

/**
 * Appends a single entry to the audit fabric. Never updates or deletes.
 * Storage is best-effort (e.g. Prisma); failures are logged but not thrown
 * so callers are not broken.
 */
export async function appendToFabric(input: AuditFabricInput): Promise<AuditFabricEntry | null> {
    const timestamp = new Date();
    try {
        const row = await prisma.auditLog.create({
            data: {
                actor: input.actor,
                action: input.action,
                resource: input.resource,
                resourceId: input.resourceId ?? null,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            },
        });
        return {
            id: row.id,
            timestamp: row.timestamp.toISOString(),
            actor: row.actor,
            action: row.action,
            resource: row.resource,
            resourceId: row.resourceId,
            metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
        };
    } catch (err) {
        console.error('[AUDIT] appendToFabric failed:', err);
        return null;
    }
}

/**
 * Returns entries from the immutable audit fabric (newest first).
 * Optional filters: action, actor, resource prefix.
 */
export async function getAuditFabricLogs(filter?: {
    action?: string;
    actor?: string;
    resourcePrefix?: string;
    limit?: number;
}): Promise<AuditFabricEntry[]> {
    try {
        const limit = Math.min(filter?.limit ?? 500, 2000);
        const where: { action?: string; actor?: string; resource?: { startsWith: string } } = {};
        if (filter?.action) where.action = filter.action;
        if (filter?.actor) where.actor = filter.actor;
        if (filter?.resourcePrefix) where.resource = { startsWith: filter.resourcePrefix };

        const rows = await prisma.auditLog.findMany({
            where: Object.keys(where).length ? where : undefined,
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return rows.map((r) => ({
            id: r.id,
            timestamp: r.timestamp.toISOString(),
            actor: r.actor,
            action: r.action,
            resource: r.resource,
            resourceId: r.resourceId,
            metadata: r.metadata ? (JSON.parse(r.metadata) as Record<string, unknown>) : null,
        }));
    } catch (err) {
        console.error('[AUDIT] getAuditFabricLogs failed:', err);
        return [];
    }
}

// -----------------------------------------------------------------------------
// CAIQ helpers
// -----------------------------------------------------------------------------

/** Metadata shape for CAIQ answer events (confidence, tier, model, hashes). */
export interface CAIQAnswerAuditMetadata {
    confidence: number;
    tier: string;
    generatedBy: string;
    needsReview: boolean;
    questionId: string;
    answerType: string;
    promptHash?: string;
    responseHash?: string;
    modelUsed?: string;
    [key: string]: unknown;
}

/**
 * Logs a CAIQ answer event to the immutable audit fabric.
 * Use for: CAIQ_ANSWER_GENERATED, CAIQ_ANSWER_REVIEWED, CAIQ_ANSWER_APPROVED, CAIQ_ANSWER_REJECTED.
 */
export async function logCAIQAnswer(
    answer: CAIQAnswer,
    eventType: 'CAIQ_ANSWER_GENERATED' | 'CAIQ_ANSWER_REVIEWED' | 'CAIQ_ANSWER_APPROVED' | 'CAIQ_ANSWER_REJECTED',
    options?: { actor?: string; promptHash?: string; responseHash?: string; modelUsed?: string }
): Promise<AuditFabricEntry | null> {
    const metadata: CAIQAnswerAuditMetadata = {
        confidence: answer.confidence,
        tier: answer.tier,
        generatedBy: answer.generatedBy,
        needsReview: answer.needsReview,
        questionId: answer.questionId,
        answerType: answer.answerType,
        promptHash: options?.promptHash,
        responseHash: options?.responseHash,
        modelUsed: options?.modelUsed,
    };
    if (answer.reviewedBy) metadata.reviewedBy = answer.reviewedBy;
    if (answer.reviewedAt) metadata.reviewedAt = answer.reviewedAt;
    if (answer.corrections) metadata.corrections = answer.corrections;

    return appendToFabric({
        actor: options?.actor ?? 'SYSTEM',
        action: eventType,
        resource: `caiq:${answer.questionId}`,
        resourceId: answer.auditId,
        metadata,
    });
}

/**
 * Logs a CAIQ batch run to the immutable audit fabric (e.g. CAIQ_RUN_STARTED with stats).
 */
export async function logCAIQRun(
    stats: CAIQStats,
    options?: { runId?: string; actor?: string; event?: 'CAIQ_RUN_STARTED' }
): Promise<AuditFabricEntry | null> {
    const event = options?.event ?? 'CAIQ_RUN_STARTED';
    const metadata: Record<string, unknown> = {
        total: stats.total,
        highConfidence: stats.highConfidence,
        mediumConfidence: stats.mediumConfidence,
        lowConfidence: stats.lowConfidence,
        flagged: stats.flagged,
        estimatedAccuracy: stats.estimatedAccuracy,
        coverageByDomain: stats.coverageByDomain,
    };
    return appendToFabric({
        actor: options?.actor ?? 'SYSTEM',
        action: event,
        resource: 'caiq:run',
        resourceId: options?.runId ?? null,
        metadata,
    });
}

/**
 * Logs a CAIQ export event.
 */
export async function logCAIQExport(options: {
    actor?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
}): Promise<AuditFabricEntry | null> {
    return appendToFabric({
        actor: options.actor ?? 'SYSTEM',
        action: 'CAIQ_EXPORT',
        resource: 'caiq:export',
        resourceId: options.resourceId ?? null,
        metadata: options.metadata ?? null,
    });
}

/**
 * Logs AI circuit breaker tripped (append-only).
 */
export async function logCircuitBreakerTripped(provider: string, metadata?: Record<string, unknown>): Promise<AuditFabricEntry | null> {
    return appendToFabric({
        actor: 'SYSTEM',
        action: 'AI_CIRCUIT_BREAKER_TRIPPED',
        resource: 'ai:circuit-breaker',
        resourceId: provider,
        metadata: metadata ? { provider, ...metadata } : { provider },
    });
}

/**
 * Logs AI circuit breaker recovered (append-only).
 */
export async function logCircuitBreakerRecovered(provider: string, metadata?: Record<string, unknown>): Promise<AuditFabricEntry | null> {
    return appendToFabric({
        actor: 'SYSTEM',
        action: 'AI_CIRCUIT_BREAKER_RECOVERED',
        resource: 'ai:circuit-breaker',
        resourceId: provider,
        metadata: metadata ? { provider, ...metadata } : { provider },
    });
}

// -----------------------------------------------------------------------------
// Legacy getAuditLogs (unchanged; returns in-memory entries only)
// -----------------------------------------------------------------------------

export async function getAuditLogs(filter?: { action?: AuditAction; userId?: string }): Promise<AuditLogEntry[]> {
    let logs = [...AUDIT_STORE];

    if (filter?.action) {
        logs = logs.filter((l) => l.action === filter.action);
    }
    if (filter?.userId) {
        logs = logs.filter((l) => l.actorId === filter.userId);
    }

    return logs;
}
