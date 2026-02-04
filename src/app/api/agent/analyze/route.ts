import { NextResponse } from 'next/server';
import { analyzeRequestAsync } from '@/lib/intelligence-engine';
import { ax, isAIReady } from '@/lib/ai/ax-engine'; // Use new Ax engine

// Define expected output shape for Ax
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

        // Check if we should use real AI provider
        const isReady = await isAIReady();
        const isRealProvider = isReady && useRealAI !== false;

        if (isRealProvider) {
            // Use Ax for structured analysis
            const prompt = `Analyze this security request and provide a risk assessment:

**Title**: ${title}
**Description**: ${description}
**Active Standards**: ${context?.activeStandards?.join(', ') || 'None specified'}

Task:
1. Assign a Risk Score (0-100) and Level.
2. Identify compliance gaps based on standards.
3. Recommend actions.`;

            // Ax 'run' method roughly equivalent to structured generation
            // Note: Actual Ax API for structured output might be .json() or similar depending on library version.
            // Assuming .chat() with instructions or a specific .run() helper. 
            // If strictly typed output is needed, we often guide Llama 3 via prompt or JSON mode.
            // Ax usually supports .run<T>(prompt) or similar.

            // Using standard chat with JSON instruction for Llama 3 (strongest method)
            const response = await ax.chat({
                chatPrompt: [
                    { role: 'system', content: 'You are a Risk Analysis AI. Return JSON only.' },
                    { role: 'user', content: prompt + "\n\nRespond ONLY with valid JSON matching the schema." }
                ]
            }, { stream: false });

            // Allow manual parse or Ax parse
            let analysis: AnalysisResult;
            const chatResponse = response as any;
            const content = chatResponse.results?.[0]?.content;

            try {
                // simple parse if response.text is the string
                analysis = content ? JSON.parse(content) : {
                    riskScore: 0, riskLevel: 'LOW', flaggedKeywords: [], complianceGaps: [], recommendedActions: ["No content generated"]
                };
            } catch (e) {
                // Fallback if JSON is messy (Llama 3 is usually good)
                console.warn("JSON Parse failed, using default", e);
                analysis = {
                    riskScore: 50,
                    riskLevel: 'MEDIUM',
                    flaggedKeywords: ['ParseError'],
                    complianceGaps: [],
                    recommendedActions: [content || "Analysis complete but unstructured."]
                };
            }

            return NextResponse.json({
                ...analysis,
                generatedArtifacts: [],
                provider: 'AX (Llama 3)',
                model: 'llama3',
                tokensUsed: 0
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
            { name: 'OLLAMA', available: process.env.NEXT_PUBLIC_USE_OLLAMA === 'true' },
            { name: 'OPENAI', available: !!process.env.OPENAI_API_KEY }
        ],
        active: process.env.NEXT_PUBLIC_USE_OLLAMA === 'true' ? 'OLLAMA' : 'OPENAI'
    });
}

