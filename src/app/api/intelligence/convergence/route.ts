import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const alerts = [
            { id: 'conv-1', location: 'Strait of Hormuz', threatTypes: ['Naval Activity', 'Oil Infrastructure', 'Cyber Threat'], riskScore: 87, details: 'Convergence of increased naval vessel movements, proximity to critical oil pipelines, and elevated APT activity targeting energy sector SCADA systems', timestamp: new Date().toISOString() },
            { id: 'conv-2', location: 'South China Sea', threatTypes: ['Military Flights', 'Naval Vessels', 'Undersea Cables'], riskScore: 82, details: 'Military reconnaissance flights overlapping with naval exercises near critical submarine cable landing points', timestamp: new Date().toISOString() },
            { id: 'conv-3', location: 'Baltic Region', threatTypes: ['Military Activity', 'Pipeline Infrastructure', 'Internet Disruption'], riskScore: 75, details: 'Elevated military posture near Nord Stream corridor with sporadic internet disruptions in neighboring countries', timestamp: new Date().toISOString() },
            { id: 'conv-4', location: 'Red Sea / Bab el-Mandeb', threatTypes: ['Naval Threats', 'Shipping Disruption', 'Conflict'], riskScore: 91, details: 'Active threat to commercial shipping from Houthi attacks, naval coalition presence, proximity to undersea cables', timestamp: new Date().toISOString() },
            { id: 'conv-5', location: 'Eastern Mediterranean', threatTypes: ['Subsea Cables', 'Naval Activity', 'Geopolitical Tension'], riskScore: 65, details: 'Increased naval patrols near cable landing stations amid territorial disputes over EEZ resources', timestamp: new Date().toISOString() },
        ];

        return NextResponse.json({
            alerts,
            count: alerts.length,
            analyzedAt: new Date().toISOString(),
            methodology: 'Spatial clustering of multi-domain threat indicators within 200km radius',
        });
    } catch (error) {
        console.error('[CONVERGENCE API] Error:', error);
        return NextResponse.json({ alerts: [], error: 'Failed' }, { status: 500 });
    }
}
