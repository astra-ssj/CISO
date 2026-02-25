"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search, ArrowLeft, CheckCircle2, XCircle, Loader2, Copy, ExternalLink,
    ChevronRight, Plug, AlertCircle, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INTEGRATIONS_REGISTRY, INTEGRATION_CATEGORIES, IntegrationDefinition, IntegrationCategory } from "@/lib/integrations/registry";

// ─── Types ──────────────────────────────────────────────────────────────────

interface IntegrationWithStatus extends IntegrationDefinition {
    status: "available" | "connected" | "error";
    connectedAt: string | null;
    lastTestResult: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    if (status === "connected")
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]">● Connected</Badge>;
    if (status === "error")
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[11px]">● Error</Badge>;
    return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[11px]">○ Available</Badge>;
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
    );
}

// ─── Integration Card ────────────────────────────────────────────────────────

function IntegrationCard({
    integration,
    onClick,
}: {
    integration: IntegrationWithStatus;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group text-left p-5 rounded-xl border transition-all duration-200 flex flex-col gap-3",
                "hover:-translate-y-0.5 hover:shadow-lg",
                integration.status === "connected"
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                    : integration.status === "error"
                        ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                        : "border-border bg-card hover:border-primary/30 hover:bg-card/80 hover:shadow-primary/5"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.logo}</span>
                    <div>
                        <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {integration.name}
                        </div>
                        {integration.popular && (
                            <span className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">★ Popular</span>
                        )}
                    </div>
                </div>
                <StatusBadge status={integration.status} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {integration.description}
            </p>
            {!integration.phase1 && (
                <div className="text-[11px] text-muted-foreground/60 italic">Coming soon in v2.2</div>
            )}
        </button>
    );
}

// ─── Config Wizard ────────────────────────────────────────────────────────────

