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
        // Map history to Google format
        // Note: Google's SDK expects { role: 'user' | 'model', parts: [{ text: string }] }
        // We assume 'history' passed in is already closer to our internal format or generic.
        // For now, adhering to the existing transformation logic in route.ts, 
        // but ideally this mapping should happen HERE. 
        // However, to minimize breakage, we will assume route.ts handles the specific mapping 
        // OR we adapt here. 
        // *Decision*: Let's keep route.ts logic for now, but the provider just takes the GenerativeModel.

        const model = this.client.getGenerativeModel({
            model: this.modelName,
            systemInstruction
        });

        // We accept pre-formatted history relevant to the specific provider? 
        // No, the interface implies a generic history. 
        // For simplicity in this iteration, we will let the route handle the specific history formatting 
        // and just pass it through, OR we define a standard internal history format.
        // Let's assume the caller passes Google-formatted history for Gemini and we'll fix route.ts to match.
        // actually, looking at route.ts, it maps to Google format. 
        // let's accept 'any[]' and cast it.

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
}

// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
export const getAIProvider = (): UnifiedAIProvider => {
    const providerType = process.env.AI_PROVIDER || 'GEMINI';

    console.log(`[ASTRA CORE] AI Provider Selected: ${providerType}`);

    if (providerType === 'ANTHROPIC') {
        const apiKey = process.env.ANTHROPIC_API_KEY || '';
        if (!apiKey) throw new Error("ANTHROPIC_API_KEY not found");
        return new AnthropicProvider(apiKey);
    }

    // Default to Gemini
    const apiKey = (process.env.GOOGLE_API_KEY || '').trim();
    if (!apiKey) console.warn("GOOGLE_API_KEY not found");
    return new GeminiProvider(apiKey);
};

// Kept for backward compatibility during refactor if needed, 
// but we will update route.ts to use getAIProvider()
// export const generativeModel = ... (Removed)

// Helper to check availability
export const isAIConfigured = () => {
    return !!process.env.GOOGLE_API_KEY || !!process.env.ANTHROPIC_API_KEY;
};
