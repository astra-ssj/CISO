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
    // 1. Access Control: Check if we have an ACTIVE Access Control Policy
    const acPolicy = policies.find(p => p.title.includes('Access Control') && p.status === 'ACTIVE');

    // 2. Incident Handling: Check if we have processed Incidents
    const resolvedIncidents = playbooks.filter(p => p.status === 'RESOLVED');
    const irPolicy = policies.find(p => p.title.includes('Incident Response') && p.status === 'ACTIVE');

    // 3. Data Protection: Check for GDPR Policy
    const gdprPolicy = policies.find(p => p.title.includes('Data Protection') || p.title.includes('Privacy'));

    return [
        {
            id: 'AC-1',
            name: 'Access Control Policy',
            description: 'Documented access control policy and procedures.',
            status: acPolicy ? 'COMPLIANT' : 'NON_COMPLIANT',
            mappedStandards: ['NIST_CSF', 'ISO_27001'],
            details: acPolicy ? `Governed by: ${acPolicy.title}` : 'No active policy found.'
        },
        {
            id: 'AC-2',
            name: 'Account Management',
            description: 'Automated account creation, modification, enabling, disabling, and removal.',
            status: 'PARTIAL', // Still mocked/manual for now as we don't have IAM integration
            mappedStandards: ['NIST_CSF', 'SOC2']
        },
        {
            id: 'DS-5',
            name: 'Data at Rest Protection',
            description: 'Cryptographic protection for data at rest.',
            status: gdprPolicy ? 'COMPLIANT' : 'NON_COMPLIANT', // Linked to Privacy Policy
            mappedStandards: ['GDPR', 'ISO_27001']
        },
        {
            id: 'IR-4',
            name: 'Incident Handling',
            description: 'Incident handling capabilities for declared incidents.',
            status: (irPolicy && playbooks.length > 0) ? 'COMPLIANT' : 'PARTIAL',
            mappedStandards: ['NIST_CSF', 'ISO_27001', 'SOC2'],
            details: `${playbooks.length} Incidents Logged. ${resolvedIncidents.length} Resolved.`
        }
    ];
};

export const activeControls: Control[] = []; // Deprecated, kept for interface compat during migration

export function calculateComplianceScore(controls: Control[]): number {
    if (controls.length === 0) return 0;

    const points = controls.reduce((acc, control) => {
        switch (control.status) {
            case 'COMPLIANT': return acc + 100;
            case 'PARTIAL': return acc + 50;
            case 'NOT_APPLICABLE': return acc + 100; // N/A counts as compliant for scoring usually
            default: return acc;
        }
    }, 0);

    return Math.round(points / controls.length);
}
