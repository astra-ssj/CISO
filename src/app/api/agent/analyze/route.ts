import { NextResponse } from 'next/server';
import { analyzeRequestAsync } from '@/lib/intelligence-engine';
import { ax, isAIConfigured } from '@/lib/ai/engine';

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

        // Check if we should use real AI provider
        // Check if we should use real AI provider
        const isRealProvider = isAIConfigured() && useRealAI !== false;

        if (isRealProvider) {
            // Use real LLM provider
            const result = await ax.chat({
                chatPrompt: [
                    {
                        role: 'user',
                        content: `Analyze this security request and provide a risk assessment:

**Title**: ${title}
**Description**: ${description}
**Active Standards**: ${context?.activeStandards?.join(', ') || 'None specified'}

Provide:
1. Risk Level (LOW/MEDIUM/HIGH/CRITICAL)
2. Flagged Keywords
3. Compliance Gaps
4. Recommended Actions
5. Any policy drafts or artifacts that should be generated

Format your response as structured analysis.`
                    }
                ]
            });

            // Parse AI response into structured format
            // Simple parsing for now, assuming string or content object
            let content = "";
            let modelName = "unknown";
            let tokensUsed = 0;

            if (typeof result === 'string') {
                content = result;
            } else if ('content' in (result as any)) {
                content = (result as any).content;
                modelName = (result as any).model || "unknown";
                tokensUsed = (result as any).usage?.totalTokens || 0;
            } else if ('results' in (result as any)) {
                content = (result as any).results[0].content;
            }

            return NextResponse.json({
                riskScore: 50,
                riskLevel: 'MEDIUM',
                flaggedKeywords: ['AI-Analyzed'],
                complianceGaps: [],
                recommendedActions: [content],
                generatedArtifacts: [],
                provider: 'AX',
                model: modelName,
                tokensUsed: tokensUsed
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

    } catch (error) {
        console.error("Agent Analysis Failed:", error);
        return NextResponse.json(
            { error: "Internal Server Error during analysis." },
            { status: 500 }
        );
    }
}

// GET endpoint to list available providers
export async function GET() {
    return NextResponse.json({
        providers: [
            { name: 'OLLAMA', available: process.env.NEXT_PUBLIC_USE_OLLAMA === 'true' },
            { name: 'OPENAI', available: !!process.env.OPENAI_API_KEY }
        ],
        active: process.env.NEXT_PUBLIC_USE_OLLAMA === 'true' ? 'OLLAMA' : 'OPENAI'
    });
}

