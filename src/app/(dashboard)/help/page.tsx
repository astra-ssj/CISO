"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    HelpCircle,
    Search,
    LayoutDashboard,
    Presentation,
    Target,
    BarChart3,
    FolderKanban,
    Zap,
    AlertTriangle,
    FileText,
    ScrollText,
    Siren,
    Gamepad2,
    BrainCircuit,
    Building2,
    TicketCheck,
    DollarSign,
    FileBarChart,
    Shield,
    Server,
    ShieldCheck,
    Settings,
    BookOpen,
    ChevronRight,
    MessageSquare,
    Cpu,
    Users,
    Bot,
    Keyboard,
    type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAstraStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type ModuleId =
    | "getting-started"
    | "command-center"
    | "executive-brief"
    | "strategy"
    | "kpis"
    | "projects"
    | "decisions"
    | "risk"
    | "governance"
    | "policies"
    | "incidents"
    | "wargames"
    | "intelligence"
    | "vendors"
    | "tickets"
    | "budget"
    | "reporting"
    | "appsec"
    | "infrastructure"
    | "privacy"
    | "settings";

interface ModuleDef {
    id: ModuleId;
    title: string;
    path: string;
    icon: LucideIcon;
    category: string;
    content: {
        what: string;
        shows: string;
        howToUse: string;
        subPages?: { label: string; path: string }[];
    };
}

