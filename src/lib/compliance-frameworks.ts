export type FrameworkID = 'GDPR' | 'EU_AI_ACT' | 'NIST_CSF_2_0' | 'ISO_27001_2022' | 'NIS2';

export interface FrameworkControl {
    id: string;
    name: string;
    description: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    evidenceRequired: string[];
}

export interface FrameworkDefinition {
    id: FrameworkID;
    name: string;
    type: 'REGULATION' | 'STANDARD';
    controls: FrameworkControl[];
}

export const COMPLIANCE_FRAMEWORKS: Record<FrameworkID, FrameworkDefinition> = {
    GDPR: {
        id: 'GDPR',
        name: 'General Data Protection Regulation (EU) 2016/679',
        type: 'REGULATION',
        controls: [
            {
                id: 'ART-5.1.a',
                name: 'Lawfulness, Fairness and Transparency',
                description: 'Personal data must be processed lawfully, fairly and in a transparent manner.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Privacy Policy', 'Consent Records', 'Lawful Basis Assessment']
            },
            {
                id: 'ART-5.1.c',
                name: 'Data Minimization',
                description: 'Personal data must be adequate, relevant and limited to what is necessary.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Data Flow Diagrams', 'Retention Schedule', 'Collection Forms Review']
            },
            {
                id: 'ART-32',
                name: 'Security of Processing',
                description: 'Implement appropriate technical and organizational measures (TOMs) to ensure security.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Encryption Policy', 'Access Control Logs', 'Penetration Test Reports']
            },
            {
                id: 'ART-35',
                name: 'Data Protection Impact Assessment (DPIA)',
                description: 'Carry out assessment of impact whenever processing is likely to result in high risk.',
                riskLevel: 'HIGH',
                evidenceRequired: ['DPIA Registry', 'Signed DPIA Documents']
            }
        ]
    },
    EU_AI_ACT: {
        id: 'EU_AI_ACT',
        name: 'EU AI Act (Regulation)',
        type: 'REGULATION',
        controls: [
            {
                id: 'AI-ART-9',
                name: 'Risk Management System',
                description: 'Establish, implement, document and maintain a risk management system for high-risk AI systems.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['AI Risk Management Policy', 'Risk Assessment Report']
            },
            {
                id: 'AI-ART-10',
                name: 'Data and Data Governance',
                description: 'Training, validation and testing data sets must be subject to appropriate data governance.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Data Governance Framework', 'Bias Analysis Report']
            },
            {
                id: 'AI-ART-14',
                name: 'Human Oversight',
                description: 'High-risk AI systems shall be designed and developed in such a way that they can be effectively overseen by natural persons.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Oversight Procedures', 'User Interface Design Docs']
            }
        ]
    },
    NIST_CSF_2_0: {
        id: 'NIST_CSF_2_0',
        name: 'NIST Cybersecurity Framework 2.0',
        type: 'STANDARD',
        controls: [
            {
                id: 'GV.OC-01',
                name: 'Organizational Context',
                description: 'The organizational mission, objectives, stakeholders, and legal requirements are understood and prioritized.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Strategic Plan', 'Stakeholder Register']
            },
            {
                id: 'PR.AA-01',
                name: 'Identity Management',
                description: 'Identities and credentials are managed, authenticated, and controlled.',
                riskLevel: 'HIGH',
                evidenceRequired: ['IAM Policy', 'Access Reviews']
            }
        ]
    },
    ISO_27001_2022: {
        id: 'ISO_27001_2022',
        name: 'ISO/IEC 27001:2022',
        type: 'STANDARD',
        controls: [
            {
                id: 'A.5.1',
                name: 'Policies for Information Security',
                description: 'Information security policies and topic-specific policies shall be defined, approved, published, communicated and acknowledged.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Master Policy List', 'Approval Records', 'Communication Logs']
            },
            {
                id: 'A.8.2',
                name: 'Privileged Access Rights',
                description: 'The allocation and use of privileged access rights shall be restricted and managed.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Privileged Access Policy', 'PAM Tool Logs']
            }
        ]
    },
    NIS2: {
        id: 'NIS2',
        name: 'NIS2 Directive',
        type: 'REGULATION',
        controls: [
            {
                id: 'NIS2-ART-21.2.d',
                name: 'Supply Chain Security',
                description: 'Measures regarding supply chain security, including security-related aspects concerning the relationships between each entity and its direct suppliers.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Supplier Risk Assessment', 'Vendor Contracts']
            }
        ]
    }
};
