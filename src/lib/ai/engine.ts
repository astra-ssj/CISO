import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// ------------------------------------------------------------------
// Interfaces
// ------------------------------------------------------------------
export interface UnifiedChatSession {
    sendMessage(message: string): Promise<string>;
}

export interface UnifiedAIProvider {
    createChatSession(systemInstruction: string, history: any[]): UnifiedChatSession;
    generateContent(prompt: string): Promise<string>;
    generateStructuredContent(prompt: string, schema?: any): Promise<any>;
}

// ------------------------------------------------------------------
// Google Gemini Provider
// ------------------------------------------------------------------
class GeminiProvider implements UnifiedAIProvider {
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = 'gemini-2.0-flash-001') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    createChatSession(systemInstruction: string, history: any[]): UnifiedChatSession {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            systemInstruction
        });

        const chat = model.startChat({
            history: history as any[]
        });

        return {
            sendMessage: async (msg: string) => {
                const result = await chat.sendMessage(msg);
                return result.response.text();
            }
        };
    }

    async generateContent(prompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    async generateStructuredContent(prompt: string, schema?: any): Promise<any> {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt + "\n\nRespond locally in JSON.");
        const text = result.response.text();

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Gemini JSON parse failed, attempting cleanup", e);
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        }
    }
}

// ------------------------------------------------------------------
// Anthropic Claude Provider
// ------------------------------------------------------------------
class AnthropicProvider implements UnifiedAIProvider {
    private client: Anthropic;
    private modelName: string;

    constructor(apiKey: string, modelName: string = 'claude-3-haiku-20240307') {
        this.client = new Anthropic({ apiKey });
        this.modelName = modelName;
    }

    createChatSession(systemInstruction: string, history: any[]): UnifiedChatSession {
        let internalHistory = history.map((msg: any) => ({
            role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: msg.parts?.[0]?.text || ''
        }));

        return {
            sendMessage: async (msg: string) => {
                internalHistory.push({ role: 'user', content: msg });

                const response = await this.client.messages.create({
                    model: this.modelName,
                    max_tokens: 4096,
                    system: systemInstruction,
                    messages: internalHistory
                });

                const text = response.content
                    .filter(block => block.type === 'text')
                    .map(block => block.text)
                    .join('\n');

                internalHistory.push({ role: 'assistant', content: text });
                return text;
            }
        };
    }

    async generateContent(prompt: string): Promise<string> {
        const response = await this.client.messages.create({
            model: this.modelName,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        });

        return response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');
    }

    async generateStructuredContent(prompt: string, schema?: any): Promise<any> {
        // Claude doesn't have a strict JSON mode flag like Gemini/OpenAI yet in the SDK 
        // effectively, but we prompt-engineer it.
        const response = await this.client.messages.create({
            model: this.modelName,
            max_tokens: 4096,
            system: "You are a data extraction AI. Respond ONLY with valid JSON. Do not include markdown formatting.",
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');

        try {
            return JSON.parse(text);
        } catch (e) {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        }
    }
}

// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
export const getAIProvider = (): UnifiedAIProvider => {
    const providerType = (process.env.AI_PROVIDER || 'GEMINI').toUpperCase();
    const googleKey = (process.env.GOOGLE_API_KEY || '').trim();
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();

    if (providerType === 'ANTHROPIC') {
        if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set. Add it to .env.local for the chat agent.");
        console.log(`[ASTRA CORE] AI Provider: ANTHROPIC`);
        return new AnthropicProvider(anthropicKey);
    }

    // Prefer Gemini when key is set; otherwise fall back to Anthropic so chat works with one key
    if (googleKey) {
        console.log(`[ASTRA CORE] AI Provider: GEMINI`);
        return new GeminiProvider(googleKey);
    }
    if (anthropicKey) {
        console.warn("[ASTRA CORE] GOOGLE_API_KEY not set; using ANTHROPIC as fallback.");
        return new AnthropicProvider(anthropicKey);
    }

    throw new Error(
        "No AI provider configured. Set GOOGLE_API_KEY or ANTHROPIC_API_KEY in .env.local (and restart the dev server)."
    );
};

// Kept for backward compatibility during refactor if needed, 
// but we will update route.ts to use getAIProvider()
// export const generativeModel = ... (Removed)

// Helper to check availability
export const isAIConfigured = () => {
    return !!process.env.GOOGLE_API_KEY || !!process.env.ANTHROPIC_API_KEY;
};
