import { NextResponse } from 'next/server';

// Simulated baseline data — in production this would query the aggregated data store
export async function GET() {
    try {
        const anomalies = [
            { id: 'anom-1', type: 'Conflict Events', region: 'Eastern Europe', severity: 'high' as const, baseline: 12, current: 28, deviationPct: 133, timestamp: new Date().toISOString(), description: 'Significant increase in reported conflict events above 30-day rolling average' },
            { id: 'anom-2', type: 'Cyber Incidents', region: 'Southeast Asia', severity: 'critical' as const, baseline: 5, current: 18, deviationPct: 260, timestamp: new Date().toISOString(), description: 'APT activity surge detected — 260% above baseline in the region' },
            { id: 'anom-3', type: 'Protest Activity', region: 'South America', severity: 'medium' as const, baseline: 8, current: 14, deviationPct: 75, timestamp: new Date().toISOString(), description: 'Elevated social unrest indicators linked to economic policy changes' },
            { id: 'anom-4', type: 'Internet Disruptions', region: 'Central Africa', severity: 'high' as const, baseline: 2, current: 7, deviationPct: 250, timestamp: new Date().toISOString(), description: 'Multiple countries reporting connectivity issues — potential coordinated shutdown' },
            { id: 'anom-5', type: 'Military Flights', region: 'Baltic States', severity: 'medium' as const, baseline: 15, current: 32, deviationPct: 113, timestamp: new Date().toISOString(), description: 'Increased NATO reconnaissance flights near Russian border' },
            { id: 'anom-6', type: 'Ransomware Activity', region: 'North America', severity: 'high' as const, baseline: 20, current: 45, deviationPct: 125, timestamp: new Date().toISOString(), description: 'New ransomware campaign targeting healthcare sector detected' },
        ];

        return NextResponse.json({
            anomalies,
            count: anomalies.length,
            analyzedAt: new Date().toISOString(),
            methodology: 'Temporal z-score analysis against 30-day rolling baselines',
        });
    } catch (error) {
        console.error('[ANOMALIES API] Error:', error);
        return NextResponse.json({ anomalies: [], error: 'Failed to compute anomalies' }, { status: 500 });
    }
}
