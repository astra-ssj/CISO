import { ComplianceStandard } from "@/lib/store";

export interface Control {
    id: string;
    name: string;
    description: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_APPLICABLE';
    mappedStandards: ComplianceStandard[];
    details?: string;
}

import { Policy } from "@/lib/policy-store";
import { Playbook } from "@/lib/playbook-store";

export const getDynamicControls = (policies: Policy[], playbooks: Playbook[]): Control[] => {
    const lowerTitles = policies.map(p => p.title.toLowerCase());
    const activePolicies = policies.filter(p => p.status === 'ACTIVE');
    const activeTitles = activePolicies.map(p => p.title.toLowerCase());
    const resolvedIncidents = playbooks.filter(p => p.status === 'RESOLVED');

    // Helper: check if any active policy covers a topic
    const hasActivePolicy = (...keywords: string[]) =>
        activeTitles.some(t => keywords.some(k => t.includes(k)));
    const hasAnyPolicy = (...keywords: string[]) =>
        lowerTitles.some(t => keywords.some(k => t.includes(k)));

    return [
        // --- IDENTITY & ACCESS ---
        {
            id: 'AC-1',
            name: 'Access Control Policy',
            description: 'Documented access control policy and procedures.',
            status: hasActivePolicy('access control') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['NIST_CSF', 'ISO_27001'],
            details: hasActivePolicy('access control') ? 'Active policy governs access control.' : 'No active policy found.'
        },
        {
            id: 'AC-2',
            name: 'Account Management',
            description: 'Automated account creation, modification, enabling, disabling, and removal.',
            status: 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'SOC2'],
            details: 'Manual process — no IAM integration yet.'
        },
        {
            id: 'AC-3',
            name: 'Privileged Access Management',
            description: 'Allocation and use of privileged access rights shall be restricted and managed.',
            status: hasActivePolicy('privileged', 'pam') ? 'COMPLIANT' : 'PARTIAL',
            mappedStandards: ['ISO_27001', 'NIST_CSF'],
            details: 'RBAC enforced in middleware. PAM tools not integrated.'
        },
        {
            id: 'AC-4',
            name: 'Multi-Factor Authentication',
            description: 'MFA is enforced for all administrative and critical system access.',
            status: 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'NIS2'],
            details: 'Auth system supports MFA capability but enforcement varies.'
        },

        // --- DATA PROTECTION ---
        {
            id: 'DS-1',
            name: 'Data Classification',
            description: 'Information is classified according to sensitivity and business value.',
            status: hasAnyPolicy('classification', 'data handling') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['ISO_27001', 'GDPR']
        },
        {
            id: 'DS-2',
            name: 'Data at Rest Protection',
            description: 'Cryptographic protection for data at rest.',
            status: hasAnyPolicy('data protection', 'privacy', 'encryption') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['GDPR', 'ISO_27001', 'NIST_CSF']
        },
        {
            id: 'DS-3',
            name: 'Data in Transit Protection',
            description: 'All data in transit is encrypted using TLS 1.2+.',
            status: 'COMPLIANT',
            mappedStandards: ['NIST_CSF', 'ISO_27001', 'NIS2'],
            details: 'TLS enforced via middleware security headers.'
        },
        {
            id: 'DS-4',
            name: 'Data Breach Notification',
            description: '72-hour breach notification process to supervisory authority.',
            status: hasActivePolicy('breach', 'incident response') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['GDPR', 'NIS2']
        },

        // --- INCIDENT MANAGEMENT ---
        {
            id: 'IR-1',
            name: 'Incident Response Plan',
            description: 'Documented incident response plan with defined roles and escalation.',
            status: hasActivePolicy('incident response', 'incident handling') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['NIST_CSF', 'ISO_27001', 'NIS2']
        },
        {
            id: 'IR-2',
            name: 'Incident Handling Capability',
            description: 'Operational incident handling with detection, containment, and recovery.',
            status: (hasActivePolicy('incident') && playbooks.length > 0) ? 'COMPLIANT' : 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'ISO_27001', 'SOC2'],
            details: `${playbooks.length} Incidents Logged. ${resolvedIncidents.length} Resolved.`
        },

        // --- VULNERABILITY MANAGEMENT ---
        {
            id: 'VM-1',
            name: 'Vulnerability Management Program',
            description: 'Regular vulnerability scanning and remediation tracking.',
            status: 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'ISO_27001'],
            details: 'Trivy + GitHub Dependabot integrated. Formal program documentation pending.'
        },
        {
            id: 'VM-2',
            name: 'Secure Development Lifecycle',
            description: 'SAST/SCA scanning integrated into development workflow.',
            status: 'PARTIAL',
            mappedStandards: ['ISO_27001', 'NIST_CSF'],
            details: 'In-app SAST engine active. CI/CD pipeline scanning not yet implemented.'
        },

        // --- BUSINESS CONTINUITY ---
        {
            id: 'BC-1',
            name: 'Business Continuity Plan',
            description: 'Documented BCP/DR plans with defined RTOs and RPOs.',
            status: hasAnyPolicy('continuity', 'disaster recovery') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['ISO_27001', 'NIS2']
        },

        // --- SUPPLY CHAIN ---
        {
            id: 'SC-1',
            name: 'Supply Chain Security',
            description: 'Vendor risk assessments and supply chain security measures.',
            status: 'NON_COMPLIANT',
            mappedStandards: ['NIS2', 'NIST_CSF'],
            details: 'Vendor Risk Management module not yet implemented.'
        },

        // --- AWARENESS & TRAINING ---
        {
            id: 'AT-1',
            name: 'Security Awareness Training',
            description: 'All personnel receive cybersecurity awareness training.',
            status: 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'NIS2', 'ISO_27001'],
            details: 'Training program documented. Completion tracking pending.'
        },

        // --- RISK MANAGEMENT ---
        {
            id: 'RM-1',
            name: 'Risk Assessment Process',
            description: 'Formal risk assessment methodology with quantitative analysis.',
            status: 'COMPLIANT',
            mappedStandards: ['NIST_CSF', 'ISO_27001', 'NIS2'],
            details: 'FAIR-based risk engine operational.'
        },

        // --- AUDIT & LOGGING ---
        {
            id: 'AU-1',
            name: 'Audit Logging',
            description: 'Security-relevant events are logged and monitored.',
            status: 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'ISO_27001', 'SOC2'],
            details: 'Audit logger active. Centralized SIEM integration pending.'
        },

        // --- AI GOVERNANCE ---
        {
            id: 'AI-1',
            name: 'AI Risk Management',
            description: 'AI systems are classified by risk and governed by appropriate policies.',
            status: hasAnyPolicy('ai', 'artificial intelligence', 'machine learning') ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['EU_AI_ACT']
        },
    ];
};

export const activeControls: Control[] = []; // Deprecated, kept for interface compat during migration

export function calculateComplianceScore(controls: Control[]): number {
    if (controls.length === 0) return 0;

    const points = controls.reduce((acc, control) => {
        switch (control.status) {
            case 'COMPLIANT': return acc + 100;
            case 'PARTIAL': return acc + 50;
            case 'NOT_APPLICABLE': return acc + 100;
            default: return acc;
        }
    }, 0);

    return Math.round(points / controls.length);
}
