import { NextResponse } from 'next/server';
import { ax } from '@/lib/ai/ax-engine';

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();

        // 1. Build System Instruction from Context
        let systemInstruction = `You are Astra, an advanced AI Security Analyst.
You are currently assisting the CISO in the "${context.page || 'Unknown'}" module.
Current Time: ${context.timestamp || new Date().toISOString()}.
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

        // 2. Start Chat Session using Ax
        // Ax handles the conversation history and prompt construction cleanly.
        // We create a new chat session for this request (stateless API style or handling history manually)

        // Prepare history for Ax (Standard OpenAI/Ax format: { role: 'user'|'assistant', content: string })
        // Note: The frontend sends 'assistant', Google wanted 'model'. Ax wants 'assistant'.
        const axHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role,
            content: m.content
        }));

        const lastMessage = messages[messages.length - 1];

        // 3. Send Message
        const response = await ax.chat({
            chatPrompt: [
                { role: 'system', content: systemInstruction },
                ...axHistory,
                { role: 'user', content: lastMessage.content }
            ]
        }, { stream: false });

        // 4. Return result
        // Ax response structure: { results: [{ content: "..." }] }
        // Type guard or cast since response can be a stream
        const chatResponse = response as any;
        const content = chatResponse.results?.[0]?.content;
        return NextResponse.json({
            response: content || "No response generated."
        });




    } catch (error: any) {
        console.error("AI Error Details:", error);
        return NextResponse.json(
            { error: "AI Processing Failed", details: error.message },
            { status: 500 }
        );
    }
}
