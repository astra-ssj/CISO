
import { ax } from './ax-engine';

async function main() {
    console.log("Testing Ax + Ollama Connection...");
    try {
        const response = await ax.chat({
            chatPrompt: [
                { role: 'system', content: 'You are a test assistant.' },
                { role: 'user', content: 'Say hello!' }
            ]
        }, { stream: false });

        console.log("Response Type:", typeof response);
        // console.log("Keys:", Object.keys(response));
        // console.log("Full JSON:", JSON.stringify(response, null, 2));

        // Inspect deeply
        console.dir(response, { depth: null });

        // Check if it's a stream
        if ((response as any).result) {
            console.log("Has .result found");
            console.log((response as any).result);
        }
        if ((response as any).results) {
            console.log("Has .results found");
            console.log((response as any).results);
        }

        const casted = response as any;
        console.log("Extracted Content:", casted.results?.[0]?.content);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
