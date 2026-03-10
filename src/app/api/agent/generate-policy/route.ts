import { NextResponse } from 'next/server';
import { generatePolicyAsync } from '@/lib/intelligence-engine';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';
import { TokenTracker, AIModel } from '@/lib/telemetry/token-tracker';
import { parseBodyWithZod, agentGeneratePolicyBodySchema } from '@/lib/api-validation';

export async function POST(request: Request) {
    try {
        const raw = await request.json().catch(() => ({}));
        const parsed = parseBodyWithZod(raw, agentGeneratePolicyBodySchema);
        if ('error' in parsed) return parsed.error;
        const { topic, strictness, useRealAI } = parsed.data;

        const safeTopic = topic.slice(0, 100).replace(/[<>]/g, "");
        const isReady = isAIConfigured();
        const isRealProvider = isReady && useRealAI !== false;

        if (isRealProvider) {
            // Use real LLM for policy generation
            const prompt = `Generate a comprehensive security policy for: "${safeTopic}"

Strictness Level: ${strictness || 'MEDIUM'}

Include the following sections:
1. Purpose - Why this policy exists
2. Scope - Who and what it applies to
3. Roles & Responsibilities - Accountable parties
4. Policy Statements - The actual rules (be ${strictness === 'HIGH' ? 'very strict and prescriptive' : 'balanced and practical'})
5. Compliance - Monitoring and enforcement

Format as a professional policy document.`;

            const provider = getAIProvider();
            const response = await provider.generateContent(prompt);
            const content = response.data;

            if (response.usage) {
                await TokenTracker.trackUsage({
                    userId: 'authenticated-user',
                    model: 'modelName' in provider ? String(provider.modelName) as AIModel : 'gemini-1.5-pro',
                    actionType: 'POLICY_GEN',
                    promptTokens: response.usage.promptTokens,
                    completionTokens: response.usage.completionTokens
                });
            }

            return NextResponse.json({
                title: `${safeTopic} Policy`,
                type: 'ISMS',
                status: 'DRAFT',
                version: '0.1.0',
                owner: 'AI Agent',
                sections: [
                    { id: 's1', title: 'AI-Generated Policy', content: content }
                ],
                mappings: [],
                provider: process.env.AI_PROVIDER || 'GEMINI',
                model: 'ai-policy-generator'
            });
        }

        // Fallback to mock generation
        const policyDraft = await generatePolicyAsync(safeTopic, strictness || 'MEDIUM');

        return NextResponse.json({
            ...policyDraft,
            provider: 'MOCK',
            model: 'intelligence-engine-v1'
        });

    } catch (error: unknown) {
        console.error("Policy Generation Failed:", error);
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Generation Failed", details },
            { status: 500 }
        );
    }
}
