// Jira Ticket Templates for CISO Operations
// 15 prepopulated templates across 5 categories

export type TicketCategory = 'INCIDENT_RESPONSE' | 'RISK_COMPLIANCE' | 'INFRASTRUCTURE' | 'VENDOR_MANAGEMENT' | 'STRATEGIC';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TicketTemplate {
    id: string;
    category: TicketCategory;
    name: string;
    summary: string;
    description: string;
    priority: TicketPriority;
    labels: string[];
    issueType: 'Task' | 'Bug' | 'Story' | 'Epic';
    customFields: {
        riskLevel?: string;
        complianceFrameworks?: string[];
        estimatedEffort?: string;
        impactArea?: string;
        dueWithin?: string;
    };
    suggestedAssignee?: string;
}

export const TICKET_CATEGORIES: Record<TicketCategory, { label: string; icon: string; color: string; description: string }> = {
    INCIDENT_RESPONSE: { label: 'Incident Response', icon: '🚨', color: 'text-red-500', description: 'Security incidents, breaches, and forensic investigations' },
    RISK_COMPLIANCE: { label: 'Risk & Compliance', icon: '📋', color: 'text-purple-500', description: 'Risk assessments, audit findings, and policy exceptions' },
    INFRASTRUCTURE: { label: 'Infrastructure', icon: '🔧', color: 'text-blue-500', description: 'Firewall changes, access reviews, and vulnerability remediation' },
    VENDOR_MANAGEMENT: { label: 'Vendor Management', icon: '🤝', color: 'text-amber-500', description: 'Vendor assessments, third-party risk, and SLA compliance' },
    STRATEGIC: { label: 'Strategic', icon: '🎯', color: 'text-emerald-500', description: 'Budget requests, board reports, and tool procurement' },
};

