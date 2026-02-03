import { AxAI } from '@ax-llm/ax';

// Feature Flag: Prefer Local AI (Privacy Mode)
// Defaults to true if OPENAI_API_KEY is missing, or if explicitly set.
const USE_LOCAL_AI = process.env.NEXT_PUBLIC_USE_OLLAMA === 'true' || !process.env.OPENAI_API_KEY;

export const ax = USE_LOCAL_AI
    ? new AxAI({
        name: 'ollama',
        apiKey: 'ollama',
        config: { model: process.env.OLLAMA_MODEL || 'llama3' }
    })
    : new AxAI({
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY as string,
        config: { model: (process.env.OPENAI_MODEL || 'gpt-4o') as any }
    });

// Helper to check availability
export const isAIConfigured = () => {
    if (!USE_LOCAL_AI) return !!process.env.OPENAI_API_KEY;
    // For Ollama, we assume it's running if selected.
    // Ideally we'd ping it, but for sync checks this is sufficient.
    return true;
};
