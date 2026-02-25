import prisma from '@/lib/prisma';

// ─── Audit Action & Category Enums ───

export type AuditAction =
    | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
    | 'LOGIN' | 'LOGOUT'
    | 'EXPORT' | 'IMPORT'
    | 'TEST' | 'APPROVE' | 'REJECT'
    | 'ESCALATE' | 'CONFIGURE';

export type AuditCategory =
    | 'AUTH' | 'COMPLIANCE' | 'RISK' | 'INCIDENT'
    | 'VENDOR' | 'INTELLIGENCE' | 'APPSEC' | 'SETTINGS'
    | 'INTEGRATION' | 'CAIQ' | 'EVIDENCE' | 'POLICY';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// ─── logAudit ───

export interface LogAuditParams {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: AuditAction;
    category: AuditCategory;
    resource: string;
    resourceId?: string;
    description: string;
    metadata?: Record<string, unknown>;
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Append an immutable audit log entry.
 * Never throws — catches all errors and logs to console so
 * callers are never disrupted by audit failures.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId ?? null,
                userName: params.userName ?? null,
                userRole: params.userRole ?? null,
                action: params.action,
                category: params.category,
                resource: params.resource,
                resourceId: params.resourceId ?? null,
                description: params.description,
                metadata: params.metadata ? JSON.stringify(params.metadata) : null,
                severity: params.severity ?? 'INFO',
                ipAddress: params.ipAddress ?? null,
                userAgent: params.userAgent ?? null,
            },
        });
    } catch (error) {
        // Never throw — audit failures must not break the caller
        console.error('[AuditService] Failed to write audit log:', error);
    }
}

/**
 * Extract IP address from request headers (works behind proxies).
 */
export function getRequestIp(req: Request): string | undefined {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]?.trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    return undefined;
}

/**
 * Extract user-agent from request headers.
 */
export function getRequestUserAgent(req: Request): string | undefined {
    return req.headers.get('user-agent') ?? undefined;
}
