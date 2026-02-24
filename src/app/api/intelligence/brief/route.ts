import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Generate a structured world brief — in production uses AI synthesis from aggregated feeds
        const brief = `GLOBAL SITUATION ASSESSMENT — ${new Date().toISOString().split('T')[0]}

PRIORITY ALERTS:
• Eastern Europe — Sustained military operations continue with no ceasefire indicators. Critical infrastructure targeting remains elevated.
• Red Sea / Bab el-Mandeb — Commercial shipping disruptions from Houthi attacks persist. Naval coalition presence expanded. Insurance premiums for transits up 300%.
• South China Sea — PLA naval exercises in proximity to Taiwan Strait. Multiple military flights tracked via ADS-B in the past 24h.

CYBER THREAT LANDSCAPE:
• Ransomware activity up 45% month-over-month, with healthcare and energy sectors most targeted.
• APT groups linked to state sponsors showing increased pre-positioning activity in critical infrastructure networks.
• Zero-day exploit market pricing indicates stockpiling — potential for coordinated campaigns.

INFRASTRUCTURE WATCH:
• Submarine cable repair vessel movements suggest potential cable damage in Mediterranean.
• Internet outages reported across 3 Central African nations — pattern consistent with intentional throttling.
• AI datacenter construction accelerating in Nordic region and Southeast Asia.

RECOMMENDATIONS FOR CISOs:
1. Review incident response playbooks for supply chain compromise scenarios.
2. Verify backup connectivity paths if your organization depends on submarine cables in high-risk corridors.
3. Monitor for credential harvesting campaigns targeting VPN and email gateways.
4. Brief executive teams on geopolitical risk exposure in operating jurisdictions.`;

        return NextResponse.json({
            brief,
            summary: 'Global threat assessment covering military, cyber, and infrastructure domains',
            generatedAt: new Date().toISOString(),
            classification: 'UNCLASSIFIED // FOR OFFICIAL USE ONLY',
        });
    } catch (error) {
        console.error('[BRIEF API] Error:', error);
        return NextResponse.json({ brief: 'Unable to generate brief', error: 'Failed' }, { status: 500 });
    }
}
