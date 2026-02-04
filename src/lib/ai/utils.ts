
import { GenerateContentResult } from "@google/generative-ai";

/**
 * Retries an async operation with exponential backoff if it fails with a 429 error.
 * 
 * @param operation The async operation to retry.
 * @param maxRetries Maximum number of retries (default: 3).
 * @param baseDelay Base delay in milliseconds (default: 1000).
 * @returns The result of the operation.
 */
export async function runWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let attempt = 0;

    while (true) {
        try {
            return await operation();
        } catch (error: any) {
            attempt++;

            // Check for 429 status (standard) or specific error messages if needed.
            // Google Generative AI SDK might throw errors with status property or specific messages.
            const isRateLimit = error?.status === 429 || error?.response?.status === 429 || error?.message?.includes('429');

            if (attempt > maxRetries || !isRateLimit) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`[AI Retry] Rate limit hit. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
