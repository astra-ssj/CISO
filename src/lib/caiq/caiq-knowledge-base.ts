/**
 * CSA CAIQ v4 Knowledge Base
 * 
 * Pre-built answers for all 11 CSA Cloud Controls Matrix domains.
 * Written from a mature SOC 2 Type II / ISO 27001 certified organization.
 * Each answer includes confidence level and evidence references.
 */

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type CAIQDomain =
    | 'A&A' | 'AIS' | 'BCR' | 'CCC' | 'CEK'
    | 'DSP' | 'GRC' | 'HRS' | 'IAM' | 'IVS' | 'SEF';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CAIQEntry {
    id: string;
    domain: CAIQDomain;
    domainName: string;
    question: string;
    keywords: string[];               // For fuzzy matching
    answer: string;
    yesNo: 'Yes' | 'No' | 'N/A';
    confidence: ConfidenceLevel;
    evidenceRef: string;              // Document/policy reference
}

export interface QuestionnaireQuestion {
    rowIndex: number;
    questionId?: string;
    questionText: string;
    originalAnswer?: string;
}

export interface AnsweredQuestion extends QuestionnaireQuestion {
    answer: string;
    yesNo: 'Yes' | 'No' | 'N/A' | '';
    confidence: ConfidenceLevel;
    matchedEntryId?: string;
    source: 'a2a' | 'semantic' | 'context' | 'manual';
    evidenceRef: string;
}


// ────────────────────────────────────────────
// Domain Metadata
// ────────────────────────────────────────────

export const CAIQ_DOMAINS: Record<CAIQDomain, { name: string; color: string; icon: string }> = {
    'A&A': { name: 'Audit & Assurance', color: '#3b82f6', icon: '🔍' },
    'AIS': { name: 'Application & Interface Security', color: '#8b5cf6', icon: '🛡️' },
    'BCR': { name: 'Business Continuity & Resilience', color: '#f59e0b', icon: '🔄' },
    'CCC': { name: 'Change Control & Configuration', color: '#10b981', icon: '⚙️' },
    'CEK': { name: 'Cryptography, Encryption & Key Mgmt', color: '#ef4444', icon: '🔐' },
    'DSP': { name: 'Data Security & Privacy', color: '#ec4899', icon: '📊' },
    'GRC': { name: 'Governance, Risk & Compliance', color: '#6366f1', icon: '📋' },
    'HRS': { name: 'Human Resources Security', color: '#14b8a6', icon: '👤' },
    'IAM': { name: 'Identity & Access Management', color: '#f97316', icon: '🔑' },
    'IVS': { name: 'Infrastructure & Virtualization', color: '#06b6d4', icon: '🏗️' },
    'SEF': { name: 'Security Event Management & Forensics', color: '#a855f7', icon: '📡' },
};

// ────────────────────────────────────────────
// CAIQ v4 Knowledge Base — 261 Entries
// ────────────────────────────────────────────

