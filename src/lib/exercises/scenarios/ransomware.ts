import type { Scenario } from "../types";

export const ransomwareScenario: Scenario = {
    id: "scenario-ransomware", slug: "ransomware",
    title: "Operation Midnight Lock",
    subtitle: "Ransomware Attack with Data Exfiltration",
    severity: "CRITICAL", icon: "🔒", color: "#ef4444",
    briefing: "At 02:47 AM local time, your SOC receives automated alerts: file encryption detected across 3 of 6 entities (Germany, UK, Thailand). The ransomware variant is identified as 'NightCrypt' — a sophisticated strain linked to a Russian-speaking threat group. The attackers have already exfiltrated an estimated 2TB of data before triggering encryption. A ransom note demands 150 BTC (~€4.2M) with a 72-hour deadline. Your backups exist but haven't been tested for full-environment restoration. The attackers claim they will publish stolen data if ransom is not paid.",
    stakes: { revenue: 42, customers: 1200, entities: 6, auditIn: "8 weeks" },
    startDollars: 0, startRepInternal: 100, startRepExternal: 100,
    modes: ["decision", "discussion"],
    steps: [
        {
            id: 1, time: "T+0h", title: "Initial Detection & Containment",
            situation: "02:47 AM: Automated alerts fire. File encryption detected across Germany, UK, and Thailand entities. Australia, Spain, and US are currently unaffected. The ransomware is spreading via lateral movement through Active Directory. Your network segmentation between entities exists but wasn't designed for this scenario.",
            decisions: [
                { id: "a", label: "Immediately isolate all 6 entities — kill network connections company-wide", role: "vptech", dollars: -200000, repInt: -10, repExt: -5, consequence: "Total blackout. Ransomware contained to 3 entities. But 3 unaffected entities now also offline. Customer-facing services down globally. €200K in SLA breach costs." },
                { id: "b", label: "Isolate only the 3 affected entities — keep unaffected entities running", role: "vptech", dollars: -50000, repInt: 0, repExt: 0, consequence: "Surgical approach. But lateral movement exploits a trust relationship you didn't know existed. Within 4 hours, Spain entity is also compromised. Partial response questioned." },
                { id: "c", label: "Attempt to stop encryption in-place without network isolation", role: "vptech", dollars: -500000, repInt: -5, repExt: -10, consequence: "Too slow. By the time countermeasures deploy, encryption completes on all 3 entities. Attacker detects your response and triggers encryption on 2 additional entities. Total damage: 5 of 6 entities encrypted." }
            ],
            questions: [
                { role: "vptech", q: "Can we contain this without total network isolation? What are the lateral movement vectors?", tension: "Surgical containment is ideal but requires understanding attack paths you may not fully map in minutes." },
                { role: "cfo", q: "What's the hourly cost of total blackout vs. the risk of spreading encryption?", tension: "Every hour of downtime costs €25K+. But every hour of uncontained ransomware encrypts more data." },
                { role: "legal", q: "At what point are we required to notify law enforcement?", tension: "Early notification helps. But law enforcement involvement may leak and spook the attackers into publishing data early." },
                { role: "auditor", q: "What evidence do we need to preserve for forensics?", tension: "Preservation competes with containment. Wiping and restoring is faster but destroys evidence." },
                { role: "impl", q: "Who do we wake up? What's the escalation protocol at 3 AM?", tension: "Full team response is needed but burnout starts at hour 1 if everyone is called in." }
            ],
            inject: null, deadline: "Ransom deadline: 72 hours", comms: null
        },
        {
            id: 2, time: "T+2h", title: "The Ransom Demand & Law Enforcement",
            situation: "Ransom note decoded: 150 BTC (~€4.2M). 72-hour deadline. The attackers demonstrate proof of exfiltration — they've sent you a sample folder containing 500 customer contracts. They threaten to publish all 2TB on their leak site. Your cyber insurance policy covers ransom payments (unusual) but requires law enforcement notification first.",
            decisions: [
                { id: "a", label: "Notify law enforcement immediately (BKA/NCA/FBI joint coordination)", role: "legal", dollars: -30000, repInt: 5, repExt: 5, consequence: "Law enforcement engaged. They've seen NightCrypt before — they have a partial decryptor. Insurance notification requirement met. Coordination overhead: €30K legal costs." },
                { id: "b", label: "Engage private ransomware negotiation firm first, law enforcement later", role: "cfo", dollars: -80000, repInt: 0, repExt: 0, consequence: "Negotiator makes contact. Opens dialogue. But 8-hour delay in law enforcement notification risks insurance coverage. Negotiator fee: €80K regardless of outcome." },
                { id: "c", label: "Attempt to pay the ransom quickly and quietly before news breaks", role: "cfo", dollars: -4200000, repInt: -20, repExt: -30, consequence: "CATASTROPHIC financially. €4.2M paid. Decryptor works... partially. 30% of data unrecoverable. Attackers demand additional payment. Insurance voided due to no law enforcement notification. Regulatory fines for undisclosed payment.", isBlunder: true }
            ],
            questions: [
                { role: "cfo", q: "Should we pay the ransom? What's the calculus?", tension: "Payment funds criminal enterprises. But the data leak could be more damaging. There's no clean answer." },
                { role: "legal", q: "Are there sanctions implications in paying this group?", tension: "If the group is sanctioned, payment is a criminal offense. Attribution may not be clear enough to confirm." },
                { role: "auditor", q: "How does ransom payment affect our regulatory standing?", tension: "Some regulators view payment as a pragmatic decision. Others view it as enabling criminal activity." }
            ],
            inject: { time: "T+1h", event: "Attackers send proof: 500 customer contracts from exfiltrated data. 'This is 0.01% of what we have.'", severity: "CRITICAL" },
            deadline: "72 hours to ransom deadline | Insurance notification: immediate",
            comms: null
        },
        {
            id: 3, time: "T+6h", title: "Backup Assessment & Recovery Planning",
            situation: "Good news: backups exist for all entities. Bad news: they've never been tested for full-environment restoration. Estimated recovery time: 5-10 days IF backups are intact. The ransomware may have infected backup systems too — you need to verify. Meanwhile, customers are calling. Your support team has no answers.",
            decisions: [
                { id: "a", label: "Begin immediate backup restoration in isolated environment — validate before deploying", role: "vptech", dollars: -150000, repInt: 10, repExt: 5, consequence: "Methodical approach. Backups validated — 85% intact. Restoration begins. 5-day estimated recovery. Customers given honest timeline. €150K in overtime and infrastructure costs." },
                { id: "b", label: "Attempt to decrypt in-place using law enforcement's partial decryptor", role: "vptech", dollars: -30000, repInt: 5, repExt: 0, consequence: "Decryptor works on 60% of files. Remaining 40% need backup restoration anyway. Hybrid recovery takes 7 days total. Some data permanently lost. Mixed success." },
                { id: "c", label: "Rebuild from scratch — clean install everything", role: "vptech", dollars: -400000, repInt: -15, repExt: -10, consequence: "Cleanest option but slowest: 14-day recovery. Customer data needs re-import. Configuration drift from production. €400K in engineering time. Customers defect during 2-week outage." }
            ],
            questions: [
                { role: "vptech", q: "How confident are we that backups are clean? Could the ransomware have infected them?", tension: "Backups were on the same network. There's a non-zero chance they're compromised too." },
                { role: "cfo", q: "What's the daily cost of operations being down?", tension: "Direct cost: €75K/day. Indirect cost (customer trust, delayed deals): incalculable but larger." },
                { role: "impl", q: "Do we have the team capacity for a multi-day recovery operation?", tension: "The team has been up since 3 AM. Sustained operations require shift rotations you may not have planned for." }
            ],
            inject: { time: "T+5h", event: "SOC discovers ransomware dormant payload in one backup set. Others appear clean.", severity: "HIGH" },
            deadline: "Customer SLAs: various (24h to 72h)", comms: null
        },
        {
            id: 4, time: "T+12h", title: "Customer & Regulatory Notification",
            situation: "12 hours in. 3 entities still down. Exfiltrated data confirmed to include customer PII across all 6 jurisdictions. GDPR 72-hour clock started at T+0h. You have 60 hours remaining. Multi-jurisdiction notification is a logistical nightmare. Customers are posting on social media: 'Is [Company] down for anyone else?'",
            decisions: [
                { id: "a", label: "Simultaneous notification to all regulators and all customers", role: "legal", dollars: -250000, repInt: 10, repExt: 15, consequence: "Massive coordination effort. But message is consistent. Regulators appreciate proactive approach. Customers feel respected. €250K in legal and communication costs." },
                { id: "b", label: "Notify regulators first, then customers in priority order", role: "legal", dollars: -120000, repInt: 0, repExt: -5, consequence: "Regulators notified. But staged customer notification means some learn from social media before your email. 'Why was I last to know?'" },
                { id: "c", label: "Notify only jurisdictions where you have confirmed data exposure", role: "legal", dollars: -60000, repInt: -5, repExt: -15, consequence: "Minimal obligation met. But forensics later reveal exposure in non-notified jurisdictions. 'They knew and didn't tell us.' Regulatory penalties escalate." }
            ],
            questions: [
                { role: "legal", q: "How do we coordinate notification across Germany, UK, Thailand, Australia, Spain, and California?", tension: "Each jurisdiction has different timelines, formats, and requirements. Contradictions between filings will be found." },
                { role: "cfo", q: "What customer communication approach minimizes churn?", tension: "Transparency increases short-term churn as some panic. But it prevents the larger second wave when hidden details emerge." },
                { role: "impl", q: "Do we have the bandwidth for multi-jurisdiction regulatory filings right now?", tension: "The team managing recovery is the same team needed for regulatory filings. Both are urgent." }
            ],
            inject: { time: "T+10h", event: "Customer tweets: 'All our data hosted with [Company] is inaccessible. No communication from them.' 500 retweets.", severity: "CRITICAL" },
            deadline: "GDPR: 60 hours remaining",
            comms: { audience: "Regulators (BfDI, ICO, PDPC, OAIC)", template: "BREACH NOTIFICATION — Article 33 GDPR\n\n[NATURE OF BREACH]\n[CATEGORIES OF DATA]\n[APPROXIMATE NUMBER OF RECORDS]\n[LIKELY CONSEQUENCES]\n[MEASURES TAKEN]\n[DPO CONTACT DETAILS]" }
        },
        {
            id: 5, time: "T+24h", title: "The Data Leak Threat Escalates",
            situation: "24 hours. Attackers publish a 'teaser' on their leak site: 100 customer records with full PII. They announce remaining data will be published in 48 hours unless ransom is paid. Media picks it up. Your stock/valuation drops 18%. Board emergency session convened.",
            decisions: [
                { id: "a", label: "Public statement acknowledging the breach, outlining response, committing to affected customers", role: "cfo", dollars: -100000, repInt: 10, repExt: 10, consequence: "Honest, forward-facing. CEO statement resonates. Insurance PR support deployed. Stock recovers 5% within 48 hours. €100K crisis comms cost." },
                { id: "b", label: "Engage ransomware negotiator to buy time — negotiate payment down while recovery continues", role: "cfo", dollars: -200000, repInt: 0, repExt: -5, consequence: "Negotiator reduces demand to 80 BTC (~€2.2M). Buys 48 more hours. But leaked negotiation transcript embarrasses company: 'They were haggling over our data.'" },
                { id: "c", label: "Ignore the threat — refuse to engage with criminals", role: "legal", dollars: -800000, repInt: -10, repExt: -25, consequence: "Principled stance. But attacker publishes 500K records. Class action lawsuit filed within 48 hours. €800K in immediate legal defense costs. Long-term exposure: €5M+.", isBlunder: true }
            ],
            questions: [
                { role: "cfo", q: "How do we communicate to the board that paying ransom may be the least bad option?", tension: "The board has a fiduciary duty to protect the company. But ransom payment creates moral and legal complications." },
                { role: "legal", q: "What's our liability exposure for the published customer data?", tension: "Published PII triggers individual notification requirements, potential class actions, and regulatory enforcement." },
                { role: "vptech", q: "Can we accelerate recovery to undercut the attacker's leverage?", tension: "Faster recovery reduces ransom leverage but increases risk of errors in restoration." }
            ],
            inject: { time: "T+22h", event: "Attackers publish 100 customer records on leak site. Media coverage begins.", severity: "CRITICAL" },
            deadline: "48 hours to data dump",
            comms: { audience: "All Stakeholders", template: "INCIDENT UPDATE\n\n[CURRENT STATUS]\n[WHAT WE KNOW]\n[ACTIONS BEING TAKEN]\n[TIMELINE FOR RESOLUTION]\n[SUPPORT RESOURCES]" }
        },
        {
            id: 6, time: "T+48h", title: "Recovery Operations & Employee Impact",
            situation: "Recovery proceeding — 2 entities restored, 1 in progress. Employees have been working 18-hour shifts. Three team members show signs of burnout. Customer support queue: 2,400 unresolved tickets. Media cycle has moved to 'company response' angle.",
            decisions: [
                { id: "a", label: "Institute mandatory rest rotations + bring in external incident response team", role: "impl", dollars: -120000, repInt: 20, repExt: 5, consequence: "External team (CrowdStrike/Mandiant) supplements exhausted internal team. Mandatory 8-hour rest periods. Recovery quality improves. Team feels supported. Morale stabilizes." },
                { id: "b", label: "Push through with current team — we're almost there", role: "vptech", dollars: -20000, repInt: -15, repExt: 0, consequence: "Team pushes through but makes errors. Misconfiguired restore destroys 2 days of customer data. 3 team members take sick leave after recovery. One files stress-related worker's comp claim." },
                { id: "c", label: "Outsource entire recovery to managed service provider", role: "cfo", dollars: -300000, repInt: -20, repExt: 0, consequence: "MSP doesn't know your environment. Recovery takes 3 additional days. Internal team feels sidelined: 'We built it, we should fix it.' Knowledge gap creates ongoing issues." }
            ],
            questions: [
                { role: "impl", q: "How do we sustain incident response operations beyond 48 hours?", tension: "Incident response training covers the first 24 hours. Long-duration incidents require operational planning most teams don't have." },
                { role: "cfo", q: "What's the cost of bringing in external incident response vs. extending internal operations?", tension: "External teams are expensive ($500/hr+). But internal team errors from exhaustion can cost more." },
                { role: "auditor", q: "How do we maintain evidence chain of custody during recovery?", tension: "Recovery operations may overwrite evidence. Forensic preservation and rapid recovery are in direct conflict." }
            ],
            inject: null, deadline: null, comms: null
        },
        {
            id: 7, time: "T+7d", title: "Post-Recovery Assessment & Insurance",
            situation: "All entities restored. Data loss: 0.5% (acceptable). Business operations resumed. Now: insurance claim, regulatory responses, and the hard question — what failed in your defenses? Your cyber insurance policy has a €5M limit. Estimated total incident cost: €3.2M and climbing.",
            decisions: [
                { id: "a", label: "Full insurance claim with transparent damage assessment", role: "cfo", dollars: 2500000, repInt: 10, repExt: 5, consequence: "Insurance covers €2.5M of €3.2M total. Transparent assessment builds insurer relationship. Premium increase: 25% but coverage maintained. Net recovery: +€2.5M." },
                { id: "b", label: "Maximize insurance claim — include all possible costs", role: "cfo", dollars: 3000000, repInt: 0, repExt: 0, consequence: "Aggressive claim: €3M. Insurer accepts €2.8M after negotiation. But relationship strained. Insurer assigns dedicated auditor for next renewal. Premium increase: 40%." },
                { id: "c", label: "Minimize insurance involvement — handle costs internally", role: "cfo", dollars: 0, repInt: -10, repExt: -5, consequence: "€3.2M absorbed. Board questions why insurance wasn't used. Premium still increases because the incident is reported anyway. Worst of both worlds." }
            ],
            questions: [
                { role: "cfo", q: "How do we optimize the insurance claim without jeopardizing the relationship?", tension: "Aggressive claims recover more now but may make future coverage harder or more expensive." },
                { role: "auditor", q: "What root causes should we document for the post-incident review?", tension: "Root cause analysis must be honest. But honest analysis creates evidence that regulators and plaintiffs can use." },
                { role: "legal", q: "How do we handle the post-incident review while litigation is pending?", tension: "Privilege applies to legal advice, not business analysis. Keep them separate or privilege is waived." }
            ],
            inject: { time: "T+6d", event: "Insurance assessor arrives. Requests complete incident timeline and decision log.", severity: "HIGH" },
            deadline: "Insurance claim: 30-day filing window", comms: null
        },
        {
            id: 8, time: "T+14d", title: "Regulatory Response & Legal Exposure",
            situation: "All 5 applicable regulatory bodies have responded. BfDI has questions about the 4-hour delay in notification. ICO wants details on cross-border data flows. Thai PDPC focuses on the customer data exposure. Class action preliminary filings in Germany and UK. The legal landscape is complex and multi-jurisdictional.",
            decisions: [
                { id: "a", label: "Proactive regulatory engagement — exceed minimum requirements in all jurisdictions", role: "legal", dollars: -200000, repInt: 5, repExt: 15, consequence: "Regulators note the proactive approach. BfDI publishes your response as a 'case study in incident reporting.' Fines reduced by 60%. Legal costs: €200K." },
                { id: "b", label: "Comply with minimum requirements — respond to what's asked, nothing more", role: "legal", dollars: -100000, repInt: 0, repExt: -5, consequence: "Requirements met. But regulators interpret minimum compliance as defensive posture. Full fine schedule applied. Total regulatory costs: €100K legal + potential €500K fines." },
                { id: "c", label: "Challenge regulatory jurisdiction where possible to reduce exposure", role: "legal", dollars: -350000, repInt: -10, repExt: -20, consequence: "Aggressive legal strategy backfires. Regulators coordinate response (they talk to each other). BfDI escalates to EDPB. Combined fine: €1.2M. Media: 'Company fights regulators instead of protecting customers.'", isBlunder: true }
            ],
            questions: [
                { role: "legal", q: "How do coordinated multi-jurisdictional regulatory responses work?", tension: "GDPR's consistency mechanism means regulators share information. Playing them off each other doesn't work." },
                { role: "cfo", q: "What's the expected total regulatory and legal cost?", tension: "Regulatory fines: €500K–€2M. Class action exposure: €2M–€5M. Total legal defense: €500K–€1M." },
                { role: "auditor", q: "How do we use regulatory responses as input for ISMS improvement?", tension: "Regulatory feedback is free consulting. But implementing every suggestion can paralyze operations." }
            ],
            inject: { time: "T+12d", event: "Class action preliminary filing in German court. 340 affected customers join.", severity: "HIGH" },
            deadline: "BfDI response: 7 days remaining", comms: null
        },
        {
            id: 9, time: "T+30d", title: "Security Hardening & Prevention",
            situation: "Board has approved a security improvement budget. The root cause analysis is clear: initial access via phishing, lateral movement via Active Directory trust relationships, and backup systems on the same network. Three fundamental failures that are fixable but expensive.",
            decisions: [
                { id: "a", label: "Comprehensive security transformation (zero trust + network redesign + DR overhaul)", role: "vptech", dollars: -600000, repInt: 15, repExt: 20, consequence: "Material security improvement. Eliminates all 3 root causes. Insurance premium drops 20%. Penetration test validates improvements. €600K but prevents the estimated €3M+ cost of a repeat incident." },
                { id: "b", label: "Address the specific root causes only (phishing defense + AD hardening + backup isolation)", role: "vptech", dollars: -250000, repInt: 10, repExt: 10, consequence: "Targeted fixes for known issues. Efficient use of budget. But doesn't address unknown attack vectors. Penetration test finds 3 new critical paths." },
                { id: "c", label: "Minimum viable improvements — endpoint detection and response (EDR) across all entities", role: "vptech", dollars: -80000, repInt: -5, repExt: -10, consequence: "EDR is necessary but insufficient. Detects future attacks faster but doesn't prevent them. Board questions 'Are we actually safer?' Insurance assessor notes 'insufficient remediation.'" }
            ],
            questions: [
                { role: "vptech", q: "What's the technical architecture for preventing this specific attack pattern?", tension: "Preventing THIS attack is necessary but not sufficient. The next attack will use a different method." },
                { role: "cfo", q: "How do we justify the security budget to the board after €3.2M incident cost?", tension: "Security investment prevents future costs. But 'preventing something that hasn't happened' is hard to budget for." },
                { role: "auditor", q: "What corrective actions does the ISO auditor require?", tension: "Auditor requires 'appropriate' corrective actions. What's appropriate is a judgment call." }
            ],
            inject: null, deadline: null, comms: null
        },
        {
            id: 10, time: "T+90d", title: "Organizational Resilience & Lessons Learned",
            situation: "Three months post-incident. Operations normal. Security improvements deployed. Regulatory engagement ongoing. The question now: did we actually learn? The CISO presents a formal lessons-learned report to the board.",
            decisions: [
                { id: "a", label: "Publish lessons learned externally + establish industry working group", role: "cfo", dollars: -100000, repInt: 20, repExt: 30, consequence: "Transforms the incident into industry leadership. Published report downloaded 10K times. Working group attracts 50 CISOs. Speaking invitations. Brand recovery complete." },
                { id: "b", label: "Internal lessons learned only + annual tabletop exercises", role: "auditor", dollars: -50000, repInt: 10, repExt: 5, consequence: "Solid internal improvement. Annual exercises test response capability. But no external signal of change. Customers and prospects don't see the improvement." },
                { id: "c", label: "Close the incident — move forward without formal lessons learned", role: "cfo", dollars: 0, repInt: -20, repExt: -25, consequence: "Organizational amnesia sets in. The same mistakes are repeated in different forms. Security team frustration: 'We went through all that for nothing.' Attrition increases 30%.", isBlunder: true }
            ],
            questions: [
                { role: "auditor", q: "What structure should the lessons-learned report follow?", tension: "ISO 27001 requires post-incident analysis. But the depth and transparency level is discretionary." },
                { role: "cfo", q: "What's the ROI of publishing lessons learned vs. keeping them internal?", tension: "Publishing risks revealing vulnerabilities. But it signals maturity and attracts security-conscious customers." },
                { role: "impl", q: "How do we ensure lessons learned translate to actual behavioral change?", tension: "Reports gather dust. Exercises build muscle memory. Culture change requires both." }
            ],
            inject: null, deadline: null, comms: null
        }
    ]
};
