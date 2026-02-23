import { NextResponse } from 'next/server';
import { TokenTracker, TokenLog } from '@/lib/telemetry/token-tracker';

export async function GET() {
    try {
        const logs = TokenTracker.getLogs();

        if (!logs || logs.length === 0) {
            return NextResponse.json({
                totalCostUSD: 0,
                totalCalls: 0,
                byFeature: [],
                byUser: []
            });
        }

        let totalCostUSD = 0;
        let totalCalls = logs.length;

        const featureMap = new Map<string, { calls: number; cost: number }>();
        const userMap = new Map<string, { calls: number; cost: number; models: Set<string> }>();

        // Aggregate Data
        logs.forEach(log => {
            totalCostUSD += log.costUSD;

            // Feature Aggregation
            const f = featureMap.get(log.actionType) || { calls: 0, cost: 0 };
            f.calls += 1;
            f.cost += log.costUSD;
            featureMap.set(log.actionType, f);

            // User Aggregation
            const u = userMap.get(log.userId) || { calls: 0, cost: 0, models: new Set<string>() };
            u.calls += 1;
            u.cost += log.costUSD;
            u.models.add(log.model);
            userMap.set(log.userId, u);
        });

        // Format for Client
        const byFeature = Array.from(featureMap.entries()).map(([feature, data]) => ({
            feature,
            calls: data.calls,
            costUSD: data.cost
        })).sort((a, b) => b.costUSD - a.costUSD);

        const byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
            userId,
            calls: data.calls,
            costUSD: data.cost,
            modelsUsed: Array.from(data.models)
        })).sort((a, b) => b.costUSD - a.costUSD);

        return NextResponse.json({
            totalCostUSD,
            totalCalls,
            byFeature,
            byUser
        });

    } catch (e: any) {
        console.error("Failed to load metrics:", e);
        return NextResponse.json({ error: "Failed to load cost metrics" }, { status: 500 });
    }
}
