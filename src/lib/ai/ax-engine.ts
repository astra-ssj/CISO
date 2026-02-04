import { AxAIOllama, AxAIOllamaArgs } from '@ax-llm/ax';

// Feature Flag: Prefer Local AI (Privacy Mode) - Hardcoded to true for this refactor
const USE_LOCAL_AI = true;

const ollamaConfig: AxAIOllamaArgs<any> = {
    name: 'ollama',
    config: {
        model: 'llama3',
    }
};

// Initialize Ax directly with Ollama provider class
export const ax = new AxAIOllama({
    apiKey: 'not-needed',
    config: {
        model: 'llama3',
    }
});

// Helper to check if AI is ready (mostly just assumes local is up)
export const isAIReady = async () => {
    try {
        // Simple health check ping to Ollama
        const res = await fetch('http://localhost:11434/api/tags');
        return res.ok;
    } catch (e) {
        console.warn("Ollama not detected at localhost:11434");
        return false;
    }
};
