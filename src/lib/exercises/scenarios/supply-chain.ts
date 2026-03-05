import type { Scenario } from "../types";

export const supplyChainScenario: Scenario = {
    id: "scenario-supply-chain", slug: "supply-chain",
    title: "Operation Trojan Vendor",
    subtitle: "Supply Chain Compromise via Identity Management Platform",
    severity: "CRITICAL", icon: "🔗", color: "#f43f5e",
    briefing: "Your company uses 'SecureFlow', a widely-adopted identity management platform, across all 6 entities. SecureFlow has disclosed that a threat actor compromised their build pipeline 4 months ago, injecting a backdoor into updates shipped between November and February. Your systems auto-updated. The backdoor grants persistent access to any environment running SecureFlow v3.8.1–v3.8.4. Your SOC confirms: all 6 entities are running v3.8.3.",
    stakes: { revenue: 42, customers: 1200, entities: 6, auditIn: "4 weeks" },
    startDollars: 0, startRepInternal: 100, startRepExternal: 100,
    modes: ["decision", "discussion"],
    steps: [
        {
            id: 1, time: "T+0h", title: "Discovery & Initial Response",
            situation: "Your SOC has confirmed all 6 entities run SecureFlow v3.8.3 — the compromised version. The backdoor has been active for 4 months. Your identity infrastructure — SSO, MFA, service accounts — is potentially compromised.",
            decisions: [
                { id: "a", label: "Immediately revoke all SecureFlow tokens and force password resets company-wide", role: "vptech", dollars: -120000, repInt: -5, repExt: 0, consequence: "2,400 employees locked out for 4–6 hours. Productivity loss estimated at €120K. Internal Slack erupts. But the backdoor is neutralized immediately." },
                { id: "b", label: "Conduct silent investigation first — assess scope before taking disruptive action", role: "auditor", dollars: 0, repInt: 0, repExt: 0, consequence: "No disruption, but every hour the backdoor remains active increases exfiltration risk. Regulators will ask 'why did you wait?'" },
                { id: "c", label: "Disable SecureFlow entirely and switch to backup authentication (24h partial outage)", role: "vptech", dollars: -340000, repInt: -15, repExt: -5, consequence: "Nuclear option. Every SaaS tool, internal system, customer portal goes dark. SLA breach notifications triggered." }
            ],
            questions: [
                { role: "vptech", q: "What is the fastest way to neutralize the backdoor without a full outage?", tension: "Speed vs. thoroughness — partial measures may leave the backdoor active in forgotten service accounts." },
                { role: "cfo", q: "What is the financial exposure if we shut down for 24 hours vs. continued unauthorized access?", tension: "Downtime cost is quantifiable. Ongoing exfiltration cost is not — but could be far greater." },
                { role: "legal", q: "What are our notification obligations under GDPR Article 33?", tension: "The 72-hour clock likely started when SecureFlow notified you." },
                { role: "auditor", q: "How does this impact our ISO 27001 certification?", tension: "ISMS is measured by response. But 4-month undetected compromise raises questions." },
                { role: "impl", q: "Do we have a backup authentication system ready?", tension: "Backup may exist in theory but hasn't been tested at scale." }
            ],
            inject: null, deadline: "72 hours (GDPR Article 33 notification)", comms: null
        },
        {
            id: 2, time: "T+4h", title: "Scope Assessment & Board Communication",
            situation: "Forensics underway. Initial findings: backdoor used to access authentication tokens across all entities. Board chair has 'notify within 6 hours' policy. Clock at T+4h.",
            decisions: [
                { id: "a", label: "Brief board with full transparency: 'We were compromised for 4 months, scope unknown'", role: "cfo", dollars: -50000, repInt: 10, repExt: 0, consequence: "Board appreciates honesty. BUT one board member leaks to a journalist." },
                { id: "b", label: "Brief board with measured language: 'Potential exposure via vendor, investigating'", role: "cfo", dollars: -25000, repInt: -5, repExt: 0, consequence: "Board calm now, but feels underinformed when full scope emerges. Trust erosion with chair." },
                { id: "c", label: "Delay board notification until forensics complete (48 hours)", role: "cfo", dollars: 0, repInt: -20, repExt: 0, consequence: "Board chair sees news on Reuters. 'Why am I hearing this from media?' Insurance notification clock may void policy." }
            ],
            questions: [
                { role: "cfo", q: "How do we frame financial exposure without causing panic?", tension: "Understating erodes trust. Overstating may trigger premature disclosure." },
                { role: "legal", q: "Does our board notification policy create a legal obligation?", tension: "Governance best practice can become legal obligation if referenced in insurance contracts." },
                { role: "auditor", q: "How should we document board communication for audit evidence?", tension: "Everything documented becomes discoverable. Not documenting is worse." }
            ],
            inject: { time: "T+3h", event: "SecureFlow releases technical advisory with IOCs. Security Twitter buzzing.", severity: "HIGH" },
            deadline: "Board notification policy: 6 hours",
            comms: { audience: "Board of Directors", template: "Subject: [CONFIDENTIAL] Material Cybersecurity Event\n\nDear Board Members,\n\n[SITUATION SUMMARY]\n[IMMEDIATE ACTIONS TAKEN]\n[CURRENT STATUS]\n[NEXT STEPS]\n[FINANCIAL EXPOSURE ESTIMATE]" }
        },
        {
            id: 3, time: "T+12h", title: "Customer Communication Decision",
            situation: "Forensics confirmed: attacker accessed authentication infrastructure. 1,200 customers across 6 jurisdictions. Some have contractual notification clauses. SecureFlow published affected versions list.",
            decisions: [
                { id: "a", label: "Proactive disclosure to ALL customers", role: "legal", dollars: -180000, repInt: 5, repExt: 15, consequence: "€180K support surge. But analysts praise transparency. Two new prospects call BECAUSE of the response." },
                { id: "b", label: "Notify only contractually-obligated customers", role: "legal", dollars: -45000, repInt: 0, repExt: -10, consequence: "Minimum obligation met. Non-notified customers discover from SecureFlow's public list." },
                { id: "c", label: "Wait for forensics before any customer communication", role: "legal", dollars: 0, repInt: 0, repExt: -25, consequence: "SecureFlow publishes affected list including you. Thai gov client triggers 48-hour clause — €2.1M contract at risk.", isBlunder: true }
            ],
            questions: [
                { role: "legal", q: "Which jurisdictions have mandatory breach notification timelines?", tension: "Germany (72h), UK (72h), Thailand (72h), Australia (30 days). You may already be non-compliant." },
                { role: "cfo", q: "Cost of proactive disclosure vs. contractual penalties?", tension: "Proactive costs more upfront but may save millions in cancellations." },
                { role: "impl", q: "Do we have support capacity for 1,200 simultaneous inquiries?", tension: "If you promise transparency but can't answer questions, you look worse." }
            ],
            inject: { time: "T+10h", event: "Security researcher publishes blog mapping affected customers. You are named.", severity: "CRITICAL" },
            deadline: "Thai gov contract: 48-hour clause",
            comms: { audience: "All Customers", template: "Subject: Important Security Notice — Action Required\n\n[WHAT HAPPENED]\n[WHAT DATA MAY BE AFFECTED]\n[WHAT WE'RE DOING]\n[WHAT YOU SHOULD DO]\n[HOW TO REACH US]" }
        },
        {
            id: 4, time: "T+24h", title: "Forensics Reveal — The Real Damage",
            situation: "Attacker exfiltrated 12,400 customer records + 3 internal docs: security architecture diagram, vendor risk assessment rating SecureFlow 'Low Risk', draft NIS2 compliance gap presentation.",
            decisions: [
                { id: "a", label: "Full disclosure to all stakeholders", role: "legal", dollars: -420000, repInt: 5, repExt: 10, consequence: "Massive effort across 5 jurisdictions. German BfDI commends 'exemplary incident response.' Insurance covers 60%." },
                { id: "b", label: "Disclose customer data but minimize internal document theft", role: "legal", dollars: -280000, repInt: -10, repExt: -5, consequence: "Attacker leaks architecture diagram 2 weeks later. Researcher tweets about the omission. Credibility destroyed.", isBlunder: true },
                { id: "c", label: "Classify internal docs as 'not personal data' — only notify about customer records", role: "auditor", dollars: -200000, repInt: -5, repExt: 0, consequence: "Technically correct. But NIS2 gap doc in attacker hands. ISO auditor questions the 'Low Risk' rating." }
            ],
            questions: [
                { role: "auditor", q: "The 'Low Risk' vendor assessment — how do we address this?", tension: "Assessment followed methodology correctly. SecureFlow WAS low risk. Methodology may be flawed." },
                { role: "legal", q: "Are we obligated to disclose non-personal-data theft under NIS2?", tension: "NIS2 'significant incident' may encompass security architecture compromise." },
                { role: "vptech", q: "Given compromised architecture diagram, what emergency changes needed?", tension: "Changing everything is expensive. But every documented vector is now known." }
            ],
            inject: { time: "T+22h", event: "Dark web monitoring detects exfiltrated records on ransomware forum.", severity: "CRITICAL" },
            deadline: "GDPR: 72 hours from discovery", comms: null
        },
        {
            id: 5, time: "T+48h", title: "The Media Amplification",
            situation: "Journalist publishes deep-dive naming 47 affected companies including yours. 12% valuation hit. Every major outlet wants a comment.",
            decisions: [
                { id: "a", label: "CEO does live interview, prepared by crisis PR firm", role: "cfo", dollars: -60000, repInt: 10, repExt: 20, consequence: "'No company is immune, but every company can control how they respond.' Goes viral. Stock recovers 4%." },
                { id: "b", label: "Issue written statement only — no interviews", role: "legal", dollars: -15000, repInt: 0, repExt: -10, consequence: "'Company declined to comment beyond a prepared statement.' Narrative controlled by journalist." },
                { id: "c", label: "CEO goes off-script, downplays severity", role: "cfo", dollars: -800000, repInt: -25, repExt: -40, consequence: "CATASTROPHIC. '#Boycott' trends. 3 customers terminate. 5 engineers update LinkedIn. €800K crisis PR.", isBlunder: true }
            ],
            questions: [
                { role: "cfo", q: "How do we prepare the CEO for live media?", tension: "Overly scripted feels hollow. Off-script creates catastrophic risk." },
                { role: "legal", q: "What can we legally say without prejudicing investigations?", tension: "Too little looks evasive. Too much may waive privilege." },
                { role: "impl", q: "How do we handle internal impact of media coverage?", tension: "External and internal messaging must be consistent." }
            ],
            inject: { time: "T+46h", event: "Reuters picks up the story. Board member calls CEO directly.", severity: "CRITICAL" },
            deadline: null,
            comms: { audience: "Media / Public", template: "PREPARED STATEMENT\n\n[ACKNOWLEDGE SITUATION]\n[DESCRIBE ACTIONS]\n[EMPHASIZE CUSTOMER PROTECTION]\n[COMMIT TO TRANSPARENCY]" }
        },
        {
            id: 6, time: "T+72h", title: "Internal Communication Crisis",
            situation: "Employees anxious. Rumors on Slack. 3 senior engineers approached by recruiters. CISO considering resignation. 40% Glassdoor spike.",
            decisions: [
                { id: "a", label: "CEO holds all-hands with full transparency, Q&A, acknowledges team", role: "impl", dollars: -30000, repInt: 25, repExt: 5, consequence: "Standing ovation. CISO stays. Engineers tell recruiters 'not interested.' Retention crisis averted." },
                { id: "b", label: "Send internal email update — factual but no Q&A", role: "impl", dollars: -5000, repInt: -10, repExt: 0, consequence: "CISO interprets lack of support as blame. Senior architect gives notice (€180K replacement)." },
                { id: "c", label: "Focus on external crisis — internal comms can wait", role: "cfo", dollars: -450000, repInt: -35, repExt: -5, consequence: "DEVASTATING. Engineer posts on Blind. CISO resigns. 5 engineers leave in 30 days.", isBlunder: true }
            ],
            questions: [
                { role: "impl", q: "How do we acknowledge the security team while incident is ongoing?", tension: "Celebrating too early seems premature. Waiting may be too late." },
                { role: "cfo", q: "What retention measures should we deploy immediately?", tension: "Retention bonuses feel transactional. Genuine leadership is more effective." },
                { role: "legal", q: "How do we balance transparency with employees while protecting privilege?", tension: "Employees detect evasion. Anything shared can be subpoenaed." }
            ],
            inject: { time: "T+70h", event: "Glassdoor review: 'Leadership invisible during worst crisis in history.'", severity: "CRITICAL" },
            deadline: null,
            comms: { audience: "All Employees", template: "Subject: Addressing the SecureFlow Incident\n\n[ACKNOWLEDGE DIFFICULTY]\n[WHAT HAPPENED]\n[WHAT WE'RE DOING]\n[RECOGNIZE THE TEAM]\n[WHAT COMES NEXT]" }
        },
        {
            id: 7, time: "T+7d", title: "Vendor Accountability & Contract Review",
            situation: "SecureFlow offers 2-year free subscription + $10M collective fund (~€200K your share). Vendor risk rated them 'Low Risk' 6 months ago.",
            decisions: [
                { id: "a", label: "Accept offer AND pursue independent legal action for full damages", role: "legal", dollars: 200000, repInt: 5, repExt: 5, consequence: "Expected recovery €800K in 18–24 months. Signals accountability to all vendors." },
                { id: "b", label: "Accept offer and move on", role: "cfo", dollars: 200000, repInt: 0, repExt: -5, consequence: "Quick relief but absorb €1M+ unrecovered. Precedent: accountability optional." },
                { id: "c", label: "Publicly terminate SecureFlow + issue accountability statement", role: "vptech", dollars: -280000, repInt: 10, repExt: 15, consequence: "Goes viral in CISO circles. 3 conference invitations. Migration costs but massive rep boost." }
            ],
            questions: [
                { role: "legal", q: "What legal options given the liability cap?", tension: "Liability caps generally enforceable. Gross negligence may override." },
                { role: "cfo", q: "Total cost of migrating vs. continuing with SecureFlow?", tension: "Migration is expensive. Staying signals acceptance of risk." },
                { role: "auditor", q: "How do we update vendor risk assessment methodology?", tension: "Methodology worked. Failure was SecureFlow's security, not your assessment." }
            ],
            inject: null, deadline: null, comms: null
        },
        {
            id: 8, time: "T+14d", title: "Regulatory Response & ISO Audit Preparation",
            situation: "German BfDI: 22-question inquiry. UK ICO investigation. Thai PDPC meeting. ISO audit in 4 weeks.",
            decisions: [
                { id: "a", label: "Proceed with audit — present incident response as evidence of mature ISMS", role: "auditor", dollars: -80000, repInt: 10, repExt: 10, consequence: "Auditor: 'ISMS measured by how you respond.' Minor non-conformity. Certification maintained." },
                { id: "b", label: "Request 3-month audit postponement", role: "auditor", dollars: -40000, repInt: -10, repExt: -10, consequence: "'They delayed because they weren't ready.' Competitor sales reps tell prospects." },
                { id: "c", label: "Switch auditing bodies for 'fresh start'", role: "cfo", dollars: -120000, repInt: -15, repExt: -20, consequence: "Looks terrible. New auditor MORE scrutinizing. 6-month cert gap." }
            ],
            questions: [
                { role: "auditor", q: "What evidence demonstrates ISMS maturity through this incident?", tension: "Incident itself is evidence. But vendor assessment failure is a gap." },
                { role: "legal", q: "How do we coordinate responses across 4 jurisdictions?", tension: "Regulators share information. Discrepancies will be found." },
                { role: "vptech", q: "What technical improvements can we demonstrate in 14 days?", tension: "Quick wins look superficial. Deep changes take time." }
            ],
            inject: { time: "T+12d", event: "BfDI formal inquiry received. Response deadline: 14 days.", severity: "HIGH" },
            deadline: "BfDI: 14 days | ISO audit: 4 weeks", comms: null
        },
        {
            id: 9, time: "T+30d", title: "Customer Retention & Revenue Recovery",
            situation: "7% churn (~€880K ARR lost). 15% request enhanced security. 3 new prospects cited incident response as differentiator.",
            decisions: [
                { id: "a", label: "Launch Security Transparency Program (public dashboard, quarterly reports)", role: "cfo", dollars: -200000, repInt: 15, repExt: 25, consequence: "Churn drops to 2%. 5 new enterprise wins. Analyst report inclusion." },
                { id: "b", label: "Offer 20% discount for 12 months", role: "cfo", dollars: -350000, repInt: 0, repExt: 5, consequence: "Retains most but sets precedent. Doesn't address root concern." },
                { id: "c", label: "Focus on winning new customers to replace churned", role: "cfo", dollars: -300000, repInt: -10, repExt: -15, consequence: "Existing customers feel neglected. Net ARR growth negative." }
            ],
            questions: [
                { role: "cfo", q: "Realistic revenue recovery timeline?", tension: "Honest: 12–18 months. Board wants 6." },
                { role: "vptech", q: "What transparency can we provide without exposing attack surface?", tension: "Sharing metrics builds trust. Too much creates vulnerabilities." },
                { role: "impl", q: "How do we resource a Transparency Program without burnout?", tension: "Team is exhausted. Waiting means losing momentum." }
            ],
            inject: { time: "T+28d", event: "Three enterprise prospects cite your incident response as a differentiator.", severity: "POSITIVE" },
            deadline: null, comms: null
        },
        {
            id: 10, time: "T+90d", title: "Long-Term Strategic Decision",
            situation: "Remediation complete. ISO passed with observations. Regulatory ongoing but manageable.",
            decisions: [
                { id: "a", label: "Establish independent Security Advisory Board + annual security reports", role: "cfo", dollars: -150000, repInt: 20, repExt: 30, consequence: "Insurance premiums decrease 15%. Net positive ROI within 3 years." },
                { id: "b", label: "Invest in technical hardening only (zero trust, micro-seg, EDR)", role: "vptech", dollars: -500000, repInt: 10, repExt: 5, consequence: "Materially more secure but no external visibility. Customers don't KNOW you're safer." },
                { id: "c", label: "Return to business as usual", role: "cfo", dollars: 0, repInt: -25, repExt: -30, consequence: "Security team morale collapses. Insurance +40%. -€2M estimated over 3 years.", isBlunder: true }
            ],
            questions: [
                { role: "cfo", q: "3-year TCO of each option?", tension: "'Business as usual' has hidden costs far larger than visible ones." },
                { role: "auditor", q: "Which option best positions for ISO 27001 and NIS2?", tension: "All achieve compliance. Compliance isn't security. Security isn't trust." },
                { role: "impl", q: "What does the security team need most?", tension: "They need to see their crisis work mattered." }
            ],
            inject: null, deadline: null, comms: null
        }
    ]
};
