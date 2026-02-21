/**
 * CSA CAIQ v4 Knowledge Base — Production-grade entries for assessment accuracy.
 *
 * Uses exact CAIQ v4 question IDs and text. Each entry includes auditor-grade
 * answers, evidence requirements, and ISO 27001:2022 / NIST CSF 2.0 mappings.
 *
 * Primary accuracy lever for achieving 90%+ on CAIQ assessments.
 */

import type { CAIQKnowledgeEntry, CAIQDomain } from './types';

// =============================================================================
// AIS — Application & Interface Security (AIS-01 through AIS-04)
// =============================================================================

export const CAIQ_KB_AIS: CAIQKnowledgeEntry[] = [
  {
    questionId: 'AIS-01.1',
    domain: 'AIS',
    question:
      'Are application security policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained to guide appropriate planning, delivery, and support of the organization\'s application security capabilities?',
    keywords: [
      'application security',
      'policies',
      'procedures',
      'documented',
      'approved',
      'communicated',
      'evaluated',
      'maintained',
    ],
    baseAnswer:
      'Yes. Application security policies and procedures are established and maintained, covering secure SDLC, API security, and secure deployment. They are approved by security and engineering leadership, communicated to development and operations teams, and evaluated through internal audits and annual policy reviews. Updates are tracked in a central policy repository with version control and acknowledgment records.',
    evidenceRequired: [
      'Application Security Policy',
      'Secure SDLC / DevSecOps procedure documents',
      'Policy approval and communication records',
      'Annual policy review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.25', description: 'Secure development life cycle' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.SA-01', description: 'Software lifecycle security' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'AIS-01.2',
    domain: 'AIS',
    question:
      'Are application security policies and procedures reviewed and updated at least annually?',
    keywords: [
      'application security',
      'policy review',
      'annual',
      'updated',
      'procedures',
    ],
    baseAnswer:
      'Yes. Application security policies and procedures are reviewed at least annually by the security and engineering owners. Reviews consider changes in technology, threat landscape, regulatory requirements, and audit findings. Updates are documented with revision history and re-communicated to stakeholders; significant changes require re-approval and training where applicable.',
    evidenceRequired: [
      'Policy review schedule or calendar',
      'Revision history or change log',
      'Review meeting notes or sign-off',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'AIS-02.1',
    domain: 'AIS',
    question:
      'Are baseline requirements to secure different applications established, documented, and maintained?',
    keywords: [
      'baseline',
      'security requirements',
      'applications',
      'documented',
      'maintained',
      'secure development',
    ],
    baseAnswer:
      'Yes. Baseline security requirements are defined per application type (e.g., web, API, mobile) and data sensitivity. They cover authentication, authorization, input validation, cryptographic standards, logging, and dependency management. Baselines are documented in security standards or architecture requirements and maintained in alignment with OWASP and framework guidance; exceptions require risk acceptance.',
    evidenceRequired: [
      'Application security baseline or standards document',
      'Security requirements by application type',
      'Exception and risk acceptance records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.25', description: 'Secure development life cycle' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.26', description: 'Application security' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.SA-01', description: 'Software lifecycle security' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors often ask for evidence that baselines are applied to both custom and third-party applications where the organization has control.',
  },
  {
    questionId: 'AIS-03.1',
    domain: 'AIS',
    question:
      'Are technical and operational metrics defined and implemented according to business objectives, security requirements, and compliance obligations?',
    keywords: [
      'metrics',
      'technical',
      'operational',
      'security requirements',
      'compliance',
      'application security',
    ],
    baseAnswer:
      'Yes. Technical and operational application security metrics are defined and tracked, including vulnerability remediation SLAs (e.g., critical within 7 days, high within 30 days), SAST/DAST coverage, mean time to remediate, and security test pass rates. Metrics are aligned to business and compliance objectives and reported to management; dashboards and periodic reports support continuous improvement.',
    evidenceRequired: [
      'Application security metrics definition or KPI document',
      'Vulnerability remediation SLA policy',
      'Metrics dashboards or periodic reports',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.8', description: 'Management of technical vulnerabilities' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.SC-01', description: 'Cybersecurity supply chain risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'DE.CM-08', description: 'Vulnerability scans' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Common gap: defining metrics but not consistently measuring or reviewing them; auditors expect evidence of use in decision-making.',
  },
  {
    questionId: 'AIS-04.1',
    domain: 'AIS',
    question:
      'Is an SDLC process defined and implemented for application design, development, deployment, and operation per organizationally designed security requirements?',
    keywords: [
      'SDLC',
      'secure development',
      'design',
      'development',
      'deployment',
      'security requirements',
      'operation',
    ],
    baseAnswer:
      'Yes. A secure SDLC is defined and implemented, integrating security at each phase: security requirements and threat modeling in design, secure coding standards and peer review in development, automated security testing (SAST/DAST/SCA) in build and test, and security gates before deployment. The process is documented and followed for custom applications; security training is required for development roles.',
    evidenceRequired: [
      'SDLC or DevSecOps policy/process documentation',
      'Threat modeling or security design artifacts',
      'Security gate criteria and evidence (e.g., pipeline checks)',
      'Secure coding training records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.25', description: 'Secure development life cycle' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.26', description: 'Application security' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.SA-01', description: 'Software lifecycle security' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-01', description: 'Baseline configuration' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'SOC 2 and ISO 27001 auditors expect to see security integrated into the lifecycle, not only penetration tests at release.',
  },
];

// =============================================================================
// AAC — Audit Assurance & Compliance (AAC-01 through AAC-03)
// Uses CAIQ v4 question IDs A&A-01.x, A&A-02.x, A&A-03.x; domain code AAC per CCM.
// =============================================================================

export const CAIQ_KB_AAC: CAIQKnowledgeEntry[] = [
  {
    questionId: 'A&A-01.1',
    domain: 'AAC',
    question:
      'Are audit and assurance policies, procedures, and standards established, documented, approved, communicated, applied, evaluated, and maintained?',
    keywords: [
      'audit',
      'assurance',
      'policies',
      'procedures',
      'standards',
      'documented',
      'approved',
      'maintained',
    ],
    baseAnswer:
      'Yes. Audit and assurance policies, procedures, and standards are established and maintained, covering internal audit program, external assessments, and assurance activities. They are documented in the ISMS or audit manual, approved by management, communicated to relevant stakeholders, and applied consistently. Effectiveness is evaluated through management review and internal audit; updates follow the organization’s document control process.',
    evidenceRequired: [
      'Audit and assurance policy or ISMS documentation',
      'Internal audit procedure',
      'Document approval and distribution records',
      'Management review or audit program evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'A&A-01.2',
    domain: 'AAC',
    question:
      'Are audit and assurance policies, procedures, and standards reviewed and updated at least annually?',
    keywords: [
      'audit',
      'assurance',
      'policy review',
      'annual',
      'updated',
    ],
    baseAnswer:
      'Yes. Audit and assurance policies and procedures are reviewed at least annually, typically as part of the ISMS or audit program review. Changes in standards, regulations, or organizational structure trigger updates; revision history is maintained and stakeholders are notified of material changes.',
    evidenceRequired: [
      'Annual review schedule or calendar',
      'Revision history or change log',
      'Review sign-off or meeting minutes',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'A&A-02.1',
    domain: 'AAC',
    question:
      'Are independent audit and assurance assessments conducted according to relevant standards at least annually?',
    keywords: [
      'independent',
      'audit',
      'assurance',
      'assessments',
      'annually',
      'standards',
    ],
    baseAnswer:
      'Yes. Independent audit and assurance assessments are conducted at least annually in accordance with relevant standards (e.g., SOC 2, ISO 27001). Assessments are performed by qualified third-party auditors independent of the area under review. Scope, criteria, and schedule are documented; reports are issued to management and used for remediation and continuous improvement.',
    evidenceRequired: [
      'SOC 2 Type II report or ISO 27001 surveillance/certification scope',
      'External auditor engagement and independence confirmation',
      'Assessment schedule or audit plan',
      'Latest assessment report (executive summary or full)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.34', description: 'Independent review of information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.SC-01', description: 'Cybersecurity supply chain risk management' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      '“Independent” means auditor is not involved in designing or operating the controls; clarify whether SOC 2, ISO 27001, or both apply.',
  },
  {
    questionId: 'A&A-03.1',
    domain: 'AAC',
    question:
      'Are independent audit and assurance assessments performed according to risk-based plans and policies?',
    keywords: [
      'audit',
      'assurance',
      'risk-based',
      'plans',
      'policies',
      'assessments',
    ],
    baseAnswer:
      'Yes. Audit and assurance activities are planned using a risk-based approach. Risk criteria and audit frequency are defined in policy; high-risk areas and critical controls are prioritized. The audit plan is approved by management and updated when significant changes occur. Past findings and threat intelligence inform the risk-based schedule.',
    evidenceRequired: [
      'Risk-based audit plan or internal audit program',
      'Audit policy or procedure describing risk-based planning',
      'Evidence of plan approval and updates',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.34', description: 'Independent review of information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.RA-01', description: 'Asset vulnerabilities identified' },
    ],
    expectedAnswerType: 'YES',
  },
];

// =============================================================================
// BCR — Business Continuity Management & Operational Resilience (BCR-01 through BCR-11)
// =============================================================================

export const CAIQ_KB_BCR: CAIQKnowledgeEntry[] = [
  {
    questionId: 'BCR-01.1',
    domain: 'BCR',
    question:
      'Are business continuity management and operational resilience policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    keywords: [
      'business continuity',
      'operational resilience',
      'policies',
      'procedures',
      'documented',
      'approved',
      'maintained',
    ],
    baseAnswer:
      'Yes. Business continuity and operational resilience policies and procedures are established and maintained, defining scope, roles, and approach to BCP/DR. They are documented, approved by leadership, and communicated to relevant teams. The program is evaluated through exercises and reviews; procedures are updated to reflect lessons learned and organizational changes.',
    evidenceRequired: [
      'Business Continuity / Operational Resilience policy',
      'BCM procedure or program documentation',
      'Policy approval and communication records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-01.2',
    domain: 'BCR',
    question:
      'Are the policies and procedures reviewed and updated at least annually?',
    keywords: [
      'business continuity',
      'policy review',
      'annual',
      'updated',
      'procedures',
    ],
    baseAnswer:
      'Yes. Business continuity and operational resilience policies and procedures are reviewed at least annually. Reviews consider exercise results, incidents, organizational changes, and regulatory updates. Revisions are documented and approved; significant changes are communicated and reflected in BCP/DR plans.',
    evidenceRequired: [
      'Annual review evidence (schedule, minutes, or sign-off)',
      'Revision history for BCM policy/procedures',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-02.1',
    domain: 'BCR',
    question:
      'Are criteria for developing business continuity and operational resiliency strategies and capabilities established based on business disruption and risk impacts?',
    keywords: [
      'business continuity',
      'operational resiliency',
      'criteria',
      'disruption',
      'risk impacts',
      'BIA',
    ],
    baseAnswer:
      'Yes. Criteria for business continuity and resilience are established based on business impact analysis (BIA) and risk assessment. Critical processes and systems are identified; RTO and RPO are defined per tier. Risk appetite and impact criteria are documented and used to prioritize resilience investments and recovery strategies.',
    evidenceRequired: [
      'Business Impact Analysis (BIA) or equivalent',
      'RTO/RPO definitions by system or process',
      'Risk assessment or criteria documentation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.RA-01', description: 'Asset vulnerabilities identified' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.BE-05', description: 'Resilience requirements' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors expect BIA to be current (e.g., annual or after major changes) and to drive RTO/RPO and recovery priorities.',
  },
  {
    questionId: 'BCR-03.1',
    domain: 'BCR',
    question:
      'Are strategies developed to reduce the impact of, withstand, and recover from business disruptions in accordance with risk appetite?',
    keywords: [
      'strategies',
      'business disruption',
      'withstand',
      'recover',
      'risk appetite',
      'resilience',
    ],
    baseAnswer:
      'Yes. Strategies to reduce impact, withstand, and recover from disruptions are developed and aligned with risk appetite. They include redundancy, failover, backup, and alternate site/work arrangements where justified by BIA. Strategies are documented and linked to RTO/RPO; cost-benefit is considered and approved by management.',
    evidenceRequired: [
      'BC/Resilience strategy document or BCP overview',
      'Redundancy and failover design (e.g., architecture or runbooks)',
      'Link to BIA and risk appetite',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.BE-05', description: 'Resilience requirements' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-04.1',
    domain: 'BCR',
    question:
      'Are operational resilience strategies and capability results incorporated to establish, document, approve, communicate, apply, evaluate, and maintain a business continuity plan?',
    keywords: [
      'business continuity plan',
      'BCP',
      'operational resilience',
      'documented',
      'approved',
      'maintained',
    ],
    baseAnswer:
      'Yes. A business continuity plan (BCP) is established and maintained, incorporating resilience strategies and capability outcomes. The BCP is documented, approved, and communicated to responsible parties. It is applied during exercises and incidents and evaluated through tests and reviews; updates are made when strategies or environment change.',
    evidenceRequired: [
      'Business Continuity Plan (BCP) document',
      'Plan approval and distribution records',
      'Evidence of plan updates (e.g., after exercises or changes)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-05.1',
    domain: 'BCR',
    question:
      'Is relevant documentation developed, identified, and acquired to support business continuity and operational resilience plans?',
    keywords: [
      'documentation',
      'business continuity',
      'operational resilience',
      'plans',
      'support',
    ],
    baseAnswer:
      'Yes. Documentation required to support BCP and operational resilience is identified, developed, or acquired. This includes contact lists, runbooks, vendor and contract information, system diagrams, and recovery procedures. Documentation is stored in accessible, secure locations and kept current as part of plan maintenance.',
    evidenceRequired: [
      'BCP/DR documentation inventory or index',
      'Sample runbooks or recovery procedures',
      'Contact list or crisis communication plan (sanitized if needed)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-05.2',
    domain: 'BCR',
    question:
      'Is business continuity and operational resilience documentation available to authorized stakeholders?',
    keywords: [
      'documentation',
      'available',
      'authorized',
      'stakeholders',
      'business continuity',
    ],
    baseAnswer:
      'Yes. BCP and operational resilience documentation is available to authorized stakeholders when needed. Access is controlled and documented; copies or access paths are provided to crisis teams and key roles. Availability is verified during exercises (e.g., access from alternate locations or devices).',
    evidenceRequired: [
      'Access control or distribution list for BCP documentation',
      'Evidence of availability during an exercise (e.g., exercise report)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-05.3',
    domain: 'BCR',
    question:
      'Is business continuity and operational resilience documentation reviewed periodically?',
    keywords: [
      'documentation',
      'reviewed',
      'periodically',
      'business continuity',
      'operational resilience',
    ],
    baseAnswer:
      'Yes. BCP and supporting documentation are reviewed periodically (e.g., annually or after significant changes). Reviews confirm accuracy of contacts, procedures, and system information; updates are made and versioned. Review frequency and responsibility are defined in policy or the BCP itself.',
    evidenceRequired: [
      'Documentation review schedule or procedure',
      'Review records or revision history for BCP documentation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-06.1',
    domain: 'BCR',
    question:
      'Are the business continuity and operational resilience plans exercised and tested at least annually and when significant changes occur?',
    keywords: [
      'business continuity',
      'exercises',
      'tested',
      'annually',
      'significant changes',
      'DR test',
    ],
    baseAnswer:
      'Yes. BCP and operational resilience plans are exercised and tested at least annually, and when significant changes occur (e.g., new systems, major infrastructure changes). Exercises range from tabletop to full failover/DR tests; results are documented with lessons learned and action items. Remediation is tracked to closure.',
    evidenceRequired: [
      'BCP/DR test schedule or calendar',
      'Exercise reports (tabletop, failover, or DR test)',
      'Lessons learned and remediation tracking',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.TE-01', description: 'Recovery plan testing' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors expect at least one substantive exercise per year (e.g., DR or tabletop) with documented outcomes and follow-up.',
  },
  {
    questionId: 'BCR-07.1',
    domain: 'BCR',
    question:
      'Do business continuity and resilience procedures establish communication with stakeholders and participants?',
    keywords: [
      'business continuity',
      'resilience',
      'communication',
      'stakeholders',
      'participants',
      'crisis communication',
    ],
    baseAnswer:
      'Yes. Business continuity and resilience procedures include communication with stakeholders and participants. Roles and contact lists are defined; internal and external communication plans (including customers and regulators where applicable) are documented. Communication is exercised during tests and updated based on lessons learned.',
    evidenceRequired: [
      'Crisis or BCP communication procedure',
      'Stakeholder/participant contact list or communication matrix (sanitized if needed)',
      'Evidence of communication during an exercise',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.CO-01', description: 'Recovery communications' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-08.1',
    domain: 'BCR',
    question: 'Is cloud data periodically backed up?',
    keywords: [
      'cloud data',
      'backup',
      'periodically',
      'data backup',
    ],
    baseAnswer:
      'Yes. Cloud and critical data are backed up on a defined schedule (e.g., daily or continuous) in line with RPO requirements. Backup scope covers databases, configuration, and critical application data; backup jobs are monitored and failures are alerted and remediated.',
    evidenceRequired: [
      'Backup policy or procedure',
      'Backup schedule and scope documentation',
      'Backup monitoring or job logs (sample)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.13', description: 'Information backup' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-08.2',
    domain: 'BCR',
    question:
      'Is the confidentiality, integrity, and availability of backup data ensured?',
    keywords: [
      'backup',
      'confidentiality',
      'integrity',
      'availability',
      'backup security',
    ],
    baseAnswer:
      'Yes. Confidentiality, integrity, and availability of backup data are ensured through encryption (at rest and in transit where applicable), access controls, and storage in geographically or logically separate locations. Backup integrity is verified (e.g., checksums or restore tests); availability is supported by redundant or resilient backup infrastructure.',
    evidenceRequired: [
      'Backup security controls (encryption, access control) documentation',
      'Backup storage location and redundancy description',
      'Integrity or restore test evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.13', description: 'Information backup' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-08.3',
    domain: 'BCR',
    question: 'Can backups be restored appropriately for resiliency?',
    keywords: [
      'backup',
      'restore',
      'resiliency',
      'recovery',
    ],
    baseAnswer:
      'Yes. Backups can be restored to support resiliency and recovery. Restore procedures are documented and tested periodically (e.g., monthly or quarterly); success is recorded and failures are remediated. Restore capability is aligned with RTO/RPO and validated in DR or backup-specific tests.',
    evidenceRequired: [
      'Restore procedure or runbook',
      'Restore test records or DR test evidence including restore steps',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.13', description: 'Information backup' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.TE-01', description: 'Recovery plan testing' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors often ask for evidence of successful restores (e.g., test logs or DR report), not only that procedures exist.',
  },
  {
    questionId: 'BCR-09.1',
    domain: 'BCR',
    question:
      'Is a disaster response plan established, documented, approved, applied, evaluated, and maintained to ensure recovery from natural and man-made disasters?',
    keywords: [
      'disaster response',
      'DR plan',
      'documented',
      'recovery',
      'natural',
      'man-made',
    ],
    baseAnswer:
      'Yes. A disaster response plan (DRP) is established and maintained to ensure recovery from natural and man-made disasters. The plan is documented, approved, and covers roles, escalation, technical recovery steps, and communication. It is applied during tests and incidents, evaluated through exercises and post-incident reviews, and updated when needed.',
    evidenceRequired: [
      'Disaster Response Plan (DRP) document',
      'Plan approval and ownership',
      'Evidence of use in exercises or incidents',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-09.2',
    domain: 'BCR',
    question:
      'Is the disaster response plan updated at least annually, and when significant changes occur?',
    keywords: [
      'disaster response plan',
      'updated',
      'annually',
      'significant changes',
    ],
    baseAnswer:
      'Yes. The disaster response plan is updated at least annually and when significant changes occur (e.g., new systems, infrastructure changes, or lessons learned from exercises or incidents). Revisions are documented and approved; stakeholders are informed of material changes.',
    evidenceRequired: [
      'DRP revision history or change log',
      'Annual review or update evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-10.1',
    domain: 'BCR',
    question:
      'Is the disaster response plan exercised annually or when significant changes occur?',
    keywords: [
      'disaster response',
      'exercised',
      'annually',
      'significant changes',
      'DR test',
    ],
    baseAnswer:
      'Yes. The disaster response plan is exercised at least annually and when significant changes occur. Exercises may include tabletop, partial failover, or full DR rehearsals; scope and results are documented. Gaps and action items are tracked to closure and feed plan updates.',
    evidenceRequired: [
      'DR exercise schedule',
      'DR exercise report(s) (e.g., annual failover or tabletop)',
      'Action items and closure tracking',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.TE-01', description: 'Recovery plan testing' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'BCR-10.2',
    domain: 'BCR',
    question:
      'Are local emergency authorities included, if possible, in the exercise?',
    keywords: [
      'emergency',
      'authorities',
      'exercise',
      'local',
      'DR exercise',
    ],
    baseAnswer:
      'Yes, where possible and relevant. DR or BCP exercises include or coordinate with local emergency authorities (e.g., fire, law enforcement, or civil defense) when it adds value and is feasible. Involvement is documented in exercise scope and reports; if not included, the rationale (e.g., fully cloud-based, no physical site in scope) is noted.',
    evidenceRequired: [
      'Exercise scope or procedure mentioning external authorities',
      'Exercise report noting involvement of authorities or rationale for exclusion',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.TE-01', description: 'Recovery plan testing' },
    ],
    expectedAnswerType: 'CONDITIONAL',
    reviewerNotes:
      'Often conditional for cloud-only providers; “if possible” allows for exclusion with documented rationale.',
  },
  {
    questionId: 'BCR-11.1',
    domain: 'BCR',
    question:
      'Is business-critical equipment supplemented with redundant equipment independently located at a reasonable minimum distance in accordance with applicable industry standards?',
    keywords: [
      'redundancy',
      'business-critical',
      'equipment',
      'independently located',
      'industry standards',
    ],
    baseAnswer:
      'Yes. Business-critical systems and infrastructure are supported by redundant equipment or services, with geographic or logical separation consistent with industry practice and risk tolerance. For cloud-based services, this is achieved through multi-AZ or multi-region design and provider SLAs. For on-premises or hybrid, redundancy and location are documented and aligned with BIA and RTO/RPO.',
    evidenceRequired: [
      'Architecture or design documentation showing redundancy (e.g., multi-AZ, multi-region)',
      'SLA or provider documentation for availability/redundancy',
      'BIA or risk assessment supporting redundancy decisions',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.29', description: 'Information security during disruption' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.BE-05', description: 'Resilience requirements' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'For SaaS/cloud, “equipment” is interpreted as critical services; evidence is typically architecture and cloud provider redundancy/SLA.',
  },
];

// =============================================================================
// CCC — Change Control & Configuration Management (CCC-01 through CCC-09)
// =============================================================================

export const CAIQ_KB_CCC: CAIQKnowledgeEntry[] = [
  {
    questionId: 'CCC-01.1',
    domain: 'CCC',
    question:
      'Are policies and procedures for managing the risks associated with applying changes to organization assets (application, systems, infrastructure, configuration, etc.), whether managed internally or externally (e.g., outsourced), established, documented, approved, communicated, applied, evaluated, and maintained?',
    keywords: [
      'change control',
      'configuration management',
      'policies',
      'procedures',
      'risk',
      'documented',
      'approved',
      'maintained',
    ],
    baseAnswer:
      'Yes. Change control and configuration management policies and procedures are established and maintained, covering risk management for changes to applications, systems, infrastructure, and configuration (internal and outsourced). They are documented, approved by leadership, communicated to IT and development teams, and evaluated through audits and operational reviews. Updates follow document control and are reviewed at least annually.',
    evidenceRequired: [
      'Change Control / Configuration Management policy',
      'Change management procedure (e.g., request, approval, testing, release)',
      'Policy approval and communication records',
      'Annual policy review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-01.2',
    domain: 'CCC',
    question:
      'Are change control and configuration management policies and procedures reviewed and updated at least annually?',
    keywords: [
      'change control',
      'configuration management',
      'policy review',
      'annual',
      'updated',
    ],
    baseAnswer:
      'Yes. Change control and configuration management policies and procedures are reviewed at least annually. Reviews consider incidents, audit findings, tooling changes, and regulatory updates; revisions are documented with version history and re-communicated. Significant changes require re-approval and training where applicable.',
    evidenceRequired: [
      'Policy review schedule or calendar',
      'Revision history or change log',
      'Review sign-off or meeting minutes',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-02.1',
    domain: 'CCC',
    question:
      'Does the organization follow a defined quality change control, approval and testing process with established baselines, testing, and release standards?',
    keywords: [
      'change control',
      'approval',
      'testing',
      'baselines',
      'release standards',
      'quality',
    ],
    baseAnswer:
      'Yes. A defined change control process is followed, with approval workflows, established baselines, testing requirements, and release standards. Changes are categorized (e.g., standard, major, emergency); approval authority is defined by risk level. Testing is required before production release where applicable, and release criteria are documented and enforced (e.g., via ticketing and deployment pipelines).',
    evidenceRequired: [
      'Change management process documentation',
      'Baseline and release standards',
      'Sample change requests with approval and testing evidence',
      'Deployment or release procedure',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-03.1',
    domain: 'CCC',
    question:
      'Are the risks associated with applying changes to organization assets (applications, systems, infrastructure, configuration), whether managed internally or externally, managed?',
    keywords: [
      'change risk',
      'applications',
      'systems',
      'infrastructure',
      'configuration',
      'risk management',
    ],
    baseAnswer:
      'Yes. Risks associated with changes are managed through risk assessment as part of the change process. High-impact or high-risk changes require additional review, testing, and approval; rollback plans are required where appropriate. Risk criteria are defined in the change policy, and both internal and outsourced asset changes are in scope.',
    evidenceRequired: [
      'Change management policy referencing risk',
      'Risk assessment or impact criteria for changes',
      'Evidence of risk-based treatment for major changes',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-04.1',
    domain: 'CCC',
    question:
      'Is the unauthorized addition, removal, update, and management of organization assets restricted?',
    keywords: [
      'unauthorized',
      'addition',
      'removal',
      'update',
      'assets',
      'access control',
    ],
    baseAnswer:
      'Yes. Unauthorized addition, removal, update, and management of organization assets are restricted through access controls, change control requirements, and least-privilege principles. Only authorized personnel with defined roles can make changes; changes are logged and reviewed. Asset management and change processes are aligned to prevent unauthorized modifications.',
    evidenceRequired: [
      'Access control policy and role matrix',
      'Change authorization requirements',
      'Asset management or CMDB procedure',
      'Sample change logs or audit trail',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.18', description: 'Access control' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AC-01', description: 'Identities and credentials' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-05.1',
    domain: 'CCC',
    question:
      'Are provisions in place limiting changes directly impacting customer (CSC) owned environments or tenants to explicitly authorized requests within service level agreements between cloud service providers and customers?',
    keywords: [
      'customer environments',
      'tenants',
      'authorized requests',
      'SLA',
      'CSP',
      'CSC',
    ],
    baseAnswer:
      'Yes. Where the organization acts as a cloud service provider, changes that directly impact customer environments or tenants are limited to explicitly authorized requests. SLAs or terms of service define notification, approval, and maintenance windows; customer-impacting changes follow a defined process and are communicated in advance where contractually required.',
    evidenceRequired: [
      'SLA or contract provisions on customer-impacting changes',
      'Procedure for customer/tenant change authorization',
      'Maintenance window or change notification process',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.SC-01', description: 'Cybersecurity supply chain risk management' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'For organizations that are not CSPs or do not host multi-tenant customer environments, answer may be N/A or Yes with scope clarification.',
  },
  {
    questionId: 'CCC-06.1',
    domain: 'CCC',
    question:
      'Are change management baselines established for all relevant authorized changes on organization assets?',
    keywords: [
      'baselines',
      'change management',
      'authorized changes',
      'assets',
      'configuration baseline',
    ],
    baseAnswer:
      'Yes. Change management baselines are established for relevant assets (e.g., infrastructure, key applications, security configurations). Baselines are documented and versioned; changes are applied against baselines and deviations require approval. Baselines are updated through the change process and maintained in configuration management or infrastructure-as-code repositories.',
    evidenceRequired: [
      'Baseline policy or procedure',
      'Documented baselines (e.g., config standards, golden images)',
      'Evidence of baseline updates via change process',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.9', description: 'Configuration management' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-01', description: 'Baseline configuration' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-07.1',
    domain: 'CCC',
    question:
      'Are detection measures implemented with proactive notification in case of changes deviating from the established baseline?',
    keywords: [
      'detection',
      'notification',
      'baseline deviation',
      'change detection',
      'drift',
    ],
    baseAnswer:
      'Yes. Detection measures are implemented to identify changes that deviate from established baselines, with proactive notification to responsible teams. Tools (e.g., configuration drift detection, file integrity monitoring, or cloud resource compliance) are used where appropriate; alerts are triaged and deviations are investigated and remediated or formally accepted.',
    evidenceRequired: [
      'Procedure for baseline deviation detection',
      'Tooling or monitoring used (e.g., FIM, drift detection)',
      'Sample alerts or deviation reports',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.9', description: 'Configuration management' },
      { framework: 'NIST CSF 2.0', controlId: 'DE.CM-07', description: 'Monitoring for unauthorized changes' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-01', description: 'Baseline configuration' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-08.1',
    domain: 'CCC',
    question:
      'Is a procedure for the management of exceptions, including emergencies, in the change and configuration process implemented and aligned with the policy exception process (e.g., GRC-04)?',
    keywords: [
      'exceptions',
      'emergencies',
      'change process',
      'configuration',
      'policy exception',
      'GRC-04',
    ],
    baseAnswer:
      'Yes. A procedure for managing exceptions in the change and configuration process is implemented, including emergency changes. It defines when expedited approval is allowed, who can authorize, and required post-implementation review and documentation. The procedure is aligned with the organization’s policy exception process (e.g., GRC-04) and includes time-bound risk acceptance where applicable.',
    evidenceRequired: [
      'Exception/emergency change procedure',
      'Link to policy exception process (e.g., GRC-04)',
      'Sample emergency change records with post-implementation review',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CCC-09.1',
    domain: 'CCC',
    question:
      'Is a process defined and implemented to proactively roll back changes to a previous known good state in case of errors or security concerns?',
    keywords: [
      'rollback',
      'known good state',
      'errors',
      'security concerns',
      'change rollback',
    ],
    baseAnswer:
      'Yes. A rollback process is defined and implemented to return systems or applications to a previous known good state when changes cause errors or security concerns. Rollback steps are documented in change records and runbooks; capability is tested periodically. Responsibility and authority for initiating rollback are clearly assigned.',
    evidenceRequired: [
      'Rollback procedure or runbook',
      'Change records referencing rollback plan',
      'Evidence of rollback testing or post-incident rollback',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
];

// =============================================================================
// CEK — Cryptography, Encryption & Key Management (CEK-01 through CEK-21)
// =============================================================================

export const CAIQ_KB_CEK: CAIQKnowledgeEntry[] = [
  {
    questionId: 'CEK-01.1',
    domain: 'CEK',
    question:
      'Are policies and procedures for Cryptography, Encryption and Key Management established, documented, approved, communicated, applied, evaluated, and maintained?',
    keywords: [
      'cryptography',
      'encryption',
      'key management',
      'policies',
      'procedures',
      'documented',
      'approved',
      'maintained',
    ],
    baseAnswer:
      'Yes. Cryptography, encryption, and key management policies and procedures are established and maintained. They define approved algorithms, key lifecycle (generation, storage, rotation, revocation, destruction), roles and responsibilities, and use of certified cryptographic libraries. Policies are approved by security and technology leadership, communicated to relevant teams, and evaluated through audits and annual reviews.',
    evidenceRequired: [
      'Encryption and Key Management Policy',
      'Key lifecycle and handling procedures',
      'Policy approval and communication records',
      'Annual policy review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-01.2',
    domain: 'CEK',
    question:
      'Are cryptography, encryption and key management policies and procedures reviewed and updated at least annually?',
    keywords: [
      'cryptography',
      'encryption',
      'key management',
      'policy review',
      'annual',
      'updated',
    ],
    baseAnswer:
      'Yes. Cryptography, encryption, and key management policies and procedures are reviewed at least annually. Reviews consider algorithm guidance (e.g., NIST, regulatory), threat landscape, audit findings, and technology changes. Revisions are documented and re-communicated; significant changes require re-approval and training for key custodians and engineering teams.',
    evidenceRequired: [
      'Policy review schedule or calendar',
      'Revision history for CEK policy/procedures',
      'Review sign-off or meeting minutes',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-02.1',
    domain: 'CEK',
    question:
      'Are cryptographic, encryption and key management roles and responsibilities defined and implemented?',
    keywords: [
      'cryptography',
      'encryption',
      'key management',
      'roles',
      'responsibilities',
      'separation of duties',
    ],
    baseAnswer:
      'Yes. Roles and responsibilities for cryptography, encryption, and key management are defined and implemented. They include key custodians, approval authorities for key release or destruction, and separation of duties between key generation, use, and administration. Responsibilities are documented in job descriptions or RACI matrices and assigned to qualified personnel.',
    evidenceRequired: [
      'CEK roles and responsibilities document or RACI',
      'Key custodian and approval authority assignments',
      'Job descriptions or access matrix referencing key management duties',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.1', description: 'Screening' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AC-01', description: 'Identities and credentials' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-03.1',
    domain: 'CEK',
    question:
      'Is cryptographic protection provided to data at-rest and in-transit using cryptographic libraries certified to approved standards?',
    keywords: [
      'cryptographic protection',
      'data at-rest',
      'data in-transit',
      'certified libraries',
      'approved standards',
      'TLS',
      'encryption',
    ],
    baseAnswer:
      'Yes. Data at-rest and in-transit are protected using cryptography implemented with libraries or modules certified to approved standards (e.g., FIPS 140-2/140-3 validated, or equivalent). At-rest encryption is applied to sensitive data stores and backups; in-transit protection uses TLS 1.2 or higher with strong cipher suites. Algorithm and library choices are documented and aligned with policy.',
    evidenceRequired: [
      'Encryption standards document (at-rest and in-transit)',
      'Evidence of certified/validated crypto modules (e.g., FIPS) where required',
      'TLS and cipher configuration standards',
      'Inventory or assessment of data encryption coverage',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-2', description: 'Data-in-transit protection' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors frequently request evidence of FIPS or equivalent validation for high-assurance environments; document where validated crypto is used vs. standard libraries.',
  },
  {
    questionId: 'CEK-04.1',
    domain: 'CEK',
    question:
      'Are encryption algorithms used that are appropriate for data protection, considering the classification of data, associated risks, and usability of the encryption technology?',
    keywords: [
      'encryption algorithms',
      'data classification',
      'risk',
      'usability',
      'algorithm strength',
      'AES',
    ],
    baseAnswer:
      'Yes. Encryption algorithms are selected to be appropriate for data protection, considering data classification, risk, and usability. Standards (e.g., AES-256 for high-sensitivity data at-rest, TLS 1.2+ for in-transit) are defined in policy; deprecated algorithms (e.g., MD5, SHA-1 for signatures, 3DES) are prohibited or phased out. Algorithm choices are documented and reviewed when guidance or threats change.',
    evidenceRequired: [
      'Encryption policy or standards (approved algorithms)',
      'Data classification linkage to algorithm strength',
      'Deprecated algorithm list and migration plan if applicable',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-2', description: 'Data-in-transit protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-05.1',
    domain: 'CEK',
    question:
      'Is a standard change management procedure established to accommodate changes from internal and external sources for review, approval, implementation and communication of cryptographic, encryption, and key management technology changes?',
    keywords: [
      'change management',
      'cryptography',
      'encryption',
      'key management',
      'technology changes',
      'approval',
    ],
    baseAnswer:
      'Yes. A standard change management procedure applies to cryptographic, encryption, and key management technology changes from internal and external sources. Changes (e.g., algorithm upgrades, key system patches, HSM firmware) are reviewed, approved, and implemented with testing and communication. Impact on key lifecycle and data protection is assessed; rollback is planned for critical changes.',
    evidenceRequired: [
      'Change management procedure (reference to CEK scope)',
      'Sample change records for crypto/key management changes',
      'Communication or release notes for crypto-related updates',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-03', description: 'Configuration change control' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-06.1',
    domain: 'CEK',
    question:
      'Are changes to cryptography-, encryption-, and key management-related systems (including policies and procedures) managed and adopted with full account of downstream effects, including residual risk, cost, and benefits analysis?',
    keywords: [
      'crypto changes',
      'downstream effects',
      'residual risk',
      'cost benefit',
      'key management',
    ],
    baseAnswer:
      'Yes. Changes to cryptography, encryption, and key management systems and policies are managed with consideration of downstream effects. Impact assessment includes residual risk (e.g., algorithm transition, key re-encryption), cost (e.g., performance, tooling), and benefits; decisions are documented and approved. Migration and communication plans are in place for significant changes.',
    evidenceRequired: [
      'Procedure for CEK change impact assessment',
      'Sample impact or cost-benefit documentation for crypto changes',
      'Migration or transition plans for major crypto updates',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.32', description: 'Change management' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-07.1',
    domain: 'CEK',
    question:
      'Is an encryption and key management risk program established and maintained that includes provisions for risk assessment, risk treatment, risk context, monitoring, and feedback?',
    keywords: [
      'encryption',
      'key management',
      'risk program',
      'risk assessment',
      'risk treatment',
      'monitoring',
    ],
    baseAnswer:
      'Yes. An encryption and key management risk program is established and maintained. It includes risk assessment of key storage, access, and algorithm strength; risk treatment (mitigation, acceptance); clear risk context and appetite; and monitoring and feedback (e.g., key usage, compliance checks, incident review). Findings are used to update controls and procedures.',
    evidenceRequired: [
      'CEK risk program or risk assessment procedure',
      'Risk register or assessment output covering key management',
      'Monitoring or audit results feeding back into the program',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.RA-01', description: 'Asset vulnerabilities identified' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-08.1',
    domain: 'CEK',
    question:
      'Do cloud service providers provide the capability for customers (CSCs) to manage their own data encryption keys?',
    keywords: [
      'customer-managed keys',
      'BYOK',
      'CSC',
      'CSP',
      'key management',
      'encryption keys',
    ],
    baseAnswer:
      'Yes. Where the organization acts as a cloud service provider, capability is provided for customers to manage their own encryption keys (e.g., bring your own key (BYOK), customer-managed keys (CMK), or hold your own key (HYOK)) where technically and contractually supported. Options, limitations, and responsibilities are documented and communicated to customers; key lifecycle is described in customer-facing documentation.',
    evidenceRequired: [
      'Customer key management capability documentation (BYOK/CMK/HYOK)',
      'Product or service documentation describing key options',
      'Contract or SLA references to customer key management',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'CONDITIONAL',
    reviewerNotes:
      'Answer is conditional: Yes if CSP and capability is offered; N/A if not a CSP; or Yes with explanation if capability is partial or planned.',
  },
  {
    questionId: 'CEK-09.1',
    domain: 'CEK',
    question:
      'Are encryption and key management systems, policies, and processes audited with a frequency proportional to risk exposure, preferably continuously but at least annually and after any security event(s)?',
    keywords: [
      'audit',
      'encryption',
      'key management',
      'risk exposure',
      'annually',
      'security event',
    ],
    baseAnswer:
      'Yes. Encryption and key management systems, policies, and processes are audited at a frequency proportional to risk exposure. Audits occur at least annually and after significant security events; where feasible, continuous monitoring or automated compliance checks are used. Scope includes key lifecycle, access controls, and policy compliance; findings are remediated and reported to management.',
    evidenceRequired: [
      'Audit schedule or scope for CEK',
      'Recent internal or external audit report (CEK section)',
      'Post-incident audit or review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.34', description: 'Independent review of information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-02', description: 'Cybersecurity roles and responsibilities' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-10.1',
    domain: 'CEK',
    question:
      'Are cryptographic keys generated using industry-accepted cryptographic libraries, specifying the algorithm strength and the random number generator used?',
    keywords: [
      'key generation',
      'cryptographic libraries',
      'algorithm strength',
      'random number generator',
      'RNG',
      'CSPRNG',
    ],
    baseAnswer:
      'Yes. Cryptographic keys are generated using industry-accepted cryptographic libraries that specify algorithm strength and use approved random number generators (e.g., CSPRNG, FIPS-approved DRBG). Key generation procedures document the library, algorithm, and key length; keys are generated in a secure environment (e.g., HSM or protected service) and never exported in plaintext where policy prohibits.',
    evidenceRequired: [
      'Key generation procedure (library, algorithm, RNG)',
      'Standards for key strength by type (e.g., AES-256, RSA 2048+)',
      'Evidence of use of approved libraries or HSMs for generation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors often ask for key generation standards (e.g., NIST SP 800-133) and evidence that weak RNGs are not used.',
  },
  {
    questionId: 'CEK-11.1',
    domain: 'CEK',
    question:
      'Are cryptographic secret and private keys that are provisioned managed for a unique purpose?',
    keywords: [
      'secret keys',
      'private keys',
      'unique purpose',
      'key purpose',
      'key isolation',
    ],
    baseAnswer:
      'Yes. Cryptographic secret and private keys are provisioned and managed for a single, defined purpose (e.g., one key per application or use case, or per environment). Key purpose is documented and enforced through key naming, tagging, or policy; keys are not reused across purposes to limit blast radius and support auditability.',
    evidenceRequired: [
      'Policy or procedure for key purpose (one purpose per key)',
      'Key inventory or catalog showing purpose',
      'Naming/tagging standards for keys',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-12.1',
    domain: 'CEK',
    question:
      'Are cryptographic keys rotated in accordance with the calculated cryptoperiod, considering the risk of information disclosure and legal and regulatory requirements?',
    keywords: [
      'key rotation',
      'cryptoperiod',
      'information disclosure',
      'legal',
      'regulatory',
      'rotation schedule',
    ],
    baseAnswer:
      'Yes. Cryptographic keys are rotated in accordance with a defined cryptoperiod that considers risk of disclosure, data sensitivity, and legal or regulatory requirements (e.g., PCI DSS, sector rules). Rotation schedules are documented and automated where possible; rotation is logged and verified. Keys that cannot be rotated (e.g., some asymmetric keys) are risk-assessed and documented.',
    evidenceRequired: [
      'Key rotation policy (cryptoperiod by key type/sensitivity)',
      'Rotation schedule or automation evidence',
      'Logs or reports showing rotation execution',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Cryptoperiod guidance (e.g., NIST SP 800-57) is often cited; auditors expect defined periods and evidence of rotation.',
  },
  {
    questionId: 'CEK-13.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to revoke and remove cryptographic keys prior to the end of the established cryptoperiod when a key is compromised or an entity is no longer part of the organization, with provisions for legal and regulatory requirements?',
    keywords: [
      'key revocation',
      'key removal',
      'compromised',
      'entity departure',
      'cryptoperiod',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Processes and technical measures are in place to revoke and remove cryptographic keys before the end of the cryptoperiod when a key is compromised or an entity leaves the organization. Revocation triggers, roles, and timelines are defined; legal and regulatory requirements (e.g., retention for investigation) are considered. Revocation is logged and communicated to dependent systems; re-encryption or key replacement is performed where necessary.',
    evidenceRequired: [
      'Key revocation procedure',
      'Trigger criteria (compromise, offboarding)',
      'Sample revocation records or runbooks',
      'Legal/regulatory consideration in procedure',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AC-01', description: 'Identities and credentials' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-14.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to destroy keys stored outside a secure environment and revoke keys stored in Hardware Security Modules (HSMs) when no longer needed, with provisions for legal and regulatory requirements?',
    keywords: [
      'key destruction',
      'key revocation',
      'HSM',
      'secure environment',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Key destruction and revocation procedures are defined and implemented. Keys stored outside a secure environment are cryptographically destroyed (e.g., secure erase, overwrite) when no longer needed; keys in HSMs are revoked per vendor and organizational procedure. Legal and regulatory requirements (e.g., retention, proof of destruction) are addressed; destruction is logged and verified.',
    evidenceRequired: [
      'Key destruction and HSM revocation procedure',
      'Evidence of secure destruction method (e.g., HSM zeroization)',
      'Destruction logs or certificates where applicable',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-15.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to create keys in a pre-activated state when they have been generated but not authorized for use, with provisions for legal and regulatory requirements?',
    keywords: [
      'key activation',
      'pre-activated',
      'authorized for use',
      'key state',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Keys are created in a pre-activated (inactive) state when generated and are only activated after authorization for use. Process and technical measures (e.g., key state machine, approval workflow) enforce this; activation is logged and auditable. Legal and regulatory requirements for key release are considered in the approval process.',
    evidenceRequired: [
      'Key activation procedure (pre-activated to active)',
      'Approval or workflow for key activation',
      'Key state model or lifecycle documentation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-16.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to monitor, review and approve key transitions from any state to/from suspension, with provisions for legal and regulatory requirements?',
    keywords: [
      'key suspension',
      'key state',
      'transition',
      'review',
      'approval',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Key state transitions to and from suspension are monitored, reviewed, and approved through defined processes and technical controls. Suspension is used when a key is temporarily not in use but may be reactivated; transitions are logged and subject to approval. Legal and regulatory requirements are considered (e.g., data retention during suspension).',
    evidenceRequired: [
      'Key state transition procedure (including suspension)',
      'Approval requirements for suspension/reactivation',
      'Logging or audit trail for state changes',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-17.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to deactivate keys at the time of their expiration date, with provisions for legal and regulatory requirements?',
    keywords: [
      'key deactivation',
      'expiration',
      'key lifecycle',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Keys are deactivated at their expiration date through defined processes and technical measures. Expiration is set according to cryptoperiod policy; automated deactivation or alerting is used where possible. Legal and regulatory requirements (e.g., extended retention for decryption-only) are addressed; deactivation is logged and keys are then revoked or destroyed per procedure.',
    evidenceRequired: [
      'Key deactivation/expiration procedure',
      'Link to cryptoperiod and expiration policy',
      'Evidence of automated expiration or deactivation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-18.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to manage archived keys in a secure repository with least privilege access, with provisions for legal and regulatory requirements?',
    keywords: [
      'archived keys',
      'secure repository',
      'least privilege',
      'key archive',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Archived keys are managed in a secure repository with access restricted by least privilege. Only authorized roles can access the archive for defined purposes (e.g., decryption of legacy data, legal hold); access is logged and reviewed. Retention and disposal of archived keys align with legal and regulatory requirements.',
    evidenceRequired: [
      'Key archive procedure and repository controls',
      'Access control and least privilege for archive',
      'Retention and legal hold provisions',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.18', description: 'Access control' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-19.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated so that compromised keys are used to encrypt information only in controlled circumstances, and thereafter exclusively for decrypting data and never for encrypting data, with provisions for legal and regulatory requirements?',
    keywords: [
      'compromised keys',
      'decrypt only',
      'no new encryption',
      'controlled circumstances',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. When a key is compromised, procedures and technical controls ensure it is used only in controlled circumstances and thereafter exclusively for decryption (e.g., data recovery, migration), never for new encryption. Compromised keys are marked and restricted in the key management system; re-encryption with a new key is planned and executed. Legal and regulatory requirements for handling compromised keys are followed.',
    evidenceRequired: [
      'Procedure for compromised key handling (decrypt-only use)',
      'Technical controls restricting use of compromised keys',
      'Re-encryption or migration plan when keys are compromised',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-20.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to assess the risk to operational continuity versus the risk of the keying material and the information it protects being exposed if control of the keying material is lost, with provisions for legal and regulatory requirements?',
    keywords: [
      'key custody',
      'operational continuity',
      'key exposure',
      'risk assessment',
      'key loss',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. Risk assessment is performed to balance operational continuity against the risk of exposure of keying material and protected data if control is lost (e.g., key escrow, recovery procedures, multi-party control). Decisions on key backup, escrow, or split knowledge are documented; legal and regulatory requirements (e.g., data sovereignty, recovery obligations) are considered. The assessment is updated when key usage or threats change.',
    evidenceRequired: [
      'Risk assessment procedure for key custody and continuity',
      'Documented decisions on key backup/escrow/recovery',
      'Consideration of legal/regulatory in assessment',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', description: 'Recovery plan' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'CEK-21.1',
    domain: 'CEK',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated so the key management system tracks and reports all cryptographic materials and changes in status, with provisions for legal and regulatory requirements?',
    keywords: [
      'key management system',
      'track',
      'report',
      'cryptographic materials',
      'status changes',
      'audit trail',
      'legal',
      'regulatory',
    ],
    baseAnswer:
      'Yes. The key management system tracks and reports all cryptographic materials (keys, certificates, secrets) and status changes (generation, activation, rotation, suspension, revocation, destruction). Logging and reporting support audit, compliance, and incident response; retention aligns with legal and regulatory requirements. Reports are available to authorized personnel and auditors.',
    evidenceRequired: [
      'Key management system documentation (tracking and reporting)',
      'Sample reports or dashboards (sanitized)',
      'Audit trail or log retention policy for key events',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.24', description: 'Use of cryptography' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.15', description: 'Logging' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
      { framework: 'NIST CSF 2.0', controlId: 'DE.CM-01', description: 'Network and system activity' },
    ],
    expectedAnswerType: 'YES',
  },
];

// =============================================================================
// DSP — Data Security & Privacy Lifecycle Management (DSP-01 through DSP-19)
// =============================================================================

export const CAIQ_KB_DSP: CAIQKnowledgeEntry[] = [
  {
    questionId: 'DSP-01.1',
    domain: 'DSP',
    question:
      'Are policies and procedures for the classification, protection and handling of data throughout its lifecycle, and according to all applicable laws and regulations, standards, and risk level, established, documented, approved, communicated, applied, evaluated, and maintained?',
    keywords: [
      'data classification',
      'protection',
      'handling',
      'lifecycle',
      'laws',
      'regulations',
      'policies',
      'procedures',
    ],
    baseAnswer:
      'Yes. Data classification, protection, and handling policies and procedures are established and maintained for the full data lifecycle, aligned with applicable laws, regulations, standards, and risk. They cover classification levels, retention, access, sharing, and disposal; are approved and communicated; and are evaluated through audits and annual review. Updates reflect regulatory and risk changes.',
    evidenceRequired: [
      'Data Classification and Protection policy',
      'Data handling procedures (collect, store, share, dispose)',
      'Policy approval and communication records',
      'Annual policy review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.12', description: 'Classification of information' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'Policies should explicitly reference GDPR and EU Member State requirements for personal data; document lawful basis and data protection principles.',
    },
  },
  {
    questionId: 'DSP-01.2',
    domain: 'DSP',
    question:
      'Are data classification, protection and handling policies and procedures reviewed and updated at least annually?',
    keywords: [
      'data policy',
      'review',
      'annual',
      'updated',
      'classification',
      'protection',
    ],
    baseAnswer:
      'Yes. Data classification, protection, and handling policies and procedures are reviewed at least annually. Reviews consider regulatory changes (e.g., GDPR, sector rules), incidents, and audit findings; revisions are documented and re-communicated. Significant changes require re-approval and, where applicable, privacy impact assessment or DPO review.',
    evidenceRequired: [
      'Policy review schedule or calendar',
      'Revision history for data policy/procedures',
      'Review sign-off or DPO/privacy review',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 5(2) accountability; annual review supports demonstration of compliance.',
    },
  },
  {
    questionId: 'DSP-02.1',
    domain: 'DSP',
    question:
      'Are industry-accepted methods applied for the secure disposal of data from storage media such that data is not recoverable by any forensic means?',
    keywords: [
      'secure disposal',
      'data disposal',
      'storage media',
      'not recoverable',
      'forensic',
      'sanitization',
    ],
    baseAnswer:
      'Yes. Industry-accepted methods are used for secure disposal of data from storage media so that data is not recoverable by forensic means. Methods include cryptographic erasure (where keys are destroyed), secure overwrite (e.g., NIST SP 800-88), or physical destruction for media that cannot be sanitized. Disposal is documented and verified; certificates of destruction are retained where required.',
    evidenceRequired: [
      'Secure disposal/sanitization procedure',
      'Methods by media type (e.g., NIST 800-88)',
      'Disposal logs or certificates of destruction',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.10', description: 'Information deletion' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR requires personal data to be erased or anonymized when no longer necessary; secure disposal supports right to erasure and storage limitation.',
    },
  },
  {
    questionId: 'DSP-03.1',
    domain: 'DSP',
    question:
      'Is a data inventory created and maintained, at least for any sensitive data and personal data?',
    keywords: [
      'data inventory',
      'sensitive data',
      'personal data',
      'maintained',
      'record of processing',
    ],
    baseAnswer:
      'Yes. A data inventory (or record of processing activities) is created and maintained for sensitive and personal data. It captures processing purposes, data categories, systems, retention, sharing, and legal basis where applicable. The inventory is updated when processing changes and is used for risk assessment, DPIAs, and responding to data subject requests.',
    evidenceRequired: [
      'Data inventory or record of processing activities (ROPA)',
      'Scope and update procedure',
      'Sample inventory entries (sanitized)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.12', description: 'Classification of information' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.AM-01', description: 'Physical and software assets' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 30 requires a record of processing activities for controllers and processors; must be available to supervisory authorities.',
    },
  },
  {
    questionId: 'DSP-04.1',
    domain: 'DSP',
    question:
      'Is data classified according to its type and sensitivity level?',
    keywords: [
      'data classification',
      'type',
      'sensitivity',
      'classification scheme',
      'labels',
    ],
    baseAnswer:
      'Yes. Data is classified according to type and sensitivity level using a defined classification scheme (e.g., public, internal, confidential, restricted). Classification criteria and handling requirements per level are documented; classification is applied at creation or ingestion and reviewed when use changes. Labels or metadata support automated controls (access, encryption, retention).',
    evidenceRequired: [
      'Data classification scheme or standard',
      'Handling requirements by classification level',
      'Evidence of classification in systems (e.g., labels, metadata)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.12', description: 'Classification of information' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'DSP-05.1',
    domain: 'DSP',
    question:
      'Is data flow documentation created to identify what data is processed, stored or transmitted where? Is it reviewed at defined intervals, at least annually, and after any change?',
    keywords: [
      'data flow',
      'processed',
      'stored',
      'transmitted',
      'documentation',
      'review',
      'annual',
    ],
    baseAnswer:
      'Yes. Data flow documentation identifies what data is processed, stored, and transmitted and where (systems, locations, third parties). It is maintained for sensitive and personal data and reviewed at least annually and after significant changes. Diagrams or tables support privacy by design, DPIAs, and vendor risk; cross-border flows are explicitly documented.',
    evidenceRequired: [
      'Data flow documentation or diagrams',
      'Review schedule and change-triggered updates',
      'Cross-border flow documentation where applicable',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.12', description: 'Classification of information' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.AM-01', description: 'Physical and software assets' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR requires understanding of data flows for DPIAs, transfer impact assessments, and Article 30 records; document transfers outside EEA.',
    },
  },
  {
    questionId: 'DSP-06.1',
    domain: 'DSP',
    question:
      'Is ownership and stewardship of all relevant documented personal and sensitive data documented? Is review performed at least annually?',
    keywords: [
      'data ownership',
      'stewardship',
      'personal data',
      'sensitive data',
      'accountability',
      'annual review',
    ],
    baseAnswer:
      'Yes. Ownership and stewardship of personal and sensitive data are documented (e.g., data owners by system or process, stewardship roles). Accountability is clear for classification, retention, and handling; review is performed at least annually and when ownership changes. This supports accountability and response to incidents and data subject requests.',
    evidenceRequired: [
      'Data ownership/stewardship matrix or register',
      'Review procedure and annual review evidence',
      'Link to data inventory or ROPA',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.2', description: 'Information security roles and responsibilities' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-02', description: 'Cybersecurity roles and responsibilities' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 5(2) accountability; data controller/processor roles and DPO where required should be documented.',
    },
  },
  {
    questionId: 'DSP-07.1',
    domain: 'DSP',
    question:
      'Are systems, products, and business practices developed based upon a principle of security by design and industry best practices?',
    keywords: [
      'security by design',
      'products',
      'business practices',
      'industry best practices',
      'privacy by design',
    ],
    baseAnswer:
      'Yes. Systems, products, and business practices are developed using security by design principles and industry best practices. Security requirements are defined early; threat modeling and risk assessment are performed; and secure development, default configurations, and ongoing hardening are applied. This is documented in SDLC and architecture standards and verified through design reviews and testing.',
    evidenceRequired: [
      'Security by design policy or SDLC security requirements',
      'Threat modeling or security design review evidence',
      'Default secure configuration standards',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.25', description: 'Secure development life cycle' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.26', description: 'Application security' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.SA-01', description: 'Software lifecycle security' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'DSP-08.1',
    domain: 'DSP',
    question:
      'Are systems, products, and business practices developed based upon a principle of privacy by design and industry best practices, with privacy settings configured by default according to applicable laws and regulations?',
    keywords: [
      'privacy by design',
      'default privacy settings',
      'laws',
      'regulations',
      'products',
      'business practices',
    ],
    baseAnswer:
      'Yes. Systems and products are developed using privacy by design principles, with privacy-friendly defaults in line with applicable laws and regulations. Data minimization, purpose limitation, and user controls (e.g., consent, preferences) are built in; default settings protect privacy. Compliance is verified through privacy reviews and, where required, DPIAs.',
    evidenceRequired: [
      'Privacy by design policy or product requirements',
      'Default privacy settings documentation',
      'Privacy review or DPIA evidence for new processing',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.26', description: 'Application security' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.PT-01', description: 'Baseline configuration' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 25 requires data protection by design and by default; document how default settings and design choices implement this.',
    },
  },
  {
    questionId: 'DSP-09.1',
    domain: 'DSP',
    question:
      'Is a Data Protection Impact Assessment (DPIA) conducted to evaluate the origin, nature, particularity and severity of the risks upon the processing of personal data, according to applicable laws, regulations and industry best practices?',
    keywords: [
      'DPIA',
      'data protection impact assessment',
      'personal data',
      'risk',
      'laws',
      'regulations',
      'processing',
    ],
    baseAnswer:
      'Yes. A Data Protection Impact Assessment (DPIA) is conducted for processing that is likely to result in high risk to individuals, in line with applicable laws and best practices. The DPIA evaluates origin, nature, and severity of risks, mitigation measures, and necessity/proportionality; it is reviewed and approved before processing and updated when processing changes. Consultation with the DPO or supervisory authority occurs where required.',
    evidenceRequired: [
      'DPIA procedure or template',
      'Completed DPIAs for high-risk processing (sanitized)',
      'Review and approval records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.RA-01', description: 'Asset vulnerabilities identified' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 35 requires DPIA for high-risk processing; Article 36 prior consultation with SA when residual risk remains high.',
    },
  },
  {
    questionId: 'DSP-10.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to ensure any transfer of personal or sensitive data is protected from unauthorized access and only processed within scope as permitted by the respective laws and regulations?',
    keywords: [
      'data transfer',
      'personal data',
      'sensitive data',
      'unauthorized access',
      'scope',
      'laws',
      'regulations',
    ],
    baseAnswer:
      'Yes. Transfers of personal and sensitive data are protected from unauthorized access and limited to scope permitted by law. Technical and organizational measures (encryption, access controls, transfer agreements) are applied; cross-border transfers use approved mechanisms (e.g., adequacy, SCCs, BCRs). Transfer scope and legal basis are documented and reviewed.',
    evidenceRequired: [
      'Data transfer policy and procedures',
      'Technical and contractual safeguards for transfers',
      'Cross-border transfer documentation (e.g., SCCs, adequacy)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-2', description: 'Data-in-transit protection' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Chapter V: transfers outside EEA require adequacy decision, appropriate safeguards (SCCs, BCRs), or derogations; document transfer mechanism.',
    },
  },
  {
    questionId: 'DSP-11.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined and implemented to enable data subjects to request access to, modification of, or deletion of their personal data, according to applicable laws and regulations?',
    keywords: [
      'data subject rights',
      'access',
      'modification',
      'deletion',
      'right to erasure',
      'laws',
      'regulations',
    ],
    baseAnswer:
      'Yes. Processes and technical measures enable data subjects to exercise rights of access, rectification, and erasure (and other rights under applicable law). Requests are received, verified, and fulfilled within statutory timeframes; procedures and contact points are published. Responses are logged and, where deletion is requested, data is securely removed or anonymized per policy and law.',
    evidenceRequired: [
      'Data subject rights procedure',
      'Privacy notice or point of contact for requests',
      'Sample request handling (process description or metrics)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Articles 15–22: right of access, rectification, erasure, restriction, portability, objection; respond within one month, extendable.',
    },
  },
  {
    questionId: 'DSP-12.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to ensure that personal data is processed according to applicable laws and regulations and for the purposes declared to the data subject?',
    keywords: [
      'purpose limitation',
      'personal data',
      'declared purposes',
      'laws',
      'regulations',
      'processing',
    ],
    baseAnswer:
      'Yes. Personal data is processed only in accordance with applicable law and for purposes declared to the data subject (e.g., in privacy notice or contract). Purpose limitation is enforced through policy, access controls, and data use agreements; use beyond declared purposes requires new lawful basis and, where required, consent or notice. Compliance is supported by training and monitoring.',
    evidenceRequired: [
      'Purpose limitation policy and privacy notices',
      'Data use agreements or processing records',
      'Training or awareness on lawful processing',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 5(1)(b) purpose limitation; processing must be for specified, explicit, legitimate purposes and not further processed in an incompatible manner.',
    },
  },
  {
    questionId: 'DSP-13.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated for the transfer and sub-processing of personal data within the service supply chain, according to applicable laws and regulations?',
    keywords: [
      'sub-processing',
      'subprocessors',
      'personal data',
      'supply chain',
      'transfer',
      'laws',
      'regulations',
    ],
    baseAnswer:
      'Yes. Transfer and sub-processing of personal data in the supply chain are governed by procedures and contracts in line with applicable law. Sub-processors are selected with due diligence; contracts impose equivalent data protection obligations and are approved per vendor management process. Sub-processor lists are maintained and, where required by law, made available to customers or data subjects.',
    evidenceRequired: [
      'Sub-processor management procedure',
      'Contractual requirements (DPA, audit rights)',
      'Sub-processor list and approval records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.SC-01', description: 'Cybersecurity supply chain risk management' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 28: processor must use sub-processors only with controller authorization and under a contract providing sufficient guarantees.',
    },
  },
  {
    questionId: 'DSP-14.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined, implemented and evaluated to disclose the details of any personal or sensitive data access by sub-processors to the data owner prior to initiation of that processing?',
    keywords: [
      'sub-processor',
      'disclosure',
      'data owner',
      'personal data',
      'sensitive data',
      'prior to processing',
    ],
    baseAnswer:
      'Yes. Details of sub-processor access to personal or sensitive data are disclosed to the data owner (or controller) before processing begins. Disclosure includes sub-processor identity, purpose, location, and safeguards; data owners can object or approve per contract. Updates to sub-processors are communicated and, where required, subject to prior approval or objection rights.',
    evidenceRequired: [
      'Procedure for sub-processor disclosure and approval',
      'Customer-facing sub-processor list or notification process',
      'Contract clauses on prior disclosure and objection',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.SC-01', description: 'Cybersecurity supply chain risk management' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 28(2): processor must inform controller of intended sub-processor changes and give opportunity to object.',
    },
  },
  {
    questionId: 'DSP-15.1',
    domain: 'DSP',
    question:
      'Is authorization from data owners obtained, and associated risk managed, before replicating or using production data in non-production environments?',
    keywords: [
      'production data',
      'non-production',
      'authorization',
      'data owner',
      'risk',
      'test data',
    ],
    baseAnswer:
      'Yes. Authorization from data owners is obtained and risk is assessed before production data is replicated or used in non-production environments. Where production data is used, it is minimized, masked, or anonymized where possible; access and retention are restricted. Procedure and approval are documented; use is logged and reviewed.',
    evidenceRequired: [
      'Policy or procedure for production data in non-production',
      'Authorization or approval process',
      'Data masking/anonymization standards where production data is used',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.10', description: 'Information deletion' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'Using personal data in test/dev without lawful basis or minimization can breach GDPR; document lawful basis if production data is used.',
    },
  },
  {
    questionId: 'DSP-16.1',
    domain: 'DSP',
    question:
      'Is data retention, archiving and deletion managed in accordance with business requirements and applicable laws and regulations?',
    keywords: [
      'data retention',
      'archiving',
      'deletion',
      'business requirements',
      'laws',
      'regulations',
    ],
    baseAnswer:
      'Yes. Data retention, archiving, and deletion are managed per defined schedules aligned with business needs and applicable laws and regulations. Retention periods are documented by data type and purpose; archiving and secure deletion are performed at end of retention. Exceptions (e.g., legal hold) are documented and reviewed; compliance is monitored and audited.',
    evidenceRequired: [
      'Data retention policy and schedule',
      'Retention by data type/purpose',
      'Deletion or archiving procedure and evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.10', description: 'Information deletion' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 5(1)(e) storage limitation; personal data kept only as long as necessary; document retention periods and deletion process.',
    },
  },
  {
    questionId: 'DSP-17.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined and implemented to protect sensitive data throughout its lifecycle?',
    keywords: [
      'sensitive data',
      'lifecycle',
      'protection',
      'processes',
      'technical measures',
      'procedures',
    ],
    baseAnswer:
      'Yes. Sensitive data is protected throughout its lifecycle via defined processes and technical measures. Protection includes classification, access control, encryption (at rest and in transit), secure disposal, and monitoring; controls are applied from collection through deletion. Lifecycle stages and controls are documented and aligned with data classification and risk.',
    evidenceRequired: [
      'Sensitive data protection procedure (lifecycle)',
      'Controls by lifecycle stage (e.g., collection, storage, sharing, disposal)',
      'Evidence of implementation (e.g., encryption, access logs)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.12', description: 'Classification of information' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-1', description: 'Data-at-rest protection' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.DS-2', description: 'Data-in-transit protection' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'DSP-18.1',
    domain: 'DSP',
    question:
      'Does the cloud service provider have in place, and describe to customers, the procedure to manage and respond to requests for disclosure of Personal Data by Law Enforcement Authorities according to applicable laws and regulations, including special attention to notifying interested customers unless prohibited (e.g., by law)?',
    keywords: [
      'law enforcement',
      'disclosure',
      'personal data',
      'procedure',
      'customer notification',
      'legal',
      'CSP',
    ],
    baseAnswer:
      'Yes. Where the organization acts as a CSP, a procedure is in place to manage and respond to law enforcement requests for personal data in accordance with applicable law. The procedure includes legal review, validation of requests, and notification to affected customers where not prohibited (e.g., gag order). The approach is described in customer-facing documentation (e.g., transparency report, DPA).',
    evidenceRequired: [
      'Law enforcement request procedure',
      'Customer-facing description (DPA, transparency report, or policy)',
      'Evidence of legal review and notification where permitted',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.35', description: 'Privacy and PII protection' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'CONDITIONAL',
    jurisdictionNotes: {
      EU: 'GDPR and ePrivacy require strict conditions for disclosure to law enforcement; document legal basis and, where possible, commitment to notify data subjects or customers.',
    },
  },
  {
    questionId: 'DSP-19.1',
    domain: 'DSP',
    question:
      'Are processes, procedures and technical measures defined and implemented to specify and document the physical locations of data, including any locations in which data is processed or backed up?',
    keywords: [
      'data location',
      'physical location',
      'processed',
      'backed up',
      'documented',
      'data residency',
    ],
    baseAnswer:
      'Yes. Physical (geographic) locations where data is processed or backed up are specified and documented. Documentation is maintained in data flow or architecture artifacts and in customer-facing materials (e.g., DPA, data residency documentation). Location is considered in contracting, compliance, and data transfer decisions; changes are communicated to customers where contractually required.',
    evidenceRequired: [
      'Data location documentation (by system or data type)',
      'Data flow or architecture showing geography',
      'Customer-facing data residency or location documentation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.12', description: 'Classification of information' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.AM-01', description: 'Physical and software assets' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR and many contracts require disclosure of data location; cross-border transfers must be documented for Chapter V compliance.',
    },
  },
];

// =============================================================================
// GRC — Governance, Risk & Compliance (GRC-01 through GRC-08)
// =============================================================================

export const CAIQ_KB_GRC: CAIQKnowledgeEntry[] = [
  {
    questionId: 'GRC-01.1',
    domain: 'GRC',
    question:
      'Are governance policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained to guide the organization\'s governance program?',
    keywords: [
      'governance',
      'policies',
      'procedures',
      'documented',
      'approved',
      'communicated',
      'evaluated',
      'maintained',
    ],
    baseAnswer:
      'Yes. Governance policies and procedures are established and maintained, defining the governance program scope, roles, and responsibilities. They are approved by executive or board-level oversight, communicated to relevant stakeholders, and applied consistently. Effectiveness is evaluated through management review and internal audit; updates follow document control and annual review requirements.',
    evidenceRequired: [
      'Governance program policy and procedures',
      'Document approval and distribution records',
      'Annual review or management review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.2', description: 'Information security roles and responsibilities' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-02', description: 'Cybersecurity roles and responsibilities' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'GRC-02.1',
    domain: 'GRC',
    question:
      'Is contact established and maintained with cloud-related special interest groups, standards bodies, or industry forums to stay informed of emerging threats and best practices?',
    keywords: [
      'special interest groups',
      'standards bodies',
      'industry forums',
      'emerging threats',
      'best practices',
      'cloud',
    ],
    baseAnswer:
      'Yes. The organization maintains contact with cloud-related special interest groups, standards bodies (e.g., CSA, ISO, NIST), or industry forums. Participation supports awareness of emerging threats, regulatory changes, and best practices; insights are used to inform risk assessment and control updates. Engagement is documented (e.g., memberships, attendance, subscriptions).',
    evidenceRequired: [
      'List of relevant groups or forums (e.g., CSA, ISACA, (ISC)²)',
      'Evidence of participation or membership',
      'How insights are used in risk or policy updates',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'GRC-03.1',
    domain: 'GRC',
    question:
      'Are applicable standards, regulations, and statutory requirements identified and mapped to the organization\'s information security and cloud controls?',
    keywords: [
      'regulatory mapping',
      'standards',
      'regulations',
      'statutory requirements',
      'controls',
      'compliance',
    ],
    baseAnswer:
      'Yes. Applicable standards, regulations, and statutory requirements are identified and mapped to information security and cloud controls. A regulatory mapping or compliance matrix is maintained (e.g., ISO 27001, SOC 2, GDPR, sector regulations); it is updated when laws or scope change and used for gap analysis and audit preparation.',
    evidenceRequired: [
      'Regulatory mapping or compliance matrix',
      'List of applicable frameworks and regulations',
      'Mapping to CCM or internal control set',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.35', description: 'Independent review of information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'GRC-04.1',
    domain: 'GRC',
    question:
      'Is a governance responsibility model defined, documenting roles and responsibilities for governance, risk, and compliance across the organization?',
    keywords: [
      'governance responsibility',
      'roles',
      'responsibilities',
      'risk',
      'compliance',
      'RACI',
    ],
    baseAnswer:
      'Yes. A governance responsibility model is defined, documenting roles and responsibilities for governance, risk, and compliance (e.g., RACI or equivalent). It clarifies accountability for policy ownership, risk acceptance, compliance monitoring, and escalation; is communicated to stakeholders; and is reviewed when organization or scope changes.',
    evidenceRequired: [
      'Governance responsibility model or RACI',
      'Roles for policy, risk, and compliance',
      'Review or update evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.2', description: 'Information security roles and responsibilities' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-02', description: 'Cybersecurity roles and responsibilities' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'GRC-05.1',
    domain: 'GRC',
    question:
      'Is a comprehensive information security program established and maintained, addressing all relevant CCM domains and aligned with business objectives and risk appetite?',
    keywords: [
      'information security program',
      'CCM domains',
      'business objectives',
      'risk appetite',
      'comprehensive',
    ],
    baseAnswer:
      'Yes. A comprehensive information security program is established and maintained, addressing all relevant CCM domains (e.g., IAM, DSP, BCR, TVM). The program is aligned with business objectives and risk appetite; scope and maturity are documented and reviewed. Program governance includes executive sponsorship and periodic reporting to management or the board.',
    evidenceRequired: [
      'Information security program charter or scope',
      'Coverage of CCM or control domains',
      'Program governance and reporting evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.7', description: 'Threat intelligence' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'GRC-06.1',
    domain: 'GRC',
    question:
      'Is an approved policy exception process established for handling deviations from security policies, including risk assessment and time-bound exceptions?',
    keywords: [
      'policy exception',
      'deviation',
      'risk assessment',
      'time-bound',
      'approval',
    ],
    baseAnswer:
      'Yes. An approved policy exception process is established for handling deviations from security policies. Exceptions require documented risk assessment, business justification, compensating controls where applicable, and approval by designated authority (e.g., CISO, risk owner). Exceptions are time-bound and reviewed for extension or closure; tracking is maintained.',
    evidenceRequired: [
      'Policy exception procedure',
      'Exception request and approval template',
      'Exception register or log (sanitized)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors often look for evidence that exceptions are not overused and that compensating controls or remediation plans exist.',
  },
  {
    questionId: 'GRC-07.1',
    domain: 'GRC',
    question:
      'Are organizational security and governance policies reviewed and updated at least annually or when substantial changes occur?',
    keywords: [
      'policy review',
      'annual',
      'substantial changes',
      'governance',
      'security policies',
    ],
    baseAnswer:
      'Yes. Organizational security and governance policies are reviewed at least annually or when substantial changes occur (e.g., regulation, incident, merger). Reviews consider regulatory updates, risk changes, and audit findings; revisions are documented with version control and re-communicated. Significant changes require re-approval and stakeholder acknowledgment where applicable.',
    evidenceRequired: [
      'Policy review schedule or calendar',
      'Revision history or change log',
      'Review sign-off or management approval',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'GRC-08.1',
    domain: 'GRC',
    question:
      'Is a formal risk management program established with policies and procedures for the identification, evaluation, and treatment of cloud and information security risks?',
    keywords: [
      'risk management program',
      'identification',
      'evaluation',
      'treatment',
      'cloud risk',
      'ERM',
    ],
    baseAnswer:
      'Yes. A formal risk management program is established with policies and procedures for identifying, evaluating, and treating cloud and information security risks. The program includes risk criteria, assessment methodology (e.g., likelihood/impact), risk treatment options (mitigate, accept, transfer, avoid), and escalation. Risk register and treatment plans are maintained and reviewed periodically; significant risks are reported to management.',
    evidenceRequired: [
      'Risk management policy and procedure',
      'Risk assessment methodology',
      'Risk register and treatment evidence (sanitized)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.7', description: 'Threat intelligence' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.RM-01', description: 'Cybersecurity risk management' },
      { framework: 'NIST CSF 2.0', controlId: 'ID.RA-01', description: 'Asset vulnerabilities and threats' },
    ],
    expectedAnswerType: 'YES',
  },
];

// =============================================================================
// HRS — Human Resources Security (HRS-01 through HRS-13)
// =============================================================================

export const CAIQ_KB_HRS: CAIQKnowledgeEntry[] = [
  {
    questionId: 'HRS-01.1',
    domain: 'HRS',
    question:
      'Are human resources security policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained for the entire employment lifecycle?',
    keywords: [
      'human resources',
      'security policies',
      'employment lifecycle',
      'documented',
      'approved',
      'communicated',
    ],
    baseAnswer:
      'Yes. Human resources security policies and procedures are established and maintained for the entire employment lifecycle (pre-employment, employment, termination). They cover background checks, security awareness training, access management, and termination procedures; are approved by HR and security leadership; and are communicated and applied consistently. Effectiveness is evaluated through audits and training compliance.',
    evidenceRequired: [
      'HR security policy or employment lifecycle procedure',
      'Policy approval and communication records',
      'Link to background check, training, and termination procedures',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'ISO 27001:2022', controlId: 'A.6.1', description: 'Screening' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-01.2',
    domain: 'HRS',
    question:
      'Are human resources security policies and procedures reviewed and updated at least annually?',
    keywords: [
      'HR security',
      'policy review',
      'annual',
      'updated',
    ],
    baseAnswer:
      'Yes. Human resources security policies and procedures are reviewed at least annually. Reviews consider regulatory changes, incident lessons learned, and role changes; revisions are documented and re-communicated. Significant changes require re-approval and, where applicable, updates to training and onboarding materials.',
    evidenceRequired: [
      'Policy review schedule or revision history',
      'Review sign-off or HR/security approval',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.1', description: 'Policies for information security' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-02.1',
    domain: 'HRS',
    question:
      'Are background verification checks performed for candidates in accordance with applicable laws, regulations, and role sensitivity prior to employment?',
    keywords: [
      'background check',
      'verification',
      'pre-employment',
      'screening',
      'role sensitivity',
      'laws',
    ],
    baseAnswer:
      'Yes. Background verification checks are performed for candidates in accordance with applicable laws and regulations and commensurate with role sensitivity. Checks may include identity, employment history, education, and criminal record where permitted; process is documented and consistently applied. Results are used in hiring decisions and retained per retention policy and legal requirements.',
    evidenceRequired: [
      'Background check policy or procedure',
      'Scope by role or sensitivity (e.g., privileged access roles)',
      'Evidence of compliance with local law (e.g., consent, permissible use)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.1', description: 'Screening' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AT-01', description: 'Identities and credentials' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Auditors expect background checks for roles with access to sensitive systems or data; document scope and legal compliance (e.g., FCRA, GDPR).',
  },
  {
    questionId: 'HRS-03.1',
    domain: 'HRS',
    question:
      'Are employment agreements, contracts, or terms that address confidentiality, acceptable use, and security responsibilities used and acknowledged by personnel?',
    keywords: [
      'employment agreement',
      'confidentiality',
      'acceptable use',
      'security responsibilities',
      'acknowledged',
    ],
    baseAnswer:
      'Yes. Employment agreements, contracts, or terms address confidentiality, acceptable use of assets, and security responsibilities. Personnel acknowledge these at hire and upon material updates; acknowledgments are retained. Terms align with policy and support disciplinary action in case of violation.',
    evidenceRequired: [
      'Employment/contract clauses (confidentiality, acceptable use, security)',
      'Acknowledgment process and records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.2', description: 'Terms and conditions of employment' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-04.1',
    domain: 'HRS',
    question:
      'Is security awareness training provided to personnel upon hire and at least annually thereafter, with content relevant to role and updated for emerging threats?',
    keywords: [
      'security awareness training',
      'upon hire',
      'annually',
      'role-relevant',
      'emerging threats',
    ],
    baseAnswer:
      'Yes. Security awareness training is provided to all personnel upon hire and at least annually thereafter. Content is relevant to role (e.g., general awareness plus role-specific for developers or admins) and is updated for emerging threats and policy changes. Completion is tracked; non-completion is escalated. Phishing simulation or other exercises may be used to reinforce awareness.',
    evidenceRequired: [
      'Security awareness training policy or program description',
      'Training curriculum and schedule',
      'Completion tracking or attestation records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.3', description: 'Information security awareness, education and training' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AT-01', description: 'Identities and credentials' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AT-02', description: 'Training and awareness' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Frequently audited; ensure evidence of both initial and annual training and, where applicable, role-based or phishing training.',
  },
  {
    questionId: 'HRS-05.1',
    domain: 'HRS',
    question:
      'Are personnel with special access privileges or security responsibilities provided additional, role-specific security training?',
    keywords: [
      'privileged access',
      'security responsibilities',
      'role-specific training',
      'additional training',
    ],
    baseAnswer:
      'Yes. Personnel with special access privileges or security responsibilities receive additional, role-specific security training beyond general awareness. Training covers secure administration, least privilege, incident reporting, and applicable policies; is completed before grant of privileged access and refreshed periodically. Completion is documented.',
    evidenceRequired: [
      'Role-specific security training curriculum (e.g., privileged access, secure coding)',
      'Training completion before privilege grant',
      'Refresh schedule and records',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.3', description: 'Information security awareness, education and training' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AT-02', description: 'Training and awareness' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-07', description: 'Identities and credentials for nonhuman users' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-06.1',
    domain: 'HRS',
    question:
      'Are disciplinary process and procedures established and applied for personnel who violate security policies or procedures?',
    keywords: [
      'disciplinary process',
      'violation',
      'security policies',
      'procedures',
      'consequences',
    ],
    baseAnswer:
      'Yes. A disciplinary process and procedures are established and applied for personnel who violate security policies or procedures. Process is documented, communicated (e.g., in policy or handbook), and applied consistently with HR and legal involvement. Severity of violation is considered; outcomes may include warning, training, or termination. Incidents are documented appropriately.',
    evidenceRequired: [
      'Disciplinary procedure for security violations',
      'Communication to staff (e.g., policy reference)',
      'Evidence of consistent application (process description; avoid sharing individual cases)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.4', description: 'Disciplinary process' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-07.1',
    domain: 'HRS',
    question:
      'Are termination or change-of-employment procedures defined and implemented to revoke access and recover assets upon departure or role change?',
    keywords: [
      'termination procedure',
      'change of employment',
      'revoke access',
      'recover assets',
      'offboarding',
    ],
    baseAnswer:
      'Yes. Termination and change-of-employment procedures are defined and implemented to revoke access and recover assets upon departure or role change. Access (logical and physical) is revoked in a timely manner (e.g., same day for terminations); assets are returned or sanitized. Checklist or workflow ensures consistency; HR and IT coordinate. Critical or privileged access is prioritized.',
    evidenceRequired: [
      'Termination/offboarding procedure or checklist',
      'Access revocation and asset recovery steps',
      'Coordination between HR and IT/security',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.5', description: 'Responsibilities after termination or change of employment' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Among the most frequently failed controls; auditors expect same-day or immediate revocation for terminations and evidence of checklist completion.',
  },
  {
    questionId: 'HRS-08.1',
    domain: 'HRS',
    question:
      'Are confidentiality and non-disclosure obligations maintained after termination or change of employment?',
    keywords: [
      'confidentiality',
      'non-disclosure',
      'after termination',
      'obligations',
      'employment change',
    ],
    baseAnswer:
      'Yes. Confidentiality and non-disclosure obligations are maintained after termination or change of employment. Employment agreements or NDAs specify ongoing obligations; personnel are reminded at exit. Legal remedies for breach are available; post-employment obligations are documented in policy and contracts.',
    evidenceRequired: [
      'Contractual confidentiality/NDA provisions',
      'Exit process reminder or acknowledgment',
      'Policy reference to post-employment obligations',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.5', description: 'Responsibilities after termination or change of employment' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-09.1',
    domain: 'HRS',
    question:
      'Are transfer and promotion processes defined to review and adjust access rights and responsibilities when personnel change roles?',
    keywords: [
      'transfer',
      'promotion',
      'access rights',
      'role change',
      'review',
      'adjust',
    ],
    baseAnswer:
      'Yes. Transfer and promotion processes include review and adjustment of access rights and responsibilities when personnel change roles. Access is recertified or updated to match new role (least privilege); unnecessary access is removed. Process is coordinated between HR and access management; changes are documented.',
    evidenceRequired: [
      'Transfer/promotion procedure including access review',
      'Coordination with access management or IAM',
      'Evidence of access review on role change',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.5', description: 'Responsibilities after termination or change of employment' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.3', description: 'Information access restriction' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-10.1',
    domain: 'HRS',
    question:
      'Are personnel required to acknowledge and comply with security policies and procedures, with acknowledgment records retained?',
    keywords: [
      'acknowledgment',
      'security policies',
      'comply',
      'records retained',
      'personnel',
    ],
    baseAnswer:
      'Yes. Personnel are required to acknowledge and comply with security policies and procedures. Acknowledgment is obtained at hire and upon material policy updates; records are retained per retention policy. Non-compliance is addressed through disciplinary process; compliance is reinforced through training and awareness.',
    evidenceRequired: [
      'Policy acknowledgment process',
      'Acknowledgment records or attestation',
      'Retention of acknowledgments',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.2', description: 'Terms and conditions of employment' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', description: 'Organizational cybersecurity policy' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-11.1',
    domain: 'HRS',
    question:
      'Is management commitment to security awareness and training demonstrated through resource allocation and oversight?',
    keywords: [
      'management commitment',
      'security awareness',
      'training',
      'resource allocation',
      'oversight',
    ],
    baseAnswer:
      'Yes. Management demonstrates commitment to security awareness and training through resource allocation (budget, tools, dedicated program owner) and oversight. Training metrics are reviewed by management; program improvements are supported. Commitment is evident in policy, program charter, or management review minutes.',
    evidenceRequired: [
      'Training program ownership and resources',
      'Management review of training metrics or program',
      'Policy or charter stating management support',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.3', description: 'Information security awareness, education and training' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-02', description: 'Cybersecurity roles and responsibilities' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AT-02', description: 'Training and awareness' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-12.1',
    domain: 'HRS',
    question:
      'Are contractors and third-party personnel subject to the same or equivalent security screening, training, and termination procedures as employees?',
    keywords: [
      'contractors',
      'third-party personnel',
      'screening',
      'training',
      'termination',
      'equivalent',
    ],
    baseAnswer:
      'Yes. Contractors and third-party personnel with access to systems or sensitive information are subject to the same or equivalent security screening, training, and termination procedures as employees. Requirements are specified in contracts; compliance is verified. Access is revoked upon contract end or earlier if required.',
    evidenceRequired: [
      'Policy for contractor/third-party security requirements',
      'Contract clauses (screening, training, termination)',
      'Evidence of application (e.g., contractor training tracking)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.6.1', description: 'Screening' },
      { framework: 'ISO 27001:2022', controlId: 'A.6.5', description: 'Responsibilities after termination or change of employment' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.SC-01', description: 'Cybersecurity supply chain risk management' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'HRS-13.1',
    domain: 'HRS',
    question:
      'Are security roles and responsibilities for personnel defined and communicated, including reporting of security incidents and concerns?',
    keywords: [
      'security roles',
      'responsibilities',
      'incident reporting',
      'concerns',
      'communicated',
    ],
    baseAnswer:
      'Yes. Security roles and responsibilities for personnel are defined and communicated, including the obligation to report security incidents and concerns. Reporting channels (e.g., security team, hotline, manager) are clear; non-retaliation is stated. Roles may be documented in job descriptions, policy, or training; compliance is reinforced in awareness program.',
    evidenceRequired: [
      'Security roles and responsibilities (policy or job descriptions)',
      'Incident and concern reporting procedure',
      'Communication of reporting channels and non-retaliation',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.2', description: 'Information security roles and responsibilities' },
      { framework: 'ISO 27001:2022', controlId: 'A.6.3', description: 'Information security awareness, education and training' },
      { framework: 'NIST CSF 2.0', controlId: 'GV.OC-02', description: 'Cybersecurity roles and responsibilities' },
      { framework: 'NIST CSF 2.0', controlId: 'RS.CO-01', description: 'Incident response coordination' },
    ],
    expectedAnswerType: 'YES',
  },
];

// =============================================================================
// IAM — Identity & Access Management (IAM-01 through IAM-16)
// ISO 27001:2022 A.5.15–A.5.18, A.8.2–A.8.5; NIST CSF 2.0 PR.AA; GDPR Art 32 where applicable.
// =============================================================================

export const CAIQ_KB_IAM: CAIQKnowledgeEntry[] = [
  {
    questionId: 'IAM-01.1',
    domain: 'IAM',
    question:
      'Are identity and access management policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    keywords: [
      'identity',
      'access management',
      'policies',
      'procedures',
      'documented',
      'approved',
      'maintained',
    ],
    baseAnswer:
      'Yes. Identity and access management (IAM) policies and procedures are established and maintained, covering identity lifecycle, authentication, authorization, privileged access, and access review. They are approved by security and IT leadership, communicated to relevant personnel, and evaluated through audits and access certifications. Updates reflect regulatory and risk changes.',
    evidenceRequired: [
      'IAM policy and procedures',
      'Policy approval and communication records',
      'Annual or periodic review evidence',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.15', description: 'Access control' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.18', description: 'Access rights' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-02', description: 'Physical and remote access' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-02.1',
    domain: 'IAM',
    question:
      'Is access to data and system functions restricted to authorized users and processes, and is authorization verified before granting access?',
    keywords: [
      'authorization',
      'access restriction',
      'authorized users',
      'verified',
      'least privilege',
    ],
    baseAnswer:
      'Yes. Access to data and system functions is restricted to authorized users and processes; authorization is verified before granting access. Role-based or attribute-based access control is implemented; access is granted per job need (least privilege) and reviewed periodically. Unauthorized access attempts are logged and monitored.',
    evidenceRequired: [
      'Access control and authorization procedure',
      'RBAC/ABAC or equivalent design',
      'Evidence of access review or certification',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.15', description: 'Access control' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.3', description: 'Information access restriction' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-03', description: 'Access is managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-03.1',
    domain: 'IAM',
    question:
      'Are passwords and other authentication secrets managed securely, including composition rules, storage, and protection against disclosure?',
    keywords: [
      'password management',
      'authentication secrets',
      'composition',
      'storage',
      'protection',
      'disclosure',
    ],
    baseAnswer:
      'Yes. Passwords and other authentication secrets are managed securely. Password policy defines composition rules (length, complexity, expiry where appropriate) and secure storage (e.g., hashing with strong algorithms); secrets are protected from disclosure and not stored in plain text. Default passwords are changed; password reuse and sharing are prohibited. Secrets management for systems uses dedicated vaults or equivalent.',
    evidenceRequired: [
      'Password policy and secrets management procedure',
      'Technical controls (hashing, vault)',
      'No plain-text storage; default password change',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.16', description: 'Identity management' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.5', description: 'Secure authentication' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Common audit finding: weak or missing password policy, or plain-text credentials; align with NIST/ISO guidance on composition and storage.',
  },
  {
    questionId: 'IAM-04.1',
    domain: 'IAM',
    question:
      'Is multifactor authentication (MFA) implemented for privileged users and for access to sensitive data or systems?',
    keywords: [
      'multifactor authentication',
      'MFA',
      'privileged users',
      'sensitive data',
      'strong authentication',
    ],
    baseAnswer:
      'Yes. Multifactor authentication (MFA) is implemented for privileged users and for access to sensitive data or systems. MFA uses at least two factors (e.g., something you know, something you have, something you are); phishing-resistant methods are preferred where feasible. Scope (which systems and roles) is documented; exceptions are limited and risk-accepted.',
    evidenceRequired: [
      'MFA policy (scope: privileged, sensitive systems)',
      'Technical implementation (e.g., IdP MFA, conditional access)',
      'Exception process and risk acceptance if any',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.17', description: 'Authentication information' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.5', description: 'Secure authentication' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-02', description: 'Physical and remote access' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-04', description: 'Network integrity' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Among the most frequently failed controls in cloud audits; ensure MFA is enforced for all privileged and sensitive access, not optional.',
  },
  {
    questionId: 'IAM-05.1',
    domain: 'IAM',
    question:
      'Are users uniquely identifiable through unique user IDs or equivalent, and is shared or generic account use restricted?',
    keywords: [
      'unique user ID',
      'uniquely identifiable',
      'shared account',
      'generic account',
      'restricted',
    ],
    baseAnswer:
      'Yes. Users are uniquely identifiable through unique user IDs (or equivalent); shared or generic account use is restricted and only used where justified (e.g., break-glass, shared service accounts) with compensating controls and logging. Individual accountability is maintained for audit and incident response; generic accounts are managed and reviewed.',
    evidenceRequired: [
      'Policy on unique user IDs and restriction of shared/generic accounts',
      'List or scope of permitted shared accounts and justification',
      'Logging and accountability for shared account use',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.16', description: 'Identity management' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.2', description: 'Privileged access rights' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-06.1',
    domain: 'IAM',
    question:
      'Are privileged access roles and rights defined, assigned only when justified, and managed through a formal process including review and revocation?',
    keywords: [
      'privileged access',
      'roles',
      'defined',
      'justified',
      'review',
      'revocation',
    ],
    baseAnswer:
      'Yes. Privileged access roles and rights are defined, assigned only when justified by job role, and managed through a formal process. Assignment requires approval; access is time-bound or reviewed periodically; revocation is performed upon role change or termination. Privileged sessions are logged and monitored; use of dedicated privileged access workstations or jump hosts is encouraged where appropriate.',
    evidenceRequired: [
      'Privileged access management (PAM) policy and procedure',
      'Approval and review process for privileged roles',
      'Logging and monitoring of privileged activity',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.2', description: 'Privileged access rights' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.3', description: 'Information access restriction' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-03', description: 'Access is managed' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-05', description: 'Network integrity' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Frequently failed in audits; document approval workflow, time-bound access, and session monitoring for privileged users.',
  },
  {
    questionId: 'IAM-07.1',
    domain: 'IAM',
    question:
      'Is customer participation or approval required for the assignment of high-risk or privileged access roles that affect the customer\'s environment or data?',
    keywords: [
      'customer approval',
      'privileged access',
      'high-risk roles',
      'customer environment',
      'CSC approval',
    ],
    baseAnswer:
      'Yes. Where the organization acts as a cloud service provider, customer participation or approval is required for the assignment of high-risk or privileged access roles that affect the customer\'s environment or data. Process is documented; customers are informed of such roles and can approve or object per contract. Assignments are logged and auditable.',
    evidenceRequired: [
      'Procedure for customer approval of high-risk/privileged roles',
      'Contractual or SLA commitment to customer participation',
      'Evidence of customer notification or approval flow (process description)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.2', description: 'Privileged access rights' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-03', description: 'Access is managed' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'CCM control for CSPs; if not a CSP, answer may be N/A with explanation of scope.',
  },
  {
    questionId: 'IAM-08.1',
    domain: 'IAM',
    question:
      'Are identity lifecycle processes (provisioning, modification, de-provisioning) defined and implemented to grant, change, and revoke access in a timely manner?',
    keywords: [
      'identity lifecycle',
      'provisioning',
      'de-provisioning',
      'modification',
      'timely',
      'revoke',
    ],
    baseAnswer:
      'Yes. Identity lifecycle processes are defined and implemented for provisioning, modification, and de-provisioning. Access is granted based on approved request and role; modified when role or need changes; and revoked in a timely manner upon termination or role change (e.g., same day for terminations). Process is documented and integrated with HR where applicable; automation supports consistency.',
    evidenceRequired: [
      'Identity lifecycle procedure (provision, modify, de-provision)',
      'Integration with HR or request workflow',
      'Evidence of timely revocation (e.g., SLA, checklist)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.16', description: 'Identity management' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.18', description: 'Access rights' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Identity lifecycle is a common audit focus; document joiners-movers-leavers and same-day revocation for terminations.',
  },
  {
    questionId: 'IAM-09.1',
    domain: 'IAM',
    question:
      'Are access rights reviewed and recertified periodically (e.g., at least annually) to ensure they remain appropriate?',
    keywords: [
      'access review',
      'recertification',
      'periodically',
      'annually',
      'appropriate',
      'access certification',
    ],
    baseAnswer:
      'Yes. Access rights are reviewed and recertified periodically (at least annually) to ensure they remain appropriate. Data owners or managers certify access; exceptions and revocations are tracked and completed. Review scope includes privileged and sensitive data access; results are reported and remediation is monitored.',
    evidenceRequired: [
      'Access recertification policy and schedule',
      'Evidence of completed access reviews (e.g., campaign summary)',
      'Remediation tracking for revocations',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.18', description: 'Access rights' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.3', description: 'Information access restriction' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-03', description: 'Access is managed' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-10.1',
    domain: 'IAM',
    question:
      'Is segregation of duties applied so that no single individual can control a critical process from end to end without detection or override?',
    keywords: [
      'segregation of duties',
      'SoD',
      'critical process',
      'detection',
      'override',
      'conflict of interest',
    ],
    baseAnswer:
      'Yes. Segregation of duties (SoD) is applied so that no single individual can control a critical process from end to end without detection or override. Conflicting roles are defined and enforced in IAM where feasible; exceptions are documented and risk-accepted. SoD is considered in role design and access certification.',
    evidenceRequired: [
      'SoD policy and conflicting role definitions',
      'Technical or process controls enforcing SoD',
      'Exception and risk acceptance process',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.15', description: 'Access control' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.3', description: 'Information access restriction' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-03', description: 'Access is managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-11.1',
    domain: 'IAM',
    question:
      'Are technical and organizational measures implemented to ensure the security of processing, including the ability to ensure confidentiality, integrity, and availability of personal data (e.g., access control)?',
    keywords: [
      'technical measures',
      'organizational measures',
      'personal data',
      'confidentiality',
      'integrity',
      'availability',
      'access control',
    ],
    baseAnswer:
      'Yes. Technical and organizational measures are implemented to ensure the security of processing, including access control, to ensure confidentiality, integrity, and availability of personal data. IAM controls (authentication, authorization, MFA, access review) support this; measures are documented and aligned with risk and regulatory requirements.',
    evidenceRequired: [
      'Security measures documentation (including IAM)',
      'Mapping to confidentiality, integrity, availability',
      'Evidence of implementation (e.g., access controls, encryption)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.3', description: 'Information access restriction' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'GDPR', controlId: 'Art. 32', description: 'Security of processing' },
    ],
    expectedAnswerType: 'YES',
    jurisdictionNotes: {
      EU: 'GDPR Article 32 requires appropriate technical and organizational measures; access control and IAM are central to demonstrating compliance.',
    },
  },
  {
    questionId: 'IAM-12.1',
    domain: 'IAM',
    question:
      'Are federation or single sign-on (SSO) capabilities used where appropriate, with secure token handling and trust boundaries defined?',
    keywords: [
      'federation',
      'SSO',
      'single sign-on',
      'token',
      'trust boundaries',
      'identity provider',
    ],
    baseAnswer:
      'Yes. Federation or single sign-on (SSO) is used where appropriate, with secure token handling (e.g., SAML, OIDC) and clearly defined trust boundaries. Identity provider and service provider relationships are documented; token lifetime and signing are configured securely. SSO is preferred over local credentials where it improves security and usability.',
    evidenceRequired: [
      'Federation/SSO architecture or procedure',
      'Trust boundaries and IdP/SP configuration',
      'Secure token handling (protocol, signing, lifetime)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.17', description: 'Authentication information' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.5', description: 'Secure authentication' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-02', description: 'Physical and remote access' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-13.1',
    domain: 'IAM',
    question:
      'Are system and application identities (e.g., service accounts, API credentials) managed with equivalent security to human identities, including strong authentication and lifecycle management?',
    keywords: [
      'system identity',
      'service account',
      'API credentials',
      'non-human',
      'strong authentication',
      'lifecycle',
    ],
    baseAnswer:
      'Yes. System and application identities (service accounts, API credentials, machine identities) are managed with equivalent security to human identities. Strong authentication (e.g., certificates, secrets vault) and lifecycle management (provisioning, rotation, revocation) are applied; use is scoped and monitored. Default and shared credentials are avoided or tightly controlled.',
    evidenceRequired: [
      'Policy for non-human identity management',
      'Secrets vault or certificate management',
      'Lifecycle (rotation, revocation) and scoping',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.16', description: 'Identity management' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.5', description: 'Secure authentication' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-07', description: 'Identities and credentials for nonhuman users' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-14.1',
    domain: 'IAM',
    question:
      'Is the integrity of access control and authentication logs safeguarded (e.g., read-only logging, segregation of duties, break-glass procedures)?',
    keywords: [
      'log integrity',
      'access control logs',
      'authentication logs',
      'read-only',
      'segregation',
      'break-glass',
    ],
    baseAnswer:
      'Yes. The integrity of access control and authentication logs is safeguarded. Logging infrastructure is configured to protect logs from unauthorized modification (e.g., write-once, read-only access, centralized logging); segregation of duties limits who can alter logging. Break-glass or emergency access procedures are documented and logged; log tampering is monitored and investigated.',
    evidenceRequired: [
      'Log protection and integrity procedure',
      'Technical controls (e.g., SIEM, write-once storage)',
      'Break-glass procedure and monitoring',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.15', description: 'Logging' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.16', description: 'Monitoring activities' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'DE.CM-01', description: 'Network and system monitoring' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-15.1',
    domain: 'IAM',
    question:
      'Are IAM policies and procedures reviewed and updated at least annually?',
    keywords: [
      'IAM',
      'policy review',
      'annual',
      'updated',
      'procedures',
    ],
    baseAnswer:
      'Yes. IAM policies and procedures are reviewed at least annually. Reviews consider regulatory changes (e.g., GDPR, sector rules), incident lessons learned, and technology changes; revisions are documented and re-communicated. Significant changes require re-approval and, where applicable, updates to training and technical configuration.',
    evidenceRequired: [
      'IAM policy review schedule or revision history',
      'Review sign-off or approval',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.5.15', description: 'Access control' },
      { framework: 'ISO 27001:2022', controlId: 'A.5.18', description: 'Access rights' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-06', description: 'Identities and credentials are issued and managed' },
    ],
    expectedAnswerType: 'YES',
  },
  {
    questionId: 'IAM-16.1',
    domain: 'IAM',
    question:
      'Are default credentials and unnecessary default accounts disabled or changed upon deployment of systems and applications?',
    keywords: [
      'default credentials',
      'default accounts',
      'disabled',
      'changed',
      'deployment',
      'hardening',
    ],
    baseAnswer:
      'Yes. Default credentials and unnecessary default accounts are disabled or changed upon deployment of systems and applications. Hardening standards or checklists require removal or change of default passwords and disabling of unused default accounts; compliance is verified in build or deployment process. Cloud and vendor default accounts are included in scope.',
    evidenceRequired: [
      'Hardening standard or baseline (default credentials/accounts)',
      'Deployment or build process incorporating default removal',
      'Verification (e.g., scanning, checklist)',
    ],
    frameworkMappings: [
      { framework: 'ISO 27001:2022', controlId: 'A.8.5', description: 'Secure authentication' },
      { framework: 'ISO 27001:2022', controlId: 'A.8.9', description: 'Configuration management' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', description: 'Identities and credentials for authorized users' },
      { framework: 'NIST CSF 2.0', controlId: 'PR.IP-01', description: 'Baseline configuration' },
    ],
    expectedAnswerType: 'YES',
    reviewerNotes:
      'Common finding in cloud audits; ensure cloud platform and application defaults are in scope, not only on-premises.',
  },
];

// =============================================================================
// Combined knowledge base and accessor
// =============================================================================

/** All knowledge base entries from AIS, AAC, BCR, CCC, CEK, DSP, GRC, HRS, and IAM domains. */
const ALL_KB_ENTRIES: CAIQKnowledgeEntry[] = [
  ...CAIQ_KB_AIS,
  ...CAIQ_KB_AAC,
  ...CAIQ_KB_BCR,
  ...CAIQ_KB_CCC,
  ...CAIQ_KB_CEK,
  ...CAIQ_KB_DSP,
  ...CAIQ_KB_GRC,
  ...CAIQ_KB_HRS,
  ...CAIQ_KB_IAM,
];

/**
 * Returns the full CAIQ knowledge base (all domains) for matching and answer generation.
 * Use this as the single source for KB-driven CAIQ assessment accuracy.
 */
export function getKnowledgeBase(): CAIQKnowledgeEntry[] {
  return ALL_KB_ENTRIES;
}

/**
 * Returns knowledge base entries for a specific domain.
 */
export function getKnowledgeBaseByDomain(domain: CAIQDomain): CAIQKnowledgeEntry[] {
  return ALL_KB_ENTRIES.filter((e) => e.domain === domain);
}

// =============================================================================
// Legacy compatibility (for caiq-answer-engine and vendors UI)
// =============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';

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
  source: 'knowledge-base' | 'ai' | 'manual';
  evidenceRef: string;
}

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  AIS: 'Application & Interface Security',
  AAC: 'Audit Assurance & Compliance',
  BCR: 'Business Continuity & Resilience',
  CCC: 'Change Control & Configuration Management',
  CEK: 'Cryptography, Encryption & Key Management',
  DSP: 'Data Security & Privacy Lifecycle Management',
};

function expectedAnswerTypeToYesNo(
  t: 'YES' | 'NO' | 'NOT_APPLICABLE' | 'CONDITIONAL'
): 'Yes' | 'No' | 'N/A' {
  if (t === 'YES') return 'Yes';
  if (t === 'NO') return 'No';
  if (t === 'NOT_APPLICABLE') return 'N/A';
  return 'Yes'; // CONDITIONAL -> Yes with explanation
}

/** Legacy CAIQEntry shape for answer engine matching. Derived from CAIQKnowledgeEntry. */
export interface CAIQEntry {
  id: string;
  domain: CAIQDomain;
  domainName: string;
  question: string;
  keywords: string[];
  answer: string;
  yesNo: 'Yes' | 'No' | 'N/A';
  confidence: ConfidenceLevel;
  evidenceRef: string;
}

/** Legacy knowledge base array: same content as getKnowledgeBase() in CAIQEntry form. */
export const CAIQ_KNOWLEDGE_BASE: CAIQEntry[] = ALL_KB_ENTRIES.map((e) => ({
  id: e.questionId,
  domain: e.domain,
  domainName: DOMAIN_DISPLAY_NAMES[e.domain] ?? e.domain,
  question: e.question,
  keywords: e.keywords,
  answer: e.baseAnswer,
  yesNo: expectedAnswerTypeToYesNo(e.expectedAnswerType),
  confidence: 'high' as ConfidenceLevel,
  evidenceRef: e.evidenceRequired?.length ? e.evidenceRequired.join('; ') : '',
}));

/** Domain metadata for UI (name, color, icon). Includes all CAIQ_DOMAINS from types. */
export const CAIQ_DOMAINS: Record<
  string,
  { name: string; color: string; icon: string }
> = {
  AIS: { name: 'Application & Interface Security', color: '#8b5cf6', icon: '🛡️' },
  AAC: { name: 'Audit Assurance & Compliance', color: '#3b82f6', icon: '🔍' },
  BCR: { name: 'Business Continuity & Resilience', color: '#f59e0b', icon: '🔄' },
  CCC: { name: 'Change Control & Configuration', color: '#10b981', icon: '⚙️' },
  CEK: { name: 'Cryptography, Encryption & Key Mgmt', color: '#ef4444', icon: '🔐' },
  DSP: { name: 'Data Security & Privacy', color: '#ec4899', icon: '📊' },
  GRC: { name: 'Governance, Risk & Compliance', color: '#6366f1', icon: '📋' },
  HRS: { name: 'Human Resources Security', color: '#14b8a6', icon: '👤' },
  IAM: { name: 'Identity & Access Management', color: '#f97316', icon: '🔑' },
  IPY: { name: 'Interoperability & Portability', color: '#06b6d4', icon: '🔗' },
  IVS: { name: 'Infrastructure & Virtualization', color: '#06b6d4', icon: '🏗️' },
  LOG: { name: 'Logging and Monitoring', color: '#a855f7', icon: '📡' },
  SEF: { name: 'Security Event Management & Forensics', color: '#a855f7', icon: '📡' },
  STA: { name: 'Supply Chain & Transparency', color: '#84cc16', icon: '📦' },
  TVM: { name: 'Threat & Vulnerability Management', color: '#e11d48', icon: '🎯' },
  UEM: { name: 'Universal Endpoint Management', color: '#0ea5e9', icon: '💻' },
};
