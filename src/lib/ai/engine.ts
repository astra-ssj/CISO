import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

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

class DisabledAIProvider implements UnifiedAIProvider {
    private disabled(): never {
        throw new Error('AI is disabled. Set AI_PROVIDER=ANTHROPIC or AI_PROVIDER=GOOGLE and configure its API key.');
    }

    createChatSession(): UnifiedChatSession {
        return { sendMessage: async () => this.disabled() };
    }

    async generateContent(): Promise<AIResponse<string>> {
        return this.disabled();
    }

    async generateStructuredContent(): Promise<AIResponse<Record<string, unknown>>> {
        return this.disabled();
    }
}

class GeminiProvider implements UnifiedAIProvider {
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = process.env.GOOGLE_MODEL || 'gemini-2.0-flash-001') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    createChatSession(systemInstruction: string, history: Array<UnifiedChatMessage>): UnifiedChatSession {
        const model = this.client.getGenerativeModel({ model: this.modelName, systemInstruction });
        const chat = model.startChat({ history: history as unknown as import('@google/generative-ai').Content[] });

        return {
            sendMessage: async (msg: string) => {
                const result = await chat.sendMessage(msg);
                const usageMetadata = result.response.usageMetadata;
                return {
                    data: result.response.text(),
                    usage: usageMetadata ? {
                        promptTokens: usageMetadata.promptTokenCount,
                        completionTokens: usageMetadata.candidatesTokenCount,
                    } : undefined,
                };
            },
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
                completionTokens: usageMetadata.candidatesTokenCount,
            } : undefined,
        };
    }

    async generateStructuredContent(prompt: string): Promise<AIResponse<Record<string, unknown>>> {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt + '\n\nRespond only in valid JSON.');
        const text = result.response.text();
        const usageMetadata = result.response.usageMetadata;
        const usage = usageMetadata ? {
            promptTokens: usageMetadata.promptTokenCount,
            completionTokens: usageMetadata.candidatesTokenCount,
        } : undefined;

        try {
            return { data: JSON.parse(text), usage };
        } catch {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return { data: JSON.parse(cleaned), usage };
        }
    }
}

class AnthropicProvider implements UnifiedAIProvider {
    private client: Anthropic;
    private modelName: string;

    constructor(apiKey: string, modelName: string = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307') {
        this.client = new Anthropic({ apiKey });
        this.modelName = modelName;
    }

    createChatSession(systemInstruction: string, history: Array<UnifiedChatMessage>): UnifiedChatSession {
        const internalHistory = history.map((msg) => ({
            role: (msg.role === 'model' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: msg.parts?.[0]?.text || msg.content || '',
        }));

        return {
            sendMessage: async (msg: string) => {
                internalHistory.push({ role: 'user', content: msg });
                const response = await this.client.messages.create({
                    model: this.modelName,
                    max_tokens: 4096,
                    system: systemInstruction,
                    messages: internalHistory,
                });
                const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
                internalHistory.push({ role: 'assistant', content: text });
                return {
                    data: text,
                    usage: {
                        promptTokens: response.usage.input_tokens,
                        completionTokens: response.usage.output_tokens,
                    },
                };
            },
        };
    }

    async generateContent(prompt: string): Promise<AIResponse<string>> {
        const response = await this.client.messages.create({
            model: this.modelName,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });
        return {
            data: response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
            },
        };
    }

    async generateStructuredContent(prompt: string): Promise<AIResponse<Record<string, unknown>>> {
        const response = await this.client.messages.create({
            model: this.modelName,
            max_tokens: 4096,
            system: 'Respond ONLY with valid JSON. Do not include markdown formatting.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        const usage = {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
        };
        try {
            return { data: JSON.parse(text), usage };
        } catch {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return { data: JSON.parse(cleaned), usage };
        }
    }
}

export type SupportedAIProvider = 'NONE' | 'ANTHROPIC' | 'GOOGLE';

export const getAIProvider = (): UnifiedAIProvider => {
    const providerType = (process.env.AI_PROVIDER || 'NONE').trim().toUpperCase() as SupportedAIProvider;

    if (providerType === 'NONE') return new DisabledAIProvider();

    if (providerType === 'ANTHROPIC') {
        const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
        if (!apiKey) throw new Error('ANTHROPIC_API_KEY not found');
        return new AnthropicProvider(apiKey);
    }

    if (providerType === 'GOOGLE') {
        const apiKey = process.env.GOOGLE_API_KEY?.trim();
        if (!apiKey) throw new Error('GOOGLE_API_KEY not found');
        return new GeminiProvider(apiKey);
    }

    throw new Error(`Unsupported AI_PROVIDER "${providerType}". Supported: NONE, ANTHROPIC, GOOGLE.`);
};

export const isAIConfigured = (): boolean => {
    const providerType = (process.env.AI_PROVIDER || 'NONE').trim().toUpperCase();
    if (providerType === 'ANTHROPIC') return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    if (providerType === 'GOOGLE') return Boolean(process.env.GOOGLE_API_KEY?.trim());
    return false;
};