const MODULES: ModuleDef[] = [
    {
        id: "command-center",
        title: "Command Center",
        path: "/",
        icon: LayoutDashboard,
        category: "Overview & Command",
        content: {
            what: "Real-time security posture overview.",
            shows: "Posture gauge, threat pulse, key metrics, and active incidents.",
            howToUse:
                "Your daily starting point — check posture score, review alerts, and drill into any area needing attention.",
        },
    },
    {
        id: "executive-brief",
        title: "Executive Brief",
        path: "/executive-brief",
        icon: Presentation,
        category: "Overview & Command",
        content: {
            what: "Board-ready security summary.",
            shows: "Investment heatmap, top risks, compliance status, bento layout.",
            howToUse:
                "Use before board meetings to get a snapshot of security posture. Export as board deck via Reporting module.",
        },
    },
    {
        id: "strategy",
        title: "Strategy",
        path: "/strategy",
        icon: Target,
        category: "Strategy & Execution",
        content: {
            what: "Security strategy and OKR tracking.",
            shows: "OKRs, KPI rows, defense matrix (control grid).",
            howToUse:
                "Define security objectives, track key results, and visualize control coverage across your defense matrix.",
            subPages: [
                { label: "Defense Matrix", path: "/strategy/matrix" },
            ],
        },
    },
    {
        id: "kpis",
        title: "KPIs",
        path: "/kpis",
        icon: BarChart3,
        category: "Strategy & Execution",
        content: {
            what: "20+ auto-computed security KPIs.",
            shows: "KPI dashboard with health indicators, trends, sparklines.",
            howToUse:
                "Monitor security program health. Upload PPTX/DOCX files to import additional KPIs. Each KPI includes board-friendly translation.",
        },
    },
    {
        id: "projects",
        title: "Projects",
        path: "/projects",
        icon: FolderKanban,
        category: "Strategy & Execution",
        content: {
            what: "Security project and OKR tracking.",
            howToUse:
                "Track security initiatives, assign owners, monitor progress against strategic objectives.",
            shows: "Project list, OKR linkage, status and owners.",
        },
    },
    {
        id: "decisions",
        title: "Decisions",
        path: "/decisions",
        icon: Zap,
        category: "Strategy & Execution",
        content: {
            what: "AI-assisted security decision support.",
            shows: "Decision queue, scoring, recommendations, confidence levels.",
            howToUse:
                "Log security decisions needing evaluation. AI provides recommendations with confidence scores. Review, approve, or override.",
        },
    },
    {
        id: "risk",
        title: "Risk Register",
        path: "/risk",
        icon: AlertTriangle,
        category: "Risk & Governance",
        content: {
            what: "Quantitative risk management using FAIR methodology.",
            shows: "Risk scenarios with ALE (Annualized Loss Expectancy), risk scores, history.",
            howToUse:
                "Create risk scenarios, define threat actors, estimate loss magnitudes. FAIR engine calculates quantitative risk scores for board reporting.",
        },
    },
    {
        id: "governance",
        title: "Governance",
        path: "/governance",
        icon: FileText,
        category: "Risk & Governance",
        content: {
            what: "Compliance management and evidence tracking.",
            shows: "Evidence vault, compliance heatmap, audit readiness.",
            howToUse:
                "Upload and organize evidence artifacts. Track compliance status across frameworks (ISO 27001, NIST, GDPR, NIS2). Heatmap shows coverage gaps at a glance.",
        },
    },
    {
        id: "policies",
        title: "Policies",
        path: "/policies",
        icon: ScrollText,
        category: "Risk & Governance",
        content: {
            what: "Policy lifecycle management.",
            shows: "Policy editor, Kanban board, dependency graph, golden library.",
            howToUse:
                "Draft policies using templates. Track policy status through Kanban (Draft → Review → Approved → Published). View dependencies between policies. AI can generate policy drafts.",
        },
    },
    {
        id: "incidents",
        title: "Incidents",
        path: "/incidents",
        icon: Siren,
        category: "Operations",
        content: {
            what: "Incident response management.",
            shows: "Incident timeline, severity tracking, resolution status.",
            howToUse:
                "Log incidents, track severity, assign commanders. Use the War Room (/incidents/war-room) for active incidents — includes AI copilot and secure communications.",
            subPages: [{ label: "War Room", path: "/incidents/war-room" }],
        },
    },
    {
        id: "wargames",
        title: "War Games",
        path: "/wargames",
        icon: Gamepad2,
        category: "Operations",
        content: {
            what: "Tabletop exercise and scenario simulation.",
            shows: "Scenario builder, MITRE ATT&CK mapping, after-action review.",
            howToUse:
                "Build attack scenarios, simulate incidents, run tabletop exercises. AI generates realistic scenarios. Document lessons learned in AAR.",
        },
    },
    {
        id: "intelligence",
        title: "Threat Intelligence",
        path: "/intelligence",
        icon: BrainCircuit,
        category: "Operations",
        content: {
            what: "Threat monitoring and intelligence feeds.",
            shows: "Threat feed, MITRE ATT&CK matrix, ransomware statistics.",
            howToUse:
                "Monitor emerging threats relevant to your org. Ransomware dashboard (/intelligence/ransomware) tracks active groups and trends.",
            subPages: [{ label: "Ransomware Dashboard", path: "/intelligence/ransomware" }],
        },
    },
    {
        id: "vendors",
        title: "Vendor Risk",
        path: "/vendors",
        icon: Building2,
        category: "Third Party & Compliance",
        content: {
            what: "Third-party risk management and CAIQ automation.",
            shows: "Vendor Registry, CAIQ Automation, Knowledge Transfer, Review Queue.",
            howToUse:
                "Vendor Registry: track vendors, risk ratings, review dates. CAIQ Automation: upload CAIQ v4 and auto-fill 80–90% with AI. Knowledge Transfer: upload your completed questionnaire as source and customer's empty one as target; system matches and transfers answers with 4-tier confidence (Direct ID 0.95+, Semantic 0.80–0.95, AI-adapted 0.60–0.80, Manual under 0.60). Review Queue: review and approve AI answers before export.",
            subPages: [
                { label: "Vendor Registry", path: "/vendors" },
                { label: "CAIQ Automation", path: "/vendors" },
                { label: "Knowledge Transfer", path: "/vendors" },
                { label: "Review Queue", path: "/vendors" },
            ],
        },
    },
    {
        id: "privacy",
        title: "Privacy",
        path: "/privacy",
        icon: ShieldCheck,
        category: "Third Party & Compliance",
        content: {
            what: "Privacy compliance management.",
            shows: "RoPA (Records of Processing Activities), DSAR tracking, breach simulation, vendor privacy risk.",
            howToUse:
                "Manage privacy obligations under GDPR and other regulations. Track data processing activities and subject access requests.",
        },
    },
    {
        id: "tickets",
        title: "Tickets",
        path: "/tickets",
        icon: TicketCheck,
        category: "Execution",
        content: {
            what: "Jira integration for security task management.",
            shows: "Ticket queue, CISO-specific templates.",
            howToUse:
                "Create security tickets using pre-built templates (incident, risk, vendor, compliance). Syncs with Jira Cloud when configured. Works offline with local queue when Jira unavailable.",
        },
    },
    {
        id: "budget",
        title: "Budget",
        path: "/budget",
        icon: DollarSign,
        category: "Execution",
        content: {
            what: "Security budget planning and tracking.",
            howToUse:
                "Plan security investments, track spend against budget, justify costs with risk-reduction metrics.",
            shows: "Budget breakdown, spend vs plan, investment justification.",
        },
    },
    {
        id: "reporting",
        title: "Reporting",
        path: "/reporting",
        icon: FileBarChart,
        category: "Execution",
        content: {
            what: "Board deck and report generation.",
            howToUse:
                "Generate board-ready reports and presentations. Export as DOCX, PDF, or Excel. Pull data from across all modules for comprehensive security reporting.",
            shows: "Report builder, export options, cross-module data.",
        },
    },
    {
        id: "appsec",
        title: "AppSec",
        path: "/appsec",
        icon: Shield,
        category: "Technical",
        content: {
            what: "Application security posture.",
            shows: "SAST results, Trivy vulnerability scanning, security posture.",
            howToUse:
                "Review application vulnerabilities. Integrates with Trivy for container and dependency scanning.",
        },
    },
    {
        id: "infrastructure",
        title: "Infrastructure",
        path: "/infrastructure",
        icon: Server,
        category: "Technical",
        content: {
            what: "Infrastructure security overview.",
            howToUse:
                "Monitor infrastructure security posture, review configurations, track hardening status.",
            shows: "Infrastructure posture, configuration status.",
        },
    },
    {
        id: "settings",
        title: "Settings",
        path: "/settings",
        icon: Settings,
        category: "Platform",
        content: {
            what: "Platform configuration.",
            howToUse:
                "Configure AI providers, integrations (Jira, GitHub), user roles, and organization settings.",
            shows: "Integrations, roles, AI and org settings.",
        },
    },
];

