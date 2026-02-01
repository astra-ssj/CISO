/**
 * Multi-Provider AI Abstraction Layer
 * Supports: OpenAI, Anthropic, Google Gemini, and Mock (fallback)
 */

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AICompletionOptions {
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export interface AICompletionResult {
    content: string;
    provider: string;
    model: string;
    tokensUsed?: number;
}

export interface AIProvider {
    name: string;
    complete(options: AICompletionOptions): Promise<AICompletionResult>;
    isAvailable(): boolean;
}

// Provider Registry
const providers: Map<string, AIProvider> = new Map();

export function registerProvider(provider: AIProvider): void {
    providers.set(provider.name.toUpperCase(), provider);
}

export function getProvider(name?: string): AIProvider {
    const providerName = name?.toUpperCase() || process.env.AI_PROVIDER?.toUpperCase() || 'MOCK';
    const provider = providers.get(providerName);

    if (!provider) {
        console.warn(`Provider "${providerName}" not found, falling back to MOCK`);
        return providers.get('MOCK')!;
    }

    if (!provider.isAvailable()) {
        console.warn(`Provider "${providerName}" not available (missing API key?), falling back to MOCK`);
        return providers.get('MOCK')!;
    }

    return provider;
}

export function listProviders(): { name: string; available: boolean }[] {
    return Array.from(providers.values()).map(p => ({
        name: p.name,
        available: p.isAvailable()
    }));
}

// CISO-specific system prompt
export const CISO_SYSTEM_PROMPT = `You are Astra, an advanced AI assistant specialized in Cybersecurity, Governance, Risk, and Compliance (GRC).

Your expertise includes:
- Information Security Management Systems (ISMS)
- Regulatory frameworks: GDPR, HIPAA, SOC 2, PCI-DSS
- Security standards: ISO 27001, NIST CSF, CIS Controls
- Risk assessment and mitigation strategies
- Incident response and crisis management
- Policy drafting and gap analysis

When responding:
1. Be precise and actionable
2. Reference specific controls/articles when applicable
3. Prioritize risk-based recommendations
4. Use professional, executive-level language
5. When asked to generate policies, include standard sections: Purpose, Scope, Roles & Responsibilities, Policy Statements, Compliance

You are currently assisting a Chief Information Security Officer (CISO).`;
