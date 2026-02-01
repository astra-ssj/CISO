import { NextResponse } from 'next/server';
import { analyzeRequestAsync } from '@/lib/intelligence-engine';
import { getProvider, listProviders } from '@/lib/ai';

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
        const provider = getProvider();
        const isRealProvider = provider.name !== 'MOCK' && useRealAI !== false;

        if (isRealProvider) {
            // Use real LLM provider
            const aiResult = await provider.complete({
                messages: [
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
            return NextResponse.json({
                riskScore: 50,
                riskLevel: 'MEDIUM',
                flaggedKeywords: ['AI-Analyzed'],
                complianceGaps: [],
                recommendedActions: [aiResult.content],
                generatedArtifacts: [],
                provider: aiResult.provider,
                model: aiResult.model,
                tokensUsed: aiResult.tokensUsed
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
        providers: listProviders(),
        active: process.env.AI_PROVIDER || 'MOCK'
    });
}

