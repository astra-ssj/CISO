/**
 * Shared API validation helpers using Zod.
 * Use parseBodyWithZod in API routes to validate and return 400 on failure.
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

export function parseBodyWithZod<T>(body: unknown, schema: z.ZodType<T>): { data: T } | { error: NextResponse } {
    const result = schema.safeParse(body);
    if (result.success) {
        return { data: result.data };
    }
    const first = result.error.flatten();
    const message = first.formErrors[0] ?? first.fieldErrors ? Object.values(first.fieldErrors).flat()[0]?.[0] : 'Validation failed';
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
    context: z.record(z.unknown()).optional(),
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
