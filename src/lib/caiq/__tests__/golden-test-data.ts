/**
 * Golden test data for CAIQ accuracy and regression tests.
 * At least 50 cases covering all 16 CAIQ domains (2–3 per domain).
 * Questions and expected outcomes align with the production knowledge base.
 */

import type { CAIQAnswerType, CAIQDomain } from '../types';

export interface GoldenTestCase {
  questionId: string;
  questionText: string;
  expectedType: CAIQAnswerType;
  mustContain: string[];
  mustNotContain: string[];
  isAmbiguous: boolean;
  domain: CAIQDomain;
}

const DOMAIN_NAMES: Record<CAIQDomain, string> = {
  AIS: 'Application & Interface Security',
  AAC: 'Audit Assurance & Compliance',
  BCR: 'Business Continuity & Resilience',
  CCC: 'Change Control & Configuration Management',
  CEK: 'Cryptography, Encryption & Key Management',
  DSP: 'Data Security & Privacy Lifecycle Management',
  GRC: 'Governance, Risk & Compliance',
  HRS: 'Human Resources Security',
  IAM: 'Identity & Access Management',
  IPY: 'Interoperability & Portability',
  IVS: 'Infrastructure & Virtualization Security',
  LOG: 'Logging & Monitoring',
  SEF: 'Security Incident Management, E-Discovery & Cloud Forensics',
  STA: 'Supply Chain Management, Transparency & Accountability',
  TVM: 'Threat & Vulnerability Management',
  UEM: 'Universal Endpoint Management',
};