const CATEGORIES: { id: string; label: string; moduleIds: ModuleId[] }[] = [
    { id: "overview", label: "Overview & Command", moduleIds: ["command-center", "executive-brief"] },
    {
        id: "strategy",
        label: "Strategy & Execution",
        moduleIds: ["strategy", "kpis", "projects", "decisions"],
    },
    {
        id: "risk",
        label: "Risk & Governance",
        moduleIds: ["risk", "governance", "policies"],
    },
    {
        id: "ops",
        label: "Operations",
        moduleIds: ["incidents", "wargames", "intelligence"],
    },
    {
        id: "third",
        label: "Third Party & Compliance",
        moduleIds: ["vendors", "privacy"],
    },
    {
        id: "exec",
        label: "Execution",
        moduleIds: ["tickets", "budget", "reporting"],
    },
    {
        id: "tech",
        label: "Technical",
        moduleIds: ["appsec", "infrastructure"],
    },
    {
        id: "platform",
        label: "Platform",
        moduleIds: ["settings"],
    },
];

function GettingStartedContent() {
    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Quick start guide
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                    <li>Start at the <Link href="/" className="text-primary hover:underline">Command Center</Link> to see your current posture and active alerts.</li>
                    <li>Review the <Link href="/executive-brief" className="text-primary hover:underline">Executive Brief</Link> before board meetings and export via Reporting.</li>
                    <li>Define objectives in <Link href="/strategy" className="text-primary hover:underline">Strategy</Link> and track KPIs in <Link href="/kpis" className="text-primary hover:underline">KPIs</Link>.</li>
                    <li>Log risks in the <Link href="/risk" className="text-primary hover:underline">Risk Register</Link> and maintain evidence in <Link href="/governance" className="text-primary hover:underline">Governance</Link>.</li>
                    <li>Use <Link href="/decisions" className="text-primary hover:underline">Decisions</Link> for AI-assisted choices and <Link href="/help" className="text-primary hover:underline">Help</Link> (or the AI chat) for questions.</li>
                </ol>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Architecture overview
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                    Astra-CISO uses a reactive <strong className="text-foreground">Signal Bus</strong> to connect tactical events with strategic decisions. The platform aligns with <strong className="text-foreground">ZTAIP</strong> (Zero Trust Architecture and Identity Posture) principles: signals from SIEM, Trivy, and threat intel are normalized by the Intelligence Engine and drive automatic updates to risk scores and strategy.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                    <li><strong className="text-foreground">Inputs:</strong> SIEM feeds, Trivy scans, threat intel streams.</li>
                    <li><strong className="text-foreground">Processing:</strong> Intelligence Engine normalizes events into Signals.</li>
                    <li><strong className="text-foreground">Outputs:</strong> Signals update Risk Register and Strategy Pyramid.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Role-based access
                </h2>
                <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="font-medium text-foreground w-28">CISO</span>
                        <span className="text-muted-foreground">Full access; strategy, decisions, reporting, settings.</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="font-medium text-foreground w-28">SEC_ENGINEER</span>
                        <span className="text-muted-foreground">Operational modules: incidents, appsec, infrastructure, tickets.</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="font-medium text-foreground w-28">AUDITOR</span>
                        <span className="text-muted-foreground">Read-only access to governance, policies, evidence.</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="font-medium text-foreground w-28">VIEWER</span>
                        <span className="text-muted-foreground">Dashboard and reports only; no edits.</span>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI features
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                    AI runs locally (e.g. Llama via Ollama) for privacy and low latency. Key behaviors:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                    <li><strong className="text-foreground">Circuit breaker:</strong> Fails gracefully if the AI service is unavailable.</li>
                    <li><strong className="text-foreground">Confidence tiers:</strong> Recommendations show confidence (e.g. high / medium / low) so you can approve or override.</li>
                    <li><strong className="text-foreground">Autonomy levels:</strong> Control how much the AI can auto-apply (e.g. suggest vs. auto-fill) in Decisions, CAIQ, and policy drafts.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-primary" />
                    Keyboard shortcuts
                </h2>
                <p className="text-muted-foreground text-sm">
                    Use the global AI chat (OmniChat) from the header for quick questions. Keyboard shortcuts are available in the chat and in context-specific views (e.g. War Room). Check the product tour and in-app hints for the latest shortcuts.
                </p>
            </section>
        </div>
    );
}

