import { NextResponse } from 'next/server';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { analyzePolicy, type PolicyGap } from '@/lib/policy-engine';
import type { FrameworkID } from '@/lib/compliance-frameworks';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { policyContent, standards } = body;

        if (!policyContent) {
            return NextResponse.json(
                { error: 'Missing required field: policyContent' },
                { status: 400 }
            );
        }

        if (policyContent.length > 50000) {
            return NextResponse.json(
                { error: 'Policy content exceeds maximum length (50,000 characters).' },
                { status: 400 }
            );
        }

        const frameworks: FrameworkID[] = standards || ['NIST_CSF_2_0', 'ISO_27001_2022'];

        // Try real AI analysis first
        if (isAIConfigured()) {
            try {
                const provider = getAIProvider();

                const prompt = `You are a senior CISO advisor performing a policy compliance analysis. Analyze the following policy text against these compliance frameworks: ${frameworks.join(', ')}.

**Policy Text:**
${policyContent.substring(0, 10000)}

**Task:**
1. Score the policy from 0-100 on compliance coverage
2. Identify specific gaps where the policy does not meet framework requirements
3. Count vague or ambiguous terms that weaken the policy
4. List strong points where the policy excels
5. Provide actionable recommendations for improvement

**Output JSON Schema:**
{
  "score": number,
  "vagueTermsCount": number,
  "identifiedGaps": [{ "framework": string, "controlId": string, "description": string, "severity": "HIGH" | "MEDIUM" | "LOW", "recommendation": string }],
  "strongPoints": string[],
  "recommendations": string[],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}`;

                const analysis = await provider.generateStructuredContent<Record<string, unknown>>(prompt);

                return NextResponse.json({
                    ...(typeof analysis === 'object' && analysis !== null ? analysis : {}),
                    provider: process.env.AI_PROVIDER || 'GEMINI',
                    model: 'ai-policy-analyzer',
                    aiPowered: true
                });
            } catch (aiError) {
                console.error('[Policy Analysis] AI failed, falling back to heuristic engine:', aiError);
            }
        }

        // Fallback to existing heuristic policy engine
        const heuristicResult = analyzePolicy(policyContent, frameworks);

        return NextResponse.json({
            ...heuristicResult,
            recommendations: heuristicResult.identifiedGaps.map(
                (g: PolicyGap) => `Address ${g.frameworkName || 'compliance'} gap: ${g.gapDescription}`
            ),
            riskLevel: heuristicResult.score > 80 ? 'LOW' : heuristicResult.score > 60 ? 'MEDIUM' : heuristicResult.score > 40 ? 'HIGH' : 'CRITICAL',
            provider: 'HEURISTIC',
            model: 'policy-engine-v1',
            aiPowered: false
        });
    } catch (error: unknown) {
        console.error('[Policy Analysis] Error:', error);

        const err = error as { status?: number; message?: string };
        const status = err.status ?? 500;
        let message = 'Internal server error during policy analysis.';

        if (status === 429 || (typeof err.message === 'string' && err.message.includes('429'))) {
            message = 'AI rate limit exceeded. Please try again in a moment.';
        } else if (err.message) {
            message = err.message;
        }

        return NextResponse.json(
            { error: message, details: err.message },
            { status }
        );
    }
}
