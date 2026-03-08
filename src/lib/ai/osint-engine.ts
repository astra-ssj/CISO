import { getAIProvider, isAIConfigured } from "@/lib/ai/engine";

// ─── Types ──────────────────────────────────────────────────────
export interface ThreatActor {
    name: string;
    aliases: string[];
    motivation: string;
    sophistication: "nation-state" | "organized-crime" | "hacktivist" | "insider";
    targetSectors: string[];
    knownTTPs: string[];
}

export interface ThreatBrief {
    generatedAt: string;
    industry: string;
    region: string;
    overallRiskLevel: "critical" | "high" | "medium" | "low";
    summary: string;
    topThreats: {
        threat: string;
        severity: "critical" | "high" | "medium";
        description: string;
        mitreTechniques: string[];
        mitigations: string[];
    }[];
    threatActors: ThreatActor[];
    recommendations: string[];
    confidence: number;
}

// ─── OSINT Engine ───────────────────────────────────────────────
export async function generateThreatBrief(
    industry: string,
    region: string,
    focusAreas: string
): Promise<ThreatBrief> {
    if (!isAIConfigured()) {
        return getFallbackBrief(industry, region);
    }

    const provider = getAIProvider();

    const prompt = `You are a world-class cybersecurity threat intelligence analyst. Generate a comprehensive threat intelligence brief for:

**Industry**: ${industry}
**Region**: ${region}
**Focus Areas**: ${focusAreas || "General threat landscape"}

Respond with a JSON object matching this exact structure:
{
    "overallRiskLevel": "critical" | "high" | "medium" | "low",
    "summary": "2-3 sentence executive summary of the current threat landscape",
    "topThreats": [
        {
            "threat": "Threat name",
            "severity": "critical" | "high" | "medium",
            "description": "Detailed description of the threat",
            "mitreTechniques": ["T1566", "T1059"],
            "mitigations": ["Specific actionable mitigation"]
        }
    ],
    "threatActors": [
        {
            "name": "Actor name",
            "aliases": ["alias1"],
            "motivation": "Financial gain / Espionage / Disruption",
            "sophistication": "nation-state" | "organized-crime" | "hacktivist" | "insider",
            "targetSectors": ["Finance", "Healthcare"],
            "knownTTPs": ["Spear phishing", "Supply chain compromise"]
        }
    ],
    "recommendations": ["5-8 strategic recommendations"],
    "confidence": 85
}

Generate 5-7 top threats, 3-5 threat actors, and 5-8 recommendations. Use real MITRE ATT&CK technique IDs. Be specific and actionable.`;

    try {
        const result = await provider.generateStructuredContent(prompt);
        const data = result.data as unknown as Partial<ThreatBrief>;
        return {
            generatedAt: new Date().toISOString(),
            industry,
            region,
            overallRiskLevel: data.overallRiskLevel ?? 'high',
            summary: data.summary ?? '',
            topThreats: data.topThreats ?? [],
            threatActors: data.threatActors ?? [],
            recommendations: data.recommendations ?? [],
            confidence: data.confidence ?? 70,
        };
    } catch (error) {
        console.error("[OSINT Engine] AI generation failed:", error);
        return getFallbackBrief(industry, region);
    }
}

// ─── Fallback (when no AI key) ─────────────────────────────────
function getFallbackBrief(industry: string, region: string): ThreatBrief {
    return {
        generatedAt: new Date().toISOString(),
        industry, region,
        overallRiskLevel: "high",
        summary: `The threat landscape for the ${industry} sector in ${region} shows elevated risk. Ransomware groups continue to target this vertical with increasing sophistication. Supply chain attacks remain a persistent concern.`,
        topThreats: [
            {
                threat: "Ransomware-as-a-Service (RaaS)",
                severity: "critical",
                description: "Organized cybercrime groups offering ransomware kits with double/triple extortion tactics. Average ransom demands have increased 300% YoY.",
                mitreTechniques: ["T1566.001", "T1059.001", "T1486", "T1027"],
                mitigations: ["Implement immutable backups", "Deploy EDR with behavioral detection", "Conduct quarterly IR tabletop exercises"]
            },
            {
                threat: "Business Email Compromise (BEC)",
                severity: "high",
                description: "AI-generated phishing emails targeting finance teams and executives. Losses average $125K per incident.",
                mitreTechniques: ["T1566.002", "T1534", "T1078"],
                mitigations: ["Deploy AI-powered email security", "Enforce dual approval for wire transfers", "Security awareness training focused on deepfakes"]
            },
            {
                threat: "Supply Chain Compromise",
                severity: "critical",
                description: "Adversaries targeting CI/CD pipelines and third-party dependencies to inject malicious code at scale.",
                mitreTechniques: ["T1195.002", "T1059.004", "T1071.001"],
                mitigations: ["Implement SCA scanning in CI/CD", "Vendor security assessments", "Software bill of materials (SBOM) tracking"]
            },
            {
                threat: "Cloud Misconfiguration Exploitation",
                severity: "high",
                description: "Attackers scanning for publicly exposed storage buckets, overly permissive IAM policies, and unencrypted databases.",
                mitreTechniques: ["T1530", "T1078.004", "T1190"],
                mitigations: ["CSPM tooling with auto-remediation", "Enforce least-privilege IAM", "Regular cloud configuration audits"]
            },
            {
                threat: "Insider Threat (Data Exfiltration)",
                severity: "medium",
                description: "Employees with elevated access copying sensitive data during termination or vendor transitions.",
                mitreTechniques: ["T1567", "T1052", "T1041"],
                mitigations: ["Deploy DLP with cloud app monitoring", "Implement user behavior analytics (UBA)", "Automate access revocation on termination"]
            }
        ],
        threatActors: [
            {
                name: "LockBit 3.0", aliases: ["ABCD"], motivation: "Financial gain",
                sophistication: "organized-crime",
                targetSectors: ["Healthcare", "Finance", "Manufacturing"],
                knownTTPs: ["Double extortion", "Affiliate model", "Data leak sites"]
            },
            {
                name: "APT29 (Cozy Bear)", aliases: ["Nobelium", "Midnight Blizzard"], motivation: "Espionage",
                sophistication: "nation-state",
                targetSectors: ["Government", "Technology", "Think Tanks"],
                knownTTPs: ["Supply chain compromise", "OAuth token theft", "Cloud account hijacking"]
            },
            {
                name: "Scattered Spider", aliases: ["UNC3944", "0ktapus"], motivation: "Financial gain",
                sophistication: "organized-crime",
                targetSectors: ["Telecommunications", "Technology", "Finance"],
                knownTTPs: ["SIM swapping", "MFA fatigue attacks", "Social engineering helpdesks"]
            }
        ],
        recommendations: [
            "Deploy AI-powered email security to combat advanced BEC attacks",
            "Implement zero-trust network architecture with microsegmentation",
            "Conduct monthly purple team exercises focused on ransomware scenarios",
            "Deploy CSPM with auto-remediation for cloud environments",
            "Implement SBOM tracking for all software supply chain dependencies",
            "Enable phishing-resistant MFA (FIDO2) for all privileged accounts",
            "Establish threat intelligence sharing with industry ISACs"
        ],
        confidence: 70,
    };
}
