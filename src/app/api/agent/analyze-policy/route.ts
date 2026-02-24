import { NextResponse } from 'next/server';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { analyzePolicy } from '@/lib/policy-engine';
import type { FrameworkID } from '@/lib/compliance-frameworks';
import { parseBodyWithZod, agentAnalyzePolicyBodySchema, log } from '@/lib/api-validation';

export async function POST(request: Request) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, agentAnalyzePolicyBodySchema);
        if ('error' in parsed) return parsed.error;
        const { policyContent, standards } = parsed.data;

        const frameworks: FrameworkID[] = (standards as FrameworkID[] | undefined) || ['NIST_CSF_2_0', 'ISO_27001_2022'];



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

                const analysis = await provider.generateStructuredContent(prompt);

                return NextResponse.json({
                    ...analysis.data,
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
                (g: any) => `Address ${g.framework || 'compliance'} gap: ${g.description}`
            ),
            riskLevel: heuristicResult.score > 80 ? 'LOW' : heuristicResult.score > 60 ? 'MEDIUM' : heuristicResult.score > 40 ? 'HIGH' : 'CRITICAL',
            provider: 'HEURISTIC',
            model: 'policy-engine-v1',
            aiPowered: false
        });
    } catch (error: any) {
        console.error('[Policy Analysis] Error:', error);

        const status = error.status || 500;
        let message = 'Internal server error during policy analysis.';

        if (status === 429 || error.message?.includes('429')) {
            message = 'AI rate limit exceeded. Please try again in a moment.';
        }

        return NextResponse.json(
            { error: message, details: error.message },
            { status }
        );
    }
}
