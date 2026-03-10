/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { ChevronRight, Target, TreeDeciduous, MessageSquare, ShieldAlert, Award, Play, Users, FileCheck, ArrowLeft, BookOpen, Calculator, CircleDollarSign, Scale, ClipboardList, Wrench, Zap, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TabId = "why" | "how" | "scenarios" | "scoring" | "first" | "facilitator" | "auditor";

interface Tab {
    id: TabId;
    label: string;
    icon: React.ElementType;
}

const TABS: Tab[] = [
    { id: "why", label: "Why Tabletop?", icon: Target },
    { id: "how", label: "How It Works", icon: TreeDeciduous },
    { id: "scenarios", label: "Scenarios", icon: ShieldAlert },
    { id: "scoring", label: "Scoring & Grading", icon: Award },
    { id: "first", label: "Running Your First", icon: Play },
    { id: "facilitator", label: "For Facilitators", icon: Users },
    { id: "auditor", label: "For Auditors", icon: FileCheck },
];

export default function ExerciseGuidePage() {
    const [activeTab, setActiveTab] = useState<TabId>("why");

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/exercises" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Library
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tabletop Exercise Guide</h1>
                        <p className="text-muted-foreground mt-1">
                            The complete manual for running effective cyber wargames, maximizing learning, and generating compliance evidence.
                        </p>
                    </div>
                </div>
            </div>

            {/* Layout: Sidebar + Content */}
            <div className="flex flex-col md:flex-row gap-8 items-start pt-4">

                {/* Sidebar Navigation */}
                <nav className="w-full md:w-64 flex-shrink-0 space-y-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-left",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary-foreground/90" : "text-muted-foreground")} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 bg-card/40 border border-border rounded-2xl p-8 shadow-sm">
                    {activeTab === "why" && <WhyTab />}
                    {activeTab === "how" && <HowTab />}
                    {activeTab === "scenarios" && <ScenariosTab />}
                    {activeTab === "scoring" && <ScoringTab />}
                    {activeTab === "first" && <FirstExerciseTab />}
                    {activeTab === "facilitator" && <FacilitatorTab />}
                    {activeTab === "auditor" && <AuditorTab />}
                </div>

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONTENT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function WhyTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">Why Tabletop Exercises Matter</h2>
                <p className="text-muted-foreground">The rationale and ROI behind cyber wargaming.</p>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
                <div>
                    <p className="text-base text-foreground/80 leading-relaxed mb-4">
                        Tabletop exercises are structured simulations where your team walks through a realistic security incident scenario, making decisions under pressure without real-world consequences.
                    </p>

                    <h3 className="text-lg font-bold text-foreground mt-8 mb-3">The Problem They Solve</h3>
                    <p className="text-foreground/80 leading-relaxed">
                        Most organizations discover their incident response gaps during an actual incident — when the cost of learning is measured in regulatory fines, customer churn, and career damage. Tabletop exercises surface these gaps in a safe environment.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-foreground mt-8 mb-3">What Makes Astra-CISO Exercises Different</h3>
                    <p className="text-foreground/80 leading-relaxed mb-6">
                        Traditional tabletop exercises are linear scripts: "Step 1: you discover a breach. What do you do?" That's a reading exercise, not a simulation. Astra-CISO exercises are built on three principles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-card p-5 rounded-xl border border-border">
                            <h4 className="text-primary font-semibold flex items-center gap-2 mb-2">
                                <Calculator className="h-4 w-4" /> 1. Quantified Consequences
                            </h4>
                            <p className="text-muted-foreground text-sm">
                                Each choice carries a specific financial impact (€) and dual reputation scores — internal (employee trust) and external (customer/market trust). You see the cost of your decisions in real-time, not in a post-exercise debrief.
                            </p>
                        </div>

                        <div className="bg-card p-5 rounded-xl border border-border">
                            <h4 className="text-primary font-semibold flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4" /> 2. Communication vs. Technical
                            </h4>
                            <p className="text-muted-foreground text-sm">
                                Our scenarios are deliberately designed so that a CEO going off-script in a media interview (-€800K, -40% external reputation) costs more than the ransomware itself. The technical containment cost is relatively fixed. The communication cost is potentially unlimited. This is the #1 lesson real CISOs learn from real incidents &mdash; and most tabletop tools miss it.
                            </p>
                        </div>

                        <div className="bg-card p-5 rounded-xl border border-border md:col-span-2">
                            <h4 className="text-primary font-semibold flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4" /> 3. Internal Reputation Matters
                            </h4>
                            <p className="text-muted-foreground text-sm">
                                Most exercises focus on customer impact and regulatory fines. We separately track how your decisions affect employee trust, team morale, and retention. Ignoring internal communication during a crisis leads to CISO resignation, engineer attrition, and Glassdoor reputation damage — costs that don't appear on the P&L but destroy organizations from the inside.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl mt-8">
                    <h3 className="text-primary font-bold flex items-center gap-2 mb-3">
                        <FileCheck className="h-5 w-5" /> Compliance Value
                    </h3>
                    <p className="text-sm text-foreground/80 mb-4">Tabletop exercises fulfill requirements under:</p>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-4 list-disc list-inside">
                        <li><strong>ISO 27001 Annex A.17</strong> — Business continuity management testing</li>
                        <li><strong>NIS2 Article 21(2)(c)</strong> — Business continuity and crisis management</li>
                        <li><strong>SOC 2 CC7.4</strong> — Incident response testing</li>
                        <li><strong>GDPR Article 32</strong> — Testing and evaluating security measures</li>
                    </ul>
                    <p className="text-sm font-medium text-foreground/90">
                        Every exercise session generates an audit trail that can serve as evidence for your next compliance audit.
                    </p>
                </div>
            </div>
        </div>
    );
}

function HowTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">How Tabletop Exercises Work</h2>
                <p className="text-muted-foreground">Understanding modes, roles, and exercise mechanics.</p>
            </div>

            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">Two Modes</h3>

                    <div className="space-y-6">
                        <div className="border border-border rounded-xl overflow-hidden bg-card">
                            <div className="bg-muted px-6 py-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-primary" />
                                    <h3 className="font-bold text-foreground">Decision Tree Mode</h3>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground bg-background rounded px-2 py-1 border border-border/50">
                                    ⏱ 60–90 min
                                </span>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    You face 3 choices at each step. Each choice has:
                                </p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                    <li><strong>Dollar impact</strong> — direct financial cost or saving</li>
                                    <li><strong>Internal reputation</strong> — how your employees perceive leadership</li>
                                    <li><strong>External reputation</strong> — how customers, media, and regulators perceive you</li>
                                </ul>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    Your total score accumulates across all steps. At the end, you receive a grade (A through F) and a detailed assessment of your decision patterns.
                                </p>
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Best for:</strong> Solo practice, quick assessments, benchmarking improvement over time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border border-border rounded-xl overflow-hidden bg-card">
                            <div className="bg-muted px-6 py-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <h3 className="font-bold text-foreground">Discussion Mode</h3>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground bg-background rounded px-2 py-1 border border-border/50">
                                    ⏱ 2–3 hours
                                </span>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    Each step presents open-ended questions assigned to specific roles (CFO, Legal Counsel, VP Technology, ISO Auditor, Implementer). Each question has a &quot;tension&quot; &mdash; the underlying conflict that makes the decision hard.
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    Participants draft real communications: board briefings, customer notifications, press statements, regulatory filings. These drafts are captured and can be reviewed post-exercise.
                                </p>
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Best for:</strong> Team exercises, communication practice, facilitator-led sessions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">The Five Roles</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                        These roles are designed to CONFLICT with each other. That tension is the exercise — forcing negotiation, prioritization, and decision-making under competing pressures.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border border-border rounded-xl overflow-hidden">
                            <thead className="bg-muted text-foreground border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-semibold w-1/4">Role</th>
                                    <th className="px-4 py-3 font-semibold w-1/3">Focus</th>
                                    <th className="px-4 py-3 font-semibold">Core Tension</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr className="bg-card">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <CircleDollarSign className="h-4 w-4 text-emerald-500" /> CFO
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">Financial exposure, insurance, disclosure timing</td>
                                    <td className="px-4 py-3 text-muted-foreground">Wants to minimize disclosure vs Legal's notification requirements</td>
                                </tr>
                                <tr className="bg-card/50">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <Scale className="h-4 w-4 text-primary" /> Legal Counsel
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">Regulatory obligations, liability, evidence</td>
                                    <td className="px-4 py-3 text-muted-foreground">Wants early notification vs CFO's damage control instinct</td>
                                </tr>
                                <tr className="bg-card">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4 text-red-500" /> VP Technology
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">Containment, forensics, recovery</td>
                                    <td className="px-4 py-3 text-muted-foreground">Wants forensic time vs business pressure for rapid recovery</td>
                                </tr>
                                <tr className="bg-card/50">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4 text-blue-500" /> ISO Auditor
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">Control failures, evidence, corrective actions</td>
                                    <td className="px-4 py-3 text-muted-foreground">Needs evidence preservation vs pressure to restore and move on</td>
                                </tr>
                                <tr className="bg-card">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <Wrench className="h-4 w-4 text-amber-500" /> Implementer
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">Execution feasibility, resources, timelines</td>
                                    <td className="px-4 py-3 text-muted-foreground">Must tell everyone what's actually achievable with the available team</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-4">
                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                        <h4 className="text-foreground font-semibold flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-primary" /> Inject Events
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Mid-exercise surprises that change the situation. A journalist calls. A second attacker appears. A customer threatens contract termination. Injects force you to adapt — not just follow a script.
                        </p>
                    </div>

                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                        <h4 className="text-foreground font-semibold flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-primary" /> Communications
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Draft actual communications for specific audiences: board members, customers, regulators, media, employees. Each audience requires different tone, different content, and different legal considerations.
                        </p>
                    </div>

                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                        <h4 className="text-foreground font-semibold flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" /> Regulatory Deadlines
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Active deadline trackers show real-world timelines: GDPR 72-hour notification, NIS2 24-hour early warning. Deadlines turn from green to amber to red as time runs out, forcing triage decisions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScenariosTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">The Scenario Library</h2>
                <p className="text-muted-foreground">Pre-configured crisis templates mapped to real-world threats.</p>
            </div>

            <p className="text-foreground/80 leading-relaxed text-sm">
                The platform ships with three highly realistic, multi-stage scenarios modeled after recent high-profile breaches.
            </p>

            <div className="space-y-8 mt-6">
                {/* Scenario 1: Supply Chain */}
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="bg-red-500/10 px-6 py-4 border-b border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center font-bold text-lg">🔗</div>
                            <h3 className="font-bold text-foreground text-lg">Operation Trojan Vendor</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded uppercase font-mono tracking-wider">Critical</span>
                            <span className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded uppercase font-mono tracking-wider">Advanced</span>
                            <span className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded uppercase font-mono tracking-wider">10 Steps</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">What You'll Face</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Your identity management platform (SecureFlow) was compromised 4 months ago through a build pipeline attack. A backdoor was injected into updates your systems auto-installed. The attacker has had persistent access to your entire identity infrastructure across 6 international entities.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Why This Scenario</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Supply chain attacks are the fastest-growing attack vector. SolarWinds (2020), Kaseya (2021), MOVEit (2023), and XZ Utils (2024) showed that even security-conscious organizations are vulnerable through their vendors.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Learning Objectives</h4>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                                <li><strong>Vendor accountability decisions</strong> — Accept their offer, pursue legal action, or publicly terminate?</li>
                                <li><strong>Board communication under uncertainty</strong> — Tell all risking a leak, use measured language, or delay?</li>
                                <li><strong>Multi-jurisdiction notification</strong> — 6 different authorities, 6 requirements, 6 timelines.</li>
                                <li><strong>CEO media performance</strong> — Step 5 is make-or-break. A prepared CEO recovers reputation; going off-script triggers a catastrophe.</li>
                                <li><strong>Internal communication is not optional</strong> — Ignoring internal comms causes CISO resignation and engineer attrition.</li>
                            </ul>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-muted p-4 rounded-xl border border-border">
                                <h5 className="font-semibold text-sm mb-2">The Optimal Path</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">End around -€600K with reputation above 80% on both meters. The worst path exceeds -€2.5M with internal reputation below 30%. The difference is almost entirely determined by communication decisions.</p>
                            </div>
                            <div className="bg-muted p-4 rounded-xl border border-border">
                                <h5 className="font-semibold text-sm mb-2">Key Decisions to Watch</h5>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    <li>Step 2: Board transparency vs measured language</li>
                                    <li>Step 5: CEO interview (+€60K to -€800K swing)</li>
                                    <li>Step 6: Internal all-hands vs email vs silence</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scenario 2: Insider Threat */}
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center font-bold text-lg">👻</div>
                            <h3 className="font-bold text-foreground text-lg">Operation Ghost Employee</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded uppercase font-mono tracking-wider">High</span>
                            <span className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded uppercase font-mono tracking-wider">Advanced</span>
                            <span className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded uppercase font-mono tracking-wider">8 Steps</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">What You'll Face</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                A 7-year veteran senior engineer is leaving for a direct competitor. Your DLP system flags 14,000 downloaded files including source code, pricing models, and the entire HR salary database (240 employee records). They don't know you've detected it. You have 2 weeks.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Why This Scenario</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Insider threats account for 25-30% of security incidents but are the most psychologically complex to handle. They involve people you know, employment law constraints, morale impacts, and reputational damage.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-amber-500">Learning Objectives</h4>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                                <li><strong>Legal strategy before confrontation</strong> — Build a forensic evidence package silently first.</li>
                                <li><strong>HR data is GDPR personal data</strong> — The salary records create a personal data breach with separate notification obligations.</li>
                                <li><strong>The Glassdoor aftermath</strong> — The dignified public response works. Astroturfing backfires. Ignoring it costs €200K in recruiting delays.</li>
                                <li><strong>Cultural recovery is real work</strong> — Trust drops. Publishing results with a recovery task force works. Hiding them doesn't.</li>
                            </ul>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-muted p-4 rounded-xl border border-border">
                                <h5 className="font-semibold text-sm mb-2">The Optimal Path</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">Best outcomes end around -€300K with internal reputation above 75%. The worst path hits -€1M+ with internal reputation below 40% — damage entirely self-inflicted through surveillance overreaction and comms failures.</p>
                            </div>
                            <div className="bg-muted p-4 rounded-xl border border-border">
                                <h5 className="font-semibold text-sm mb-2">Key Decisions to Watch</h5>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    <li>Step 1: Silent investigation vs immediate confrontation</li>
                                    <li>Step 4: Transparent all-hands vs silent surveillance</li>
                                    <li>Step 5: Graceful farewell vs security escort</li>
                                    <li>Step 8: Publish survey results vs hide them</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scenario 3: Ransomware */}
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <div className="bg-red-500/10 px-6 py-4 border-b border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center font-bold text-lg">🔒</div>
                            <h3 className="font-bold text-foreground text-lg">Operation Midnight Lock</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded uppercase font-mono tracking-wider">Critical</span>
                            <span className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded uppercase font-mono tracking-wider">Expert</span>
                            <span className="text-[10px] bg-background border border-border text-muted-foreground px-2 py-0.5 rounded uppercase font-mono tracking-wider">10 Steps</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">What You'll Face</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Ransomware group "BlackVeil" has encrypted 4 servers, exfiltrated 2.3GB of customer data (12,400 records across 6 jurisdictions), and demands 45 BTC (~€2.1M) with a 72-hour deadline. They claim to have your ISO gap analysis.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Why This Scenario</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Ransomware with data exfiltration is the most common critical incident a CISO will face. This tests the full lifecycle: detection through recovery through regulatory follow-up — most tabletop exercises stop at containment.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Learning Objectives</h4>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                                <li><strong>The ransom decision is a board decision</strong> — Paying carries OFAC risks. Refusing means data goes public. Frame this for a non-technical board.</li>
                                <li><strong>Regulatory notification nightmare</strong> — Filing with 6 different authorities simultaneously across different languages and formats.</li>
                                <li><strong>Customer communication across cultures</strong> — A single notification must work across 6 different cultural expectations.</li>
                                <li><strong>The 30-day view matters</strong> — Regulatory follow-up, ISO audit prep, and security investment ROI framing. This scenario teaches endurance.</li>
                            </ul>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-muted p-4 rounded-xl border border-border">
                                <h5 className="font-semibold text-sm mb-2">The Optimal Path</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">The net cost floor is approximately -€1.3M. Best teams maintain certification and strengthen market position. Worst case exceeds -€5M with lost certification and existential customer churn.</p>
                            </div>
                            <div className="bg-muted p-4 rounded-xl border border-border">
                                <h5 className="font-semibold text-sm mb-2">Key Decisions to Watch</h5>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    <li>Step 3: Pay vs refuse</li>
                                    <li>Step 5: Customer notification tone</li>
                                    <li>Step 8: ISO audit postpone vs proceed</li>
                                    <li>Step 10: Total cost framing</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function ScoringTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">How Scoring Works</h2>
                <p className="text-muted-foreground">The simulation's evaluation mechanics (Decision Mode Only).</p>
            </div>

            <div className="space-y-8">
                {/* The Three Meters */}
                <section>
                    <h3 className="text-lg font-bold text-foreground mb-4">The Three Meters</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-destructive font-bold text-xl">💰</span>
                                <h4 className="text-destructive font-bold">Financial Impact (€)</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Every decision has a direct cost or saving. These accumulate across all steps. Costs include: business interruption, legal fees, forensics, customer churn, regulatory fines, recruitment, PR crisis management. Savings include: insurance recovery, vendor settlements, avoided costs from proactive decisions.
                            </p>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-500 font-bold text-xl">👥</span>
                                <h4 className="text-emerald-500 font-bold">Internal Reputation</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Measures employee trust. Starts at 100%. Drops when you ignore internal communication, implement surveillance without transparency, or mishandle employee situations. Recovers when you hold transparent all-hands meetings, acknowledge team contributions publicly, and co-develop policies with employee input.
                            </p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-500 font-bold text-xl">🌍</span>
                                <h4 className="text-blue-500 font-bold">External Reputation</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Measures customer, media, and market perception. Starts at 100%. Drops when you delay customer notification, issue statements that contradict filings, or CEO goes off-script. Recovers with proactive transparent disclosure, empathetic CEO interviews, and public vendor accountability.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Grade Calculation */}
                    <section>
                        <h3 className="text-lg font-bold text-foreground mb-4">Grade Calculation</h3>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-4 mb-4 text-sm font-medium border-b border-border/50 pb-4">
                                <span className="text-destructive">40% Financial</span>
                                <span className="text-emerald-500">30% Internal</span>
                                <span className="text-blue-500">30% External</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <span className="w-8 h-8 rounded shrink-0 bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center">A</span>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">80–100</div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Exceptional — you'd be hired as a crisis consultant.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-8 h-8 rounded shrink-0 bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center">B</span>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">65–79</div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Strong — mistakes were made but leadership was sound.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-8 h-8 rounded shrink-0 bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center">C</span>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">50–64</div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Adequate — survived but with significant damage.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-8 h-8 rounded shrink-0 bg-orange-500/20 text-orange-500 font-bold flex items-center justify-center">D</span>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">35–49</div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Poor — organizational recovery will take quarters.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-8 h-8 rounded shrink-0 bg-red-500/20 text-red-500 font-bold flex items-center justify-center">F</span>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">0–34</div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Catastrophic — existential threat to the business.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Insights */}
                    <section className="space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-foreground mb-2">Why Financial Impact is 40%</h3>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                In a board meeting, the first question after an incident is always: "What did this cost us?" CFOs are the ultimate decision-makers in real incidents. Financial discipline during a crisis correlates directly with long-term organizational survival.
                            </p>
                        </div>

                        <div className="bg-primary/5 border-l-4 border-primary p-5 rounded-r-xl">
                            <h3 className="text-base font-bold text-primary mb-2">The Key Insight Across Scenarios</h3>
                            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                                The technical containment cost is relatively fixed — you're going to spend €X on forensics and recovery regardless.
                            </p>
                            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                                The communication cost is variable — and it's where the real damage (or recovery) happens. A CEO who nails a media interview can recover external reputation to ABOVE pre-incident levels. A CEO who says "this is blown out of proportion" triggers a cascade that costs 10x the technical incident.
                            </p>
                            <p className="text-sm font-bold text-foreground italic">
                                "The breach costs what it costs. The response costs what you choose."
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FirstExerciseTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">Running Your First Exercise</h2>
                <p className="text-muted-foreground">Detailed instructions for executing scenarios effectively.</p>
            </div>

            <div className="space-y-10">
                {/* Solo Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg">
                            <span className="font-bold text-xl">👤</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Solo — Decision Tree Mode (Recommended Start)</h3>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6">
                        <ol className="space-y-6 relative border-l border-border/60 ml-3">
                            <li className="pl-8 relative">
                                <div className="absolute w-6 h-6 bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold text-xs -left-3 top-0">1</div>
                                <h4 className="font-bold text-sm text-foreground mb-1">Select Scenario</h4>
                                <p className="text-sm text-foreground/80">Go to <code>/exercises</code> and choose <strong>Operation Trojan Vendor</strong>.</p>
                            </li>
                            <li className="pl-8 relative">
                                <div className="absolute w-6 h-6 bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold text-xs -left-3 top-0">2</div>
                                <h4 className="font-bold text-sm text-foreground mb-1">Choose Mode</h4>
                                <p className="text-sm text-foreground/80">Select <strong>Decision Tree Mode</strong>.</p>
                            </li>
                            <li className="pl-8 relative">
                                <div className="absolute w-6 h-6 bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold text-xs -left-3 top-0">3</div>
                                <h4 className="font-bold text-sm text-foreground mb-1">Context Setting</h4>
                                <p className="text-sm text-foreground/80">Read the briefing carefully — it sets the context for all 10 steps.</p>
                            </li>
                            <li className="pl-8 relative">
                                <div className="absolute w-6 h-6 bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold text-xs -left-3 top-0">4</div>
                                <h4 className="font-bold text-sm text-foreground mb-2">Execute Steps</h4>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1.5 ml-1">
                                    <li>Read the situation description.</li>
                                    <li>Consider all 3 choices before selecting.</li>
                                    <li>Check the deadline tracker — time pressure is part of the exercise.</li>
                                    <li>Note the inject events (<span className="text-yellow-500">⚡</span>) when they appear — they change everything.</li>
                                    <li>Rate your confidence before confirming.</li>
                                </ul>
                            </li>
                            <li className="pl-8 relative">
                                <div className="absolute w-6 h-6 bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold text-xs -left-3 top-0">5</div>
                                <h4 className="font-bold text-sm text-foreground mb-2">After-Action Review</h4>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1.5 ml-1">
                                    <li>Your grade and final scores.</li>
                                    <li>The decision trail — where did you lose the most?</li>
                                    <li>The confidence analysis — were you overconfident on bad decisions?</li>
                                </ul>
                            </li>
                            <li className="pl-8 relative">
                                <div className="absolute w-6 h-6 bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold text-xs -left-3 top-0">6</div>
                                <h4 className="font-bold text-sm text-foreground mb-1">Iterate</h4>
                                <p className="text-sm text-foreground/80">Run it again — make different choices. See how the outcome changes.</p>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Team Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-lg">
                            <span className="font-bold text-xl">👥</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Team — Discussion Mode</h3>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-4">
                        {/* Before */}
                        <div className="bg-card border border-border p-5 rounded-xl">
                            <h4 className="font-bold text-emerald-500 mb-4 border-b border-border/50 pb-2">Before the Exercise</h4>
                            <ul className="text-sm text-foreground/80 space-y-3">
                                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">1.</span> Assign roles to participants (ideally 3–5 people).</li>
                                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">2.</span> Set expectations: takes 2–3 hours. No phones, no interruptions.</li>
                                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">3.</span> Brief participants on their role's focus and tensions.</li>
                                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">4.</span> Designate a facilitator (can be the CISO or an observer).</li>
                            </ul>
                        </div>

                        {/* During */}
                        <div className="bg-card border border-border p-5 rounded-xl">
                            <h4 className="font-bold text-amber-500 mb-4 border-b border-border/50 pb-2">During the Exercise</h4>
                            <ul className="text-sm text-foreground/80 space-y-3">
                                <li className="flex gap-2"><span className="text-amber-500 shrink-0">1.</span> Facilitator reads situation aloud at each step.</li>
                                <li className="flex gap-2"><span className="text-amber-500 shrink-0">2.</span> Each role answers their designated question.</li>
                                <li className="flex gap-2"><span className="text-amber-500 shrink-0">3.</span> Allow debate — tensions between roles are the exercise.</li>
                                <li className="flex gap-2">
                                    <span className="text-amber-500 shrink-0">4.</span>
                                    <div>
                                        Draft communications ACTUALLY:
                                        <ul className="text-xs text-muted-foreground mt-1 ml-2 border-l border-border pl-2 space-y-1">
                                            <li>Set timer (15 min per draft)</li>
                                            <li>Read aloud to the group</li>
                                            <li>Critique: Board? Customer? Media?</li>
                                        </ul>
                                    </div>
                                </li>
                                <li className="flex gap-2"><span className="text-amber-500 shrink-0">5.</span> Stop and reassess when inject events (<span className="text-amber-500">⚡</span>) appear.</li>
                            </ul>
                        </div>

                        {/* After */}
                        <div className="bg-card border border-border p-5 rounded-xl">
                            <h4 className="font-bold text-blue-500 mb-4 border-b border-border/50 pb-2">After the Exercise</h4>
                            <ul className="text-sm text-foreground/80 space-y-3">
                                <li className="flex gap-2"><span className="text-blue-500 shrink-0">1.</span> Review captured responses and communication drafts.</li>
                                <li className="flex gap-2">
                                    <span className="text-blue-500 shrink-0">2.</span>
                                    Identify: What surprised the team? Where was consensus easy/hard? What did we miss?
                                </li>
                                <li className="flex gap-2"><span className="text-blue-500 shrink-0">3.</span> Document 3–5 corrective actions with owners/deadlines.</li>
                                <li className="flex gap-2"><span className="text-blue-500 shrink-0">4.</span> Schedule the next exercise (quarterly recommended).</li>
                                <li className="flex gap-2"><span className="text-blue-500 shrink-0">5.</span> Export the after-action report for your compliance file.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function FacilitatorTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">Facilitator Guide</h2>
                <p className="text-muted-foreground">Tips for driving engagement, injecting stress, and controlling the room.</p>
            </div>

            <div className="space-y-8">
                {/* Your Role section */}
                <section>
                    <h3 className="text-lg font-bold text-foreground mb-4">Your Role</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                        You are not a player. You are the environment. Your job is to:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <h4 className="font-bold text-primary text-sm mb-2 flex items-center gap-2">
                                <span className="text-lg">⏱️</span> Keep Time Pressure Real
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Don't let the room debate for 30 minutes on a decision that needs to be made in 2 hours of scenario time.
                            </p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <h4 className="font-bold text-amber-500 text-sm mb-2 flex items-center gap-2">
                                <span className="text-lg">⚖️</span> Surface Tensions
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                If CFO and Legal agree too quickly, push back: "Legal, are you sure you're comfortable with that timeline given the insurance notification clause?"
                            </p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <h4 className="font-bold text-destructive text-sm mb-2 flex items-center gap-2">
                                <span className="text-lg">⚡</span> Play the Injects Hard
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                When TechCrunch calls, make it feel real. "The journalist has your PR team's number. They're publishing in 4 hours. What do you tell them?"
                            </p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl">
                            <h4 className="font-bold text-blue-500 text-sm mb-2 flex items-center gap-2">
                                <span className="text-lg">🛡️</span> Protect the Implementer
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This role gets steamrolled. When VP Tech says "deploy MFA on everything in 2 weeks," ask the Implementer: "Is that actually possible with 8 engineers?"
                            </p>
                        </div>
                    </div>
                </section>

                {/* Common Mistakes */}
                <section>
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl overflow-hidden">
                        <div className="bg-destructive/10 px-5 py-3 border-b border-destructive/20 flex items-center gap-2">
                            <span className="text-destructive font-bold text-lg">⚠️</span>
                            <h3 className="font-bold text-foreground">Common Facilitator Mistakes</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Revealing the "right answer"</h4>
                                <p className="text-xs text-muted-foreground">There is no right answer. Every choice has tradeoffs. Surface the tradeoffs, don't guide toward a specific outcome.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Letting one voice dominate</h4>
                                <p className="text-xs text-muted-foreground">Rotate who speaks first at each step.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Skipping communication exercises</h4>
                                <p className="text-xs text-muted-foreground">These are the most valuable part. Don't let the room say "we'd send an email." Make them ACTUALLY write it.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Rushing through inject events</h4>
                                <p className="text-xs text-muted-foreground">Injects exist to disrupt plans. Give the room 5 minutes to react and replan.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Debrief Questions */}
                <section className="bg-card border border-border p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-emerald-500">📝</span> Post-Exercise Debrief Questions
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                            <p className="text-sm text-foreground/80">"What was the hardest decision and why?"</p>
                        </li>
                        <li className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                            <p className="text-sm text-foreground/80">"Where did the room disagree most? Was that healthy?"</p>
                        </li>
                        <li className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                            <p className="text-sm text-foreground/80">"Which communication draft would you actually send? What would you change?"</p>
                        </li>
                        <li className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
                            <p className="text-sm text-foreground/80">"What would we do differently if this happened for real?"</p>
                        </li>
                        <li className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</div>
                            <p className="text-sm font-bold text-foreground">"What corrective actions should we implement THIS WEEK?"</p>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

function AuditorTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold text-foreground">Auditor Evidence Guide</h2>
                <p className="text-muted-foreground">How this module generates defensible artifacts for compliance frameworks.</p>
            </div>

            <div className="space-y-8">
                {/* Evidence Section */}
                <section>
                    <h3 className="text-lg font-bold text-foreground mb-4">What This Module Provides as Audit Evidence</h3>

                    <div className="space-y-4">
                        <div className="bg-card border border-border p-5 rounded-xl">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-3">
                                <FileCheck className="h-5 w-5" />
                                ISO 27001 Annex A.17 — Business Continuity Testing
                            </h4>
                            <p className="text-sm text-foreground/80 mb-2">Every completed exercise session generates:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>Scenario type and severity level</li>
                                <li>Participant list with assigned roles</li>
                                <li>Date, duration, and mode of exercise</li>
                                <li>Complete decision trail with timestamps</li>
                                <li>Communication drafts produced during the exercise</li>
                                <li>Final assessment with grade and scores</li>
                                <li>Corrective actions identified</li>
                            </ul>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-xl">
                            <h4 className="font-bold text-emerald-500 flex items-center gap-2 mb-3">
                                <FileCheck className="h-5 w-5" />
                                SOC 2 CC7.4 — Response to Identified Security Incidents
                            </h4>
                            <p className="text-sm text-foreground/80 mb-2">Exercise sessions demonstrate that the organization:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>Has defined incident response procedures</li>
                                <li>Tests those procedures regularly</li>
                                <li>Identifies gaps through simulation</li>
                                <li>Documents corrective actions with owners and timelines</li>
                            </ul>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-xl">
                            <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-3">
                                <FileCheck className="h-5 w-5" />
                                NIS2 Article 21(2)(c) — Crisis Management
                            </h4>
                            <p className="text-sm text-foreground/80 mb-2">Exercise sessions demonstrate:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>Cross-functional incident response capability</li>
                                <li>Multi-jurisdiction notification readiness</li>
                                <li>Communication protocols for different stakeholder groups</li>
                                <li>Regular testing and improvement of response procedures</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Evidence Package Export */}
                <section className="bg-muted p-5 rounded-xl border border-border">
                    <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <span className="text-lg">📦</span> Evidence Package
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Export the after-action report from any completed exercise via the <Link href="/exercises/history" className="text-primary hover:underline font-medium">Exercise History</Link> log.
                        The report includes all data listed above in a format suitable for auditor review.
                    </p>
                </section>

                {/* Cadence */}
                <section>
                    <h3 className="text-lg font-bold text-foreground mb-4">Recommended Exercise Cadence</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-card border border-border p-4 rounded-xl space-y-2">
                            <div className="font-bold text-foreground border-b border-border/50 pb-2">Quarterly</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                One full tabletop exercise (<strong>Discussion mode</strong>, 2-3 hours)
                            </p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl space-y-2">
                            <div className="font-bold text-foreground border-b border-border/50 pb-2">Monthly</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                One quick assessment (<strong>Decision mode</strong>, 60-90 minutes)
                            </p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl space-y-2">
                            <div className="font-bold text-foreground border-b border-border/50 pb-2">Annual</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Cover all 3+ scenarios at least once.
                            </p>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-2">
                            <div className="font-bold text-primary border-b border-primary/20 pb-2">After Incidents</div>
                            <p className="text-xs text-primary/80 leading-relaxed">
                                Run a scenario similar to the real incident within <strong>30 days</strong> to test lessons learned.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
