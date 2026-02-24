"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    HelpCircle,
    Search,
    LayoutDashboard,
    Target,
    Zap,
    FileText,
    Siren,
    BrainCircuit,
    Building2,
    BookOpen,
    Shield,
    Settings,
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
    | "strategy"
    | "governance"
    | "decisions"
    | "incidents"
    | "intelligence"
    | "vendors"
    | "knowledge"
    | "appsec"
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
        category: "Core",
        content: {
            what: "Real-time security posture overview with executive briefing and board reporting.",
            shows: "Overview (posture gauge, threat pulse, metrics), Executive Brief (board-ready summary), Reports & Board Deck (export DOCX/PDF).",
            howToUse: "Your daily starting point. Use the tabs to switch between live dashboard, executive summary, and report generation.",
        },
    },
    {
        id: "strategy",
        title: "Strategy & OKRs",
        path: "/strategy",
        icon: Target,
        category: "Core",
        content: {
            what: "Security strategy, OKR tracking, KPIs, and project management.",
            shows: "OKRs (objectives & key results), Defense Matrix (control coverage), KPI Dashboard (20+ auto-computed KPIs), Program Tracker (project Gantt & status).",
            howToUse: "Define security objectives, track key results, monitor KPIs with board-friendly translations, and manage security projects — all in one tabbed view.",
        },
    },
    {
        id: "governance",
        title: "Governance & Risk",
        path: "/governance",
        icon: FileText,
        category: "Core",
        content: {
            what: "Compliance heatmap, FAIR-based risk register, and policy lifecycle management.",
            shows: "Compliance (evidence vault, framework heatmap), Risk Register (FAIR methodology, ALE), Policy Engine (draft → review → approve → publish).",
            howToUse: "Upload evidence, track compliance across frameworks (ISO 27001, NIST, GDPR). Create risk scenarios with quantitative scoring. Manage policies through templates and lifecycle stages.",
        },
    },
    {
        id: "decisions",
        title: "Decision Center",
        path: "/decisions",
        icon: Zap,
        category: "Core",
        content: {
            what: "AI-assisted security decisions and action queue.",
            shows: "Decisions (AI recommendations with confidence scores, pillar filters), Action Queue (security tickets and tasks).",
            howToUse: "Review AI-generated recommendations, approve/defer decisions. Manage security action items and tickets in the Action Queue tab.",
        },
    },
    {
        id: "incidents",
        title: "Incidents",
        path: "/incidents",
        icon: Siren,
        category: "Operations",
        content: {
            what: "Incident response management and tabletop exercises.",
            shows: "Incident Response (playbooks, war room, timeline), Tabletop Exercises (scenario planning, CRUD, status tracking).",
            howToUse: "Manage active incidents and playbooks. Use the War Room (/incidents/war-room) for live response. Plan and run tabletop exercises for preparedness.",
            subPages: [{ label: "War Room", path: "/incidents/war-room" }],
        },
    },
    {
        id: "intelligence",
        title: "Intelligence",
        path: "/intelligence",
        icon: BrainCircuit,
        category: "Operations",
        content: {
            what: "Threat monitoring and intelligence feeds.",
            shows: "Threat feed, MITRE ATT&CK matrix, ransomware statistics.",
            howToUse: "Monitor emerging threats. Ransomware dashboard (/intelligence/ransomware) tracks active groups and trends.",
            subPages: [{ label: "Ransomware Dashboard", path: "/intelligence/ransomware" }],
        },
    },
    {
        id: "vendors",
        title: "Vendor Risk",
        path: "/vendors",
        icon: Building2,
        category: "Third Party",
        content: {
            what: "Third-party risk management and CAIQ automation.",
            shows: "Vendor Registry, CAIQ Automation, Knowledge Transfer, Review Queue.",
            howToUse: "Track vendors and risk ratings. Use CAIQ Automation to auto-fill questionnaires with AI. Knowledge Transfer matches and transfers answers between questionnaires with 4-tier confidence.",
        },
    },
    {
        id: "knowledge",
        title: "Knowledge Base",
        path: "/vendors/knowledge",
        icon: BookOpen,
        category: "Third Party",
        content: {
            what: "Centralized knowledge repository for vendor questionnaire answers.",
            shows: "Knowledge entries, import/export, search.",
            howToUse: "Build your organisation's answer library. Import from completed questionnaires; the system uses this to auto-fill future ones.",
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
            howToUse: "Review application vulnerabilities. Integrates with Trivy for container and dependency scanning.",
        },
    },
    {
        id: "settings",
        title: "Settings",
        path: "/settings",
        icon: Settings,
        category: "Platform",
        content: {
            what: "AI provider configuration, preferences, and AI economics.",
            shows: "AI Provider (LLM selection, API keys, connection test), Preferences (notifications), AI Economics (cost tracking, burn rate, margin alerts).",
            howToUse: "Configure which LLM powers Astra, manage notification preferences, and monitor API cost analytics.",
        },
    },
];

const CATEGORIES: { id: string; label: string; moduleIds: ModuleId[] }[] = [
    { id: "core", label: "Core", moduleIds: ["command-center", "strategy", "governance", "decisions"] },
    { id: "ops", label: "Operations", moduleIds: ["incidents", "intelligence"] },
    { id: "third", label: "Third Party", moduleIds: ["vendors", "knowledge"] },
    { id: "tech", label: "Technical", moduleIds: ["appsec"] },
    { id: "platform", label: "Platform", moduleIds: ["settings"] },
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
                    <li>Start at the <Link href="/" className="text-primary hover:underline">Command Center</Link> to see your posture, executive brief, and reports — all under one roof.</li>
                    <li>Define objectives in <Link href="/strategy" className="text-primary hover:underline">Strategy & OKRs</Link> and track KPIs, projects, and the defense matrix from its tabs.</li>
                    <li>Log risks and manage policies in <Link href="/governance" className="text-primary hover:underline">Governance & Risk</Link>.</li>
                    <li>Use the <Link href="/decisions" className="text-primary hover:underline">Decision Center</Link> for AI-assisted decisions and the Action Queue for tasks.</li>
                    <li>Manage <Link href="/incidents" className="text-primary hover:underline">Incidents</Link> and run tabletop exercises from one place.</li>
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
                    Use the AI assistant from the header for quick questions when it is configured. Keyboard shortcuts are available in the chat and in context-specific views (e.g. War Room). Check the product tour and in-app hints for the latest shortcuts.
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

    // "Ask AI" opens the global chat and sends the query (optional; requires sign-in and API keys).
    const handleAskAi = () => {
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
                <div className="relative flex flex-col gap-2">
                    <div className="relative flex gap-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search modules (e.g. policy, risk, governance)"
                            aria-label="Search help modules"
                            className="pl-9 flex-1 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                        />
                        <Button onClick={handleAskAi} variant="secondary" className="shrink-0" type="button">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ask AI
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Browse the guides below anytime. The AI assistant is available when you are signed in and an AI provider is configured in Settings.
                    </p>
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
