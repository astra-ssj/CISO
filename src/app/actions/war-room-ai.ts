"use server";

import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

type ChatHistoryEntry = { role: 'user' | 'model'; parts: { text: string }[] };

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
        return {
            success: false,
            role: 'assistant',
            content: 'AI is not configured. No draft. Set an AI provider in Settings.',
            error: 'ai_not_configured',
            timestamp: new Date()
        };
    }

    try {
        // 2. Construct Prompt
        const systemPrompt = `You are a CISO copilot drafting incident guidance.
        Incident context (may be exercise mode): ${JSON.stringify(incidentContext)}.
        Label every recommendation as a draft. Do not invent IOCs, asset names, or containment that did not happen.
        You cannot close a decision or change Vendor/Incident status.`;

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
            return {
                success: false,
                role: 'assistant',
                content: 'AI quota exceeded. No draft was invented.',
                error: 'quota_exceeded',
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
