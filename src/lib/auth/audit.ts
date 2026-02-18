import { UserProfile } from './rbac';

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'POLICY_UPDATE'
    | 'INCIDENT_RESOLVED'
    | 'SETTINGS_CHANGED'
    | 'EXPORT_GENERATED';

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

// In-memory store for MVP (will reset on restart)
// In production, this connects to Postgres/ClickHouse
const AUDIT_STORE: AuditLogEntry[] = [];

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

    // Unshift to show newest first
    AUDIT_STORE.unshift(entry);

    // Keep only last 1000 logs for memory safety/demo
    if (AUDIT_STORE.length > 1000) {
        AUDIT_STORE.pop();
    }
}

export async function getAuditLogs(filter?: { action?: AuditAction; userId?: string }): Promise<AuditLogEntry[]> {
    let logs = [...AUDIT_STORE];

    if (filter?.action) {
        logs = logs.filter(l => l.action === filter.action);
    }
    if (filter?.userId) {
        logs = logs.filter(l => l.actorId === filter.userId);
    }

    return logs;
}