function ConfigWizard({
    integration,
    onBack,
    onStatusChange,
}: {
    integration: IntegrationWithStatus;
    onBack: () => void;
    onStatusChange: (status: "available" | "connected" | "error") => void;
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [localStatus, setLocalStatus] = useState(integration.status);
    const [showPassword, setShowPassword] = useState<Set<string>>(new Set());

    const step = integration.steps[currentStep];
    const isLastStep = currentStep === integration.steps.length - 1;

    const togglePassword = (key: string) => {
        setShowPassword((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(`/api/integrations/${integration.id}/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: fieldValues }),
            });
            const data = await res.json() as { success?: boolean; error?: string; details?: unknown };
            if (res.ok && data.success) {
                setLocalStatus("connected");
                onStatusChange("connected");
                if (!isLastStep) setCurrentStep((s) => s + 1);
            } else {
                setSaveError(data.error ?? "Failed to save configuration");
            }
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`/api/integrations/${integration.id}/test`, { method: "POST" });
            const data = await res.json() as { success: boolean; message: string };
            setTestResult(data);
            setLocalStatus(data.success ? "connected" : "error");
            onStatusChange(data.success ? "connected" : "error");
        } catch (err) {
            setTestResult({ success: false, message: err instanceof Error ? err.message : "Test failed" });
        } finally {
            setIsTesting(false);
        }
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        try {
            await fetch(`/api/integrations/${integration.id}/disconnect`, { method: "POST" });
            setLocalStatus("available");
            onStatusChange("available");
            setTestResult(null);
            setFieldValues({});
            setCurrentStep(0);
        } finally {
            setIsDisconnecting(false);
        }
    };

    // Coming Soon overlay
    if (!integration.phase1) {
        return (
            <div className="flex-1 flex flex-col">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Back to integrations
                </button>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-md mx-auto text-center">
                    <div className="text-6xl">{integration.logo}</div>
                    <div>
                        <h2 className="text-2xl font-bold">{integration.name}</h2>
                        <p className="text-muted-foreground mt-2">{integration.description}</p>
                    </div>
                    <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 w-full">
                        <div className="text-4xl mb-3">🚀</div>
                        <h3 className="font-semibold mb-1">Coming in v2.2</h3>
                        <p className="text-sm text-muted-foreground">
                            This integration is on our roadmap. Click below to register your interest and we&apos;ll prioritize it.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => window.open("mailto:feedback@astraciso.io?subject=Integration+Request:+" + integration.name)}>
                        <ExternalLink className="h-4 w-4" /> Request This Integration
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to integrations
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-4xl">{integration.logo}</span>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">{integration.name}</h2>
                            <StatusBadge status={localStatus} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{integration.description}</p>
                    </div>
                    {localStatus === "connected" && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400 gap-2"
                            onClick={() => void handleDisconnect()}
                            disabled={isDisconnecting}
                        >
                            {isDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            Disconnect
                        </Button>
                    )}
                </div>
            </div>

            {/* Layout: Steps + Content */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Step nav */}
                <div className="w-48 shrink-0 space-y-1">
                    {integration.steps.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentStep(i)}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-all",
                                i === currentStep
                                    ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <span className={cn(
                                "w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0",
                                i === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {i + 1}
                            </span>
                            <span className="truncate">{s.title}</span>
                        </button>
                    ))}

                    {/* Progress bar */}
                    <div className="mt-4 px-3">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${((currentStep + 1) / integration.steps.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                            Step {currentStep + 1} of {integration.steps.length}
                        </p>
                    </div>
                </div>

                {/* Step content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="space-y-5 pb-4">
                        <div>
                            <h3 className="text-base font-semibold">{step.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                        </div>

                        {/* Copy value */}
                        {step.copyValue && (
                            <div className="p-4 rounded-lg bg-muted/40 border border-border">
                                <p className="text-xs text-muted-foreground mb-2 font-medium">{step.copyValue.label}</p>
                                <div className="flex items-center gap-2 font-mono text-sm bg-background border border-border rounded-md px-3 py-2">
                                    <span className="flex-1 truncate text-primary">{step.copyValue.value}</span>
                                    <CopyButton value={step.copyValue.value} />
                                </div>
                            </div>
                        )}

                        {/* Input fields */}
                        {step.fields && step.fields.length > 0 && (
                            <div className="space-y-4">
                                {step.fields.map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-sm font-medium">
                                            {field.label}
                                            {field.required && <span className="text-red-400 ml-1">*</span>}
                                        </label>
                                        {field.type === "select" ? (
                                            <select
                                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                value={fieldValues[field.key] ?? ""}
                                                onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                            >
                                                <option value="">Select...</option>
                                                {field.options?.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <Input
                                                    type={field.type === "password" && !showPassword.has(field.key) ? "password" : "text"}
                                                    placeholder={field.placeholder}
                                                    value={fieldValues[field.key] ?? ""}
                                                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                                    className="font-mono text-sm"
                                                />
                                                {field.type === "password" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePassword(field.key)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <span className="text-xs">{showPassword.has(field.key) ? "Hide" : "Show"}</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {field.hint && (
                                            <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action button */}
                        {step.action && step.action.actionType === "external_link" && step.action.url && (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => window.open(step.action!.url, "_blank")}
                            >
                                <ExternalLink className="h-4 w-4" />
                                {step.action.label}
                            </Button>
                        )}

                        {/* Test section */}
                        {step.action && step.action.actionType === "test" && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => void handleTest()}
                                    disabled={isTesting || localStatus !== "connected"}
                                    className="gap-2"
                                >
                                    {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                    {isTesting ? "Testing..." : step.action.label}
                                </Button>
                                {localStatus !== "connected" && (
                                    <p className="text-xs text-muted-foreground">Save your configuration first to enable testing.</p>
                                )}
                                {testResult && (
                                    <div className={cn(
                                        "flex items-start gap-3 p-4 rounded-lg border text-sm",
                                        testResult.success
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                            : "bg-red-500/10 border-red-500/30 text-red-400"
                                    )}>
                                        {testResult.success
                                            ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                                            : <XCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                                        <div>
                                            <p className="font-medium">{testResult.success ? "Connection successful!" : "Connection failed"}</p>
                                            <p className="text-xs opacity-80 mt-0.5">{testResult.message}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save error */}
                        {saveError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {saveError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                <Button
                    variant="ghost"
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Previous
                </Button>

                <div className="flex items-center gap-2">
                    {/* Save if there are fields in this step */}
                    {step.fields && step.fields.length > 0 && (
                        <Button
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {isSaving ? "Saving..." : localStatus === "connected" ? "Update & Continue" : "Save & Continue"}
                        </Button>
                    )}

                    {!isLastStep && !(step.fields && step.fields.length > 0) && (
                        <Button onClick={() => setCurrentStep((s) => s + 1)} className="gap-2">
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<IntegrationWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<IntegrationCategory | "all">("all");
    const [selected, setSelected] = useState<IntegrationWithStatus | null>(null);

    const fetchIntegrations = useCallback(async () => {
        try {
            const res = await fetch("/api/integrations");
            if (!res.ok) return;
            const data = await res.json() as { integrations: IntegrationWithStatus[] };
            setIntegrations(data.integrations);
        } catch {
            // silent
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { void fetchIntegrations(); }, [fetchIntegrations]);

    const connectedCount = useMemo(() => integrations.filter((i) => i.status === "connected").length, [integrations]);

    const filtered = useMemo(() => {
        return integrations.filter((i) => {
            const matchCat = activeCategory === "all" || i.category === activeCategory;
            const matchSearch =
                !search ||
                i.name.toLowerCase().includes(search.toLowerCase()) ||
                i.description.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [integrations, activeCategory, search]);

    const categoryCountMap = useMemo(() => {
        const map: Record<string, number> = {};
        for (const i of integrations) {
            map[i.category] = (map[i.category] ?? 0) + 1;
        }
        return map;
    }, [integrations]);

    const handleStatusChange = (id: string, status: "available" | "connected" | "error") => {
        setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
        if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-0 -m-4 md:-m-6 lg:-m-8 overflow-hidden">
            {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
            <aside className="w-64 shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-5 pb-4 border-b border-border">
                    <div className="flex items-center gap-2.5 mb-1">
                        <Plug className="h-5 w-5 text-primary" />
                        <h1 className="font-bold text-base">Integrations</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">Connect your security stack</p>
                    <div className="mt-3">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                            connectedCount > 0
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                        )}>
                            {connectedCount > 0 ? "✓" : "●"} {connectedCount} of {INTEGRATIONS_REGISTRY.length} connected
                        </span>
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 py-3 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search integrations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs bg-background"
                        />
                    </div>
                </div>

                {/* Category list */}
                <nav className="flex-1 overflow-y-auto py-2 px-2">
                    <button
                        onClick={() => { setActiveCategory("all"); setSelected(null); }}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-all mb-0.5",
                            activeCategory === "all"
                                ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <span>🔌</span>
                            <span>All Integrations</span>
                        </span>
                        <span className="text-xs opacity-60">{INTEGRATIONS_REGISTRY.length}</span>
                    </button>

                    {INTEGRATION_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id); setSelected(null); }}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-all mb-0.5",
                                activeCategory === cat.id
                                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span className="truncate">{cat.label}</span>
                            </span>
                            <span className="text-xs opacity-60">{categoryCountMap[cat.id] ?? 0}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ── Main Content ─────────────────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto bg-background">
                <div className="p-6 h-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : selected ? (
                        <ConfigWizard
                            integration={selected}
                            onBack={() => setSelected(null)}
                            onStatusChange={(status) => handleStatusChange(selected.id, status)}
                        />
                    ) : (
                        <>
                            {/* Category header */}
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold">
                                    {activeCategory === "all"
                                        ? "All Integrations"
                                        : INTEGRATION_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {filtered.length} integration{filtered.length !== 1 ? "s" : ""}
                                    {search ? ` matching "${search}"` : ""}
                                </p>
                            </div>

                            {/* Grid */}
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="text-4xl mb-3">🔍</div>
                                    <p className="text-muted-foreground">No integrations found for &quot;{search}&quot;</p>
                                    <Button variant="ghost" className="mt-3" onClick={() => setSearch("")}>Clear search</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filtered.map((integration) => (
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onClick={() => setSelected(integration)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
