export interface PolicyTemplate {
    id: string;
    title: string;
    description: string;
    content: string;
    category: string;
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
    {
        id: 'tpl-aup',
        title: 'Acceptable Use Policy (AUP)',
        description: 'Standard guidelines for employee use of company assets and internet.',
        category: 'General',
        content: `# Acceptable Use Policy

## 1. Overview
This policy outlines the acceptable use of computer equipment at [Company Name]. These rules are in place to protect the employee and [Company Name]. Inappropriate use exposes [Company Name] to risks including virus attacks, compromise of network systems and services, and legal issues.

## 2. Scope
This policy applies to the use of information, electronic and computing devices, and network resources to conduct [Company Name] business or interact with internal networks and business systems, whether owned or leased by [Company Name], the employee, or a third party.

## 3. Policy
### 3.1 General Use and Ownership
- [Company Name] proprietary information stored on electronic and computing devices whether owned or leased by [Company Name], the employee or a third party, remains the sole property of [Company Name]. 
- You have the responsibility to promptly report the theft, loss, or unauthorized disclosure of [Company Name] proprietary information.
- You may access, use or share [Company Name] proprietary information only to the extent it is authorized and necessary to fulfill your assigned job duties.
`
    },
    {
        id: 'tpl-retention',
        title: 'Data Retention Policy',
        description: 'Rules for storing, archiving, and deleting company data.',
        category: 'Compliance',
        content: `# Data Retention Policy

## 1. Purpose
The purpose of this policy is to ensure that necessary records and documents of [Company Name] are adequately protected and maintained and to ensure that records that are no longer needed by [Company Name] or are of no value are discarded at the proper time.

## 2. Administration
Attached is a Record Retention Schedule that is approved as the initial maintenance, retention and disposal schedule for physical records of [Company Name] and the retention and disposal of electronic media.

## 3. Retention Schedule
- **Financial Records**: 7 Years
- **Employee Records**: 7 Years post-termination
- **Customer Correspondence**: 3 Years
- **Project Documentation**: 5 Years post-completion
`
    },
    {
        id: 'tpl-ir',
        title: 'Incident Response Policy',
        description: 'Framework for detecting and responding to security incidents.',
        category: 'Security',
        content: `# Incident Response Policy

## 1. Purpose
The purpose of this policy is to establish controls to ensure that [Company Name] assets and information are protected and that security incidents are detected, analyzed, responded to, and reported in a timely manner.

## 2. Definition of Security Incident
A security incident is defined as any adverse event that threatens the confidentiality, integrity, availability, or authenticity of information resources.

## 3. Reporting
All employees, contractors, and temporary workers are required to report any suspected or actual security incidents immediately to the Security Team via [Email/Slack].

## 4. Response Phases
1. **Preparation**: Training and tooling.
2. **Identification**: Detecting the breach.
3. **Containment**: stopping the spread.
4. **Eradication**: Removing the threat.
5. **Recovery**: Restoring services.
6. **Lessons Learned**: Post-mortem analysis.
`
    }
];
