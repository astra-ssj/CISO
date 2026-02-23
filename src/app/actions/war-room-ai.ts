"use server";

import { getAIProvider, isAIConfigured, type ChatHistoryEntry } from '@/lib/ai/engine';

export interface WarRoomResult {
    success: boolean;
    role: 'assistant';
    content: string;
    error?: string;
    timestamp: Date;
}

export interface IncidentContext {
    id?: string;
    title?: string;
    severity?: string;
    status?: string;
    [key: string]: unknown;
}

export async function consultCommandCenter(
    message: string,
    incidentContext: IncidentContext,
    history: { role: string; content: string }[]
): Promise<WarRoomResult> {

    // 1. Safety Check
    if (!isAIConfigured()) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            success: true,
            role: 'assistant',
            content: "⚠️ **AI Offline**: The neural core is unreachable. Please check your API configuration.\n\n*Running in localized fail-safe mode.*",
            timestamp: new Date()
        };
    }

    try {
        // 2. Construct Prompt
        const systemPrompt = `You are the AI Commander of a Cyber War Room. 
        Current active incident: ${JSON.stringify(incidentContext)}.
        
        Your role:
        1. Analyze the situation based on the user's input.
        2. Provide immediate, tactical guidance (containment, eradication, recovery).
        3. Be authoritative, concise, and precise. Use military/cybersecurity terminology.
        4. If the user asks for a specific artifact (email, report), draft it.
        
        Format your response in Markdown. Use bolding for key actions.`;

        // 3. Call AI
        const chatSession = getAIProvider().createChatSession(
            systemPrompt,
            [
                { role: 'model', parts: [{ text: "Acknowledged. War Room initialized. Awaiting sitrep." }] },
                // simple history mapping
                ...history.slice(-6).map((msg): ChatHistoryEntry => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ]
        );

        const responseText = await chatSession.sendMessage(message);

        return {
            success: true,
            role: 'assistant',
            content: responseText.data,
            timestamp: new Date()
        };

    } catch (error: unknown) {
        console.error("War Room AI Error:", error);

        const message = error instanceof Error ? error.message : String(error);
        // 4. Quota Fallback (The Feature we verified)
        if (message.includes("429") || message.includes("Quota exceeded")) {
            console.warn("Quota exceeded. Returning mock fallback.");
            return {
                success: true,
                role: 'assistant',
                content: `**AI assistant temporarily unavailable.**\n\nUnable to reach the AI service. Please try again shortly.\n\n**Recommended actions:**\n1.  **Isolate** the compromised subnet immediately.\n2.  **Snapshot** all affected VM memory states.\n3.  **Reset** Kerberos Ticket Granting Ticket (KRBTGT) account password twice.\n\n*You can retry the AI connection in 60s.*`,
                timestamp: new Date()
            };
        }

        return {
            success: false,
            role: 'assistant',
            content: "Error: Communication link severed.",
            error: message,
            timestamp: new Date()
        };
    }
}
