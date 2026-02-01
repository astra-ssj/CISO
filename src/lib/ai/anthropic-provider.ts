import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AICompletionOptions, AICompletionResult, registerProvider, CISO_SYSTEM_PROMPT } from './ai-provider';

class AnthropicProvider implements AIProvider {
    name = 'ANTHROPIC';
    private client: Anthropic | null = null;
    private model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

    constructor() {
        if (process.env.ANTHROPIC_API_KEY) {
            this.client = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
        }
    }

    isAvailable(): boolean {
        return !!this.client;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        if (!this.client) {
            throw new Error('Anthropic client not initialized');
        }

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: options.maxTokens ?? 2048,
            system: options.systemPrompt || CISO_SYSTEM_PROMPT,
            messages: options.messages.map(m => ({
                role: m.role === 'system' ? 'user' : m.role,
                content: m.content
            }))
        });

        const textContent = response.content.find(c => c.type === 'text');

        return {
            content: textContent?.type === 'text' ? textContent.text : '',
            provider: this.name,
            model: this.model,
            tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens
        };
    }
}

// Auto-register on import
registerProvider(new AnthropicProvider());

export { AnthropicProvider };
