"use server";

import { generativeModel, isAIConfigured } from '@/lib/ai/engine';

export interface CounterDraftResult {
    success: boolean;
    counterDraft?: string;
    reasoning?: string;
    error?: string;
}

export async function generateCounterDraftAction(
    clauseText: string,
    riskLevel: string,
    companyStandard?: string
): Promise<CounterDraftResult> {

    // 1. Safety Check
    if (!isAIConfigured()) {
        console.warn("AI Engine not configured. Falling back to Mock.");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            success: true,
            counterDraft: `[MOCK AI GENERATION]\n\nRevised CAUSE: ${clauseText.substring(0, 20)}... SHALL BE AMENDED TO...\n\n(Note: AI Engine not configured.)`,
            reasoning: "Mock reasoning: The AI engine was not found or unavailable."
        };
    }

    try {
        // 2. Define the Prompt
        const systemPrompt = `You are an expert Legal Counsel AI. 
        Your task is to draft a counter-proposal for a contract clause that minimizes risk.
        
        Rules:
        1. Adhere strictly to the Company Standard if provided.
        2. Be concise and professional.
        3. Explain your reasoning in the 'reasoning' field.
        4. Output your response as valid JSON with keys: 'counterDraft' and 'reasoning'.`;

        const userPrompt = `
        Vendor Clause: "${clauseText}"
        Risk Level: ${riskLevel}
        Company Standard: "${companyStandard || 'Standard commercial reasonableness'}"
        
        Draft the counter-proposal now.
        `;

        // 3. Call Google Engine
        const result = await generativeModel.generateContent(
            `${systemPrompt}\n\n${userPrompt}`
        );

        // 4. Parse Result with Robustness
        const response = result.response;
        let textResponse = response.text();

        // Clean up markdown code blocks if present
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (parseError) {
            console.warn("JSON Parse Failed. Returning raw text.", textResponse);
            // Fallback: Use the whole text as reasoning if parse fails
            data = {
                counterDraft: "See reasoning below.",
                reasoning: textResponse
            };
        }

        return {
            success: true,
            counterDraft: data.counterDraft || "Draft generation incomplete.",
            reasoning: data.reasoning || "Reasoning not provided."
        };

    } catch (error: any) {
        console.error("AI Engine Error:", error);
        return {
            success: false,
            error: error.message || "Failed to generate draft"
        };
    }
}
