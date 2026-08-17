import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit/audit-service';

export type ApprovalDecision = 'APPROVE' | 'REJECT';

export interface RecordApprovalInput {
    skillRunId: string;
    observationIds?: string[];
    decision: ApprovalDecision;
    actorId?: string;
    actorName?: string;
    plugin?: string;
    payload?: Record<string, unknown>;
    notes?: string;
}

/**
 * Dual-write: Astra Approval + AuditLog. Optionally POST to OpenNeko memory.
 * Plugin payloads must include skillRunId. Plugins do not run without APPROVE.
 */
export async function recordApproval(input: RecordApprovalInput): Promise<string> {
    if (input.payload && input.payload.skillRunId !== input.skillRunId) {
        throw new Error('Plugin payload must include matching skillRunId');
    }

    const row = await prisma.approval.create({
        data: {
            skillRunId: input.skillRunId,
            observationIds: JSON.stringify(input.observationIds ?? []),
            decision: input.decision,
            actorId: input.actorId ?? null,
            actorName: input.actorName ?? null,
            plugin: input.plugin ?? null,
            payload: input.payload ? JSON.stringify(input.payload) : null,
            notes: input.notes ?? null,
        },
    });

    await logAudit({
        userId: input.actorId,
        userName: input.actorName,
        action: input.decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
        category: 'INTEGRATION',
        resource: 'Approval',
        resourceId: row.id,
        description: `${input.decision} skillRun ${input.skillRunId}${input.plugin ? ` plugin ${input.plugin}` : ''}`,
        metadata: {
            skillRunId: input.skillRunId,
            observationIds: input.observationIds ?? [],
            plugin: input.plugin ?? null,
        },
    });

    const memoryUrl = process.env.OPENNEKO_MEMORY_URL;
    if (memoryUrl) {
        try {
            await fetch(memoryUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-astra-internal-secret': process.env.ASTRA_INTERNAL_SECRET || '',
                },
                body: JSON.stringify({
                    type: 'approval',
                    id: row.id,
                    skillRunId: input.skillRunId,
                    decision: input.decision,
                }),
                signal: AbortSignal.timeout(5_000),
            });
        } catch (err) {
            console.warn('[Approval] OpenNeko memory write failed', err instanceof Error ? err.message : err);
        }
    }

    return row.id;
}

export async function executeApprovedPlugin(approvalId: string): Promise<{ ok: boolean; reason: string }> {
    const approval = await prisma.approval.findUnique({ where: { id: approvalId } });
    if (!approval) return { ok: false, reason: 'approval_not_found' };
    if (approval.decision !== 'APPROVE') return { ok: false, reason: 'not_approved' };
    if (!approval.skillRunId) return { ok: false, reason: 'missing_skill_run' };
    if (!approval.plugin) return { ok: true, reason: 'no_plugin' };

    await logAudit({
        action: 'CONFIGURE',
        category: 'INTEGRATION',
        resource: 'Plugin',
        resourceId: approvalId,
        description: `Gated plugin ${approval.plugin} executed after approve (skillRun ${approval.skillRunId})`,
        metadata: { skillRunId: approval.skillRunId, plugin: approval.plugin },
    });

    return { ok: true, reason: `plugin:${approval.plugin}` };
}
