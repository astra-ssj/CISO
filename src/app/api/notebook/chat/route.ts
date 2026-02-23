import { NextResponse } from 'next/server';
import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();

        // 1. Build System Instruction from Context
        let systemInstruction = `You are Astra, an advanced AI Security Analyst.
You are currently assisting the CISO in the "${context.page || 'Unknown'}" module.
Current Time: ${context.timestamp || new Date().toISOString()}.

PLATFORM CAPABILITIES (Use this for Help/Support):
- **Threat Intelligence**: Real-time MITRE ATT&CK Matrix and Global Threat Map (White-board style). Live Security Events feed matches tactical signals.
- **Strategy Pyramid**: Strategic initiatives are prioritized by AI based on threat signals. You can "Adopt" initiatives to track them.
- **Policy Engine**: Upload docs to check against ISO/NIST. Uses gap analysis to find missing controls.
- **Connectivity**: The "Signal Bus" connects modules. A "Critical" alert in Intelligence automatically promotes initiatives in Strategy.
- **AI Economics**: We mathematically track AI token consumption (Prompt Tokens + Completion Tokens) via a 'TokenTracker' backend utility that intercepts traffic from our 4 major AI engines (Chat, Policy, Risk, and CAIQ). The cost is calculated against exact model pricing per 1 million tokens, saved to a local JSON log, and aggregated into a CISO-level frontend dashboard to monitor Profit Margins for each active tenant.
`;

        if (context.selectedNode) {
            systemInstruction += `\nFOCUS CONTEXT: The user is analyzing Node "${context.selectedNode.id}".`;
            if (context.selectedNode.violation) {
                systemInstruction += `\nALERT: This node has an active compliance violation: "${context.selectedNode.violation}". Prioritize remediation advice.`;
            }
        }

        if (context.activeConstraints && context.activeConstraints.length > 0) {
            systemInstruction += `\nACTIVE LEGAL CONSTRAINTS: ${context.activeConstraints.join(', ')}.`;
        }

        systemInstruction += `\nBe concise, professional, and actionable. Use markdown for formatting.`;

        if (!isAIConfigured()) {
            return NextResponse.json({
                response: "AI provider is not configured. Please set GOOGLE_API_KEY or ANTHROPIC_API_KEY in your .env.local file."
            });
        }

        // 2. Create Chat Session using the unified provider
        const provider = getAIProvider();

        // Build history for the AI provider
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'model' as const : (m.role as 'user' | 'system'),
            parts: [{ text: m.content }]
        }));

        const lastMessage = messages[messages.length - 1];

        const session = provider.createChatSession(systemInstruction, history);
        const response = await session.sendMessage(lastMessage.content);

        return NextResponse.json({
            response: response?.data || "No response generated."
        });

    } catch (error: unknown) {
        console.error("AI Error Details:", error);
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "AI Processing Failed", details },
            { status: 500 }
        );
    }
}
