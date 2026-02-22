import { NextResponse } from 'next/server';
import { generatePolicyAsync } from '@/lib/intelligence-engine';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { topic, strictness, useRealAI } = body;

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

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
            const content = await provider.generateContent(prompt);

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
