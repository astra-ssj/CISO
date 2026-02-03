export interface VerifiedClause {
    id: string;
    title: string;
    category: 'Legal' | 'Security' | 'Compliance' | 'SLA';
    content: string;
    source: string;
    riskLevel: 'Low' | 'Medium' | 'High';
}

export const GOLDEN_LIBRARY: VerifiedClause[] = [
    {
        id: 'indem-1',
        title: 'Standard Indemnification (Mutual)',
        category: 'Legal',
        content: "Each party shall indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with any third-party claim alleging that the indemnifying party's negligence or willful misconduct caused bodily injury or property damage.",
        source: 'Legal Dept (Approved 2025-Q4)',
        riskLevel: 'Low'
    },
    {
        id: 'lim-liab-1',
        title: 'Limitation of Liability (Cap at Fees)',
        category: 'Legal',
        content: "EXCEPT FOR: (A) A PARTY'S INDEMNIFICATION OBLIGATIONS; (B) A PARTY'S BREACH OF CONFIDENTIALITY; OR (C) GROSS NEGLIGENCE OR WILLFUL MISCONDUCT, IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL AMOUNT PAID BY CUSTOMER HEREUNDER IN THE TWELVE (12) MONTHS PRECEDING THE FIRST INCIDENT OUT OF WHICH THE LIABILITY AROSE.",
        source: 'Legal Dept (Approved 2025-Q4)',
        riskLevel: 'Medium'
    },
    {
        id: 'gdpr-proc-1',
        title: 'GDPR Data Processing (Article 28)',
        category: 'Compliance',
        content: "The Processor shall only process Personal Data on documented instructions from the Controller, including with regard to transfers of personal data to a third country or an international organisation, unless required to do so by Union or Member State law to which the Processor is subject.",
        source: 'DPO Office',
        riskLevel: 'Low'
    },
    {
        id: 'sec-inc-1',
        title: 'Security Incident Notification (72h)',
        category: 'Security',
        content: "In the event of a Security Incident, Provider shall notify Customer without undue delay, and in any event within seventy-two (72) hours of becoming aware of the Security Incident. Such notification shall describe the nature of the Security Incident, the data affected, and the immediate mitigation steps taken.",
        source: 'CISO Policy 8.2',
        riskLevel: 'High'
    },
    {
        id: 'sla-uptime-1',
        title: 'SLA - 99.9% Uptime Commitment',
        category: 'SLA',
        content: "Provider will use commercially reasonable efforts to make the Service available with a Monthly Uptime Percentage of at least 99.9% during any monthly billing cycle (the 'Service Level Commitment').",
        source: 'Engineering / Product',
        riskLevel: 'Medium'
    }
];
