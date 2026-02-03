import { AxAI } from '@ax-llm/ax';

// Feature Flag: Prefer Local AI (Privacy Mode)
// Defaults to true if OPENAI_API_KEY is missing, or if explicitly set.
// Provider Configuration
const PROVIDER = process.env.AI_PROVIDER || 'OLLAMA';

const getAxInstance = () => {
    switch (PROVIDER) {
        case 'GEMINI':
            return new AxAI({
                name: 'google-gemini',
                apiKey: process.env.GOOGLE_API_KEY as string,
                config: { model: (process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest') as any }
            });
        case 'OPENAI':
            return new AxAI({
                name: 'openai',
                apiKey: process.env.OPENAI_API_KEY as string,
                config: { model: (process.env.OPENAI_MODEL || 'gpt-4o') as any }
            });
        case 'OLLAMA':
        default:
            return new AxAI({
                name: 'ollama',
                apiKey: 'ollama',
                config: { model: process.env.OLLAMA_MODEL || 'llama4:scout' }
            });
    }
};

export const ax = getAxInstance();

// Helper to check availability
export const isAIConfigured = () => {
    switch (PROVIDER) {
        case 'GEMINI': return !!process.env.GOOGLE_API_KEY;
        case 'OPENAI': return !!process.env.OPENAI_API_KEY;
        case 'OLLAMA': return true; // Assume local is always "there" for now
        default: return false;
    }
};
