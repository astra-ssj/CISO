"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BrainCircuit, CheckCircle2, Clock, TicketCheck, ShieldAlert, XCircle
} from "lucide-react";

interface DecisionQueueItem {
    id: string;
    kind: 'evidence_expired' | 'evidence_expiring' | 'open_risk' | 'skill_run';
    title: string;
    detail: string;
    href: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    skillRunId: string | null;
    asOf: string;
}

interface PersistedDecision {
    id: string;
    pillar: string;
    urgency: string;
    status: string;
    title: string;
    question: string;
    context: string;
    recommendationAction: string;
    recommendationSummary: string;
    recommendationRationale: string;
    confidenceValue: number;
    confidenceLabel: string;
    source: string;
    skillRunId: string | null;
    sourceResourceType: string | null;
    sourceResourceId: string | null;
    decidedByName: string | null;
    decidedAt: string | null;
    decisionNotes: string | null;
    createdAt: string;
}

const urgencyStyle = (urgency: string) =>
    urgency === "CRITICAL" ? "bg-red-500/10 text-red-500"
        : urgency === "HIGH" ? "bg-orange-500/10 text-orange-400"
        : urgency === "MEDIUM" ? "bg-amber-500/10 text-amber-400"
        : "bg-blue-500/10 text-blue-400";

function NeedsYouTab() {
    const [items, setItems] = useState<DecisionQueueItem[]>([]);
    const [counts, setCounts] = useState<{ evidenceExpired: number; evidenceExpiring: number; openRisks: number; skillRuns: number } | null>(null);
    const [empty, setEmpty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/decision-queue')
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json() as Promise<{ items: DecisionQueueItem[]; empty: boolean; counts: typeof counts }>;
            })
            .then((data) => {
                setItems(data.items);
                setCounts(data.counts);
                setEmpty(data.empty);
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load queue'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-sm text-muted-foreground">Loading work that needs a human…</p>;
    if (error) return <p className="text-sm text-amber-400">Decision queue unavailable: {error}</p>;

    const actionable = items.filter((item) => item.kind !== 'skill_run');
    const runs = items.filter((item) => item.kind === 'skill_run');

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                Computed from evidence expiry and open 5×5 risks. Empty means nothing needs attention; Astra does not invent work.
            </p>

            {counts && (
                <div className="grid gap-3 md:grid-cols-4">
                    <Metric value={counts.evidenceExpired} label="Evidence expired" />
                    <Metric value={counts.evidenceExpiring} label="Expiring in 30d" />
                    <Metric value={counts.openRisks} label="Open risks" />
                    <Metric value={counts.skillRuns} label="Recent skill runs" />
                </div>
            )}

            {empty && (
                <div className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No expired evidence or open risks.</p>
                </div>
            )}

            <div className="space-y-3">
                {actionable.map((item) => (
                    <Link key={item.id} href={item.href}>
                        <Card className="border-border hover:border-primary/30 transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="font-medium text-sm">{item.title}</h4>
                                    <Badge className={urgencyStyle(item.urgency)}>{item.urgency}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{item.detail}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {runs.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent skill runs</p>
                    {runs.map((item) => (
                        <Card key={item.id} className="border-border/40 bg-card/20">
                            <CardContent className="p-3">
                                <p className="text-xs font-mono">{item.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{item.detail} · {item.asOf}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function Metric({ value, label }: { value: number; label: string }) {
    return (
        <Card className="bg-card/30 border-border/30">
            <CardContent className="p-3">
                <p className="text-xl font-bold font-mono">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
            </CardContent>
        </Card>
    );
}

function RecordedDecisionsTab() {
    const [decisions, setDecisions] = useState<PersistedDecision[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolving, setResolving] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/decisions?limit=200');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json() as { decisions: PersistedDecision[] };
            setDecisions(data.decisions);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load decisions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const stats = useMemo(() => ({
        pending: decisions.filter((d) => d.status === 'PENDING').length,
        approved: decisions.filter((d) => d.status === 'APPROVED').length,
        rejected: decisions.filter((d) => d.status === 'REJECTED').length,
        deferred: decisions.filter((d) => d.status === 'DEFERRED').length,
    }), [decisions]);

    const resolve = async (decision: PersistedDecision, status: 'APPROVED' | 'REJECTED' | 'DEFERRED') => {
        setResolving(decision.id);
        try {
            const res = await fetch(`/api/decisions/${decision.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Decision update failed');
        } finally {
            setResolving(null);
        }
    };

    if (loading && decisions.length === 0) return <p className="text-sm text-muted-foreground">Loading recorded decisions…</p>;

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                These decisions are persisted in PostgreSQL. Recommendations do not execute material changes until an authorized human approves them.
            </p>

            <div className="grid gap-3 md:grid-cols-4">
                <Metric value={stats.pending} label="Pending" />
                <Metric value={stats.approved} label="Approved" />
                <Metric value={stats.rejected} label="Rejected" />
                <Metric value={stats.deferred} label="Deferred" />
            </div>

            {error && <p className="text-sm text-amber-400">{error}</p>}

            {decisions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No recorded decisions yet.</p>
                </div>
            )}

            <div className="space-y-3">
                {decisions.map((decision) => (
                    <Card key={decision.id} className="border-border bg-card/30">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline">{decision.pillar}</Badge>
                                        <Badge className={urgencyStyle(decision.urgency)}>{decision.urgency}</Badge>
                                        <Badge variant="secondary">{decision.status}</Badge>
                                    </div>
                                    <h3 className="font-semibold">{decision.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{decision.question}</p>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground">{decision.id}</span>
                            </div>

                            <div className="rounded-md border border-border/50 bg-background/30 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {decision.source === 'AI_DRAFT' ? 'AI draft' : 'Recommendation'}
                                </p>
                                <p className="text-sm font-medium mt-1">{decision.recommendationSummary}</p>
                                {decision.recommendationRationale && (
                                    <p className="text-xs text-muted-foreground mt-2">{decision.recommendationRationale}</p>
                                )}
                            </div>

                            {decision.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        disabled={resolving === decision.id}
                                        onClick={() => void resolve(decision, 'APPROVED')}
                                        className="gap-1.5"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={resolving === decision.id}
                                        onClick={() => void resolve(decision, 'DEFERRED')}
                                        className="gap-1.5"
                                    >
                                        <Clock className="h-4 w-4" /> Defer
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={resolving === decision.id}
                                        onClick={() => void resolve(decision, 'REJECTED')}
                                        className="gap-1.5 text-red-400"
                                    >
                                        <XCircle className="h-4 w-4" /> Reject
                                    </Button>
                                </div>
                            )}

                            {decision.decidedAt && (
                                <p className="text-[10px] text-muted-foreground">
                                    Decided by {decision.decidedByName ?? 'unknown'} · {new Date(decision.decidedAt).toLocaleString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function DecisionsPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BrainCircuit className="h-7 w-7 text-primary" />Decision Center
            </h1>

            <Tabs defaultValue="queue" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="queue" className="gap-2">
                        <TicketCheck className="h-4 w-4" />Needs You
                    </TabsTrigger>
                    <TabsTrigger value="decisions" className="gap-2">
                        <BrainCircuit className="h-4 w-4" />Recorded
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="queue"><NeedsYouTab /></TabsContent>
                <TabsContent value="decisions"><RecordedDecisionsTab /></TabsContent>
            </Tabs>
        </div>
    );
}
