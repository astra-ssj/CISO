import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { getCircuitState, setCircuitState } from '@/lib/ai/circuit-breaker';
import { appendToFabric } from '@/lib/auth/audit';
import { parseBodyWithZod, agentChatBodySchema } from '@/lib/api-validation';

const CISO_SYSTEM_PROMPT = `You are Astra, an AI security advisor embedded in the Astra-CISO platform. You have deep knowledge of ISO 27001, NIST CSF, GDPR, NIS2, EU AI Act, SOC 2, and FAIR risk methodology. You help CISOs with compliance questions, risk analysis, policy drafting, incident response guidance, and security strategy. Be concise, specific, and reference relevant framework controls when applicable. When uncertain, say so — never fabricate compliance guidance.

### CONVERSATION MODES (detect from user input and respond accordingly):
- **General security Q&A** — Answer directly with references to standards where relevant.
- **Policy drafting** — Use policy templates and structure; reference controls (e.g. ISO A.5.x, NIST ID.AM).
- **Risk analysis** — Use FAIR methodology; distinguish threat, vulnerability, impact, likelihood.
- **Incident guidance** — Reference playbooks, containment, communication, and post-incident review.
- **Compliance gap analysis** — Reference framework controls and map gaps to specific control IDs.
- **CAIQ / vendor risk** — Help with questionnaire answers and evidence mapping.

Use the CURRENT PLATFORM CONTEXT below to tailor your answers to the organization's state.`;

function buildContextBlock(context: Record<string, unknown> | undefined): string {
    const complianceScore = context?.complianceScore ?? '—';
    const activeThreats = context?.activeThreats ?? 0;
    const activeStandards = Array.isArray(context?.activeStandards)
        ? (context.activeStandards as string[]).join(', ')
        : '—';
    const recentRiskScores = Array.isArray(context?.recentRiskScores)
        ? (context.recentRiskScores as number[]).slice(0, 5).join(', ')
        : '—';
    const userRole = context?.userRole ?? 'Unknown';
    const page = context?.page ?? 'Dashboard';
    const systemStatus = context?.systemStatus ?? 'NOMINAL';

    return `
### CURRENT PLATFORM CONTEXT:
- **User Role**: ${userRole}
- **Current Page**: ${page}
- **System Status**: ${systemStatus}
- **Compliance Posture Score**: ${complianceScore} (0–100)
- **Active Incident / Threat Count**: ${activeThreats}
- **Active Frameworks**: ${activeStandards}
- **Recent Risk Scores** (from decision queue): ${recentRiskScores}
`;
}

/** Redact or truncate query for audit (avoid logging full PII/secrets). */
function redactForAudit(query: string, maxLen: number = 200): string {
    if (!query || typeof query !== 'string') return '[empty]';
    const trimmed = query.trim().slice(0, maxLen);
    // Mask potential secrets (e.g. API key-like strings)
    const masked = trimmed.replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]');
    return masked + (query.length > maxLen ? '…' : '');
}

export async function POST(request: NextRequest) {
    const providerName = (process.env.AI_PROVIDER || 'GEMINI').toUpperCase();

    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, agentChatBodySchema);
        if ('error' in parsed) return parsed.error;
        const { message, history = [], context } = parsed.data;

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized Access to Neural Core' }, { status: 401 });
        }

        // Circuit breaker: if open, return helpful message
        if (getCircuitState(providerName) === 'open') {
            return NextResponse.json(
                {
                    error: 'AI assistant is temporarily unavailable. The circuit breaker will retry shortly.',
                    circuitOpen: true
                },
                { status: 503 }
            );
        }

        if (!isAIConfigured()) {
            return NextResponse.json(
                {
                    error: 'AI provider not configured. Set GOOGLE_API_KEY or ANTHROPIC_API_KEY in .env.local and restart the server.'
                },
                { status: 503 }
            );
        }

        const contextBlock = buildContextBlock(context);
        const userMessageWithContext = message + '\n' + contextBlock;

        type ChatHistoryEntry = import('@/lib/ai/engine').ChatHistoryEntry;
        let chatHistory: ChatHistoryEntry[] = (history as { role: string; content: string }[]).map((msg): ChatHistoryEntry => ({
            role: (msg.role === 'assistant' ? 'model' : 'user') as ChatHistoryEntry['role'],
            parts: [{ text: msg.content || '' }]
        }));
        if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
            chatHistory = chatHistory.slice(1);
        }

        const provider = getAIProvider();
        const chatSession = provider.createChatSession(CISO_SYSTEM_PROMPT, chatHistory);

        const { runWithRetry } = await import('@/lib/ai/utils');
        const responseText = await runWithRetry(() => chatSession.sendMessage(userMessageWithContext));

        const finalContent = typeof responseText === 'string' ? responseText : String(responseText ?? '');

        // Audit: log every AI interaction
        const querySummary = redactForAudit(message);
        const responseSummary = finalContent.slice(0, 500) + (finalContent.length > 500 ? '…' : '');
        await appendToFabric({
            actor: 'SYSTEM',
            action: 'AI_CHAT',
            resource: 'agent:chat',
            resourceId: null,
            metadata: {
                querySummary,
                responseSummary,
                modelUsed: providerName,
                tokensConsumed: null,
                confidenceLevel: null
            }
        }).catch(() => {});

        const wantsStream = request.headers.get('accept')?.includes('text/event-stream');
        if (wantsStream) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    const chunk = finalContent;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk, done: true })}\n\n`));
                    controller.close();
                }
            });
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive'
                }
            });
        }

        return NextResponse.json({
            role: 'assistant',
            content: finalContent
        });
    } catch (error: unknown) {
        const err = error as { message?: string; status?: number };
        const errMsg = typeof err?.message === 'string' ? err.message : String(err?.message ?? error);
        console.error('Chat API Error:', error);

        let status = err?.status ?? 500;
        let message = 'Internal Server Error';

        if (status === 429 || errMsg.includes('429')) {
            status = 429;
            message = 'AI Rate Limit Exceeded. Please try again in a moment. (Retried 3 times)';
        } else if (
            status === 403 ||
            errMsg.includes('not configured') ||
            errMsg.includes('not set') ||
            errMsg.includes('unregistered callers') ||
            errMsg.includes('API Key')
        ) {
            status = 503;
            message = 'AI provider not configured. Set GOOGLE_API_KEY or ANTHROPIC_API_KEY in .env.local and restart the server.';
        }

        if (status !== 429 && status !== 403) {
            setCircuitState(providerName, 'open');
            const { logCircuitBreakerTripped } = await import('@/lib/auth/audit');
            logCircuitBreakerTripped(providerName, { error: errMsg }).catch(() => {});
        }

        return NextResponse.json({
            error: message,
            details: errMsg
        }, { status });
    }
}
