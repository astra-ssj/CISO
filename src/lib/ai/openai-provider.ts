import OpenAI from 'openai';
import { AIProvider, AICompletionOptions, AICompletionResult, registerProvider, CISO_SYSTEM_PROMPT } from './ai-provider';

class OpenAIProvider implements AIProvider {
    name = 'OPENAI';
    private client: OpenAI | null = null;
    private model = process.env.OPENAI_MODEL || 'gpt-4o';

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
    }

    isAvailable(): boolean {
        return !!this.client;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        if (!this.client) {
            throw new Error('OpenAI client not initialized');
        }

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: options.systemPrompt || CISO_SYSTEM_PROMPT },
            ...options.messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
        ];

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048
        });

        return {
            content: response.choices[0]?.message?.content || '',
            provider: this.name,
            model: this.model,
            tokensUsed: response.usage?.total_tokens
        };
    }
}

// Auto-register on import
registerProvider(new OpenAIProvider());

export { OpenAIProvider };
