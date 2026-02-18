import { NextResponse } from 'next/server';
import { analyzeRequestAsync } from '@/lib/intelligence-engine';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

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
        const body = await request.json();
        const { title, description, context, useRealAI } = body;

        if (!title || !description) {
            return NextResponse.json(
                { error: "Missing required fields: title, description" },
                { status: 400 }
            );
        }

        // Input Sanitization
        if (title.length > 200 || description.length > 5000) {
            return NextResponse.json(
                { error: "Input exceeds maximum length limits." },
                { status: 400 }
            );
        }

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

            let analysis: AnalysisResult;

            try {
                analysis = await provider.generateStructuredContent(prompt);
            } catch (e) {
                console.error("AI Generation failed, falling back to mock", e);
                // Silent fallback or error? Let's fallback for robustness
                const analysisResult = await analyzeRequestAsync(
                    title,
                    description,
                    {
                        activeStandards: context?.activeStandards || [],
                        policies: context?.policies || []
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
                activeStandards: context?.activeStandards || [],
                policies: context?.policies || []
            }
        );

        return NextResponse.json({
            ...analysisResult,
            provider: 'MOCK',
            model: 'intelligence-engine-v1'
        });

    } catch (error: any) {
        console.error("Agent Analysis Failed:", error);

        const status = error.status || 500;
        let message = 'Internal Server Error during analysis.';

        if (status === 429 || error.message?.includes('429')) {
            message = 'AI Rate Limit Exceeded. Please try again in a moment.';
        }

        return NextResponse.json(
            { error: message, details: error.message },
            { status: status }
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