function ModuleContent({ module }: { module: ModuleDef }) {
    const { content } = module;
    const Icon = module.icon;
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">{module.title}</h2>
                    <Link
                        href={module.path}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                        Open {module.title}
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            <div className="grid gap-4">
                <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">What it is</h3>
                    <p className="text-sm text-muted-foreground">{content.what}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">What it shows</h3>
                    <p className="text-sm text-muted-foreground">{content.shows}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">How to use it</h3>
                    <p className="text-sm text-muted-foreground">{content.howToUse}</p>
                </div>
                {content.subPages && content.subPages.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-foreground mb-2">Related pages</h3>
                        <ul className="flex flex-wrap gap-2">
                            {content.subPages.map((sp) => (
                                <li key={sp.path + sp.label}>
                                    <Link
                                        href={sp.path}
                                        className="text-sm text-primary hover:underline inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/5 border border-primary/20"
                                    >
                                        {sp.label}
                                        <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function HelpPage() {
    const [selectedId, setSelectedId] = useState<ModuleId | "getting-started">("getting-started");
    const [searchQuery, setSearchQuery] = useState("");
    const { setChatOpen, sendQuery } = useAstraStore();

    const handleSearchSubmit = () => {
        const q = searchQuery.trim();
        if (q) {
            setChatOpen(true);
            sendQuery(q);
        }
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return CATEGORIES;
        const q = searchQuery.toLowerCase();
        return CATEGORIES.map((cat) => ({
            ...cat,
            moduleIds: cat.moduleIds.filter((id) => {
                const m = MODULES.find((x) => x.id === id);
                return m && (m.title.toLowerCase().includes(q) || m.content.what.toLowerCase().includes(q));
            }),
        })).filter((cat) => cat.moduleIds.length > 0);
    }, [searchQuery]);

    const showGettingStarted =
        !searchQuery.trim() ||
        "getting started quick start architecture role ai shortcuts".split(" ").some((t) => searchQuery.toLowerCase().includes(t));

    const selectedModule = selectedId === "getting-started" ? null : MODULES.find((m) => m.id === selectedId);

    return (
        <div className="flex flex-col h-full max-w-[1600px] mx-auto gap-4">
            {/* Header + Search */}
            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <HelpCircle className="h-8 w-8 text-primary" />
                        Platform Guide
                    </h1>
                    <p className="text-muted-foreground">
                        Knowledge base for CISOs and security analysts. Search or browse by module.
                    </p>
                </div>
                <div className="relative flex gap-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search modules or ask AI (e.g. “How do I add a policy?”)"
                        className="pl-9 flex-1 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    />
                    <Button onClick={handleSearchSubmit} variant="secondary" className="shrink-0">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask AI
                    </Button>
                </div>
            </div>

            {/* Layout: Sidebar + Content */}
            <div className="flex flex-1 min-h-0 gap-6">
                {/* Left sidebar - collapsible categories */}
                <aside className="w-64 shrink-0 flex flex-col border border-border rounded-lg bg-card overflow-hidden">
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            <button
                                onClick={() => setSelectedId("getting-started")}
                                className={cn(
                                    "w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                                    selectedId === "getting-started"
                                        ? "bg-primary/15 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <BookOpen className="h-4 w-4 shrink-0" />
                                Getting Started
                            </button>
                            {showGettingStarted && searchQuery.trim() && (
                                <p className="px-3 py-1 text-xs text-muted-foreground">Matches “getting started”</p>
                            )}
                            <Accordion type="multiple" className="w-full mt-2" defaultValue={["overview", "strategy", "risk"]}>
                                {filteredCategories.map((cat) => (
                                    <AccordionItem key={cat.id} value={cat.id} className="border-none">
                                        <AccordionTrigger className="py-2 px-3 hover:no-underline text-sm font-medium text-foreground [&[data-state=open]>svg]:rotate-180">
                                            {cat.label}
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-1 pt-0">
                                            <div className="space-y-0.5 pl-1">
                                                {cat.moduleIds.map((id) => {
                                                    const m = MODULES.find((x) => x.id === id);
                                                    if (!m) return null;
                                                    const Icon = m.icon;
                                                    const isActive = selectedId === m.id;
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => setSelectedId(m.id)}
                                                            className={cn(
                                                                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                                                                isActive
                                                                    ? "bg-primary/15 text-primary"
                                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            )}
                                                        >
                                                            <Icon className="h-4 w-4 shrink-0" />
                                                            <span className="truncate">{m.title}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </ScrollArea>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 overflow-auto">
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">
                                {selectedId === "getting-started"
                                    ? "Getting Started"
                                    : selectedModule?.title ?? "Platform Guide"}
                            </CardTitle>
                            {selectedModule && (
                                <CardDescription>
                                    {selectedModule.content.what}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-2">
                            {selectedId === "getting-started" ? (
                                <GettingStartedContent />
                            ) : selectedModule ? (
                                <ModuleContent module={selectedModule} />
                            ) : (
                                <p className="text-muted-foreground text-sm">Select a module from the sidebar.</p>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
