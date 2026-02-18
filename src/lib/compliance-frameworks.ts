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
                id: 'ART-5.1.b',
                name: 'Purpose Limitation',
                description: 'Personal data must be collected for specified, explicit and legitimate purposes.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Processing Activity Register', 'Purpose Documentation']
            },
            {
                id: 'ART-5.1.c',
                name: 'Data Minimization',
                description: 'Personal data must be adequate, relevant and limited to what is necessary.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Data Flow Diagrams', 'Retention Schedule', 'Collection Forms Review']
            },
            {
                id: 'ART-5.1.f',
                name: 'Integrity and Confidentiality',
                description: 'Personal data must be processed in a manner ensuring appropriate security.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Security Measures Documentation', 'Encryption Policy', 'Access Controls']
            },
            {
                id: 'ART-13',
                name: 'Information to Data Subject',
                description: 'Provide transparent information about data processing at the point of collection.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Privacy Notices', 'Cookie Consent Mechanisms', 'Layered Notices']
            },
            {
                id: 'ART-25',
                name: 'Data Protection by Design and Default',
                description: 'Implement appropriate technical and organisational measures for data protection principles.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Privacy Engineering Documentation', 'Default Settings Review', 'Design Reviews']
            },
            {
                id: 'ART-28',
                name: 'Processor Obligations',
                description: 'Processing by a processor shall be governed by a contract with the controller.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Data Processing Agreements', 'Sub-Processor Registry', 'Processor Audit Reports']
            },
            {
                id: 'ART-30',
                name: 'Records of Processing Activities',
                description: 'Maintain a record of processing activities under its responsibility.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['ROPA Register', 'Processing Activity Inventory']
            },
            {
                id: 'ART-32',
                name: 'Security of Processing',
                description: 'Implement appropriate technical and organizational measures (TOMs) to ensure security.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Encryption Policy', 'Access Control Logs', 'Penetration Test Reports']
            },
            {
                id: 'ART-33',
                name: 'Data Breach Notification to Authority',
                description: 'Notify the supervisory authority of a personal data breach within 72 hours.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Breach Response Procedure', 'Breach Register', 'Notification Templates']
            },
            {
                id: 'ART-35',
                name: 'Data Protection Impact Assessment (DPIA)',
                description: 'Carry out assessment of impact whenever processing is likely to result in high risk.',
                riskLevel: 'HIGH',
                evidenceRequired: ['DPIA Registry', 'Signed DPIA Documents']
            },
            {
                id: 'ART-37',
                name: 'Data Protection Officer',
                description: 'Designate a DPO where required by processing activities.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['DPO Appointment Letter', 'DPO Contact Published', 'DPO Independence Documentation']
            }
        ]
    },
    EU_AI_ACT: {
        id: 'EU_AI_ACT',
        name: 'EU AI Act (Regulation)',
        type: 'REGULATION',
        controls: [
            {
                id: 'AI-ART-6',
                name: 'Classification of High-Risk AI',
                description: 'Classify AI systems according to risk categories and apply corresponding obligations.',
                riskLevel: 'HIGH',
                evidenceRequired: ['AI System Inventory', 'Risk Classification Register', 'Self-Assessment Reports']
            },
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
                id: 'AI-ART-11',
                name: 'Technical Documentation',
                description: 'Technical documentation shall be drawn up before a high-risk AI system is placed on the market.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Model Cards', 'System Architecture Docs', 'Training Methodology Documentation']
            },
            {
                id: 'AI-ART-13',
                name: 'Transparency and Information',
                description: 'High-risk AI systems shall be designed to ensure sufficient transparency for deployers.',
                riskLevel: 'HIGH',
                evidenceRequired: ['User Instructions', 'Capability & Limitation Disclosures', 'AI System Information Sheets']
            },
            {
                id: 'AI-ART-14',
                name: 'Human Oversight',
                description: 'High-risk AI systems shall be designed and developed in such a way that they can be effectively overseen by natural persons.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Oversight Procedures', 'User Interface Design Docs', 'Human-in-the-Loop Architecture']
            },
            {
                id: 'AI-ART-15',
                name: 'Accuracy, Robustness and Cybersecurity',
                description: 'High-risk AI systems shall be designed to achieve an appropriate level of accuracy, robustness, and cybersecurity.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Performance Benchmarks', 'Adversarial Testing Reports', 'Cybersecurity Assessment']
            },
            {
                id: 'AI-ART-52',
                name: 'Transparency for General-Purpose AI',
                description: 'Providers of AI systems that interact with persons shall ensure users are informed they are interacting with AI.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['AI Disclosure Mechanisms', 'User Notification Designs', 'Deepfake Labeling Procedures']
            }
        ]
    },
    NIST_CSF_2_0: {
        id: 'NIST_CSF_2_0',
        name: 'NIST Cybersecurity Framework 2.0',
        type: 'STANDARD',
        controls: [
            // GOVERN (GV)
            {
                id: 'GV.OC-01',
                name: 'Organizational Context',
                description: 'The organizational mission, objectives, stakeholders, and legal requirements are understood and prioritized.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Strategic Plan', 'Stakeholder Register']
            },
            {
                id: 'GV.RM-01',
                name: 'Risk Management Strategy',
                description: 'Risk management objectives are established and agreed upon by organizational stakeholders.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Risk Management Policy', 'Risk Appetite Statement', 'Board Approval Minutes']
            },
            {
                id: 'GV.RR-01',
                name: 'Roles, Responsibilities, Authorities',
                description: 'Organizational leadership is responsible and accountable for cybersecurity risk.',
                riskLevel: 'HIGH',
                evidenceRequired: ['RACI Matrix', 'CISO Charter', 'Cybersecurity Organization Chart']
            },
            {
                id: 'GV.SC-01',
                name: 'Supply Chain Risk Management',
                description: 'A cyber supply chain risk management program is established, governed, and assessed.',
                riskLevel: 'HIGH',
                evidenceRequired: ['SCRM Policy', 'Vendor Risk Assessment Process', 'Supply Chain Inventory']
            },
            // IDENTIFY (ID)
            {
                id: 'ID.AM-01',
                name: 'Asset Management - Inventories',
                description: 'Inventories of hardware, software, services, and data are maintained.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Asset Inventory', 'CMDB Export', 'Data Classification Registry']
            },
            {
                id: 'ID.AM-02',
                name: 'Asset Management - Software',
                description: 'Software platforms and applications are inventoried and managed.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Software Inventory', 'License Management Records', 'Shadow IT Assessment']
            },
            {
                id: 'ID.RA-01',
                name: 'Risk Assessment - Vulnerabilities',
                description: 'Vulnerabilities in assets are identified, validated, and recorded.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Vulnerability Scan Reports', 'Penetration Test Results', 'Bug Bounty Findings']
            },
            {
                id: 'ID.RA-02',
                name: 'Risk Assessment - Threat Intelligence',
                description: 'Cyber threat intelligence is received from information sharing forums and sources.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Threat Intel Feeds Configuration', 'ISAC Membership', 'Threat Briefing Reports']
            },
            {
                id: 'ID.IM-01',
                name: 'Improvement - Lessons Learned',
                description: 'Improvements are identified from evaluations, exercises, and incidents.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Post-Incident Reviews', 'Lessons Learned Reports', 'Corrective Action Plans']
            },
            // PROTECT (PR)
            {
                id: 'PR.AA-01',
                name: 'Identity Management',
                description: 'Identities and credentials are managed, authenticated, and controlled.',
                riskLevel: 'HIGH',
                evidenceRequired: ['IAM Policy', 'Access Reviews']
            },
            {
                id: 'PR.AA-02',
                name: 'Access Control Enforcement',
                description: 'Access permissions and authorizations are managed, incorporating least privilege and separation of duties.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['RBAC Configuration', 'Privileged Access Management Logs', 'Access Certification Reports']
            },
            {
                id: 'PR.AT-01',
                name: 'Awareness and Training',
                description: 'Personnel are provided cybersecurity awareness and trained to perform their duties.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Training Completion Records', 'Phishing Simulation Results', 'Training Curriculum']
            },
            {
                id: 'PR.DS-01',
                name: 'Data Security - At Rest',
                description: 'Data-at-rest is protected with appropriate safeguards.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Encryption Standards', 'Key Management Procedures', 'Storage Security Configuration']
            },
            {
                id: 'PR.DS-02',
                name: 'Data Security - In Transit',
                description: 'Data-in-transit is protected with appropriate safeguards.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['TLS Configuration', 'Certificate Management', 'Network Encryption Standards']
            },
            {
                id: 'PR.PS-01',
                name: 'Platform Security',
                description: 'The hardware, software, and services of physical and virtual platforms are managed consistent with risk.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Hardening Standards', 'Patch Management Records', 'Baseline Configurations']
            },
            {
                id: 'PR.IR-01',
                name: 'Technology Infrastructure Resilience',
                description: 'Security architectures are managed with the organization\'s risk strategy to protect confidentiality, integrity, and availability.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Architecture Diagrams', 'Redundancy Plans', 'Failover Test Results']
            },
            // DETECT (DE)
            {
                id: 'DE.CM-01',
                name: 'Continuous Monitoring - Networks',
                description: 'Networks and network services are monitored to find potentially adverse events.',
                riskLevel: 'HIGH',
                evidenceRequired: ['SIEM Configuration', 'Network Monitoring Dashboards', 'Alert Rules Documentation']
            },
            {
                id: 'DE.CM-06',
                name: 'Continuous Monitoring - External',
                description: 'External service provider activities and services are monitored for cybersecurity events.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Third-Party Monitoring Tools', 'SLA Compliance Reports', 'External Threat Feeds']
            },
            {
                id: 'DE.AE-02',
                name: 'Adverse Event Analysis',
                description: 'Potentially adverse events are analyzed to better understand associated activities.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Incident Analysis Reports', 'Correlation Rules', 'Forensic Analysis Procedures']
            },
            // RESPOND (RS)
            {
                id: 'RS.MA-01',
                name: 'Incident Management',
                description: 'Incidents are managed according to defined processes.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Incident Response Plan', 'Incident Tickets/Logs', 'Escalation Procedures']
            },
            {
                id: 'RS.AN-03',
                name: 'Incident Reporting',
                description: 'Incidents are categorized and reported to adequate internal and external stakeholders.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Incident Classification Criteria', 'Notification Procedures', 'Regulatory Reporting Templates']
            },
            {
                id: 'RS.MI-01',
                name: 'Incident Mitigation',
                description: 'Incidents are contained and mitigated to limit impact.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Containment Procedures', 'Eradication Playbooks', 'Impact Assessment Forms']
            },
            // RECOVER (RC)
            {
                id: 'RC.RP-01',
                name: 'Recovery Execution',
                description: 'The recovery portion of the incident response plan is executed once initiated.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Recovery Playbooks', 'Backup Restoration Logs', 'BCP/DR Test Results']
            },
            {
                id: 'RC.CO-01',
                name: 'Recovery Communication',
                description: 'Restoration activities and progress are communicated to designated internal and external stakeholders.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Stakeholder Communication Plans', 'Status Update Templates', 'Post-Recovery Reports']
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
                id: 'A.5.2',
                name: 'Information Security Roles & Responsibilities',
                description: 'Information security roles and responsibilities shall be defined and allocated.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['RACI Matrix', 'Job Descriptions', 'Organizational Chart']
            },
            {
                id: 'A.5.23',
                name: 'Information Security for Cloud Services',
                description: 'Processes for acquisition, use, management and exit from cloud services shall be established.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Cloud Security Policy', 'CSP Assessment Reports', 'Shared Responsibility Matrix']
            },
            {
                id: 'A.5.29',
                name: 'Information Security During Disruption',
                description: 'Plans to maintain information security at an appropriate level during disruption.',
                riskLevel: 'HIGH',
                evidenceRequired: ['BCP Plans', 'DR Test Results', 'Continuity Risk Assessments']
            },
            {
                id: 'A.6.1',
                name: 'Screening',
                description: 'Background verification checks on all candidates shall be carried out prior to joining.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Background Check Policy', 'Screening Records', 'NDA Templates']
            },
            {
                id: 'A.7.1',
                name: 'Physical Security Perimeters',
                description: 'Security perimeters shall be defined and used to protect areas containing information.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Physical Security Policy', 'Site Access Logs', 'Perimeter Assessment Reports']
            },
            {
                id: 'A.8.1',
                name: 'User Endpoint Devices',
                description: 'Information stored on, processed by or accessible through user endpoint devices shall be protected.',
                riskLevel: 'HIGH',
                evidenceRequired: ['MDM Configuration', 'Endpoint Protection Logs', 'BYOD Policy']
            },
            {
                id: 'A.8.2',
                name: 'Privileged Access Rights',
                description: 'The allocation and use of privileged access rights shall be restricted and managed.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Privileged Access Policy', 'PAM Tool Logs']
            },
            {
                id: 'A.8.8',
                name: 'Management of Technical Vulnerabilities',
                description: 'Information about technical vulnerabilities shall be obtained, exposure evaluated, and measures taken.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Vulnerability Management Policy', 'Scan Reports', 'Patch Compliance Dashboard']
            },
            {
                id: 'A.8.9',
                name: 'Configuration Management',
                description: 'Configurations, including security configurations, shall be established, documented, implemented, monitored and reviewed.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Baseline Configurations', 'Change Management Records', 'Configuration Audit Logs']
            },
            {
                id: 'A.8.15',
                name: 'Logging',
                description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Logging Standards', 'Log Retention Policy', 'SIEM Dashboard Screenshots']
            },
            {
                id: 'A.8.16',
                name: 'Monitoring Activities',
                description: 'Networks, systems and applications shall be monitored for anomalous behaviour.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Monitoring Procedures', 'Alert Configurations', 'SOC Reports']
            },
            {
                id: 'A.8.24',
                name: 'Use of Cryptography',
                description: 'Rules for the effective use of cryptography, including key management, shall be defined and implemented.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Cryptography Policy', 'Key Management Procedures', 'Certificate Inventory']
            },
            {
                id: 'A.8.25',
                name: 'Secure Development Life Cycle',
                description: 'Rules for the secure development of software and systems shall be established and applied.',
                riskLevel: 'HIGH',
                evidenceRequired: ['SDLC Policy', 'Code Review Checklists', 'SAST/DAST Reports']
            },
            {
                id: 'A.8.28',
                name: 'Secure Coding',
                description: 'Secure coding principles shall be applied to software development.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Secure Coding Standards', 'Code Review Records', 'Developer Training Certificates']
            }
        ]
    },
    NIS2: {
        id: 'NIS2',
        name: 'NIS2 Directive (EU) 2022/2555',
        type: 'REGULATION',
        controls: [
            {
                id: 'NIS2-ART-21.2.a',
                name: 'Risk Analysis and Information System Security Policies',
                description: 'Policies on risk analysis and information system security shall be adopted.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Information Security Policy', 'Risk Assessment Methodology', 'Risk Treatment Plans']
            },
            {
                id: 'NIS2-ART-21.2.b',
                name: 'Incident Handling',
                description: 'Measures for incident handling, detection, response and recovery.',
                riskLevel: 'CRITICAL',
                evidenceRequired: ['Incident Response Plan', 'Incident Register', 'CSIRT Contact Information']
            },
            {
                id: 'NIS2-ART-21.2.c',
                name: 'Business Continuity and Crisis Management',
                description: 'Business continuity measures including backup management, disaster recovery and crisis management.',
                riskLevel: 'HIGH',
                evidenceRequired: ['BCP/DR Plans', 'Backup Procedures', 'Crisis Management Framework']
            },
            {
                id: 'NIS2-ART-21.2.d',
                name: 'Supply Chain Security',
                description: 'Measures regarding supply chain security, including security-related aspects concerning the relationships between each entity and its direct suppliers.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Supplier Risk Assessment', 'Vendor Contracts', 'Supply Chain Security Policy']
            },
            {
                id: 'NIS2-ART-21.2.e',
                name: 'Network and Information Systems Security',
                description: 'Security in network and information systems acquisition, development and maintenance, including vulnerability handling.',
                riskLevel: 'HIGH',
                evidenceRequired: ['Secure Development Policy', 'Vulnerability Disclosure Process', 'System Acquisition Security Requirements']
            },
            {
                id: 'NIS2-ART-21.2.f',
                name: 'Cybersecurity Risk Assessment Effectiveness',
                description: 'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Effectiveness Assessment Reports', 'KPI/KRI Dashboards', 'Audit Findings']
            },
            {
                id: 'NIS2-ART-21.2.g',
                name: 'Cybersecurity Hygiene and Training',
                description: 'Basic cyber hygiene practices and cybersecurity training for all personnel.',
                riskLevel: 'MEDIUM',
                evidenceRequired: ['Training Program Documentation', 'Completion Records', 'Awareness Campaign Materials']
            },
            {
                id: 'NIS2-ART-21.2.j',
                name: 'Multi-Factor Authentication',
                description: 'Use of multi-factor authentication, secured voice/video/text communications, and secured emergency communications.',
                riskLevel: 'HIGH',
                evidenceRequired: ['MFA Configuration Evidence', 'Secure Communications Policy', 'Emergency Communication Procedures']
            }
        ]
    }
};
