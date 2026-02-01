import { Policy } from './policy-store';

export const SEED_POLICIES: Policy[] = [
    {
        id: 'pol-isms-001',
        title: 'Global Information Security Policy',
        type: 'ISMS',
        version: '2.1.0',
        status: 'ACTIVE',
        owner: 'CISO Office',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. Purpose', content: 'The purpose of this policy is to protect the confidentiality, integrity, and availability of the organization\'s information assets from all threats, whether internal or external, deliberate or accidental.' },
            { id: 's2', title: '2. Scope', content: 'This policy applies to all employees, contractors, consultants, temporaries, and other workers at the organization, including all personnel affiliated with third parties.' },
            { id: 's3', title: '3. Information Security Objectives', content: '1. Ensure that information is accessible only to those authorized to have access.\n2. Safeguard the accuracy and completeness of information and processing methods.\n3. Ensure that authorized users have access to information and associated assets when required.' }
        ],
        mappings: [
            { frameworkId: 'ISO_27001', controlId: '5.1', coverage: 'FULL' },
            { frameworkId: 'NIST_CSF', controlId: 'GV.PO-01', coverage: 'FULL' }
        ],
        dependencies: [],
        acknowledgment: {
            status: 'COMPLETED',
            totalUsers: 450,
            signedUsers: 442,
            dueDate: '2025-12-31'
        },
        changelog: [
            { version: '2.1.0', date: '2025-01-15', author: 'CISO', notes: 'Annual review complete.' },
            { version: '2.0.0', date: '2024-06-10', author: 'GRC Lead', notes: 'Major rewrite for ISO 27001:2022.' }
        ]
    },
    {
        id: 'pol-access-001',
        title: 'Access Control Policy',
        type: 'ACCESS',
        version: '1.5.0',
        status: 'ACTIVE',
        owner: 'Identity & Access Management Team',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. User Access Management', content: 'User access rights must be assigned based on the Principle of Least Privilege. Access requests must be formally approved by the resource owner.' },
            { id: 's2', title: '2. Password Management', content: 'Passwords must meet the following complexity requirements:\n- Minimum length: 12 characters\n- Include mixed case, numbers, and special characters.\n- Multi-Factor Authentication (MFA) is mandatory for all remote access.' },
            { id: 's3', title: '3. Access Review', content: 'User access rights must be reviewed at regular intervals (quarterly for privileged accounts, bi-annually for standard accounts) to ensure they remain appropriate.' }
        ],
        mappings: [
            { frameworkId: 'ISO_27001', controlId: 'A.9.1', coverage: 'FULL' },
            { frameworkId: 'NIST_800_53', controlId: 'AC-1', coverage: 'FULL' },
            { frameworkId: 'SOC2', controlId: 'CC6.1', coverage: 'FULL' }
        ],
        dependencies: ['pol-isms-001'], // Depends on Global ISMS
        acknowledgment: {
            status: 'ACTIVE',
            totalUsers: 450,
            signedUsers: 120,
            dueDate: '2026-03-01'
        },
        changelog: [
            { version: '1.5.0', date: '2026-01-20', author: 'IAM Manager', notes: 'Added MFA requirement for all remote access.' }
        ]
    },
    {
        id: 'pol-ir-001',
        title: 'Incident Response Policy',
        type: 'INCIDENT',
        version: '3.0.0',
        status: 'ACTIVE',
        owner: 'SOC Manager',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. Incident Classification', content: 'Incidents must be classified by severity: LOW (no impact), MEDIUM (localized impact), HIGH (business unit impact), CRITICAL (enterprise impact).' },
            { id: 's2', title: '2. Containment Procedures', content: 'Upon confirmation of a security incident, the immediate priority is containment to prevent further spread. This may involve network isolation, account suspension, or temporary service shutdown. Evidence preservation is paramount.' },
            { id: 's3', title: '3. Reporting', content: 'All security incidents must be reported to the CISO within 1 hour of detection. External reporting to regulatory bodies (e.g., GDPR authorities) must occur within 72 hours where applicable.' }
        ],
        mappings: [
            { frameworkId: 'ISO_27001', controlId: 'A.16.1', coverage: 'FULL' },
            { frameworkId: 'NIST_CSF', controlId: 'RS.CO-01', coverage: 'FULL' },
            { frameworkId: 'GDPR', controlId: 'Art. 33', coverage: 'FULL' }
        ],
        dependencies: [],
        acknowledgment: { status: 'ACTIVE', totalUsers: 50, signedUsers: 50, dueDate: '2025-11-30' },
        changelog: []
    },
    {
        id: 'pol-priv-001',
        title: 'Data Protection & Privacy Policy',
        type: 'PRIVACY',
        version: '1.2.0',
        status: 'ACTIVE',
        owner: 'Data Privacy Officer',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. Data Classification', content: 'Data must be classified into PUBLIC, INTERNAL, CONFIDENTIAL, or RESTRICTED based on sensitivity and legal requirements.' },
            { id: 's2', title: '2. Data Minimization', content: 'Personal data collected must be adequate, relevant, and limited to what is necessary in relation to the purposes for which they are processed.' },
            { id: 's3', title: '3. Data Retention', content: 'Personal data shall not be kept for longer than is necessary. A data retention schedule must be maintained and enforced.' }
        ],
        mappings: [
            { frameworkId: 'GDPR', controlId: 'Art. 5', coverage: 'FULL' },
            { frameworkId: 'ISO_27701', controlId: '6.3', coverage: 'FULL' }
        ],
        dependencies: ['pol-isms-001'],
        acknowledgment: { status: 'PENDING', totalUsers: 450, signedUsers: 10, dueDate: '2026-06-01' },
        changelog: []
    },
    {
        id: 'pol-net-001',
        title: 'Network Security Policy',
        type: 'ISMS',
        version: '1.1.0',
        status: 'ACTIVE',
        owner: 'Network Engineering',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. Network Segregation', content: 'Networks must be segregated into logical zones (e.g., DMZ, Internal, Database) based on trust levels. Traffic between zones must be controlled via firewalls.' },
            { id: 's2', title: '2. Wireless Security', content: 'All wireless networks must use WPA3 encryption. Guest wireless networks must be completely isolated from the internal corporate network.' }
        ],
        mappings: [
            { frameworkId: 'ISO_27001', controlId: 'A.13.1', coverage: 'FULL' },
            { frameworkId: 'NIST_800_53', controlId: 'SC-7', coverage: 'FULL' }
        ],
        dependencies: ['pol-isms-001', 'pol-access-001'],
        acknowledgment: { status: 'ACTIVE', totalUsers: 50, signedUsers: 45 },
        changelog: []
    },
    {
        id: 'pol-vendor-001',
        title: 'Vendor Risk Management Policy',
        type: 'ISMS',
        version: '1.0.0',
        status: 'ACTIVE',
        owner: 'Procurement',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. Due Diligence', content: 'All third-party vendors with access to organization data must undergo a security risk assessment prior to onboarding.' },
            { id: 's2', title: '2. Contractual Clauses', content: 'Contracts must include Right to Audit clauses and specific SLA requirements for security incident reporting.' }
        ],
        mappings: [
            { frameworkId: 'ISO_27001', controlId: 'A.15.1', coverage: 'FULL' },
            { frameworkId: 'SOC2', controlId: 'CC9.2', coverage: 'FULL' }
        ],
        dependencies: ['pol-isms-001'],
        acknowledgment: { status: 'PENDING', totalUsers: 20, signedUsers: 5 },
        changelog: []
    },
    {
        id: 'pol-ai-001',
        title: 'Generative AI Acceptable Use Policy',
        type: 'AI_GOV',
        version: '0.9.5',
        status: 'DRAFT',
        owner: 'AI Ethics Committee',
        lastUpdated: new Date().toISOString(),
        sections: [
            { id: 's1', title: '1. Allowed Usage', content: 'Generative AI tools may be used for drafting generic content, code generation (with review), and summarization of public data.' },
            { id: 's2', title: '2. Prohibited Data', content: 'Strictly prohibited: Inputting PII, PHI, Customer Data, or Intellectual Property (source code, diagrams) into public or non-enterprise LLMs.' },
            { id: 's3', title: '3. Human Oversight', content: 'All AI-generated output must be reviewed by a qualified human for accuracy and bias before being published or used in decision-making.' }
        ],
        mappings: [
            { frameworkId: 'EU_AI_ACT', controlId: 'Art. 9', coverage: 'PARTIAL' },
            { frameworkId: 'ISO_42001', controlId: 'A.6.2', coverage: 'FULL' },
            { frameworkId: 'NIST_AI_RMF', controlId: 'MAP-1.2', coverage: 'FULL' }
        ],
        dependencies: ['pol-priv-001'],
        acknowledgment: { status: 'PENDING', totalUsers: 450, signedUsers: 0 },
        changelog: []
    }
];
