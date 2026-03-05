import type { Scenario } from "../types";

export const insiderScenario: Scenario = {
    id: "scenario-insider", slug: "insider",
    title: "Operation Ghost Employee",
    subtitle: "Insider Threat — Departing Engineer with Production Access",
    severity: "HIGH", icon: "👻", color: "#f97316",
    briefing: "A senior platform engineer — 7-year veteran, trusted with production access across all entities — has submitted their resignation effective in 2 weeks. They're leaving for a direct competitor. Your DLP system flags an anomaly: in the past 72 hours, this engineer has downloaded 14,000 files including proprietary algorithms, customer deployment configurations, pricing models, complete source code, AND the HR database (240 employee salary records). They don't know you've detected this.",
    stakes: { revenue: 28, customers: 800, entities: 6, auditIn: "6 weeks" },
    startDollars: 0, startRepInternal: 100, startRepExternal: 100,
    modes: ["decision", "discussion"],
    steps: [
        {
            id: 1, time: "T+0h", title: "Detection & Legal Assessment",
            situation: "DLP alert flagged: 14,000 files downloaded in 72 hours by a senior engineer who just resigned. Files include proprietary algorithms, customer configs, pricing models, complete source code, and full HR salary database (240 records). The engineer has no idea you've detected this. Their notice period has 13 days remaining.",
            decisions: [
                { id: "a", label: "Immediately revoke access and confront", role: "vptech", dollars: -25000, repInt: -10, repExt: 0, consequence: "Already copied to personal devices. Claims 'personal work notes.' Team learns management monitors activity. 'Am I being watched too?'" },
                { id: "b", label: "Silently restrict access while building forensic evidence package", role: "legal", dollars: -60000, repInt: 5, repExt: 0, consequence: "Smart move. Read-only access set. Remote forensic image captured. Legal position strengthened. Engineer doesn't know." },
                { id: "c", label: "Do nothing during notice period — monitor only", role: "vptech", dollars: 0, repInt: 0, repExt: 0, consequence: "2 more weeks of full access. 3,000 additional files downloaded including M&A pipeline. Competitor knows your pricing 3 weeks later." }
            ],
            questions: [
                { role: "legal", q: "What legal options do we have before the engineer leaves? What evidence do we need to preserve?", tension: "Moving too fast may compromise evidence. Moving too slow loses opportunity for legal remedies." },
                { role: "vptech", q: "Can we restrict access without the engineer noticing? What's the technical approach?", tension: "Sophisticated engineers will notice subtle access changes. But overt lockout tips them off." },
                { role: "cfo", q: "What's the potential financial impact of this IP theft?", tension: "The stolen algorithms and pricing models could erode competitive advantage for years." },
                { role: "auditor", q: "Does this trigger any regulatory notification requirements?", tension: "HR salary data is personal data under GDPR. You may already be in a breach notification scenario." },
                { role: "impl", q: "Who else had access to these files? Is this an isolated event?", tension: "Investigating broadly could alert the engineer through colleague conversations." }
            ],
            inject: null, deadline: "13 days until engineer's last day", comms: null
        },
        {
            id: 2, time: "T+24h", title: "The HR Salary Data Problem",
            situation: "Forensics reveal: full HR salary database was accessed — 240 records with names, salaries, equity grants, performance ratings. This is unambiguously GDPR personal data. The engineer accessed it using their legitimate production database credentials. Technically authorized, but the download pattern is clearly anomalous.",
            decisions: [
                { id: "a", label: "Notify all affected employees about the data exposure", role: "legal", dollars: -80000, repInt: -30, repExt: -5, consequence: "Every employee knows. Salary comparison explosions. 12 employees demand adjustments (€180K annual impact). 3 GDPR SARs filed. 'If they can't protect OUR data...'" },
                { id: "b", label: "File GDPR notification with DPA but don't tell employees yet", role: "legal", dollars: -40000, repInt: -5, repExt: 0, consequence: "DPA acknowledges. But Article 34 may require individual notification. If DPA orders it and you haven't = compliance failure on top of breach." },
                { id: "c", label: "Pursue legal injunction to retrieve/contain data first, then notify", role: "legal", dollars: -100000, repInt: 0, repExt: 0, consequence: "Court grants TRO. Strongest legal play. But injunction is public court filing — journalists can find it." }
            ],
            questions: [
                { role: "legal", q: "Does GDPR Article 34 require us to notify all 240 employees?", tension: "Article 34 requires notification when there's 'high risk to rights and freedoms.' Salary data likely qualifies." },
                { role: "cfo", q: "What's the cost if salary data becomes public internally?", tension: "Pay equity issues will surface. Some may be legitimate grievances that predate this incident." },
                { role: "impl", q: "How do we communicate without naming the engineer to an audience that will figure it out?", tension: "The resignation is known. People will connect the dots regardless of how carefully you communicate." }
            ],
            inject: { time: "T+20h", event: "The engineer's direct reports notice restricted access and ask questions on team Slack.", severity: "HIGH" },
            deadline: "GDPR 72-hour notification to DPA", comms: null
        },
        {
            id: 3, time: "T+3d", title: "The Competitor Connection",
            situation: "The engineer updated LinkedIn showing the competitor as new employer. Your sales team reports the competitor suddenly revised pricing to exactly undercut your €2M proposal to a key prospect — the proposal was in a document the engineer accessed. Circumstantial but damning.",
            decisions: [
                { id: "a", label: "Engage competitor's legal team directly — private negotiation", role: "legal", dollars: -150000, repInt: 10, repExt: 10, consequence: "Competitor CEO calls personally. Settlement: data returned, €300K damages, engineer fired. Net: +€150K recovery." },
                { id: "b", label: "File trade secrets lawsuit — make it public", role: "legal", dollars: -400000, repInt: 5, repExt: -15, consequence: "12–18 months litigation. Industry knows. Recruiting becomes harder — 'they sue departing employees.' Engineer's lawyer shifts blame to your access controls." },
                { id: "c", label: "Adjust pricing/roadmap to mitigate — don't pursue legal action", role: "cfo", dollars: -250000, repInt: -15, repExt: -10, consequence: "Absorb the loss. Precedent set: IP is unprotected. 2 more engineers approach recruiters within 6 months." }
            ],
            questions: [
                { role: "legal", q: "What's the evidentiary standard for trade secret misappropriation?", tension: "Circumstantial evidence is strong but not conclusive. The competitor can claim independent analysis." },
                { role: "cfo", q: "What's the total financial exposure from the stolen pricing models?", tension: "Hard to quantify — every deal for the next 12 months is potentially undermined." },
                { role: "vptech", q: "How do we prevent this technically going forward?", tension: "More controls means less trust. Engineers work best when trusted with access." }
            ],
            inject: { time: "T+2d", event: "Sales team reports competitor's pricing exactly matches your proposal terms. Too precise to be coincidence.", severity: "CRITICAL" },
            deadline: null, comms: null
        },
        {
            id: 4, time: "T+5d", title: "Internal Communication — The Team Knows",
            situation: "The engineering team has figured it out. The restricted access is visible. A 47-message Slack thread is circulating. 'Is my code safe?' 'Are we being monitored?' 'Should I be worried about my own access?' Trust is eroding fast.",
            decisions: [
                { id: "a", label: "VP Tech holds transparent engineering all-hands, invites input on new policies", role: "vptech", dollars: -20000, repInt: 20, repExt: 0, consequence: "Engineers help design access controls. Team owns the solution. Security becomes collaborative, not adversarial. Internal rep soars." },
                { id: "b", label: "Issue company-wide acceptable use policy update — don't mention specific incident", role: "legal", dollars: -10000, repInt: -15, repExt: 0, consequence: "Everyone knows exactly why. Called 'the [Name] Rule.' Compliance becomes resentful, not genuine." },
                { id: "c", label: "Implement strict DLP/monitoring without announcement", role: "vptech", dollars: -80000, repInt: -25, repExt: 0, consequence: "Engineers notice immediately. Tweet: 'My company just went full surveillance state.' Goes viral. 3 job applications submitted that week.", isBlunder: true }
            ],
            questions: [
                { role: "vptech", q: "How do we rebuild trust with the engineering team?", tension: "They feel betrayed — by the colleague and potentially by management's surveillance. Both need addressing." },
                { role: "impl", q: "What access controls can we implement that engineers will actually accept?", tension: "Engineers need access to do their jobs. Every restriction slows them down and signals distrust." },
                { role: "auditor", q: "What does ISO 27001 Annex A.7 require for employee screening and access management?", tension: "Annex A.7 requires proportionate controls. 'Proportionate' is subjective and cultural." }
            ],
            inject: null, deadline: null, comms: null
        },
        {
            id: 5, time: "T+10d", title: "The Engineer's Last Day",
            situation: "Three days to go. The engineer knows you know — their lawyer sent a defamation threat letter yesterday. The team wants to throw a farewell lunch. The situation is surreal: legal warfare and farewell cake simultaneously.",
            decisions: [
                { id: "a", label: "Allow farewell + formal exit interview with legal present — request data return attestation", role: "legal", dollars: -15000, repInt: 5, repExt: 0, consequence: "Graceful. Farewell preserves team cohesion. Exit interview with evidence documented. Engineer refuses to sign but you have forensic proof." },
                { id: "b", label: "Security escort out at 9 AM — no farewell", role: "vptech", dollars: -5000, repInt: -20, repExt: -5, consequence: "'They perp-walked a 7-year veteran.' 4 engineers update resumes that day. Lawyer gets ammunition for wrongful termination angle." },
                { id: "c", label: "Let them serve normally, initiate legal proceedings next week", role: "legal", dollars: -10000, repInt: 0, repExt: 0, consequence: "Normal goodbye. Handshake. Monday: lawyers send cease-and-desist. 'They smiled then sued me.' Bad faith optics." }
            ],
            questions: [
                { role: "legal", q: "What's our exposure to a wrongful termination or defamation counterclaim?", tension: "The engineer may claim constructive dismissal. Your evidence is strong but litigation is unpredictable." },
                { role: "impl", q: "How do we handle the team dynamic on the last day?", tension: "Some team members are sympathetic to the engineer. Others feel betrayed. Both groups are watching management." },
                { role: "cfo", q: "What's the cost of the farewell approach vs. security escort in terms of retention?", tension: "The 'security escort' saves face legally but costs you in talent retention. The farewell risks looking weak." }
            ],
            inject: { time: "T+9d", event: "Engineer's lawyer sends defamation threat letter. 'Any public statements about my client will result in litigation.'", severity: "HIGH" },
            deadline: "3 days until last day", comms: null
        },
        {
            id: 6, time: "T+14d", title: "The Glassdoor Bomb",
            situation: "The departed engineer posts a detailed Glassdoor review: 'toxic surveillance culture, fires people for accessing code they're authorized to use, management paranoia.' 47 helpful votes in 24 hours. A tech recruiter screenshots it on LinkedIn: 'Red flag alert 🚩.' You have 3 open senior engineering roles.",
            decisions: [
                { id: "a", label: "Respond on Glassdoor with factual, dignified correction", role: "legal", dollars: -10000, repInt: 5, repExt: 10, consequence: "Measured, professional response. LinkedIn recruiter deletes post after current employees comment supportively." },
                { id: "b", label: "Encourage current employees to post positive reviews", role: "impl", dollars: -5000, repInt: -10, repExt: -15, consequence: "Glassdoor flags as incentivized reviews. Journalist picks it up: 'Company astroturfs after damning review.' TWO reputation crises now.", isBlunder: true },
                { id: "c", label: "Ignore it — it'll blow over", role: "cfo", dollars: -200000, repInt: -5, repExt: -20, consequence: "It doesn't blow over. First thing candidates see. Time-to-fill doubles (45→90 days). 2 top candidates decline. Premium recruitment costs." }
            ],
            questions: [
                { role: "legal", q: "Can we legally challenge the Glassdoor review?", tension: "Defamation claims against employee reviews rarely succeed and always generate more publicity." },
                { role: "impl", q: "How do we address the review with current employees?", tension: "Acknowledging it gives it weight. Ignoring it looks like you agree. Neither option is clean." },
                { role: "cfo", q: "What's the measurable impact on recruiting pipeline?", tension: "Hard to measure directly. But the correlation between review and candidate quality is unmistakable." }
            ],
            inject: { time: "T+13d", event: "Tech recruiter screenshots Glassdoor review on LinkedIn: 'Red flag alert 🚩.' 2,000 impressions.", severity: "HIGH" },
            deadline: null, comms: null
        },
        {
            id: 7, time: "T+30d", title: "Resolution & Policy Reform",
            situation: "The immediate crisis is past. Legal proceedings initiated. Now: build the framework to prevent this from happening again. The board wants a comprehensive insider threat program. The engineering team wants assurance they won't be surveilled. These goals are in tension.",
            decisions: [
                { id: "a", label: "Comprehensive insider threat program (DLP + behavioral analytics + tiered access + transparency)", role: "auditor", dollars: -180000, repInt: 15, repExt: 10, consequence: "Co-developed with engineering. Published monitoring policy. ISO auditor commends 'proportionate and transparent.' Engineers accept because they were consulted." },
                { id: "b", label: "Technical controls only (DLP, UEBA, download restrictions)", role: "vptech", dollars: -120000, repInt: -5, repExt: 5, consequence: "Strong tech but no policy framework. Engineers feel surveilled without context. Auditor notes insufficient A.7 human resource security controls." },
                { id: "c", label: "Minimal changes — update NDA, add non-compete, tighten acceptable use policy", role: "legal", dollars: -30000, repInt: -10, repExt: 0, consequence: "Non-competes unenforceable in most jurisdictions. Nothing structural changes. ISO auditor issues major non-conformity on A.7.3 (termination process)." }
            ],
            questions: [
                { role: "auditor", q: "What does the ISO 27001 non-conformity mean for our certification?", tension: "Major non-conformity requires corrective action within a fixed timeframe or certification is suspended." },
                { role: "vptech", q: "How do we implement monitoring that engineers accept and understand?", tension: "Transparency about monitoring is the key. But even transparent monitoring changes behavior." },
                { role: "legal", q: "Are non-compete clauses enforceable in our jurisdictions?", tension: "Germany: very limited. UK: must be reasonable. Australia: generally unenforceable. Thailand: rarely tested." }
            ],
            inject: null, deadline: null, comms: null
        },
        {
            id: 8, time: "T+60d", title: "Cultural Recovery Assessment",
            situation: "Two months post-incident. Employee pulse survey results: Trust in leadership 62% (was 78%). Confidence in data protection 45% (was 72%). Would recommend as employer 55% (was 81%). These numbers tell the real story.",
            decisions: [
                { id: "a", label: "Publish survey results internally, create employee-led task force for improvements", role: "impl", dollars: -40000, repInt: 30, repExt: 5, consequence: "Radical transparency. Task force proposes 5 concrete changes, 4 implemented within 60 days. 90-day re-survey: trust rises to 71%. Cultural recovery accelerates." },
                { id: "b", label: "Share results with leadership only, implement changes top-down", role: "cfo", dollars: -15000, repInt: -5, repExt: 0, consequence: "Changes happen without connection to feedback. Survey fatigue sets in. Next round participation drops to 40%. Employees feel unheard." },
                { id: "c", label: "Don't conduct the survey — focus on forward-looking initiatives", role: "cfo", dollars: 0, repInt: -15, repExt: 0, consequence: "No data, no improvement. Voluntary attrition +25% over 6 months. €400K in replacement hiring. P&L doesn't show a 'destroyed trust' line item — but every metric suffers." }
            ],
            questions: [
                { role: "impl", q: "How do we rebuild trust that was damaged by both the insider and the company's response?", tension: "Trust takes years to build and moments to destroy. There are no shortcuts." },
                { role: "cfo", q: "What's the financial impact of a 16-point drop in trust scores?", tension: "Correlation to attrition, productivity, and innovation is well-documented but hard to attribute to a single event." },
                { role: "auditor", q: "How do we document cultural recovery for audit evidence?", tension: "ISO 27001 requires 'competence, awareness, and communication' under Clause 7. Survey results ARE evidence." }
            ],
            inject: null, deadline: null, comms: null
        }
    ]
};