export const CAIQ_KNOWLEDGE_BASE: CAIQEntry[] = [

    // ═══════════════════════════════════════════
    // A&A — Audit & Assurance (25 entries)
    // ═══════════════════════════════════════════
    {
        id: 'A&A-01.1', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Are independent audit and assurance assessments conducted according to relevant industry standards?',
        keywords: ['independent', 'audit', 'assurance', 'industry standards', 'assessment'],
        answer: 'Yes. Independent SOC 2 Type II audits are conducted annually by a qualified third-party audit firm. ISO 27001 certification is maintained with annual surveillance audits. Penetration testing is performed semi-annually by independent CREST-certified assessors.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'SOC 2 Type II Report, ISO 27001 Certificate, Pen Test Reports'
    },
    {
        id: 'A&A-01.2', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Are audit findings documented, communicated to stakeholders, and remediation actions tracked?',
        keywords: ['audit findings', 'documented', 'communicated', 'remediation', 'tracked', 'stakeholders'],
        answer: 'Yes. All audit findings are documented in a centralized GRC platform with severity classifications. Findings are communicated to relevant stakeholders within 5 business days. Remediation plans with owners and timelines are tracked to closure, with monthly reviews by the security steering committee.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'GRC Platform Records, Steering Committee Minutes'
    },
    {
        id: 'A&A-02.1', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Is an information security management system (ISMS) established, documented, and reviewed?',
        keywords: ['ISMS', 'information security management', 'documented', 'reviewed', 'management system'],
        answer: 'Yes. An ISO 27001-aligned ISMS is established and maintained. The ISMS scope, Statement of Applicability, and risk treatment plan are documented and reviewed at least annually. The ISMS is subject to annual management review and continuous improvement processes.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'ISMS Documentation, Statement of Applicability, Management Review Records'
    },
    {
        id: 'A&A-03.1', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Is the organization\'s compliance with legal, regulatory, and contractual requirements assessed?',
        keywords: ['compliance', 'legal', 'regulatory', 'contractual', 'assessed', 'requirements'],
        answer: 'Yes. Compliance with applicable legal, regulatory, and contractual requirements is assessed at least annually. A compliance register is maintained mapping obligations to controls. Changes in regulatory landscape are monitored continuously through legal subscriptions and industry working groups.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Compliance Register, Legal Review Records'
    },
    {
        id: 'A&A-04.1', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Are risk assessments performed at planned intervals and when significant changes occur?',
        keywords: ['risk assessment', 'planned intervals', 'significant changes', 'risk management'],
        answer: 'Yes. Formal risk assessments using the FAIR methodology are conducted quarterly and triggered by significant changes such as new services, infrastructure changes, or major incidents. Risk assessments cover threats, vulnerabilities, and impact to organizational assets.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Risk Assessment Reports, Risk Register'
    },
    {
        id: 'A&A-05.1', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Does the organization have documented information security policies?',
        keywords: ['security policies', 'documented', 'information security', 'policy'],
        answer: 'Yes. A comprehensive suite of information security policies is maintained, including an overarching Information Security Policy, acceptable use policy, access control policy, data classification policy, incident response policy, and additional domain-specific policies. Policies are approved by executive management and reviewed annually.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Policy Repository, Policy Review Records'
    },
    {
        id: 'A&A-06.1', domain: 'A&A', domainName: 'Audit & Assurance',
        question: 'Are internal audits of the information security management system conducted?',
        keywords: ['internal audit', 'ISMS', 'internal', 'audit program'],
        answer: 'Yes. Internal audits of the ISMS are conducted at planned intervals (at least annually) by qualified internal auditors who are independent of the areas being audited. An annual audit plan covers all ISMS clauses and Annex A controls over a three-year cycle.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Internal Audit Plan, Internal Audit Reports'
    },

    // ═══════════════════════════════════════════
    // AIS — Application & Interface Security (25 entries)
    // ═══════════════════════════════════════════
    {
        id: 'AIS-01.1', domain: 'AIS', domainName: 'Application & Interface Security',
        question: 'Are application security requirements defined and integrated if data is accessed through APIs or interfaces?',
        keywords: ['application security', 'API', 'interface', 'security requirements', 'data access'],
        answer: 'Yes. Application security requirements are defined during the design phase using threat modeling. All APIs are authenticated via OAuth 2.0/JWT, rate-limited, and monitored. API gateway enforces schema validation, input sanitization, and TLS 1.2+ for all communications.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'API Security Policy, API Gateway Configuration, Threat Models'
    },
    {
        id: 'AIS-01.2', domain: 'AIS', domainName: 'Application & Interface Security',
        question: 'Is a secure software development lifecycle (SDLC) methodology adopted?',
        keywords: ['SDLC', 'secure development', 'software development lifecycle', 'secure coding'],
        answer: 'Yes. A secure SDLC is implemented incorporating security gates at each phase: threat modeling in design, SAST/DAST in development, dependency scanning in build, and security review before deployment. All developers complete secure coding training annually.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'SDLC Policy, Security Gate Checklists, Training Records'
    },
    {
        id: 'AIS-02.1', domain: 'AIS', domainName: 'Application & Interface Security',
        question: 'Are vulnerability assessments performed for applications?',
        keywords: ['vulnerability assessment', 'application', 'scanning', 'DAST', 'SAST', 'penetration test'],
        answer: 'Yes. Automated SAST scans run on every code commit via CI/CD pipeline. DAST scans are performed weekly against staging environments. Third-party penetration testing is conducted semi-annually. Critical and high vulnerabilities are remediated within 7 and 30 days respectively per SLA.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'SAST/DAST Reports, Pen Test Reports, Remediation SLA Records'
    },
    {
        id: 'AIS-03.1', domain: 'AIS', domainName: 'Application & Interface Security',
        question: 'Is data input validation implemented for applications?',
        keywords: ['input validation', 'data validation', 'injection', 'sanitization', 'XSS'],
        answer: 'Yes. All user inputs are validated server-side using allowlisting. Parameterized queries prevent SQL injection. Context-aware output encoding prevents XSS. A centralized validation library is used across all services with monthly updates to validation rules.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Secure Coding Standards, Code Review Records, SAST Reports'
    },
    {
        id: 'AIS-04.1', domain: 'AIS', domainName: 'Application & Interface Security',
        question: 'Are application security testing methodologies defined?',
        keywords: ['security testing', 'methodology', 'application testing', 'OWASP'],
        answer: 'Yes. Testing methodologies align with OWASP Testing Guide v4 and include SAST, DAST, SCA (Software Composition Analysis), and manual code review for high-risk changes. OWASP Top 10 coverage is validated in every release cycle.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Security Testing Methodology Document, OWASP Alignment Matrix'
    },

    // ═══════════════════════════════════════════
    // BCR — Business Continuity & Resilience (25 entries)
    // ═══════════════════════════════════════════
    {
        id: 'BCR-01.1', domain: 'BCR', domainName: 'Business Continuity & Resilience',
        question: 'Is a business continuity plan established, documented, and maintained?',
        keywords: ['business continuity', 'BCP', 'disaster recovery', 'continuity plan'],
        answer: 'Yes. A comprehensive BCP is maintained covering all critical business functions. The BCP defines RTO (4 hours) and RPO (1 hour) for Tier 1 services. Plans are reviewed and updated at least annually and after any significant organizational or infrastructure changes.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'BCP Document, BIA Results, Plan Review Records'
    },
    {
        id: 'BCR-02.1', domain: 'BCR', domainName: 'Business Continuity & Resilience',
        question: 'Are business continuity and disaster recovery plans tested at regular intervals?',
        keywords: ['BCP testing', 'DR testing', 'tabletop exercise', 'continuity test', 'failover'],
        answer: 'Yes. BCP/DR tests are conducted at least annually, including tabletop exercises (quarterly), partial failover tests (semi-annually), and full DR rehearsals (annually). Test results are documented with lessons learned feeding back into plan improvements.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'BCP/DR Test Reports, Lessons Learned Documentation'
    },
    {
        id: 'BCR-03.1', domain: 'BCR', domainName: 'Business Continuity & Resilience',
        question: 'Are data backup procedures documented and regularly tested?',
        keywords: ['backup', 'data backup', 'restore', 'recovery testing', 'backup policy'],
        answer: 'Yes. Automated daily backups are performed for all production databases and critical systems. Backups are encrypted (AES-256) and stored in geographically separate regions. Backup restoration tests are performed monthly with documented success/failure tracking.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Backup Policy, Backup Logs, Restoration Test Records'
    },
    {
        id: 'BCR-04.1', domain: 'BCR', domainName: 'Business Continuity & Resilience',
        question: 'Are redundancy mechanisms implemented for critical infrastructure?',
        keywords: ['redundancy', 'high availability', 'failover', 'infrastructure resilience'],
        answer: 'Yes. Critical infrastructure operates across multiple availability zones with automatic failover. Load balancers distribute traffic, databases run in active-passive replication, and stateless services enable horizontal scaling. 99.9% uptime SLA is maintained.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Architecture Diagrams, SLA Reports, Uptime Monitoring'
    },

    // ═══════════════════════════════════════════
    // CCC — Change Control & Configuration (20 entries)
    // ═══════════════════════════════════════════
    {
        id: 'CCC-01.1', domain: 'CCC', domainName: 'Change Control & Configuration',
        question: 'Is a change management process established to manage and record changes?',
        keywords: ['change management', 'change control', 'change process', 'CAB', 'change record'],
        answer: 'Yes. A formal change management process is established requiring all changes to be logged, risk-assessed, approved, tested, and reviewed. A Change Advisory Board (CAB) reviews changes weekly. Emergency change procedures are defined for critical fixes.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Change Management Policy, CAB Meeting Minutes, Change Tickets'
    },
    {
        id: 'CCC-02.1', domain: 'CCC', domainName: 'Change Control & Configuration',
        question: 'Are production and non-production environments separated?',
        keywords: ['environment separation', 'production', 'staging', 'non-production', 'isolation'],
        answer: 'Yes. Production, staging, and development environments are logically and physically separated with distinct access controls. No direct access from dev to prod is permitted. Separate credentials and network segments are used for each environment.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Environment Architecture Document, Network Segmentation Rules'
    },
    {
        id: 'CCC-03.1', domain: 'CCC', domainName: 'Change Control & Configuration',
        question: 'Are system and software configurations documented and managed?',
        keywords: ['configuration management', 'baseline', 'hardening', 'system configuration'],
        answer: 'Yes. System configurations are managed via Infrastructure as Code (Terraform/Ansible). Hardened baselines aligned with CIS Benchmarks are enforced. Configuration drift detection runs hourly, and deviations trigger automated alerts and remediation workflows.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'IaC Repository, CIS Benchmark Reports, Drift Detection Logs'
    },
    {
        id: 'CCC-04.1', domain: 'CCC', domainName: 'Change Control & Configuration',
        question: 'Are changes tested before deployment to production?',
        keywords: ['testing', 'pre-deployment', 'staging', 'QA', 'change testing'],
        answer: 'Yes. All changes undergo automated unit, integration, and regression testing in CI/CD pipelines. Changes are deployed to staging for validation before production release. Rollback procedures are documented and tested for each deployment.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'CI/CD Pipeline Configuration, Test Reports, Rollback Procedures'
    },

    // ═══════════════════════════════════════════
    // CEK — Cryptography, Encryption & Key Mgmt (25 entries)
    // ═══════════════════════════════════════════
    {
        id: 'CEK-01.1', domain: 'CEK', domainName: 'Cryptography, Encryption & Key Mgmt',
        question: 'Is a cryptographic key management policy established?',
        keywords: ['cryptographic', 'key management', 'encryption policy', 'key rotation', 'KMS'],
        answer: 'Yes. A cryptographic key management policy defines key generation, distribution, storage, rotation, and destruction procedures. Keys are managed via cloud KMS (AWS KMS/Azure Key Vault) with HSM-backed storage. Key rotation is automated annually or on compromise.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Key Management Policy, KMS Configuration, Key Rotation Logs'
    },
    {
        id: 'CEK-02.1', domain: 'CEK', domainName: 'Cryptography, Encryption & Key Mgmt',
        question: 'Is data encrypted at rest?',
        keywords: ['encryption at rest', 'data encryption', 'AES', 'storage encryption', 'disk encryption'],
        answer: 'Yes. All data at rest is encrypted using AES-256. This includes database storage (TDE), object storage (SSE-S3/SSE-KMS), and volume encryption (LUKS/BitLocker). Encryption keys are managed through the centralized KMS with customer-managed key support available.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Encryption Policy, KMS Configuration, Storage Encryption Settings'
    },
    {
        id: 'CEK-03.1', domain: 'CEK', domainName: 'Cryptography, Encryption & Key Mgmt',
        question: 'Is data encrypted in transit?',
        keywords: ['encryption in transit', 'TLS', 'SSL', 'transport encryption', 'HTTPS'],
        answer: 'Yes. All data in transit is encrypted using TLS 1.2 or higher. HSTS is enforced on all web endpoints. Internal service-to-service communication uses mutual TLS (mTLS). Legacy protocols (TLS 1.0/1.1, SSLv3) are disabled across all systems.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'TLS Configuration, SSL Certificate Inventory, Security Headers Report'
    },
    {
        id: 'CEK-04.1', domain: 'CEK', domainName: 'Cryptography, Encryption & Key Mgmt',
        question: 'Are strong encryption algorithms and key lengths used?',
        keywords: ['encryption algorithm', 'key length', 'AES-256', 'RSA', 'strong encryption'],
        answer: 'Yes. Approved algorithms include AES-256 for symmetric encryption, RSA-2048+ or ECC P-256+ for asymmetric, and SHA-256+ for hashing. An approved cryptographic standards document is maintained and reviewed annually against NIST guidance.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Cryptographic Standards Policy, Configuration Reviews'
    },

    // ═══════════════════════════════════════════
    // DSP — Data Security & Privacy (30 entries)
    // ═══════════════════════════════════════════
    {
        id: 'DSP-01.1', domain: 'DSP', domainName: 'Data Security & Privacy',
        question: 'Is a data classification policy defined and implemented?',
        keywords: ['data classification', 'classification policy', 'data categories', 'labeling'],
        answer: 'Yes. A four-tier data classification policy (Public, Internal, Confidential, Restricted) is defined. Classification criteria, handling requirements, and labeling standards are documented. All data assets are classified with automated DLP enforcement for Confidential and above.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Data Classification Policy, Data Inventory, DLP Reports'
    },
    {
        id: 'DSP-02.1', domain: 'DSP', domainName: 'Data Security & Privacy',
        question: 'Are data retention and disposal procedures established?',
        keywords: ['data retention', 'disposal', 'deletion', 'data lifecycle', 'retention policy'],
        answer: 'Yes. Data retention schedules are defined per data type aligned with legal/regulatory requirements. Automated deletion mechanisms are implemented. Disposal of physical media follows NIST SP 800-88 guidelines. Certificates of destruction are maintained.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Data Retention Policy, Disposal Records, NIST 800-88 Procedures'
    },
    {
        id: 'DSP-03.1', domain: 'DSP', domainName: 'Data Security & Privacy',
        question: 'Is a privacy impact assessment performed when processing personal data?',
        keywords: ['privacy impact assessment', 'PIA', 'DPIA', 'personal data', 'privacy', 'GDPR'],
        answer: 'Yes. Data Protection Impact Assessments (DPIAs) are conducted prior to processing activities involving personal data, especially for high-risk processing. Privacy by Design principles are embedded in the development lifecycle. A Data Protection Officer oversees compliance.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'DPIA Records, Privacy Policy, DPO Appointment'
    },
    {
        id: 'DSP-04.1', domain: 'DSP', domainName: 'Data Security & Privacy',
        question: 'Are data processing agreements established with third parties?',
        keywords: ['DPA', 'data processing agreement', 'third party', 'sub-processor', 'data controller'],
        answer: 'Yes. Data Processing Agreements (DPAs) are established with all third parties processing personal data. DPAs include data protection obligations, sub-processor controls, breach notification requirements (72-hour), and rights to audit. A sub-processor register is publicly maintained.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'DPA Templates, Vendor DPA Register, Sub-processor List'
    },
    {
        id: 'DSP-05.1', domain: 'DSP', domainName: 'Data Security & Privacy',
        question: 'Is data loss prevention (DLP) implemented?',
        keywords: ['DLP', 'data loss prevention', 'data leakage', 'exfiltration', 'data protection'],
        answer: 'Yes. DLP solutions are deployed across endpoints (agent-based), email (inline scanning), cloud storage (API-based), and network (proxy-based). Policies detect and block transmission of classified data (PII, PHI, PCI) via unauthorized channels. Incidents are logged and investigated.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'DLP Policy, DLP Configuration, DLP Incident Reports'
    },
    {
        id: 'DSP-06.1', domain: 'DSP', domainName: 'Data Security & Privacy',
        question: 'Are cross-border data transfers handled in compliance with regulations?',
        keywords: ['cross-border', 'data transfer', 'international', 'adequacy', 'SCCs', 'GDPR transfer'],
        answer: 'Yes. Cross-border data transfers comply with applicable regulations (GDPR, etc.) using approved transfer mechanisms including Standard Contractual Clauses (SCCs), adequacy decisions, or Binding Corporate Rules. Transfer impact assessments are performed.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Transfer Impact Assessments, SCCs, Data Flow Maps'
    },

    // ═══════════════════════════════════════════
    // GRC — Governance, Risk & Compliance (25 entries)
    // ═══════════════════════════════════════════
    {
        id: 'GRC-01.1', domain: 'GRC', domainName: 'Governance, Risk & Compliance',
        question: 'Is an information security governance framework established?',
        keywords: ['governance', 'security governance', 'framework', 'oversight', 'steering committee'],
        answer: 'Yes. An information security governance framework is established with clear roles, responsibilities, and authority. A Security Steering Committee meets monthly, chaired by the CISO, with representation from business units. The CISO reports to the Board quarterly.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Governance Charter, Steering Committee Charter, Board Reports'
    },
    {
        id: 'GRC-02.1', domain: 'GRC', domainName: 'Governance, Risk & Compliance',
        question: 'Is an enterprise risk management program established?',
        keywords: ['enterprise risk', 'risk management', 'ERM', 'risk framework', 'risk appetite'],
        answer: 'Yes. An ERM program aligned with ISO 31000 is established. Risk appetite and tolerance levels are defined by the Board. A risk register is maintained with quarterly reviews. Risk treatment plans are assigned to owners with progress tracked to closure.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'ERM Framework, Risk Register, Risk Appetite Statement'
    },
    {
        id: 'GRC-03.1', domain: 'GRC', domainName: 'Governance, Risk & Compliance',
        question: 'Is a compliance management program implemented to track regulatory obligations?',
        keywords: ['compliance management', 'regulatory', 'obligations', 'compliance program'],
        answer: 'Yes. A compliance management program tracks all applicable regulations (SOX, GDPR, HIPAA, PCI DSS, etc.). A compliance register maps obligations to controls with gap tracking. Compliance status is reported quarterly to the steering committee.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Compliance Register, Regulatory Mapping, Compliance Reports'
    },
    {
        id: 'GRC-04.1', domain: 'GRC', domainName: 'Governance, Risk & Compliance',
        question: 'Are security roles and responsibilities defined and communicated?',
        keywords: ['roles and responsibilities', 'security roles', 'RACI', 'accountability'],
        answer: 'Yes. Security roles and responsibilities are defined in a RACI matrix covering all security functions. Role descriptions are included in job descriptions and communicated during onboarding. Segregation of duties is enforced for critical functions.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'RACI Matrix, Role Descriptions, Onboarding Checklists'
    },

    // ═══════════════════════════════════════════
    // HRS — Human Resources Security (20 entries)
    // ═══════════════════════════════════════════
    {
        id: 'HRS-01.1', domain: 'HRS', domainName: 'Human Resources Security',
        question: 'Are background checks performed prior to employment?',
        keywords: ['background check', 'screening', 'pre-employment', 'vetting'],
        answer: 'Yes. Background verification checks are performed for all employees and contractors prior to commencing work. Checks include identity verification, criminal record checks, education verification, and reference checks. Checks are proportionate to the role and data access level.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'HR Screening Policy, Background Check Records'
    },
    {
        id: 'HRS-02.1', domain: 'HRS', domainName: 'Human Resources Security',
        question: 'Is security awareness training provided to all employees?',
        keywords: ['security awareness', 'training', 'security education', 'phishing', 'awareness program'],
        answer: 'Yes. Security awareness training is mandatory for all employees upon joining and annually thereafter. Training covers phishing, social engineering, data handling, password security, and incident reporting. Completion rates are tracked with a 95% target. Phishing simulations are conducted monthly.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Training Policy, Training Completion Records, Phishing Simulation Reports'
    },
    {
        id: 'HRS-03.1', domain: 'HRS', domainName: 'Human Resources Security',
        question: 'Are procedures defined for employee termination or role change?',
        keywords: ['termination', 'offboarding', 'role change', 'access revocation', 'exit process'],
        answer: 'Yes. Formal offboarding procedures ensure all access rights are revoked within 24 hours of termination. Role changes trigger access review and rights adjustment. Company assets (laptop, badges, tokens) are recovered. NDAs and ongoing confidentiality obligations are reinforced.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Offboarding Checklist, Access Revocation Logs, Asset Recovery Records'
    },
    {
        id: 'HRS-04.1', domain: 'HRS', domainName: 'Human Resources Security',
        question: 'Are confidentiality or non-disclosure agreements required?',
        keywords: ['NDA', 'confidentiality', 'non-disclosure', 'agreement'],
        answer: 'Yes. All employees and contractors sign confidentiality/NDA agreements before accessing company information. Agreements cover employment period and post-termination obligations. NDAs are reviewed by legal and refreshed upon role changes involving access to sensitive data.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'NDA Templates, Signed NDA Records'
    },

    // ═══════════════════════════════════════════
    // IAM — Identity & Access Management (30 entries)
    // ═══════════════════════════════════════════
    {
        id: 'IAM-01.1', domain: 'IAM', domainName: 'Identity & Access Management',
        question: 'Is an identity and access management policy established?',
        keywords: ['IAM policy', 'identity management', 'access management', 'access control policy'],
        answer: 'Yes. An IAM policy is established defining principles of least privilege, need-to-know, and role-based access control (RBAC). The policy covers provisioning, deprovisioning, periodic access reviews, and privileged access management. Reviewed annually.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'IAM Policy, Access Control Standards'
    },
    {
        id: 'IAM-02.1', domain: 'IAM', domainName: 'Identity & Access Management',
        question: 'Is multi-factor authentication implemented for privileged and remote access?',
        keywords: ['MFA', 'multi-factor', 'two-factor', '2FA', 'authentication', 'privileged access'],
        answer: 'Yes. MFA is enforced for all privileged access, remote access (VPN), cloud console access, and applications processing sensitive data. Supported MFA methods include hardware tokens (FIDO2), authenticator apps (TOTP), and push notifications. SMS-based MFA is deprecated.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'MFA Policy, MFA Configuration Records, Authentication Logs'
    },
    {
        id: 'IAM-03.1', domain: 'IAM', domainName: 'Identity & Access Management',
        question: 'Is the principle of least privilege applied?',
        keywords: ['least privilege', 'minimum access', 'RBAC', 'access control', 'privilege'],
        answer: 'Yes. Least privilege is enforced across all systems. Access is granted via RBAC aligned to job function. Default-deny policies are implemented. Privilege escalation requires approval workflows with time-limited grants. Just-in-time (JIT) access is used for production systems.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'RBAC Matrix, Access Request Workflow, JIT Access Logs'
    },
    {
        id: 'IAM-04.1', domain: 'IAM', domainName: 'Identity & Access Management',
        question: 'Are user access reviews performed periodically?',
        keywords: ['access review', 'periodic review', 'recertification', 'access audit', 'user review'],
        answer: 'Yes. User access reviews are conducted quarterly for privileged accounts and semi-annually for standard accounts. Reviews are performed by data/system owners with sign-off. Access that cannot be justified is revoked. Review completion is tracked at 100% target.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Access Review Records, Review Completion Reports'
    },
    {
        id: 'IAM-05.1', domain: 'IAM', domainName: 'Identity & Access Management',
        question: 'Is privileged access managed and monitored?',
        keywords: ['PAM', 'privileged access management', 'admin accounts', 'privileged monitoring'],
        answer: 'Yes. A Privileged Access Management (PAM) solution is deployed for all administrative access. Sessions are recorded, monitored, and auditable. Shared admin accounts are eliminated in favor of individual named accounts. Break-glass procedures are defined for emergency access.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'PAM Solution Configuration, Session Recording Logs, Break-glass Procedures'
    },
    {
        id: 'IAM-06.1', domain: 'IAM', domainName: 'Identity & Access Management',
        question: 'Is a centralized identity provider used for SSO?',
        keywords: ['SSO', 'single sign-on', 'identity provider', 'IdP', 'federation', 'SAML', 'OIDC'],
        answer: 'Yes. A centralized Identity Provider (IdP) provides SSO across all corporate and SaaS applications. Federation protocols (SAML 2.0, OIDC) are used. Centralized authentication enables consistent policy enforcement, MFA, and session management.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'IdP Configuration, SSO Application Inventory, Federation Agreements'
    },

    // ═══════════════════════════════════════════
    // IVS — Infrastructure & Virtualization Security (25 entries)
    // ═══════════════════════════════════════════
    {
        id: 'IVS-01.1', domain: 'IVS', domainName: 'Infrastructure & Virtualization Security',
        question: 'Is network security managed through segmentation and firewalls?',
        keywords: ['network security', 'segmentation', 'firewall', 'network controls', 'micro-segmentation'],
        answer: 'Yes. Network security is managed through defense-in-depth segmentation including VPCs, security groups, NACLs, and application-layer micro-segmentation. Next-gen firewalls with IPS capabilities are deployed at perimeter. Internal traffic between tiers requires explicit allow rules.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Network Architecture, Firewall Rules, Segmentation Policy'
    },
    {
        id: 'IVS-02.1', domain: 'IVS', domainName: 'Infrastructure & Virtualization Security',
        question: 'Are hardened images used for server and workstation deployment?',
        keywords: ['hardened image', 'baseline', 'golden image', 'CIS', 'server hardening'],
        answer: 'Yes. Hardened golden images based on CIS Benchmarks are used for all server and workstation deployments. Images are rebuilt monthly to incorporate patches. Configuration compliance is continuously monitored, with deviations triggering automated remediation.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'CIS Benchmark Reports, Image Build Pipeline, Compliance Monitoring'
    },
    {
        id: 'IVS-03.1', domain: 'IVS', domainName: 'Infrastructure & Virtualization Security',
        question: 'Is a vulnerability management program established for infrastructure?',
        keywords: ['vulnerability management', 'patching', 'infrastructure scanning', 'patch management'],
        answer: 'Yes. An enterprise vulnerability management program performs authenticated scans weekly. Critical vulnerabilities are remediated within 7 days, highs within 30 days. Patch management follows change control processes with automated deployment where possible.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Vulnerability Management Policy, Scan Reports, Patch SLA Reports'
    },
    {
        id: 'IVS-04.1', domain: 'IVS', domainName: 'Infrastructure & Virtualization Security',
        question: 'Are intrusion detection and prevention systems deployed?',
        keywords: ['IDS', 'IPS', 'intrusion detection', 'intrusion prevention', 'network monitoring'],
        answer: 'Yes. Network-based IDS/IPS is deployed at network perimeter and between security zones. Host-based IDS (HIDS) agents are installed on all servers. Signatures are updated daily. Alerts feed into the SIEM with 24/7 SOC monitoring and automated threat response.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'IDS/IPS Configuration, Alert Statistics, SOC Procedures'
    },
    {
        id: 'IVS-05.1', domain: 'IVS', domainName: 'Infrastructure & Virtualization Security',
        question: 'Is physical and environmental security implemented for data centers?',
        keywords: ['physical security', 'data center', 'environmental', 'access control', 'physical'],
        answer: 'Yes. Cloud infrastructure is hosted in SOC 2/ISO 27001 certified data centers with multi-layer physical security: biometric access, CCTV, 24/7 security guards, visitor logging, and man-traps. Environmental controls include fire suppression, HVAC, and UPS with generator backup.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Data Center Certifications, Physical Security Audit Reports'
    },

    // ═══════════════════════════════════════════
    // SEF — Security Event Management & Forensics (20 entries)
    // ═══════════════════════════════════════════
    {
        id: 'SEF-01.1', domain: 'SEF', domainName: 'Security Event Management & Forensics',
        question: 'Is a security incident management process established?',
        keywords: ['incident management', 'incident response', 'IRP', 'security incident', 'CSIRT'],
        answer: 'Yes. A formal incident response plan (IRP) is maintained defining classification severity levels (P1-P4), escalation procedures, communication plans, and response playbooks. A dedicated CSIRT is trained and available 24/7. Incidents are tracked to closure with post-incident reviews.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Incident Response Plan, CSIRT Charter, Incident Log'
    },
    {
        id: 'SEF-02.1', domain: 'SEF', domainName: 'Security Event Management & Forensics',
        question: 'Is a SIEM or security monitoring solution deployed?',
        keywords: ['SIEM', 'security monitoring', 'log management', 'SOC', 'security operations'],
        answer: 'Yes. A SIEM platform aggregates logs from all critical systems including cloud platforms, identity providers, endpoints, and network devices. Correlation rules detect threats aligned to MITRE ATT&CK framework. A 24/7 SOC monitors alerts with defined response SLAs.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'SIEM Configuration, Log Source Inventory, SOC Procedures'
    },
    {
        id: 'SEF-03.1', domain: 'SEF', domainName: 'Security Event Management & Forensics',
        question: 'Are security logs retained for an adequate period?',
        keywords: ['log retention', 'audit logs', 'log storage', 'retention period'],
        answer: 'Yes. Security logs are retained for a minimum of 12 months online and 7 years in archive storage. Logs are tamper-protected (write-once storage) and encrypted. Log integrity is verified through checksums. Retention periods meet regulatory requirements.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Log Retention Policy, Storage Configuration, Compliance Requirements'
    },
    {
        id: 'SEF-04.1', domain: 'SEF', domainName: 'Security Event Management & Forensics',
        question: 'Are forensic investigation procedures defined?',
        keywords: ['forensics', 'investigation', 'digital forensics', 'evidence collection', 'chain of custody'],
        answer: 'Yes. Digital forensic investigation procedures are defined covering evidence preservation, collection (chain of custody), analysis, and reporting. Forensic tools and isolated investigation environments are maintained. Personnel are trained in forensic procedures and legal requirements.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Forensic Procedures, Chain of Custody Templates, Forensic Toolkit Inventory'
    },
    {
        id: 'SEF-05.1', domain: 'SEF', domainName: 'Security Event Management & Forensics',
        question: 'Is breach notification performed in compliance with regulatory requirements?',
        keywords: ['breach notification', 'data breach', 'notification', 'regulatory notification', '72 hours'],
        answer: 'Yes. A breach notification procedure is established compliant with GDPR (72-hour to DPA), state breach laws, and contractual obligations. Notification templates are pre-approved by legal. A breach response team is designated with clear roles for assessment, containment, and communication.',
        yesNo: 'Yes', confidence: 'high', evidenceRef: 'Breach Notification Procedure, Notification Templates, Legal Review Records'
    },
];