export const GOLDEN_TEST_CASES: GoldenTestCase[] = [
  // ---- AIS (3) ----
  {
    questionId: 'AIS-01.1',
    questionText:
      "Are application security policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained to guide appropriate planning, delivery, and support of the organization's application security capabilities?",
    expectedType: 'YES',
    mustContain: ['application security', 'policies', 'established'],
    mustNotContain: ['not implemented', 'we do not have'],
    isAmbiguous: false,
    domain: 'AIS',
  },
  {
    questionId: 'AIS-01.2',
    questionText: 'Are application security policies and procedures reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed', 'no policy'],
    isAmbiguous: false,
    domain: 'AIS',
  },
  {
    questionId: 'AIS-02.1',
    questionText:
      'Are baseline requirements to secure different applications established, documented, and maintained?',
    expectedType: 'YES',
    mustContain: ['baseline', 'security requirements', 'documented'],
    mustNotContain: ['no baseline', 'not defined'],
    isAmbiguous: false,
    domain: 'AIS',
  },
  // ---- AAC (3) ----
  {
    questionId: 'A&A-01.1',
    questionText:
      'Are audit and assurance policies, procedures, and standards established, documented, approved, communicated, applied, evaluated, and maintained?',
    expectedType: 'YES',
    mustContain: ['audit', 'assurance', 'policies', 'established'],
    mustNotContain: ['not established', 'no audit'],
    isAmbiguous: false,
    domain: 'AAC',
  },
  {
    questionId: 'A&A-01.2',
    questionText: 'Are audit and assurance policies, procedures, and standards reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed'],
    isAmbiguous: false,
    domain: 'AAC',
  },
  {
    questionId: 'A&A-02.1',
    questionText:
      'Are independent audit and assurance assessments conducted according to relevant standards at least annually?',
    expectedType: 'YES',
    mustContain: ['independent', 'audit', 'annually'],
    mustNotContain: ['not conducted', 'no assessment'],
    isAmbiguous: false,
    domain: 'AAC',
  },
  // ---- BCR (3) ----
  {
    questionId: 'BCR-01.1',
    questionText:
      'Are business continuity management and operational resilience policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    expectedType: 'YES',
    mustContain: ['business continuity', 'resilience', 'policies'],
    mustNotContain: ['not established', 'no procedures'],
    isAmbiguous: false,
    domain: 'BCR',
  },
  {
    questionId: 'BCR-01.2',
    questionText:
      'Are business continuity management and operational resilience policies and procedures reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed'],
    isAmbiguous: false,
    domain: 'BCR',
  },
  {
    questionId: 'BCR-02.1',
    questionText:
      'Are business impact analyses and risk assessments conducted to identify and prioritize critical business processes and systems?',
    expectedType: 'YES',
    mustContain: ['business impact', 'risk assessment', 'critical'],
    mustNotContain: ['not conducted', 'no analysis'],
    isAmbiguous: false,
    domain: 'BCR',
  },
  // ---- CCC (3) ----
  {
    questionId: 'CCC-01.1',
    questionText:
      'Are change control and configuration management policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    expectedType: 'YES',
    mustContain: ['change control', 'configuration', 'policies'],
    mustNotContain: ['not established', 'no change control'],
    isAmbiguous: false,
    domain: 'CCC',
  },
  {
    questionId: 'CCC-01.2',
    questionText:
      'Are change control and configuration management policies and procedures reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed'],
    isAmbiguous: false,
    domain: 'CCC',
  },
  {
    questionId: 'CCC-02.1',
    questionText:
      'Are changes to the infrastructure, applications, and data classified and managed according to the change control process?',
    expectedType: 'YES',
    mustContain: ['changes', 'change control', 'process'],
    mustNotContain: ['not managed', 'no process'],
    isAmbiguous: false,
    domain: 'CCC',
  },
  // ---- CEK (3) ----
  {
    questionId: 'CEK-01.1',
    questionText:
      'Are cryptography, encryption, and key management policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    expectedType: 'YES',
    mustContain: ['cryptography', 'encryption', 'key management', 'policies'],
    mustNotContain: ['not established', 'no encryption'],
    isAmbiguous: false,
    domain: 'CEK',
  },
  {
    questionId: 'CEK-01.2',
    questionText:
      'Are cryptography, encryption, and key management policies and procedures reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed'],
    isAmbiguous: false,
    domain: 'CEK',
  },
  {
    questionId: 'CEK-02.1',
    questionText:
      'Are encryption algorithms, key lengths, and cryptographic protocols approved and aligned with industry standards and regulatory requirements?',
    expectedType: 'YES',
    mustContain: ['encryption', 'key', 'defined'],
    mustNotContain: ['not approved', 'weak algorithms'],
    isAmbiguous: false,
    domain: 'CEK',
  },
  // ---- DSP (3) ----
  {
    questionId: 'DSP-01.1',
    questionText:
      'Are data security and privacy lifecycle management policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    expectedType: 'YES',
    mustContain: ['data', 'policies', 'established'],
    mustNotContain: ['not established', 'no data policy'],
    isAmbiguous: false,
    domain: 'DSP',
  },
  {
    questionId: 'DSP-01.2',
    questionText:
      'Are data security and privacy lifecycle management policies and procedures reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed'],
    isAmbiguous: false,
    domain: 'DSP',
  },
  {
    questionId: 'DSP-02.1',
    questionText:
      'Are industry-accepted methods applied for the secure disposal of data from storage media such that data is not recoverable by any forensic means?',
    expectedType: 'YES',
    mustContain: ['data', 'secure', 'disposal', 'recoverable'],
    mustNotContain: ['not applied', 'no disposal'],
    isAmbiguous: false,
    domain: 'DSP',
  },
  // ---- GRC (3) ----
  {
    questionId: 'GRC-01.1',
    questionText:
      "Are governance policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained to guide the organization's governance program?",
    expectedType: 'YES',
    mustContain: ['governance', 'policies', 'established'],
    mustNotContain: ['not established', 'no governance'],
    isAmbiguous: false,
    domain: 'GRC',
  },
  {
    questionId: 'GRC-02.1',
    questionText:
      'Is contact established and maintained with cloud-related special interest groups, standards bodies, or industry forums to stay informed of emerging threats and best practices?',
    expectedType: 'YES',
    mustContain: ['contact', 'standards', 'threats', 'best practices'],
    mustNotContain: ['no contact', 'not maintained'],
    isAmbiguous: false,
    domain: 'GRC',
  },
  {
    questionId: 'GRC-03.1',
    questionText:
      "Are applicable standards, regulations, and statutory requirements identified and mapped to the organization's information security and cloud controls?",
    expectedType: 'YES',
    mustContain: ['standards', 'regulations', 'mapped', 'controls'],
    mustNotContain: ['not identified', 'no mapping'],
    isAmbiguous: false,
    domain: 'GRC',
  },
  // ---- HRS (3) ----
  {
    questionId: 'HRS-01.1',
    questionText:
      'Are human resources security policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained for the entire employment lifecycle?',
    expectedType: 'YES',
    mustContain: ['human resources', 'security', 'policies', 'employment'],
    mustNotContain: ['not established', 'no HR security'],
    isAmbiguous: false,
    domain: 'HRS',
  },
  {
    questionId: 'HRS-01.2',
    questionText: 'Are human resources security policies and procedures reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['reviewed', 'annually'],
    mustNotContain: ['not reviewed'],
    isAmbiguous: false,
    domain: 'HRS',
  },
  {
    questionId: 'HRS-02.1',
    questionText:
      'Are background verification checks performed for candidates in accordance with applicable laws, regulations, and role sensitivity prior to employment?',
    expectedType: 'YES',
    mustContain: ['background', 'verification', 'candidates'],
    mustNotContain: ['not performed', 'no background check'],
    isAmbiguous: false,
    domain: 'HRS',
  },
  // ---- IAM (3) ----
  {
    questionId: 'IAM-01.1',
    questionText:
      'Are identity and access management policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    expectedType: 'YES',
    mustContain: ['identity', 'access management', 'policies', 'established'],
    mustNotContain: ['not established', 'no IAM'],
    isAmbiguous: false,
    domain: 'IAM',
  },
  {
    questionId: 'IAM-02.1',
    questionText:
      'Is access to data and system functions restricted to authorized users and processes, and is authorization verified before granting access?',
    expectedType: 'YES',
    mustContain: ['access', 'restricted', 'authorized', 'authorization'],
    mustNotContain: ['not restricted', 'no verification'],
    isAmbiguous: false,
    domain: 'IAM',
  },
  {
    questionId: 'IAM-03.1',
    questionText:
      'Are passwords and other authentication secrets managed securely, including composition rules, storage, and protection against disclosure?',
    expectedType: 'YES',
    mustContain: ['passwords', 'authentication', 'securely', 'storage'],
    mustNotContain: ['not managed', 'credentials stored in plain text'],
    isAmbiguous: false,
    domain: 'IAM',
  },
  // ---- IPY (3) ----
  {
    questionId: 'IPY-01.1',
    questionText:
      'Are interoperability and portability policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained, including requirements for communications between application interfaces, information processing interoperability, application development portability, and information/data exchange, usage, portability, integrity, and persistence? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['interoperability', 'portability', 'policies'],
    mustNotContain: ['not established', 'no portability'],
    isAmbiguous: false,
    domain: 'IPY',
  },
  {
    questionId: 'IPY-02.1',
    questionText:
      'Are application interface(s) provided so that cloud service customers can programmatically retrieve their data to enable interoperability and portability?',
    expectedType: 'YES',
    mustContain: ['application interface', 'retrieve', 'data', 'interoperability'],
    mustNotContain: ['not provided', 'no API'],
    isAmbiguous: false,
    domain: 'IPY',
  },
  {
    questionId: 'IPY-03.1',
    questionText:
      'Are cryptographically secure and standardized network protocols implemented for the management, import, and export of data?',
    expectedType: 'YES',
    mustContain: ['cryptographically secure', 'protocols', 'data'],
    mustNotContain: ['not implemented', 'insecure'],
    isAmbiguous: false,
    domain: 'IPY',
  },
  // ---- IVS (3) ----
  {
    questionId: 'IVS-01.1',
    questionText:
      'Are infrastructure and virtualization security policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['infrastructure', 'virtualization', 'security', 'policies'],
    mustNotContain: ['not established', 'no procedures'],
    isAmbiguous: false,
    domain: 'IVS',
  },
  {
    questionId: 'IVS-02.1',
    questionText:
      'Are availability, quality, and adequate capacity of resources planned and monitored in order to deliver the required system performance as determined by the business?',
    expectedType: 'YES',
    mustContain: ['availability', 'capacity', 'planned', 'monitored'],
    mustNotContain: ['not planned', 'no monitoring'],
    isAmbiguous: false,
    domain: 'IVS',
  },
  {
    questionId: 'IVS-03.1',
    questionText:
      'Are communications between environments monitored, encrypted, and restricted to only authenticated and authorized connections as justified by the business? Are these configurations reviewed at least annually and supported by documented justification of all allowed services, protocols, ports, and compensating controls?',
    expectedType: 'YES',
    mustContain: ['monitored', 'encrypted', 'authenticated', 'authorized'],
    mustNotContain: ['not restricted', 'no encryption'],
    isAmbiguous: false,
    domain: 'IVS',
  },
  // ---- LOG (3) ----
  {
    questionId: 'LOG-01.1',
    questionText:
      'Are logging and monitoring policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['logging', 'monitoring', 'policies', 'established'],
    mustNotContain: ['not established', 'no logging'],
    isAmbiguous: false,
    domain: 'LOG',
  },
  {
    questionId: 'LOG-02.1',
    questionText:
      'Are processes, procedures, and technical measures defined, implemented, and evaluated to ensure the security and retention of audit logs?',
    expectedType: 'YES',
    mustContain: ['audit logs', 'retention', 'security'],
    mustNotContain: ['not defined', 'no retention'],
    isAmbiguous: false,
    domain: 'LOG',
  },
  {
    questionId: 'LOG-03.1',
    questionText:
      'Are security-related events within applications and the underlying infrastructure identified and monitored, and is a system defined and implemented to generate alerts to responsible stakeholders based on such events and corresponding metrics?',
    expectedType: 'YES',
    mustContain: ['security', 'events', 'monitored', 'stakeholders'],
    mustNotContain: ['not monitored', 'no alerts'],
    isAmbiguous: false,
    domain: 'LOG',
  },
  // ---- SEF (3) ----
  {
    questionId: 'SEF-01.1',
    questionText:
      'Are policies and procedures for Security Incident Management, E-Discovery, and Cloud Forensics established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['incident', 'E-Discovery', 'Forensics', 'policies'],
    mustNotContain: ['not established', 'no incident procedure'],
    isAmbiguous: false,
    domain: 'SEF',
  },
  {
    questionId: 'SEF-02.1',
    questionText:
      'Are policies and procedures for the timely management of security incidents established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['security incidents', 'timely', 'management'],
    mustNotContain: ['not established', 'no procedures'],
    isAmbiguous: false,
    domain: 'SEF',
  },
  {
    questionId: 'SEF-03.1',
    questionText:
      'Is a security incident response plan established, documented, approved, communicated, applied, evaluated, and maintained, including relevant internal departments, impacted cloud service customers, and other business-critical relationships (such as supply chain) that may be impacted?',
    expectedType: 'YES',
    mustContain: ['incident response', 'plan', 'documented'],
    mustNotContain: ['no plan', 'not established'],
    isAmbiguous: false,
    domain: 'SEF',
  },
  // ---- STA (3) ----
  {
    questionId: 'STA-01.1',
    questionText:
      'Are policies and procedures for the application of the Shared Security Responsibility Model (SSRM) within the organization established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['Shared Security Responsibility', 'SSRM', 'policies'],
    mustNotContain: ['not established', 'no SSRM'],
    isAmbiguous: false,
    domain: 'STA',
  },
  {
    questionId: 'STA-02.1',
    questionText:
      'Is the SSRM applied, documented, implemented, and managed throughout the supply chain for the cloud service offering?',
    expectedType: 'YES',
    mustContain: ['SSRM', 'supply chain', 'documented'],
    mustNotContain: ['not applied', 'no documentation'],
    isAmbiguous: false,
    domain: 'STA',
  },
  {
    questionId: 'STA-03.1',
    questionText:
      'Is SSRM guidance provided to the cloud service customer (CSC) detailing information about the SSRM applicability throughout the supply chain?',
    expectedType: 'YES',
    mustContain: ['SSRM', 'guidance', 'customer', 'supply chain'],
    mustNotContain: ['not provided', 'no guidance'],
    isAmbiguous: false,
    domain: 'STA',
  },
  // ---- TVM (3) ----
  {
    questionId: 'TVM-01.1',
    questionText:
      'Are policies and procedures to identify, report, and prioritize the remediation of vulnerabilities established, documented, approved, communicated, applied, evaluated, and maintained in order to protect systems against vulnerability exploitation? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['vulnerability', 'remediation', 'policies', 'established'],
    mustNotContain: ['not established', 'no remediation'],
    isAmbiguous: false,
    domain: 'TVM',
  },
  {
    questionId: 'TVM-02.1',
    questionText:
      'Are policies and procedures to protect against malware on managed assets established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['malware', 'policies', 'established', 'maintained'],
    mustNotContain: ['not established', 'no protection'],
    isAmbiguous: false,
    domain: 'TVM',
  },
  {
    questionId: 'TVM-03.1',
    questionText:
      'Are processes, procedures, and technical measures defined, implemented, and evaluated to enable both scheduled and emergency responses to vulnerability identifications, based on identified risk?',
    expectedType: 'YES',
    mustContain: ['vulnerability', 'response', 'scheduled', 'emergency'],
    mustNotContain: ['not defined', 'no response'],
    isAmbiguous: false,
    domain: 'TVM',
  },
  // ---- UEM (3) ----
  {
    questionId: 'UEM-01.1',
    questionText:
      'Are policies and procedures for all endpoints established, documented, approved, communicated, applied, evaluated, and maintained? Are they reviewed and updated at least annually?',
    expectedType: 'YES',
    mustContain: ['endpoints', 'policies', 'established', 'annually'],
    mustNotContain: ['not established', 'no endpoint policy'],
    isAmbiguous: false,
    domain: 'UEM',
  },
  {
    questionId: 'UEM-02.1',
    questionText:
      'Is a list of approved services, applications, and sources of applications (stores) acceptable for use by endpoints when accessing or storing organization-managed data defined, documented, applied, and evaluated?',
    expectedType: 'YES',
    mustContain: ['approved', 'applications', 'endpoints', 'defined'],
    mustNotContain: ['not defined', 'no list'],
    isAmbiguous: false,
    domain: 'UEM',
  },
  {
    questionId: 'UEM-03.1',
    questionText:
      "Is a process for the validation of the endpoint device's compatibility with operating systems and applications defined and implemented?",
    expectedType: 'YES',
    mustContain: ['compatibility', 'endpoint', 'defined', 'implemented'],
    mustNotContain: ['not defined', 'no process'],
    isAmbiguous: false,
    domain: 'UEM',
  },
  // ---- Extra cases to exceed 50 and add ambiguous ----
  {
    questionId: 'AIS-03.1',
    questionText:
      'Are technical and operational metrics defined and implemented according to business objectives, security requirements, and compliance obligations?',
    expectedType: 'YES',
    mustContain: ['metrics', 'security', 'compliance'],
    mustNotContain: ['not defined', 'no metrics'],
    isAmbiguous: true, // can be context-dependent
    domain: 'AIS',
  },
  {
    questionId: 'IAM-04.1',
    questionText:
      'Is multifactor authentication (MFA) implemented for privileged users and for access to sensitive data or systems?',
    expectedType: 'YES',
    mustContain: ['multifactor', 'MFA', 'privileged'],
    mustNotContain: ['MFA not implemented', 'no MFA'],
    isAmbiguous: false,
    domain: 'IAM',
  },
  {
    questionId: 'DSP-03.1',
    questionText:
      'Is a data inventory created and maintained, at least for any sensitive data and personal data?',
    expectedType: 'YES',
    mustContain: ['data', 'maintained', 'inventory'],
    mustNotContain: ['not created', 'no inventory'],
    isAmbiguous: false,
    domain: 'DSP',
  },
];

export function getDomainDisplayName(domain: CAIQDomain): string {
  return DOMAIN_NAMES[domain] ?? domain;
}
