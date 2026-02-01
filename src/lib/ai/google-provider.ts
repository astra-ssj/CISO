import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AICompletionOptions, AICompletionResult, registerProvider, CISO_SYSTEM_PROMPT } from './ai-provider';

class GoogleProvider implements AIProvider {
    name = 'GOOGLE';
    private client: GoogleGenerativeAI | null = null;
    private model = process.env.GOOGLE_MODEL || 'gemini-2.0-flash';

    constructor() {
        if (process.env.GOOGLE_API_KEY) {
            this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        }
    }

    isAvailable(): boolean {
        return !!this.client;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        if (!this.client) {
            throw new Error('Google AI client not initialized');
        }

        const model = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: options.systemPrompt || CISO_SYSTEM_PROMPT
        });

        // Convert messages to Gemini format
        const history = options.messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMessage = options.messages[options.messages.length - 1];

        const chat = model.startChat({
            history: history as any,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 2048
            }
        });

        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;

        return {
            content: response.text(),
            provider: this.name,
            model: this.model,
            tokensUsed: response.usageMetadata?.totalTokenCount
        };
    }
}

// Auto-register on import
registerProvider(new GoogleProvider());

export { GoogleProvider };
