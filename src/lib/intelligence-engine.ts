import { DecisionRequest, RiskLevel } from "./store";

interface AnalysisResult {
    riskScore: number;
    riskLevel: RiskLevel;
    flaggedKeywords: string[];
    complianceGaps: string[];
    recommendedActions: string[];
    generatedArtifacts: NonNullable<DecisionRequest['generatedArtifacts']>;
}

export const analyzeRequest = (title: string, description: string): AnalysisResult => {
    const fullText = `${title} ${description}`.toLowerCase();
    const flaggedKeywords: string[] = [];
    const complianceGaps: string[] = [];
    const recommendedActions: string[] = [];
    const generatedArtifacts: AnalysisResult['generatedArtifacts'] = [];
    let riskScore = 0;

    // Heuristic Rules

    // 1. Container / Kubernetes
    // Regex matches: kubernetes, k8s, kube, docker, container, pod, helm (case insensitive)
    if (/(?:kubernetes|k8s|kube|docker|container|pod|helm)\b/i.test(fullText)) {
        flaggedKeywords.push('Containerization', 'Orchestration');
        complianceGaps.push('NIST 800-190 (Container Security)', 'ISO 27001 A.14.2 (Secure Development)');
        recommendedActions.push('Enforce Pod Security Standards (PSS)', 'Implement Image Signing (Notary)', 'Enable Runtime Threat Detection');
        riskScore += 65;

        generatedArtifacts.push({
            id: `art-${Date.now()}-1`,
            type: 'POLICY_DRAFT',
            title: 'Container Security Standard v1.0',
            content: `
# Container Security Standard

## 1. Purpose
To ensure all containerized workloads deployed in the environment adhere to strict security baselines.

## 2. Requirements
### 2.1 Base Images
- All images must be sourced from the Trusted Registry (Harbor).
- Images must be scanned for vulnerabilities (CVSS > 7.0 must be remediated).

### 2.2 Runtime Protection
- Root privileges inside containers are PROHIBITED.
- Read-only root filesystems must be enforced where possible.

## 3. Compliance
Violations of this policy will result in the automated termination of the workload by the Admission Controller.
            `
        });
    }

    // 2. Cloud / AWS / Azure
    // Regex matches: cloud, aws, azure, gcp, s3, blob, bucket, lambda, serverless
    if (/(?:cloud|aws|azure|gcp|s3|blob|bucket|lambda|serverless)\b/i.test(fullText)) {
        flaggedKeywords.push('Public Cloud', 'Data Residency');
        complianceGaps.push('GDPR Article 44 (Cross-Border Transfer)', 'SOC 2 CC (Logical Access)');
        recommendedActions.push('Enable MFA on Root Accounts', 'Block Public Buckets via SCP', 'Activate CloudTrail/GuardDuty');
        riskScore += 40;

        generatedArtifacts.push({
            id: `art-${Date.now()}-2`,
            type: 'ARCHITECTURE_DIAGRAM',
            title: 'Secure Cloud Landing Zone Specification',
            content: `
# Secure Landing Zone Specs

1. **Identity**: AWS IAM Identity Center (SSO) integrated with Azure AD.
2. **Network**: Hub-and-Spoke model with Transit Gateway.
3. **Egress**: All outbound traffic filtered via Central Firewall VPC.
4. **Encryption**: KMS Customer Managed Keys (CMK) required for all storage.
            `
        });
    }

    // 3. Data / AI / Model
    // Regex matches: ai, ml, model, training, llm, gpt, inference, data
    if (/(?:ai|ml|model|training|llm|gpt|inference|data)\b/i.test(fullText)) {
        flaggedKeywords.push('AI/ML', 'Sensitive Data');
        complianceGaps.push('EU AI Act (Transparency)', 'GDPR Article 35 (DPIA)');
        recommendedActions.push('Conduct Algorithmic Impact Assessment', 'Anonymize Training Data', 'Implement Model Inventory');
        riskScore += 80;
    }

    // Risk Calculation
    let riskLevel: RiskLevel = 'LOW';
    if (riskScore > 80) riskLevel = 'CRITICAL';
    else if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 20) riskLevel = 'MEDIUM';

    // Default Fallback
    if (recommendedActions.length === 0) {
        recommendedActions.push('Conduct Manual Architecture Review', 'Perform Vendor Risk Assessment');
        complianceGaps.push('ISO 27001 General Controls');
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
