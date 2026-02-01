import { NextResponse } from 'next/server';
import { generatePolicyAsync } from '@/lib/intelligence-engine';
import { getProvider } from '@/lib/ai';

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
        const provider = getProvider();
        const isRealProvider = provider.name !== 'MOCK' && useRealAI !== false;

        if (isRealProvider) {
            // Use real LLM for policy generation
            const aiResult = await provider.complete({
                messages: [
                    {
                        role: 'user',
                        content: `Generate a comprehensive security policy for: "${safeTopic}"

Strictness Level: ${strictness || 'MEDIUM'}

Include the following sections:
1. Purpose - Why this policy exists
2. Scope - Who and what it applies to
3. Roles & Responsibilities - Accountable parties
4. Policy Statements - The actual rules (be ${strictness === 'HIGH' ? 'very strict and prescriptive' : 'balanced and practical'})
5. Compliance - Monitoring and enforcement

Format as a professional policy document.`
                    }
                ]
            });

            return NextResponse.json({
                title: `${safeTopic} Policy`,
                type: 'ISMS',
                status: 'DRAFT',
                version: '0.1.0',
                owner: 'AI Agent',
                sections: [
                    { id: 's1', title: 'AI-Generated Policy', content: aiResult.content }
                ],
                mappings: [],
                provider: aiResult.provider,
                model: aiResult.model
            });
        }

        // Fallback to mock generation
        const policyDraft = await generatePolicyAsync(safeTopic, strictness || 'MEDIUM');

        return NextResponse.json({
            ...policyDraft,
            provider: 'MOCK',
            model: 'intelligence-engine-v1'
        });

    } catch (error) {
        console.error("Policy Generation Failed:", error);
        return NextResponse.json(
            { error: "Internal Server Error during generation." },
            { status: 500 }
        );
    }
}
