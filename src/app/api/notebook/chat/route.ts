import { NextResponse } from 'next/server';
import { ax } from '@/lib/ai/engine';

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

        // 2. Augment messages with system prompt
        // Ax expects { role: 'system' | 'user' | 'assistant', content: string }
        const chatMessages = [
            { role: 'system', content: systemInstruction },
            ...messages
        ];

        // 3. Call Ax
        const result = await ax.chat({
            chatPrompt: chatMessages as any
        });

        console.log("Ax Result:", JSON.stringify(result, null, 2));

        // 4. Parse Result
        let textResponse = "";

        // Handle various return shapes from Ax
        if (typeof result === 'string') {
            textResponse = result;
        } else if (Array.isArray(result)) {
            // Handle array response (common in some streaming adapters or Ollama direct)
            if (result.length > 0) {
                if (typeof result[0] === 'string') textResponse = result[0];
                else if (result[0].content) textResponse = result[0].content;
                else textResponse = JSON.stringify(result[0]);
            }
        } else if (result && typeof result === 'object') {
            if ('content' in result) {
                textResponse = (result as any).content;
            } else if ('results' in result && Array.isArray((result as any).results)) {
                textResponse = (result as any).results[0].content;
            } else if ('choices' in result && Array.isArray((result as any).choices)) {
                textResponse = (result as any).choices[0].message.content;
            } else {
                textResponse = JSON.stringify(result);
            }
        }

        // 4. Return result
        return NextResponse.json({
            response: textResponse || "No response generated."
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
