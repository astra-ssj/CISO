import { getAIProvider, isAIConfigured } from './engine';

async function main() {
    console.log("Testing AI Provider Connection...");
    console.log("Configured:", isAIConfigured());
    console.log("Provider:", process.env.AI_PROVIDER || 'GEMINI (default)');

    try {
        const provider = getAIProvider();
        const response = await provider.generateContent("Say hello in one sentence.");
        console.log("Response:", response);
        console.log("✅ AI Provider is working correctly!");
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

main();
