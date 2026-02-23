import fs from 'fs';
import path from 'path';

export type AIModel = 'claude-3-haiku-20240307' | 'claude-3-5-sonnet-20241022' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

export type ActionType = 'OMNI_CHAT' | 'CAIQ_SCAN' | 'POLICY_GEN' | 'RISK_ANALYSIS' | 'GENERAL';

export interface TokenLog {
    id: string;
    userId: string;
    model: AIModel;
    actionType: ActionType;
    promptTokens: number;
    completionTokens: number;
    costUSD: number;
    timestamp: string;
}

// Model pricing per 1M tokens (in USD)
// Source: Provider pricing pages (approximate for MVP use)
const PRICING: Record<AIModel, { input: number; output: number }> = {
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'gemini-1.5-pro': { input: 3.50, output: 10.50 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
};

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'token_logs.json');

// Ensure directory and file exist (for MVP local DB)
function ensureLogFile() {
    const dir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOG_FILE_PATH)) {
        fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([]), 'utf-8');
    }
}

export class TokenTracker {
    /**
     * Calculate the cost in USD based on model pricing
     */
    static calculateCost(model: AIModel, promptTokens: number, completionTokens: number): number {
        const pricing = PRICING[model];
        if (!pricing) return 0;

        // Cost per token (instead of per million)
        const inputCost = (promptTokens / 1_000_000) * pricing.input;
        const outputCost = (completionTokens / 1_000_000) * pricing.output;

        return inputCost + outputCost;
    }

    /**
     * Log an API call's token usage.
     */
    static async trackUsage({
        userId = 'anonymous',
        model,
        actionType,
        promptTokens,
        completionTokens
    }: {
        userId?: string;
        model: AIModel;
        actionType: ActionType;
        promptTokens: number;
        completionTokens: number;
    }) {
        const costUSD = this.calculateCost(model, promptTokens, completionTokens);

        const logEntry: TokenLog = {
            id: crypto.randomUUID(),
            userId,
            model,
            actionType,
            promptTokens,
            completionTokens,
            costUSD,
            timestamp: new Date().toISOString()
        };

        // In a production app, this would be an INSERT into a PostgreSQL database.
        // For MVP, we write to a local JSON file to act as our Database.
        try {
            ensureLogFile();
            const existingLogs: TokenLog[] = JSON.parse(fs.readFileSync(LOG_FILE_PATH, 'utf-8'));
            existingLogs.push(logEntry);
            fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(existingLogs, null, 2), 'utf-8');

            console.log(`[TokenTracker] Logged ${actionType} using ${model}. Cost: $${costUSD.toFixed(6)}`);
        } catch (e) {
            console.error("[TokenTracker] Failed to save token log:", e);
        }
    }

    /**
     * Get all token logs
     */
    static getLogs(): TokenLog[] {
        try {
            ensureLogFile();
            return JSON.parse(fs.readFileSync(LOG_FILE_PATH, 'utf-8'));
        } catch {
            return [];
        }
    }
}
