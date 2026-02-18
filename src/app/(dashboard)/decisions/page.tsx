"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDecisionStore } from "@/lib/decision-engine/router";
import { DecisionCard } from "@/components/decisions/decision-card";
import { PILLAR_META, URGENCY_META, type DecisionPillar } from "@/lib/decision-engine/types";
import {
    BrainCircuit, CheckCircle2, Clock, XCircle, Filter,
    ArrowUpDown, Gauge, Zap
} from "lucide-react";

export default function DecisionsPage() {
    const { decisions, getPending, getStats } = useDecisionStore();
    const stats = getStats();
    const pending = getPending();
    const [pillarFilter, setPillarFilter] = useState<DecisionPillar | 'ALL'>('ALL');
    const [showResolved, setShowResolved] = useState(false);

    const filtered = pillarFilter === 'ALL'
        ? (showResolved ? decisions : pending)
        : (showResolved ? decisions : pending).filter(d => d.pillar === pillarFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BrainCircuit className="h-7 w-7 text-primary" />
                        Decision Center
                    </h1>
                    <p className="text-muted-foreground">AI-powered security decisions awaiting your approval</p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant={showResolved ? 'default' : 'outline'}
                        className="h-8 text-xs gap-1"
                        onClick={() => setShowResolved(!showResolved)}>
                        <Filter className="h-3.5 w-3.5" />
                        {showResolved ? 'All Decisions' : 'Pending Only'}
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid gap-3 md:grid-cols-5">
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Zap className="h-6 w-6 text-amber-400" />
                        <div>
                            <p className="text-xl font-bold text-white">{stats.pending}</p>
                            <p className="text-[10px] text-muted-foreground">Pending</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        <div>
                            <p className="text-xl font-bold text-white">{stats.approved}</p>
                            <p className="text-[10px] text-muted-foreground">Approved</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Clock className="h-6 w-6 text-amber-400" />
                        <div>
                            <p className="text-xl font-bold text-white">{stats.deferred}</p>
                            <p className="text-[10px] text-muted-foreground">Deferred</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Gauge className="h-6 w-6 text-blue-400" />
                        <div>
                            <p className="text-xl font-bold text-white">{stats.avgConfidence}%</p>
                            <p className="text-[10px] text-muted-foreground">Avg Confidence</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <ArrowUpDown className="h-6 w-6 text-purple-400" />
                        <div>
                            <p className="text-xl font-bold text-white">{stats.total}</p>
                            <p className="text-[10px] text-muted-foreground">Total Decisions</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pillar Filters */}
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={pillarFilter === 'ALL' ? 'default' : 'outline'}
                    className="h-7 text-[11px]" onClick={() => setPillarFilter('ALL')}>
                    All Pillars
                </Button>
                {(Object.keys(PILLAR_META) as DecisionPillar[]).map(pillar => {
                    const meta = PILLAR_META[pillar];
                    const count = pending.filter(d => d.pillar === pillar).length;
                    return (
                        <Button key={pillar} size="sm"
                            variant={pillarFilter === pillar ? 'default' : 'outline'}
                            className="h-7 text-[11px] gap-1"
                            onClick={() => setPillarFilter(pillar)}>
                            {meta.label}
                            {count > 0 && <Badge className="h-4 w-4 p-0 justify-center rounded-full text-[9px] bg-primary/30">{count}</Badge>}
                        </Button>
                    );
                })}
            </div>

            {/* Decision Feed */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No decisions matching your filter.</p>
                    </div>
                )}
                {filtered.map(decision => (
                    <DecisionCard key={decision.id} decision={decision} />
                ))}
            </div>
        </div>
    );
}
