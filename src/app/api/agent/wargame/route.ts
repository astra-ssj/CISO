import { NextResponse } from 'next/server';
import { ax } from '@/lib/ai/engine';

export interface WargameState {
    scenarioType: string;
    turnNumber: number;
    playerActions: string[];
    currentSituation: string;
    threatActorProfile: string;
    organizationProfile: string;
}

const RED_TEAM_SYSTEM_PROMPT = `You are an advanced AI simulating a sophisticated threat actor for a cybersecurity tabletop exercise.

Your role is to:
1. React realistically to the defender's actions
2. Adapt your attack strategy based on their defenses
3. Escalate or pivot when blocked
4. Provide detailed, immersive narrative

You will be given:
- The current situation
- The player's latest action
- The threat actor profile you are simulating
- The target organization's profile

Respond with a JSON object containing:
{
    "narrative": "A 2-3 paragraph dramatic description of what happens next",
    "threatAction": "Brief description of the attacker's next move",
    "newSituation": "Updated situation summary",
    "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "playerOptions": [
        {
            "text": "Option text (action the player can take)",
            "description": "Brief explanation",
            "risk": "LOW" | "MEDIUM" | "HIGH",
            "cost": 0
        }
    ],
    "isGameOver": false,
    "gameOverReason": null
}

Be realistic, adaptive, and challenging. Make the defender WORK for their victory.`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { state, playerAction } = body as { state: WargameState; playerAction: string };

        if (!state || !playerAction) {
            return NextResponse.json(
                { error: "Missing required fields: state, playerAction" },
                { status: 400 }
            );
        }

        // Construct the game context
        const gameContext = `
## Current Wargame State

**Scenario Type**: ${state.scenarioType}
**Turn Number**: ${state.turnNumber}
**Current Situation**: ${state.currentSituation}

### Threat Actor Profile
${state.threatActorProfile}

### Target Organization
${state.organizationProfile}

### Action History
${state.playerActions.map((a, i) => `Turn ${i + 1}: ${a}`).join('\n')}

### Latest Player Action
**Turn ${state.turnNumber}**: "${playerAction}"

---
Generate the threat actor's response and updated game state.
`;

        const result = await ax.chat({
            chatPrompt: [
                { role: 'system', content: RED_TEAM_SYSTEM_PROMPT },
                { role: 'user', content: gameContext }
            ]
        });

        // Parse AI response
        // Ax handling
        let content = "";
        let modelName = "unknown";

        if (typeof result === 'string') {
            content = result;
        } else if ('content' in (result as any)) {
            content = (result as any).content;
            modelName = (result as any).model || "unknown";
        } else if ('results' in (result as any)) {
            content = (result as any).results[0].content;
        } else {
            content = JSON.stringify(result);
        }

        let parsed;
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch {
            // Fallback to structured mock if parsing fails
            parsed = {
                narrative: content,
                threatAction: "The adversary adapts to your action...",
                newSituation: state.currentSituation,
                severity: "MEDIUM",
                playerOptions: [
                    { text: "Investigate Further", description: "Gather more intel", risk: "LOW", cost: 5000 },
                    { text: "Escalate Response", description: "Increase defensive posture", risk: "MEDIUM", cost: 25000 },
                    { text: "Aggressive Countermeasures", description: "Take the fight to them", risk: "HIGH", cost: 100000 }
                ],
                isGameOver: false,
                gameOverReason: null
            };
        }

        return NextResponse.json({
            ...parsed,
            provider: 'AX',
            model: modelName,
            turnNumber: state.turnNumber + 1
        });

    } catch (error) {
        console.error("Wargame AI Failed:", error);
        return NextResponse.json(
            { error: "Red Team AI encountered an error." },
            { status: 500 }
        );
    }
}

// GET endpoint for available threat actor profiles
export async function GET() {
    return NextResponse.json({
        threatActorProfiles: [
            {
                id: 'apt29',
                name: 'APT29 (Cozy Bear)',
                description: 'Russian state-sponsored. Patient, stealthy, persistent.',
                tactics: ['Spear Phishing', 'Supply Chain Compromise', 'Living off the Land']
            },
            {
                id: 'lazarus',
                name: 'Lazarus Group',
                description: 'North Korean. Financial motivation. Destructive when cornered.',
                tactics: ['Watering Hole', 'Ransomware', 'Financial Theft']
            },
            {
                id: 'fin7',
                name: 'FIN7 (Carbanak)',
                description: 'Financially motivated. Sophisticated social engineering.',
                tactics: ['Phishing', 'Point-of-Sale Malware', 'Business Email Compromise']
            },
            {
                id: 'generic_ransomware',
                name: 'RaaS Affiliate (LockBit)',
                description: 'Ransomware-as-a-Service. Fast, loud, opportunistic.',
                tactics: ['RDP Brute Force', 'Credential Stuffing', 'Double Extortion']
            }
        ],
        organizationTemplates: [
            { id: 'healthcare', name: 'Regional Healthcare Provider', employees: 5000, criticalAssets: ['Patient Records', 'Medical Devices', 'EHR System'] },
            { id: 'fintech', name: 'FinTech Startup', employees: 200, criticalAssets: ['Customer Funds', 'Trading Platform', 'KYC Data'] },
            { id: 'manufacturing', name: 'Global Manufacturer', employees: 25000, criticalAssets: ['OT/ICS Systems', 'IP/Trade Secrets', 'Supply Chain'] }
        ]
    });
}
