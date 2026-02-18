"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    type Decision, type DecisionStatus,
    PILLAR_META, URGENCY_META
} from '@/lib/decision-engine/types';
import { useDecisionStore } from '@/lib/decision-engine/router';
import {
    CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
    Shield, Sparkles, ArrowRight, AlertTriangle, Gauge
} from 'lucide-react';

const CONFIDENCE_COLORS: Record<string, string> = {
    VERY_HIGH: 'text-emerald-400',
    HIGH: 'text-blue-400',
    MODERATE: 'text-yellow-400',
    LOW: 'text-orange-400',
    SPECULATIVE: 'text-red-400',
};

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    APPROVE: { label: 'Approve', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    REJECT: { label: 'Reject', icon: <XCircle className="h-3.5 w-3.5" /> },
    MITIGATE: { label: 'Mitigate', icon: <Shield className="h-3.5 w-3.5" /> },
    TRANSFER: { label: 'Transfer', icon: <ArrowRight className="h-3.5 w-3.5" /> },
    ACCEPT: { label: 'Accept Risk', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    INVESTIGATE: { label: 'Investigate', icon: <Sparkles className="h-3.5 w-3.5" /> },
    ESCALATE: { label: 'Escalate', icon: <ArrowRight className="h-3.5 w-3.5" /> },
    DEFER: { label: 'Defer', icon: <Clock className="h-3.5 w-3.5" /> },
};

export function DecisionCard({ decision }: { decision: Decision }) {
    const [expanded, setExpanded] = useState(false);
    const { resolveDecision } = useDecisionStore();

    const pillar = PILLAR_META[decision.pillar];
    const urgency = URGENCY_META[decision.urgency];
    const conf = decision.recommendation.confidence;
    const isPending = decision.status === 'PENDING';

    const handleResolve = (status: DecisionStatus, notes?: string) => {
        resolveDecision(decision.id, status, notes);
    };

    return (
        <Card className={`bg-card/30 border-l-4 backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${isPending ? 'border-l-primary/60 hover:border-l-primary' : 'border-l-emerald-500/30 opacity-80'
            }`}>
            <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Badge className={`${pillar.color} border text-[10px] px-1.5 py-0`}>
                                {pillar.label}
                            </Badge>
                            <Badge className={`${urgency.color} text-[10px] px-1.5 py-0`}>
                                {urgency.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">{decision.id}</span>
                        </div>
                        <h3 className="font-semibold text-white text-sm leading-tight">{decision.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{decision.question}</p>
                    </div>

                    {/* Confidence Gauge */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <div className="relative h-10 w-10">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                                    className="text-white/5" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15" fill="none"
                                    className={CONFIDENCE_COLORS[conf.label]}
                                    stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                    strokeDasharray={`${(conf.value / 100) * 94.2}, 94.2`} />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {conf.value}
                            </span>
                        </div>
                        <span className={`text-[9px] ${CONFIDENCE_COLORS[conf.label]}`}>
                            {conf.label.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Recommendation</span>
                    </div>
                    <p className="text-sm text-white font-medium">{decision.recommendation.summary}</p>
                    {decision.recommendation.impact.costEstimate !== undefined && (
                        <div className="flex gap-3 mt-2">
                            {decision.recommendation.impact.costEstimate !== 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                    💰 {decision.recommendation.impact.costEstimate < 0 ? 'Saves' : 'Cost'}: ${Math.abs(decision.recommendation.impact.costEstimate).toLocaleString()}{decision.recommendation.impact.costEstimate < 0 ? '/yr' : ''}
                                </span>
                            )}
                            {decision.recommendation.impact.riskDelta !== 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                    📉 Risk: {decision.recommendation.impact.riskDelta > 0 ? '+' : ''}{decision.recommendation.impact.riskDelta}%
                                </span>
                            )}
                            {decision.recommendation.impact.timeEstimate && (
                                <span className="text-[10px] text-muted-foreground">
                                    ⏱ {decision.recommendation.impact.timeEstimate}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Expand/Collapse */}
                <button onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-white transition-colors py-1">
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {expanded ? 'Less detail' : 'Rationale & alternatives'}
                </button>

                {expanded && (
                    <div className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Rationale */}
                        <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-white/70">Rationale:</span> {decision.recommendation.rationale}
                        </div>

                        {/* Data Sources */}
                        <div className="flex items-center gap-1 flex-wrap">
                            <Gauge className="h-3 w-3 text-muted-foreground" />
                            {conf.dataSources.map(ds => (
                                <span key={ds} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5">
                                    {ds}
                                </span>
                            ))}
                        </div>

                        {/* Alternatives */}
                        {decision.recommendation.alternatives.length > 0 && (
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Alternatives</span>
                                {decision.recommendation.alternatives.map((alt, i) => (
                                    <div key={i} className="p-2 rounded bg-white/[0.02] border border-white/5 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            {ACTION_LABELS[alt.action]?.icon}
                                            <span className="font-medium text-white/80">{alt.summary}</span>
                                        </div>
                                        <p className="text-muted-foreground mt-0.5 pl-5">⚠ {alt.tradeoff}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Context */}
                        <div className="text-[11px] text-muted-foreground/60 italic p-2 bg-white/[0.01] rounded border border-white/5">
                            {decision.context}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {isPending && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/20">
                        <Button size="sm" className="flex-1 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleResolve('APPROVED', `Approved: ${decision.recommendation.action}`)}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Accept Recommendation
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => handleResolve('DEFERRED')}>
                            <Clock className="h-3.5 w-3.5" />
                            Defer
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleResolve('REJECTED')}>
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                        </Button>
                    </div>
                )}

                {/* Resolved State */}
                {!isPending && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                        <Badge className={decision.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : decision.status === 'DEFERRED'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                            {decision.status}
                        </Badge>
                        {decision.decidedAt && (
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(decision.decidedAt).toLocaleDateString()}
                            </span>
                        )}
                        {decision.decisionNotes && (
                            <span className="text-[10px] text-muted-foreground italic truncate">
                                — {decision.decisionNotes}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
