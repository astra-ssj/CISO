"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDecisionStore } from "@/lib/decision-engine/router";
import { DecisionCard } from "@/components/decisions/decision-card";
import { PILLAR_META, type DecisionPillar } from "@/lib/decision-engine/types";
import {
    BrainCircuit, CheckCircle2, Clock, Filter,
    ArrowUpDown, Gauge, Zap, TicketCheck, ShieldAlert
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

const urgencyStyle = (p: string) =>
    p === "CRITICAL" ? "bg-red-500/10 text-red-500"
        : p === "HIGH" ? "bg-orange-500/10 text-orange-400"
        : p === "MEDIUM" ? "bg-amber-500/10 text-amber-400"
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

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading real work that needs a human…</p>;
    }
    if (error) {
        return <p className="text-sm text-amber-400">Decision queue unavailable: {error}</p>;
    }

    const actionable = items.filter((i) => i.kind !== 'skill_run');
    const runs = items.filter((i) => i.kind === 'skill_run');

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                Computed from evidence expiry (evidence.expiry) and open 5×5 risks (risk.fiveByFive). Empty means nothing needs you — not that the feed is demo.
            </p>
            {counts && (
                <div className="grid gap-3 md:grid-cols-4">
                    <Card className="bg-card/30 border-border/30"><CardContent className="p-3"><p className="text-xl font-bold font-mono">{counts.evidenceExpired}</p><p className="text-[10px] text-muted-foreground">Evidence expired</p></CardContent></Card>
                    <Card className="bg-card/30 border-border/30"><CardContent className="p-3"><p className="text-xl font-bold font-mono">{counts.evidenceExpiring}</p><p className="text-[10px] text-muted-foreground">Expiring in 30d</p></CardContent></Card>
                    <Card className="bg-card/30 border-border/30"><CardContent className="p-3"><p className="text-xl font-bold font-mono">{counts.openRisks}</p><p className="text-[10px] text-muted-foreground">Open risks</p></CardContent></Card>
                    <Card className="bg-card/30 border-border/30"><CardContent className="p-3"><p className="text-xl font-bold font-mono">{counts.skillRuns}</p><p className="text-[10px] text-muted-foreground">Recent skill runs</p></CardContent></Card>
                </div>
            )}

            {empty && (
                <div className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No expired evidence or open risks.</p>
                    <p className="text-xs mt-2">Add evidence with an expiry date or a risk on Governance. OpenNeko approvals are not wired yet.</p>
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
                                <p className="text-[10px] text-muted-foreground mt-2 font-mono">{item.kind}</p>
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

function DecisionFeedTab() {
    const { decisions, getPending, getStats } = useDecisionStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const stats = mounted ? getStats() : { pending: 0, approved: 0, deferred: 0, avgConfidence: 0, total: 0 };
    const pending = mounted ? getPending() : [];
    const [pillarFilter, setPillarFilter] = useState<DecisionPillar | 'ALL'>('ALL');
    const [showResolved, setShowResolved] = useState(false);

    const filtered = pillarFilter === 'ALL'
        ? (showResolved ? decisions : pending)
        : (showResolved ? decisions : pending).filter(d => d.pillar === pillarFilter);

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                Operator-recorded decisions only. This list starts empty. OpenNeko will write here later; until then nothing is invented.
            </p>
            <div className="flex items-center justify-end">
                <Button size="sm" variant={showResolved ? 'default' : 'outline'} className="h-8 text-xs gap-1" onClick={() => setShowResolved(!showResolved)}>
                    <Filter className="h-3.5 w-3.5" />{showResolved ? 'All Decisions' : 'Pending Only'}
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><Zap className="h-6 w-6 text-amber-400" /><div><p className="text-xl font-bold">{stats.pending}</p><p className="text-[10px] text-muted-foreground">Pending</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-400" /><div><p className="text-xl font-bold">{stats.approved}</p><p className="text-[10px] text-muted-foreground">Approved</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><Clock className="h-6 w-6 text-amber-400" /><div><p className="text-xl font-bold">{stats.deferred}</p><p className="text-[10px] text-muted-foreground">Deferred</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><Gauge className="h-6 w-6 text-blue-400" /><div><p className="text-xl font-bold">{stats.avgConfidence}%</p><p className="text-[10px] text-muted-foreground">Avg Confidence</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><ArrowUpDown className="h-6 w-6 text-purple-400" /><div><p className="text-xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></div></CardContent></Card>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={pillarFilter === 'ALL' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setPillarFilter('ALL')}>All Pillars</Button>
                {(Object.keys(PILLAR_META) as DecisionPillar[]).map(pillar => {
                    const meta = PILLAR_META[pillar]; const count = pending.filter(d => d.pillar === pillar).length;
                    return (
                        <Button key={pillar} size="sm" variant={pillarFilter === pillar ? 'default' : 'outline'} className="h-7 text-[11px] gap-1" onClick={() => setPillarFilter(pillar)}>
                            {meta.label}{count > 0 && <Badge className="h-4 w-4 p-0 justify-center rounded-full text-[9px] bg-primary/30">{count}</Badge>}
                        </Button>
                    );
                })}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground"><BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No recorded decisions yet.</p></div>
                )}
                {filtered.map(decision => <DecisionCard key={decision.id} decision={decision} />)}
            </div>
        </div>
    );
}

export default function DecisionsPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BrainCircuit className="h-7 w-7 text-primary" />Decision Center</h1>

            <Tabs defaultValue="queue" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="queue" className="gap-2"><TicketCheck className="h-4 w-4" />Needs you</TabsTrigger>
                    <TabsTrigger value="decisions" className="gap-2"><Zap className="h-4 w-4" />Recorded</TabsTrigger>
                </TabsList>

                <TabsContent value="queue"><NeedsYouTab /></TabsContent>
                <TabsContent value="decisions"><DecisionFeedTab /></TabsContent>
            </Tabs>
        </div>
    );
}
