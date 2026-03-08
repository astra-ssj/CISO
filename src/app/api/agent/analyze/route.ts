import { NextResponse } from 'next/server';
import { analyzeRequestAsync } from '@/lib/intelligence-engine';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { TokenTracker, AIModel } from '@/lib/telemetry/token-tracker';
import { parseBodyWithZod, log } from '@/lib/api-validation';
import { z } from 'zod';
import type { ComplianceStandard } from '@/lib/store';
import type { Policy } from '@/lib/policy-store';

// Inline schema — extends the shared one to include the legacy 'policies' field
const analyzeBodySchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    context: z.object({
        activeStandards: z.array(z.string().max(64)).max(20).optional(),
        policies: z.array(z.unknown()).max(100).optional(),
    }).optional(),
    useRealAI: z.boolean().optional(),
});


// Define expected output shape
interface AnalysisResult {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    flaggedKeywords: string[];
    complianceGaps: string[];
    recommendedActions: string[];
}

export async function POST(request: Request) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, analyzeBodySchema);
        if ('error' in parsed) return parsed.error;
        const { title, description, context, useRealAI } = parsed.data;


        // Check availability
        const isReady = isAIConfigured();
        const isRealProvider = isReady && useRealAI !== false;

        if (isRealProvider) {
            const provider = getAIProvider();

            const prompt = `Analyze this security request and provide a risk assessment in JSON format.

**Title**: ${title}
**Description**: ${description}
**Active Standards**: ${context?.activeStandards?.join(', ') || 'None specified'}

Task:
1. Assign a Risk Score (0-100) and Level.
2. Identify compliance gaps based on standards.
3. Recommend actions.

Output Schema:
{
  "riskScore": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "flaggedKeywords": string[],
  "complianceGaps": string[],
  "recommendedActions": string[]
}`;

            let analysis: Record<string, unknown>;

            try {
                const response = await provider.generateStructuredContent(prompt);
                analysis = response.data;

                if (response.usage) {
                    await TokenTracker.trackUsage({
                        userId: 'authenticated-user',
                        model: (provider as unknown as Record<string, unknown>).modelName as AIModel || 'gemini-1.5-pro',
                        actionType: 'RISK_ANALYSIS',
                        promptTokens: response.usage.promptTokens,
                        completionTokens: response.usage.completionTokens
                    });
                }
            } catch (e) {
                console.error("AI Generation failed, falling back to mock", e);
                // Silent fallback or error? Let's fallback for robustness
                const analysisResult = await analyzeRequestAsync(
                    title,
                    description,
                    {
                        activeStandards: (context?.activeStandards || []) as ComplianceStandard[],
                        policies: (context?.policies || []) as unknown as Policy[]
                    }
                );
                return NextResponse.json({
                    ...analysisResult,
                    provider: 'MOCK (Fallback)',
                    model: 'intelligence-engine-v1'
                });
            }

            return NextResponse.json({
                ...analysis,
                generatedArtifacts: [],
                provider: process.env.AI_PROVIDER || 'GEMINI',
                model: 'unified-model'
            });
        }

        // Fallback to existing intelligence engine (mock/heuristic)
        const analysisResult = await analyzeRequestAsync(
            title,
            description,
            {
                activeStandards: (context?.activeStandards || []) as ComplianceStandard[],
                policies: (context?.policies || []) as unknown as Policy[]
            }
        );

        return NextResponse.json({
            ...analysisResult,
            provider: 'MOCK',
            model: 'intelligence-engine-v1'
        });

    } catch (error: unknown) {
        log('error', 'agent/analyze', 'Agent Analysis Failed', error);


        const err = error as { status?: number; message?: string };
        const status = err.status ?? 500;
        let message = 'Internal Server Error during analysis.';

        if (status === 429 || (typeof err.message === 'string' && err.message.includes('429'))) {
            message = 'AI Rate Limit Exceeded. Please try again in a moment.';
        } else if (err.message) {
            message = err.message;
        }

        return NextResponse.json(
            { error: message, details: err.message },
            { status }
        );
    }
}

// GET endpoint to list available providers
export async function GET() {
    return NextResponse.json({
        providers: [
            { name: 'GEMINI', available: !!process.env.GOOGLE_API_KEY },
            { name: 'ANTHROPIC', available: !!process.env.ANTHROPIC_API_KEY }
        ],
        active: process.env.AI_PROVIDER || 'GEMINI'
    });
}