export const TICKET_TEMPLATES: TicketTemplate[] = [
    // ─── Incident Response ───
    {
        id: 'IR-001',
        category: 'INCIDENT_RESPONSE',
        name: 'Security Incident Report',
        summary: '[SEVERITY] Security Incident — [Brief Description]',
        description: `## Security Incident Report

### Incident Details
- **Date/Time Detected:** [YYYY-MM-DD HH:MM UTC]
- **Detection Source:** [EDR / SIEM / SOC Analyst / User Report]
- **Affected Systems:** [List impacted systems/services]
- **Current Status:** [Investigating / Contained / Eradicated / Recovered]

### Impact Assessment
- **Confidentiality:** [None / Low / Moderate / High / Critical]
- **Integrity:** [None / Low / Moderate / High / Critical]
- **Availability:** [None / Low / Moderate / High / Critical]
- **Data Involved:** [PII / PCI / PHI / IP / None]
- **Users Affected:** [Count or estimate]

### Initial Findings
[Describe what happened, how it was detected, and initial observations]

### Containment Actions Taken
- [ ] Network isolation
- [ ] Account lockout
- [ ] System quarantine
- [ ] Evidence preservation

### Next Steps
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

### Stakeholders Notified
- [ ] CISO
- [ ] Legal
- [ ] CEO/Board
- [ ] Regulatory bodies (if required)`,
        priority: 'CRITICAL',
        labels: ['security-incident', 'ir-process', 'urgent'],
        issueType: 'Bug',
        customFields: {
            riskLevel: 'CRITICAL',
            complianceFrameworks: ['NIST CSF', 'ISO 27001'],
            estimatedEffort: '40h',
            impactArea: 'Security Operations',
            dueWithin: '4 hours',
        },
        suggestedAssignee: 'SOC Manager',
    },
    {
        id: 'IR-002',
        category: 'INCIDENT_RESPONSE',
        name: 'Breach Notification',
        summary: '[REGULATORY] Data Breach Notification — [Affected Data Type]',
        description: `## Data Breach Notification Request

### Breach Summary
- **Date Breach Discovered:** [YYYY-MM-DD]
- **Date Breach Occurred:** [YYYY-MM-DD or estimated range]
- **Type of Data Compromised:** [PII / PCI / PHI / Credentials / IP]
- **Number of Records Affected:** [Count]
- **Root Cause:** [Phishing / Misconfiguration / Malware / Insider / Unknown]

### Regulatory Obligations
| Regulation | Deadline | Status |
|------------|----------|--------|
| GDPR (72hr) | [Date] | [ ] Pending |
| State Breach Laws | [Date] | [ ] Pending |
| SEC (4 business days) | [Date] | [ ] Pending |
| PCI DSS | [Date] | [ ] Pending |

### Notification Plan
- **Affected Individuals:** [How will they be notified?]
- **Regulators:** [Which regulators, timeline]
- **Media Statement:** [Prepared / In Progress / Not Required]
- **Credit Monitoring:** [Offered / Not Applicable]

### Legal Review
- [ ] Outside counsel engaged
- [ ] Privilege considerations documented
- [ ] Insurance carrier notified

### Attachments
- [ ] Forensic report
- [ ] Impact assessment
- [ ] Draft notification letter`,
        priority: 'CRITICAL',
        labels: ['breach-notification', 'legal', 'regulatory', 'urgent'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'CRITICAL',
            complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI DSS'],
            estimatedEffort: '80h',
            impactArea: 'Legal & Compliance',
            dueWithin: '72 hours',
        },
        suggestedAssignee: 'Legal Counsel',
    },
    {
        id: 'IR-003',
        category: 'INCIDENT_RESPONSE',
        name: 'Forensic Investigation Request',
        summary: '[FORENSICS] Investigation Request — [Case Reference]',
        description: `## Digital Forensic Investigation Request

### Case Information
- **Case Reference:** [CASE-YYYY-###]
- **Requesting Party:** [Name / Department]
- **Investigation Type:** [Incident Response / HR / Legal Hold / Compliance]
- **Urgency:** [Immediate / 24hr / 72hr / Scheduled]

### Scope of Investigation
- **Systems to Investigate:** [Endpoints / Servers / Cloud / Email / Network]
- **Time Period:** [Start Date] to [End Date]
- **Specific User(s):** [If applicable]

### Preservation Requirements
- [ ] Full disk image required
- [ ] Memory capture needed
- [ ] Network traffic capture
- [ ] Cloud logs (specify: AWS CloudTrail / Azure AD / GCP)
- [ ] Email archive

### Chain of Custody
- **Evidence Handler:** [Name]
- **Storage Location:** [Secure evidence locker / Forensic server]

### Expected Deliverables
- [ ] Timeline of events
- [ ] Indicators of Compromise (IOCs)
- [ ] Root cause analysis
- [ ] Executive summary
- [ ] Detailed technical report`,
        priority: 'HIGH',
        labels: ['forensics', 'investigation', 'evidence'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'HIGH',
            complianceFrameworks: ['NIST CSF', 'ISO 27001'],
            estimatedEffort: '120h',
            impactArea: 'Security Operations',
            dueWithin: '24 hours',
        },
        suggestedAssignee: 'DFIR Lead',
    },

    // ─── Risk & Compliance ───
    {
        id: 'RC-001',
        category: 'RISK_COMPLIANCE',
        name: 'Risk Assessment Request',
        summary: '[RISK] Assessment Required — [System/Project Name]',
        description: `## Risk Assessment Request

### Subject
- **System/Project Name:** [Name]
- **Business Owner:** [Name / Department]
- **Assessment Type:** [New System / Change / Periodic Review / M&A]
- **Target Completion:** [Date]

### Scope
- **Data Classification:** [Public / Internal / Confidential / Restricted]
- **Data Types Processed:** [PII / PCI / PHI / Financial / IP]
- **Users/Customers Impacted:** [Count]
- **Third Parties Involved:** [List]

### Assessment Areas
- [ ] Technical architecture review
- [ ] Access control assessment
- [ ] Data flow analysis
- [ ] Threat modeling
- [ ] Compliance gap analysis
- [ ] Business impact analysis

### Current Controls
[Describe existing security controls]

### Known Risks
[List any known or suspected risks]

### Deliverables Expected
- [ ] Risk register entry
- [ ] Risk heat map
- [ ] Remediation recommendations
- [ ] Executive summary`,
        priority: 'MEDIUM',
        labels: ['risk-assessment', 'governance'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'MEDIUM',
            complianceFrameworks: ['ISO 27001', 'NIST CSF'],
            estimatedEffort: '40h',
            impactArea: 'Risk Management',
            dueWithin: '2 weeks',
        },
        suggestedAssignee: 'Risk Manager',
    },
    {
        id: 'RC-002',
        category: 'RISK_COMPLIANCE',
        name: 'Compliance Audit Finding',
        summary: '[AUDIT] Finding #[Number] — [Framework] — [Control ID]',
        description: `## Compliance Audit Finding

### Finding Details
- **Finding ID:** [FIND-YYYY-###]
- **Framework:** [ISO 27001 / SOC 2 / PCI DSS / GDPR / NIST]
- **Control Reference:** [Control ID]
- **Severity:** [Critical / Major / Minor / Observation]
- **Auditor:** [Internal / External Firm Name]

### Description
[Detailed description of the finding]

### Evidence
[Reference to evidence collected]

### Root Cause
[Analysis of why this control deficiency exists]

### Remediation Plan
| Step | Action | Owner | Due Date | Status |
|------|--------|-------|----------|--------|
| 1 | [Action] | [Owner] | [Date] | [ ] Open |
| 2 | [Action] | [Owner] | [Date] | [ ] Open |
| 3 | [Action] | [Owner] | [Date] | [ ] Open |

### Risk Acceptance
- [ ] Remediation planned (standard path)
- [ ] Risk accepted (requires CISO sign-off)
- [ ] Compensating control implemented`,
        priority: 'HIGH',
        labels: ['audit-finding', 'compliance', 'remediation'],
        issueType: 'Bug',
        customFields: {
            riskLevel: 'HIGH',
            complianceFrameworks: ['ISO 27001', 'SOC 2', 'PCI DSS'],
            estimatedEffort: '24h',
            impactArea: 'Compliance',
            dueWithin: '30 days',
        },
        suggestedAssignee: 'Compliance Manager',
    },
    {
        id: 'RC-003',
        category: 'RISK_COMPLIANCE',
        name: 'Policy Exception Request',
        summary: '[EXCEPTION] Policy Exception — [Policy Name] — [Requesting Dept]',
        description: `## Policy Exception Request

### Request Details
- **Policy:** [Policy Name and ID]
- **Specific Clause:** [Section reference]
- **Requesting Department:** [Department]
- **Requested By:** [Name and Title]
- **Duration:** [Start Date] to [End Date] or Permanent

### Business Justification
[Why is this exception necessary? What business need does it address?]

### Current Requirement
[What does the policy currently require?]

### Requested Exception
[What specific deviation is being requested?]

### Risk Analysis
- **Risk Without Exception:** [Description]
- **Risk With Exception:** [Description]
- **Residual Risk Level:** [Low / Medium / High / Critical]

### Compensating Controls
[What alternative controls will be implemented to mitigate risk?]
- [ ] Control 1: [Description]
- [ ] Control 2: [Description]

### Approval Chain
- [ ] Department Head
- [ ] Risk Manager
- [ ] CISO
- [ ] Board (if Critical risk)`,
        priority: 'MEDIUM',
        labels: ['policy-exception', 'governance', 'risk-acceptance'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'MEDIUM',
            complianceFrameworks: ['ISO 27001'],
            estimatedEffort: '8h',
            impactArea: 'Governance',
            dueWithin: '1 week',
        },
        suggestedAssignee: 'CISO',
    },

    // ─── Infrastructure ───
    {
        id: 'INFRA-001',
        category: 'INFRASTRUCTURE',
        name: 'Firewall Change Request',
        summary: '[FW] Firewall Rule Change — [Source] → [Destination] — [Port/Protocol]',
        description: `## Firewall Change Request

### Change Details
- **Change Type:** [Add / Modify / Remove]
- **Firewall(s):** [Device name(s)]
- **Environment:** [Production / Staging / Development]
- **Requested Date:** [Date for implementation]

### Rule Specification
| Field | Value |
|-------|-------|
| Source IP/Network | [CIDR] |
| Destination IP/Network | [CIDR] |
| Port(s) | [Port numbers] |
| Protocol | [TCP / UDP / ICMP] |
| Direction | [Inbound / Outbound] |
| Action | [Allow / Deny] |
| Duration | [Permanent / Temporary until DATE] |

### Business Justification
[Why is this rule needed?]

### Risk Assessment
- [ ] Traffic has been analyzed for security implications
- [ ] No lateral movement risk introduced
- [ ] Complies with network segmentation policy
- [ ] Logging enabled for this rule

### Approvals
- [ ] Application Owner
- [ ] Network Team
- [ ] Security Team
- [ ] Change Advisory Board (if production)`,
        priority: 'MEDIUM',
        labels: ['firewall', 'network', 'change-request'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'MEDIUM',
            complianceFrameworks: ['PCI DSS', 'NIST CSF'],
            estimatedEffort: '4h',
            impactArea: 'Network Security',
            dueWithin: '5 business days',
        },
        suggestedAssignee: 'Network Security Engineer',
    },
    {
        id: 'INFRA-002',
        category: 'INFRASTRUCTURE',
        name: 'Access Review Request',
        summary: '[IAM] Quarterly Access Review — [System/Application]',
        description: `## Access Review Request

### Review Scope
- **System/Application:** [Name]
- **Review Period:** [Q1/Q2/Q3/Q4 YYYY]
- **Review Type:** [Quarterly / Annual / Triggered / New Hire]
- **Total Users to Review:** [Count]

### Review Criteria
- [ ] Verify active employment status
- [ ] Confirm role-appropriate access levels
- [ ] Review privileged/admin accounts
- [ ] Check service accounts and API keys
- [ ] Validate shared account usage
- [ ] Review dormant accounts (>90 days inactive)

### Privileged Accounts
| Account | Role | Last Used | Action |
|---------|------|-----------|--------|
| [User] | [Admin/Root] | [Date] | [Keep/Revoke] |

### Findings Summary
- **Total Reviewed:** [Count]
- **Access Revoked:** [Count]
- **Access Modified:** [Count]
- **Exceptions Granted:** [Count]

### Compliance Mapping
- ISO 27001: A.9.2.5 (Review of user access rights)
- SOC 2: CC6.1 (Logical access security)
- PCI DSS: 7.1 (Limit access to need-to-know)`,
        priority: 'MEDIUM',
        labels: ['access-review', 'iam', 'compliance'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'MEDIUM',
            complianceFrameworks: ['ISO 27001', 'SOC 2', 'PCI DSS'],
            estimatedEffort: '16h',
            impactArea: 'Identity & Access',
            dueWithin: '2 weeks',
        },
        suggestedAssignee: 'IAM Team Lead',
    },
    {
        id: 'INFRA-003',
        category: 'INFRASTRUCTURE',
        name: 'Vulnerability Remediation',
        summary: '[VULN] Remediation — [CVE-YYYY-XXXXX] — CVSS [Score]',
        description: `## Vulnerability Remediation Ticket

### Vulnerability Details
- **CVE ID:** [CVE-YYYY-XXXXX]
- **CVSS Score:** [0.0-10.0] ([Critical/High/Medium/Low])
- **Vendor Advisory:** [Link]
- **Exploit Available:** [Yes — Public / Yes — Private / No]

### Affected Assets
| Asset | IP/FQDN | OS/Version | Environment |
|-------|---------|------------|-------------|
| [Name] | [IP] | [OS] | [Prod/Stage/Dev] |

### Remediation Plan
- **Patch Available:** [Yes / No]
- **Patch Version:** [Version number]
- **Workaround Available:** [Yes — describe / No]
- **Estimated Downtime:** [Duration]

### Remediation Steps
1. [ ] Test patch in staging environment
2. [ ] Schedule maintenance window
3. [ ] Deploy patch to production
4. [ ] Verify remediation (re-scan)
5. [ ] Update vulnerability register

### SLA
| Severity | SLA | Deadline |
|----------|-----|----------|
| Critical | 24 hours | [Date] |
| High | 7 days | [Date] |
| Medium | 30 days | [Date] |
| Low | 90 days | [Date] |`,
        priority: 'HIGH',
        labels: ['vulnerability', 'patching', 'remediation'],
        issueType: 'Bug',
        customFields: {
            riskLevel: 'HIGH',
            complianceFrameworks: ['NIST CSF', 'PCI DSS'],
            estimatedEffort: '8h',
            impactArea: 'Infrastructure Security',
            dueWithin: '7 days',
        },
        suggestedAssignee: 'Vulnerability Manager',
    },

    // ─── Vendor Management ───
    {
        id: 'VM-001',
        category: 'VENDOR_MANAGEMENT',
        name: 'Vendor Security Assessment',
        summary: '[VENDOR] Security Assessment — [Vendor Name]',
        description: `## Vendor Security Assessment

### Vendor Information
- **Vendor Name:** [Name]
- **Service Provided:** [Description]
- **Contract Value:** [$Amount / Annual]
- **Data Shared:** [PII / PCI / PHI / Financial / None]
- **Integration Type:** [API / VPN / SaaS / On-Premise / Manual]

### Assessment Scope
- [ ] Security questionnaire (SIG/CAIQ)
- [ ] SOC 2 Type II report review
- [ ] Penetration test results
- [ ] Insurance certificate review
- [ ] Business continuity plan review
- [ ] Data processing agreement review
- [ ] Sub-processor assessment

### Key Questions
1. How is data encrypted at rest and in transit?
2. What access controls are in place?
3. What is the incident notification timeline?
4. Where is data geographically stored?
5. What compliance certifications are held?

### Risk Rating
- **Inherent Risk:** [Critical / High / Medium / Low]
- **Residual Risk (after controls):** [Critical / High / Medium / Low]

### Recommendation
- [ ] Approve (no conditions)
- [ ] Approve with conditions
- [ ] Reject
- [ ] Requires further assessment`,
        priority: 'MEDIUM',
        labels: ['vendor-risk', 'third-party', 'assessment'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'MEDIUM',
            complianceFrameworks: ['ISO 27001', 'SOC 2'],
            estimatedEffort: '24h',
            impactArea: 'Vendor Risk',
            dueWithin: '2 weeks',
        },
        suggestedAssignee: 'Vendor Risk Analyst',
    },
    {
        id: 'VM-002',
        category: 'VENDOR_MANAGEMENT',
        name: 'Third-Party Risk Review',
        summary: '[TPR] Annual Risk Review — [Vendor Name] — [Risk Tier]',
        description: `## Third-Party Risk Review

### Review Context
- **Vendor:** [Name]
- **Risk Tier:** [Tier 1 — Critical / Tier 2 — High / Tier 3 — Medium]
- **Review Type:** [Annual / Triggered by Incident / Contract Renewal]
- **Last Review Date:** [Date]
- **Reviewer:** [Name]

### Performance Metrics
| Metric | SLA | Actual | Status |
|--------|-----|--------|--------|
| Uptime | 99.9% | [%] | [Met/Not Met] |
| Incident Response | 1hr | [Time] | [Met/Not Met] |
| Patch Cadence | 30 days | [Days] | [Met/Not Met] |
| Security Incidents | 0 | [Count] | [Met/Not Met] |

### Changes Since Last Review
- [ ] New sub-processors added
- [ ] Data processing changes
- [ ] Security incidents reported
- [ ] Compliance certification changes
- [ ] Key personnel changes
- [ ] Financial stability changes

### Updated Risk Assessment
[Summary of current risk posture]

### Recommendations
1. [Recommendation]
2. [Recommendation]
3. [Recommendation]`,
        priority: 'MEDIUM',
        labels: ['third-party-risk', 'annual-review', 'vendor'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'MEDIUM',
            complianceFrameworks: ['ISO 27001', 'NIST CSF'],
            estimatedEffort: '16h',
            impactArea: 'Vendor Risk',
            dueWithin: '30 days',
        },
        suggestedAssignee: 'Vendor Risk Analyst',
    },
    {
        id: 'VM-003',
        category: 'VENDOR_MANAGEMENT',
        name: 'SLA Non-Compliance Report',
        summary: '[SLA] Non-Compliance — [Vendor Name] — [Metric] — [Period]',
        description: `## SLA Non-Compliance Report

### Vendor & Contract
- **Vendor:** [Name]
- **Contract ID:** [ID]
- **SLA Document:** [Link/Reference]
- **Reporting Period:** [Start] to [End]

### Non-Compliance Details
| SLA Metric | Agreed Level | Actual | Variance | Impact |
|-----------|-------------|--------|----------|--------|
| [Metric] | [Target] | [Actual] | [Delta] | [Business Impact] |

### Financial Impact
- **Service Credits Due:** [$Amount]
- **Business Loss Estimated:** [$Amount]
- **Penalty Clause Triggered:** [Yes / No]

### Root Cause (Vendor Statement)
[Vendor's explanation]

### Our Assessment
[Security team's independent assessment]

### Remediation Required
1. [ ] [Remediation item]
2. [ ] [Remediation item]

### Escalation Path
- [ ] Vendor Account Manager notified
- [ ] Contractual remediation letter sent
- [ ] Legal team engaged
- [ ] Alternative vendor assessment initiated`,
        priority: 'HIGH',
        labels: ['sla', 'vendor-compliance', 'escalation'],
        issueType: 'Bug',
        customFields: {
            riskLevel: 'HIGH',
            complianceFrameworks: [],
            estimatedEffort: '8h',
            impactArea: 'Vendor Management',
            dueWithin: '5 business days',
        },
        suggestedAssignee: 'Vendor Manager',
    },

    // ─── Strategic ───
    {
        id: 'STR-001',
        category: 'STRATEGIC',
        name: 'Budget Approval Request',
        summary: '[BUDGET] FY[Year] — [Project/Initiative Name] — $[Amount]',
        description: `## Security Budget Approval Request

### Request Summary
- **Initiative:** [Project/Program Name]
- **Fiscal Year:** [FY YYYY]
- **Total Amount Requested:** $[Amount]
- **Budget Category:** [CAPEX / OPEX]
- **Duration:** [One-time / Multi-year]

### Business Case
[Why is this investment necessary? What risk does it mitigate?]

### Cost Breakdown
| Item | Vendor | Annual Cost | Multi-Year Total |
|------|--------|------------|-----------------|
| [License/Service] | [Vendor] | $[Amount] | $[Amount] |
| [Implementation] | [Internal/External] | $[Amount] | $[Amount] |
| [Training] | [Provider] | $[Amount] | $[Amount] |
| **Total** | | **$[Amount]** | **$[Amount]** |

### ROI Analysis
- **Risk Reduced:** [Quantified risk reduction]
- **Cost Avoidance:** [Estimated savings from prevented incidents]
- **Compliance Impact:** [frameworks satisfied]
- **Payback Period:** [Months]

### Alternatives Considered
| Option | Cost | Pros | Cons |
|--------|------|------|------|
| Option A | $[Amount] | [Pro] | [Con] |
| Option B | $[Amount] | [Pro] | [Con] |
| Do Nothing | $0 | None | [Risk accepted] |

### Approval
- [ ] CISO recommendation
- [ ] CFO budget allocation
- [ ] Board approval (if >$500K)`,
        priority: 'MEDIUM',
        labels: ['budget', 'strategic', 'investment'],
        issueType: 'Epic',
        customFields: {
            riskLevel: 'LOW',
            complianceFrameworks: [],
            estimatedEffort: '16h',
            impactArea: 'Strategic Planning',
            dueWithin: '4 weeks',
        },
        suggestedAssignee: 'CISO',
    },
    {
        id: 'STR-002',
        category: 'STRATEGIC',
        name: 'Board Report Preparation',
        summary: '[BOARD] Quarterly Security Report — Q[#] [Year]',
        description: `## Board Security Report Preparation

### Report Period
- **Quarter:** Q[#] [Year]
- **Presentation Date:** [Date]
- **Audience:** [Board of Directors / Audit Committee / Executive Team]
- **Time Allotted:** [Minutes]

### Required Sections
- [ ] Executive Summary (1 page)
- [ ] Threat Landscape Update
- [ ] Key Metrics Dashboard
- [ ] Incident Summary
- [ ] Compliance Status
- [ ] Risk Register Changes
- [ ] Budget vs. Actual
- [ ] Strategic Initiative Progress
- [ ] Key Decisions Required

### Key Metrics to Include
| Metric | This Quarter | Last Quarter | Trend |
|--------|-------------|-------------|-------|
| Security Incidents | [#] | [#] | [↑↓→] |
| MTTR | [hours] | [hours] | [↑↓→] |
| Compliance Score | [%] | [%] | [↑↓→] |
| Vulnerability Backlog | [#] | [#] | [↑↓→] |
| Training Completion | [%] | [%] | [↑↓→] |

### Board Questions to Anticipate
1. [Expected question and prepared answer]
2. [Expected question and prepared answer]

### Deliverables
- [ ] Slide deck (max 15 slides)
- [ ] One-page executive summary
- [ ] Appendix with detailed metrics`,
        priority: 'MEDIUM',
        labels: ['board-report', 'executive', 'quarterly'],
        issueType: 'Task',
        customFields: {
            riskLevel: 'LOW',
            complianceFrameworks: [],
            estimatedEffort: '24h',
            impactArea: 'Executive Reporting',
            dueWithin: '2 weeks',
        },
        suggestedAssignee: 'CISO',
    },
    {
        id: 'STR-003',
        category: 'STRATEGIC',
        name: 'Security Tool Procurement',
        summary: '[PROCUREMENT] [Tool Category] — Evaluation & Selection',
        description: `## Security Tool Procurement

### Requirement
- **Tool Category:** [SIEM / EDR / CSPM / SOAR / DLP / IAM / Other]
- **Business Need:** [Description]
- **Current Solution:** [Name or "None"]
- **Why Change:** [End of life / Capability gap / Cost / Performance]

### Requirements Matrix
| Requirement | Priority | Weight |
|-------------|----------|--------|
| [Requirement 1] | Must Have | 10 |
| [Requirement 2] | Must Have | 9 |
| [Requirement 3] | Should Have | 7 |
| [Requirement 4] | Nice to Have | 3 |

### Vendor Evaluation
| Criteria | Vendor A | Vendor B | Vendor C |
|----------|----------|----------|----------|
| Functionality | [1-5] | [1-5] | [1-5] |
| Integration | [1-5] | [1-5] | [1-5] |
| Cost (3yr TCO) | $[Amount] | $[Amount] | $[Amount] |
| Support Quality | [1-5] | [1-5] | [1-5] |
| Security Posture | [1-5] | [1-5] | [1-5] |
| **Total Score** | [Score] | [Score] | [Score] |

### Proof of Concept Plan
- **Duration:** [2-4 weeks]
- **Success Criteria:** [List measurable criteria]
- **Test Environment:** [Description]

### Budget & Timeline
- **Implementation Cost:** $[Amount]
- **Annual Licensing:** $[Amount]
- **Go-Live Target:** [Date]

### Approvals
- [ ] Security Architecture review
- [ ] IT Operations compatibility check
- [ ] Procurement / Legal contract review
- [ ] CISO sign-off
- [ ] Budget approval`,
        priority: 'LOW',
        labels: ['procurement', 'tool-evaluation', 'strategic'],
        issueType: 'Epic',
        customFields: {
            riskLevel: 'LOW',
            complianceFrameworks: [],
            estimatedEffort: '40h',
            impactArea: 'Security Architecture',
            dueWithin: '6 weeks',
        },
        suggestedAssignee: 'Security Architect',
    },
];

export function getTemplatesByCategory(category: TicketCategory): TicketTemplate[] {
    return TICKET_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): TicketTemplate | undefined {
    return TICKET_TEMPLATES.find(t => t.id === id);
}
