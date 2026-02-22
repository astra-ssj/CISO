import { DecisionRequest, RiskLevel, ComplianceStandard } from "./store";
import { Policy } from "./policy-store";

interface AnalysisResult {
    riskScore: number;
    riskLevel: RiskLevel;
    flaggedKeywords: string[];
    complianceGaps: string[];
    recommendedActions: string[];
    generatedArtifacts: NonNullable<DecisionRequest['generatedArtifacts']>;
}

export const analyzeRequestAsync = async (
    title: string,
    description: string,
    context: {
        activeStandards: ComplianceStandard[],
        policies: Policy[]
    }
): Promise<AnalysisResult> => {
    const fullText = `${title} ${description}`.toLowerCase();

    // Simulate Agent Thinking Time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const flaggedKeywords: string[] = [];
    const complianceGaps: string[] = [];
    const recommendedActions: string[] = [];
    const generatedArtifacts: AnalysisResult['generatedArtifacts'] = [];
    let riskScore = 0;

    // --- Dynamic Context Awareness ---

    // 1. Container / Kubernetes
    if (/(?:kubernetes|k8s|kube|docker|container|pod|helm)\b/i.test(fullText)) {
        flaggedKeywords.push('Containerization', 'Orchestration');

        // Context-Aware Gap Analysis
        if (context.activeStandards.includes('NIST_CSF')) {
            complianceGaps.push('NIST CSF PR.IP-1 (Baseline Configuration)');
        }
        if (context.activeStandards.includes('ISO_27001')) {
            complianceGaps.push('ISO 27001 A.14.2.5 (Secure Engineering Principles)');
        }

        recommendedActions.push('Enforce Pod Security Standards (PSS)', 'Implement Image Signing (Notary)');
        riskScore += 65;

        generatedArtifacts.push({
            id: `art-${Date.now()}-1`,
            type: 'POLICY_DRAFT',
            title: 'Container Security Standard v1.0',
            content: `# Container Security Standard\n\n## Purpose\nMandatory security controls for all K8s workloads.\n\n## Requirements\n1. No Root Containers\n2. Read-Only Filesystems`
        });
    }

    // 2. Cloud / Serverless
    if (/(?:cloud|aws|azure|gcp|s3|blob|bucket|lambda|serverless)\b/i.test(fullText)) {
        flaggedKeywords.push('Public Cloud', 'Data Residency');

        if (context.activeStandards.includes('GDPR')) {
            complianceGaps.push('GDPR Art. 44 (Cross-Border Transfer)');
        }
        if (context.activeStandards.includes('SOC2')) {
            complianceGaps.push('SOC 2 CC6.1 (Logical Access)');
        }

        recommendedActions.push('Enable MFA on Root Accounts', 'Block Public Buckets via SCP');
        riskScore += 40;

        generatedArtifacts.push({
            id: `art-${Date.now()}-2`,
            type: 'ARCHITECTURE_DIAGRAM',
            title: 'Secure Cloud Landing Zone',
            content: `# Landing Zone Specs\n\n1. Identity (SSO)\n2. Transit Gateway (Hub-Spoke)\n3. Centralized Logging`
        });
    }

    // 3. AI / ML Models
    if (/(?:ai|ml|model|training|llm|gpt|inference|data)\b/i.test(fullText)) {
        flaggedKeywords.push('AI/ML', 'Sensitive Data');
        complianceGaps.push('EU AI Act (Transparency)');
        recommendedActions.push('Conduct Algorithmic Impact Assessment');
        riskScore += 80;
    }

    // --- Native CISO AI: policy analysis via /api/agent/analyze-policy ---
    try {
        const base = typeof process !== 'undefined'
            ? (process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000')
            : '';
        if (base) {
            const standards = context.activeStandards.map((s: string) => s.replace('ISO_27001', 'ISO_27001_2022').replace('NIST_CSF', 'NIST_CSF_2_0'));
            const res = await fetch(`${base}/api/agent/analyze-policy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policyContent: fullText, standards: standards.length ? standards : ['NIST_CSF_2_0', 'ISO_27001_2022'] })
            });
            if (res.ok) {
                const data = await res.json();
                const agentScore = data.score ?? data.riskScore ?? 50;
                const agentGaps = data.identifiedGaps?.map((g: { description?: string; framework?: string; controlId?: string }) =>
                    typeof g === 'string' ? g : `${g.controlId || g.framework || ''}: ${g.description || g}`
                ) || [];
                const agentRecs = data.recommendations || data.strongPoints || [];
                if (agentGaps.length > 0) complianceGaps.push(...agentGaps.map((g: string) => `[AI] ${g}`));
                if (agentRecs.length > 0) recommendedActions.push(...agentRecs.map((r: string) => `[AI] ${r}`));
                riskScore = Math.floor((riskScore * 0.6) + (agentScore * 0.4));
            }
        }
    } catch (e) {
        console.warn("Policy analysis API unavailable, falling back to heuristics only.", e);
    }

    // 4. Policy Cross-Reference (Agentic Feature)
    // Check if we already have a relevant policy
    const relevantPolicies = context.policies.filter(p =>
        fullText.includes(p.title.toLowerCase()) ||
        p.sections.some(s => fullText.includes(s.title.toLowerCase()))
    );

    if (relevantPolicies.length > 0) {
        recommendedActions.push(`Review existing policy: ${relevantPolicies[0].title}`);
        riskScore -= 10; // Mitigating factor: Policy exists
    } else {
        recommendedActions.push('Gap Identified: No specific policy found for this domain.');
        riskScore += 10;
    }

    // Risk Calculation
    let riskLevel: RiskLevel = 'LOW';
    if (riskScore > 80) riskLevel = 'CRITICAL';
    else if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 20) riskLevel = 'MEDIUM';

    // Default Fallback
    if (recommendedActions.length === 0) {
        recommendedActions.push('Conduct Manual Architecture Review');
        generatedArtifacts.push({
            id: `art-${Date.now()}-def`,
            type: 'POLICY_DRAFT',
            title: 'General IT Security Policy',
            content: '# General Security Policy\n\nAll systems must adhere to the standard Acceptable Use Policy.'
        });
    }

    return {
        riskScore,
        riskLevel,
        flaggedKeywords,
        complianceGaps,
        recommendedActions,
        generatedArtifacts
    };
};

export const generatePolicyAsync = async (
    topic: string,
    strictness: 'LOW' | 'MEDIUM' | 'HIGH',
    frameworks: string[] = []
): Promise<Partial<Policy>> => {
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const contentTemplate = strictness === 'HIGH'
        ? "MUST implemented Strict Access Control. MFA is mandatory for all access attempts."
        : "Should implement Access Control where feasible. MFA recommended for critical systems.";

    return {
        title: `${topic} Policy (AI Generated)`,
        type: 'ISMS',
        status: 'DRAFT',
        version: '0.1.0',
        owner: 'AI Agent',
        sections: [
            {
                id: 's1',
                title: '1. Purpose',
                content: `To establish the rules and guidelines regarding ${topic} within the organization, ensuring confidentiality and integrity.`
            },
            {
                id: 's2',
                title: '2. Scope',
                content: `This policy applies to all employees, contractors, and third-party vendors accessing ${topic} resources.`
            },
            {
                id: 's3',
                title: '3. Policy Statements',
                content: contentTemplate
            },
            {
                id: 's4',
                title: '4. Compliance',
                content: `Violations of this policy may result in disciplinary action. Compliance is monitored via ${frameworks.join(', ') || 'Internal Audits'}.`
            }
        ],
        mappings: frameworks.map(f => ({
            frameworkId: f,
            controlId: 'Unknown',
            coverage: 'PARTIAL'
        }))
    };
};
