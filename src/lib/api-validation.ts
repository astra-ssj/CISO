/**
 * Shared API validation helpers using Zod.
 * Use parseBodyWithZod in API routes to validate and return 400 on failure.
 *
 * L1 fix: use log() instead of bare console.error() so production builds can
 * redirect structured log lines to an aggregator without leaking stack traces.
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

// ─── Structured Logger (L1 fix) ──────────────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error';

export function log(level: LogLevel, context: string, message: string, meta?: unknown): void {
    const entry: Record<string, unknown> = {
        ts: new Date().toISOString(),
        level,
        ctx: context,
        msg: message,
    };
    // In production omit the raw error object (may contain stack/sensitive data)
    if (meta !== undefined && process.env.NODE_ENV !== 'production') {
        entry.meta = meta;
    } else if (meta instanceof Error && process.env.NODE_ENV === 'production') {
        entry.error = meta.message; // safe: message only, no stack
    }
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(entry));
}

export function parseBodyWithZod<T>(body: unknown, schema: z.ZodType<T>): { data: T } | { error: NextResponse } {
    const result = schema.safeParse(body);
    if (result.success) {
        return { data: result.data };
    }
    const first = result.error.flatten();
    const message = first.formErrors[0] ?? (Object.values(first.fieldErrors).flat().filter(Boolean)[0] as string | undefined) ?? 'Validation failed';
    return {
        error: NextResponse.json(
            { error: 'Validation failed', details: message },
            { status: 400 }
        ),
    };
}

// --- Common schemas ---

export const loginBodySchema = z.object({
    email: z.string().email('Invalid email').optional(),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required').max(1024),
}).refine((data) => (data.email ?? data.username) != null && ((data.email ?? data.username) as string).length > 0, {
    message: 'Email or username is required',
});

export type LoginBody = z.infer<typeof loginBodySchema>;

const chatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']).optional(),
    content: z.string(),
});

export const agentChatBodySchema = z.object({
    message: z.string().min(1, 'Message is required').max(32_000),
    history: z.array(chatMessageSchema).max(50).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
});

export type AgentChatBody = z.infer<typeof agentChatBodySchema>;

export const notificationCreateSchema = z.object({
    notification: z.object({
        type: z.string().max(64).optional(),
        title: z.string().max(512).optional(),
        message: z.string().max(4096).optional(),
        severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
        timestamp: z.number().optional(),
        actionUrl: z.string().url().max(2048).nullable().optional(),
    }),
});

/** Max file size in bytes for uploads (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateFileSize(file: File, maxBytes: number = MAX_UPLOAD_BYTES): NextResponse | null {
    if (file.size > maxBytes) {
        return NextResponse.json(
            { error: `File too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.` },
            { status: 400 }
        );
    }
    return null;
}

// ─── Route-specific schemas (M1 fix) ─────────────────────────────────────────

// --- CAIQ ---

const orgProfileSchema = z.object({
    orgName: z.string().max(256).optional(),
    industry: z.string().max(128).optional(),
    cloudModel: z.string().max(64).optional(),
    frameworks: z.array(z.string().max(64)).max(20).optional(),
    jurisdictions: z.array(z.string().max(64)).max(20).optional(),
}).optional();

// Used by POST /api/caiq/enhance (JSON body: { questions, sourceEntries?, profile? })
export const caiqEnhanceBodySchema = z.object({
    questions: z.array(z.record(z.string(), z.unknown())).min(1, 'At least one question is required').max(2000),
    sourceEntries: z.array(z.record(z.string(), z.unknown())).max(5000).optional(),
    profile: orgProfileSchema,
});
export type CAIQEnhanceBody = z.infer<typeof caiqEnhanceBodySchema>;

// Used by POST /api/caiq/export
export const caiqExportBodySchema = z.object({
    questions: z.array(z.record(z.string(), z.unknown())).min(1, 'At least one question is required').max(2000),
    fileName: z.string().max(256).optional(),
});
export type CAIQExportBody = z.infer<typeof caiqExportBodySchema>;

// --- Agent routes ---

// Used by POST /api/agent/analyze
export const agentAnalyzeBodySchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    context: z.object({
        activeStandards: z.array(z.string().max(64)).max(20).optional(),
    }).optional(),
    useRealAI: z.boolean().optional(),
});
export type AgentAnalyzeBody = z.infer<typeof agentAnalyzeBodySchema>;

// Used by POST /api/agent/analyze-policy
export const agentAnalyzePolicyBodySchema = z.object({
    policyContent: z.string().min(1, 'policyContent is required').max(50_000),
    standards: z.array(z.string().max(64)).max(20).optional(),
});
export type AgentAnalyzePolicyBody = z.infer<typeof agentAnalyzePolicyBodySchema>;

// Used by POST /api/agent/generate-policy
export const agentGeneratePolicyBodySchema = z.object({
    topic: z.string().min(1, 'Topic is required').max(100),
    strictness: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    useRealAI: z.boolean().optional(),
});
export type AgentGeneratePolicyBody = z.infer<typeof agentGeneratePolicyBodySchema>;

// --- Jira ---

// Used by POST /api/jira
export const jiraIssueBodySchema = z.object({
    summary: z.string().min(1).max(512),
    description: z.string().max(32_000).optional(),
    issuetype: z.string().max(64).optional(),
    priority: z.string().max(32).optional(),
    labels: z.array(z.string().max(64)).max(20).optional(),
    projectKey: z.string().max(32).optional(),
});
export type JiraIssueBody = z.infer<typeof jiraIssueBodySchema>;

// --- Knowledge ---

const knowledgeEntrySchema = z.object({
    questionText: z.string().min(1).max(4096),
    answerText: z.string().min(1).max(16_384),
    answerType: z.enum(['YES', 'NO', 'NA', 'PARTIAL', 'CONDITIONAL']).optional(),
    domain: z.string().max(128).optional(),
    category: z.string().max(128).optional(),
    evidence: z.string().max(4096).optional(),
    source: z.string().max(256).optional(),
    confidence: z.number().min(0).max(1).optional(),
    frameworks: z.union([z.string().max(4096), z.array(z.string().max(64)).max(20)]).optional(),
    jurisdiction: z.string().max(128).optional(),
    tags: z.union([z.string().max(4096), z.array(z.string().max(64)).max(30)]).optional(),
});

// Used by POST /api/knowledge (single or bulk)
export const knowledgeCreateBodySchema = z.union([
    // Single entry
    knowledgeEntrySchema,
    // Bulk import
    z.object({
        entries: z.array(knowledgeEntrySchema).min(1).max(5000),
        source: z.string().max(256).optional(),
    }),
]);
export type KnowledgeCreateBody = z.infer<typeof knowledgeCreateBodySchema>;

// Used by PATCH /api/knowledge/[id]
export const knowledgePatchBodySchema = z.union([
    z.object({ action: z.literal('approve'), approvedBy: z.string().max(256).optional() }),
    z.object({ action: z.literal('recordUsage') }),
    knowledgeEntrySchema.partial().extend({ action: z.undefined().optional() }),
]);
export type KnowledgePatchBody = z.infer<typeof knowledgePatchBodySchema>;

// Used by POST /api/knowledge/ingest
const answeredQuestionSchema = z.object({
    questionText: z.string().min(1).max(4096),
    answer: z.string().max(16_384).optional(),
    yesNo: z.string().max(8).optional(),
    source: z.string().max(64).optional(),
    confidence: z.union([z.number(), z.string()]).optional(),
    domain: z.string().max(128).optional(),
    category: z.string().max(128).optional(),
    evidenceRef: z.string().max(2048).optional(),
});

export const knowledgeIngestBodySchema = z.object({
    questions: z.array(answeredQuestionSchema).min(1, 'questions array is required and must not be empty').max(5000),
    source: z.string().max(256).optional(),
    assessmentName: z.string().max(256).optional(),
});
export type KnowledgeIngestBody = z.infer<typeof knowledgeIngestBodySchema>;
