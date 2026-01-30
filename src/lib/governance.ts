import { ComplianceStandard } from "@/lib/store";

export interface Control {
    id: string;
    name: string;
    description: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_APPLICABLE';
    mappedStandards: ComplianceStandard[];
}

export const activeControls: Control[] = [
    {
        id: 'AC-1',
        name: 'Access Control Policy',
        description: 'Documented access control policy and procedures.',
        status: 'COMPLIANT',
        mappedStandards: ['NIST_CSF', 'ISO_27001']
    },
    {
        id: 'AC-2',
        name: 'Account Management',
        description: 'Automated account creation, modification, enabling, disabling, and removal.',
        status: 'PARTIAL',
        mappedStandards: ['NIST_CSF', 'SOC2']
    },
    {
        id: 'DS-5',
        name: 'Data at Rest Protection',
        description: 'Cryptographic protection for data at rest.',
        status: 'COMPLIANT',
        mappedStandards: ['GDPR', 'ISO_27001']
    },
    {
        id: 'IR-4',
        name: 'Incident Handling',
        description: 'Incident handling capabilities for declared incidents.',
        status: 'COMPLIANT',
        mappedStandards: ['NIST_CSF', 'ISO_27001', 'SOC2']
    }
];

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
