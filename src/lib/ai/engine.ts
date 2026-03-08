import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// ------------------------------------------------------------------
// Interfaces
// ------------------------------------------------------------------
export interface AIUsageMetadata {
    promptTokens: number;
    completionTokens: number;
}

export interface AIResponse<T = string> {
    data: T;
    usage?: AIUsageMetadata;
}

export interface UnifiedChatSession {
    sendMessage(message: string): Promise<AIResponse<string>>;
}

export type UnifiedChatMessage = { role: string; parts?: Array<{ text: string }>; content?: string };

export interface UnifiedAIProvider {
    createChatSession(systemInstruction: string, history: Array<UnifiedChatMessage>): UnifiedChatSession;
    generateContent(prompt: string): Promise<AIResponse<string>>;
    generateStructuredContent(prompt: string, schema?: Record<string, unknown>): Promise<AIResponse<Record<string, unknown>>>;
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

    createChatSession(systemInstruction: string, history: Array<UnifiedChatMessage>): UnifiedChatSession {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            systemInstruction
        });

        const chat = model.startChat({
            history: history as unknown as import('@google/generative-ai').Content[]
        });

        return {
            sendMessage: async (msg: string) => {
                const result = await chat.sendMessage(msg);
                const usageMetadata = result.response.usageMetadata;
                return {
                    data: result.response.text(),
                    usage: usageMetadata ? {
                        promptTokens: usageMetadata.promptTokenCount,
                        completionTokens: usageMetadata.candidatesTokenCount
                    } : undefined
                };
            }
        };
    }

    async generateContent(prompt: string): Promise<AIResponse<string>> {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const result = await model.generateContent(prompt);
        const usageMetadata = result.response.usageMetadata;
        return {
            data: result.response.text(),
            usage: usageMetadata ? {
                promptTokens: usageMetadata.promptTokenCount,
                completionTokens: usageMetadata.candidatesTokenCount
            } : undefined
        };
    }

    async generateStructuredContent(prompt: string, schema?: Record<string, unknown>): Promise<AIResponse<Record<string, unknown>>> {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt + "\n\nRespond locally in JSON.");
        const text = result.response.text();
        const usageMetadata = result.response.usageMetadata;

        const usage = usageMetadata ? {
            promptTokens: usageMetadata.promptTokenCount,
            completionTokens: usageMetadata.candidatesTokenCount
        } : undefined;

        try {
            return { data: JSON.parse(text), usage };
        } catch (e) {
            console.error("Gemini JSON parse failed, attempting cleanup", e);
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return { data: JSON.parse(cleaned), usage };
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

    createChatSession(systemInstruction: string, history: Array<UnifiedChatMessage>): UnifiedChatSession {
        const internalHistory = history.map((msg: UnifiedChatMessage) => ({
            role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: (msg.parts as Array<{ text: string }>)?.[0]?.text || ''
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
                return {
                    data: text,
                    usage: {
                        promptTokens: response.usage.input_tokens,
                        completionTokens: response.usage.output_tokens
                    }
                };
            }
        };
    }

    async generateContent(prompt: string): Promise<AIResponse<string>> {
        const response = await this.client.messages.create({
            model: this.modelName,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        });

        return {
            data: response.content
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('\n'),
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens
            }
        };
    }

    async generateStructuredContent(prompt: string, schema?: Record<string, unknown>): Promise<AIResponse<Record<string, unknown>>> {
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

        const usage = {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens
        };

        try {
            return { data: JSON.parse(text), usage };
        } catch (e) {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return { data: JSON.parse(cleaned), usage };
        }
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
