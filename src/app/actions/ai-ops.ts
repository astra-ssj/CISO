"use server";

import { getAIProvider, isAIConfigured } from '@/lib/ai/engine';

// --- Type Definitions ---
export interface AIResult {
    success: boolean;
    content?: string;
    error?: string;
}

// --- SecOps: Threat Analysis ---
export async function analyzeThreatBatchAction(events: any[]): Promise<AIResult> {
    if (!isAIConfigured()) return { success: true, content: "Mock: AI Engine not configured." };

    try {
        const prompt = `
        Events: ${JSON.stringify(events.slice(0, 5))}
        
        Task: You are a CISO. Summarize these security events into 2 concise sentences for an executive briefing. Focus on the most critical risks.
        `;

        const content = await getAIProvider().generateContent(prompt) || "No content generated.";

        return { success: true, content: content };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Active Defense: Remediation ---
export async function generateRemediationPlanAction(threatId: string, description: string): Promise<AIResult> {
    if (!isAIConfigured()) return { success: true, content: "Mock: AI Engine not configured." };

    try {
        const prompt = `
        Threat: ${threatId} - ${description}
        
        Task: Provide 3 concrete bash commands or steps to remediate this specific vulnerability on a Linux server. 
        Format as clear code blocks.
        `;

        const content = await getAIProvider().generateContent(prompt) || "";

        return { success: true, content: content };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Governance: Policy Drafting ---
export async function draftPolicyAction(topic: string, specificRequirements?: string): Promise<AIResult> {
    if (!isAIConfigured()) return { success: true, content: "Mock: AI Engine not configured." };

    try {
        const prompt = `
        Topic: ${topic}
        Requirements: ${specificRequirements || 'Standard ISO 27001 compliance'}
        
        Task: Draft a formal security policy document. Include:
        1. Purpose
        2. Scope
        3. Policy Statement (Bullet points)
        4. Enforcement
        
        Keep it professional and concise.
        `;

        const content = await getAIProvider().generateContent(prompt) || "";

        return { success: true, content: content };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
