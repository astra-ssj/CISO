"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';

export interface TimelineEvent {
    timestamp: string;
    event: string;
    actor: string;
    type: 'DETECTION' | 'TRIAGE' | 'CONTAINMENT' | 'ERADICATION' | 'RECOVERY' | 'LESSONS_LEARNED' | 'ESCALATION';
    notes?: string;
}

export interface SLAMetrics {
    detectedAt?: string;
    containedAt?: string;
    resolvedAt?: string;
    ttd?: number; // Time to Detect (hours)
    ttc?: number; // Time to Contain (hours)
    ttr?: number; // Time to Resolve (hours)
}

const TYPE_COLORS: Record<TimelineEvent['type'], string> = {
    DETECTION: 'bg-red-500',
    TRIAGE: 'bg-orange-500',
    CONTAINMENT: 'bg-yellow-500',
    ERADICATION: 'bg-blue-500',
    RECOVERY: 'bg-emerald-500',
    LESSONS_LEARNED: 'bg-purple-500',
    ESCALATION: 'bg-red-400',
};

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
    DETECTION: 'Detection', TRIAGE: 'Triage', CONTAINMENT: 'Containment',
    ERADICATION: 'Eradication', RECOVERY: 'Recovery', LESSONS_LEARNED: 'Lessons Learned',
    ESCALATION: 'Escalation'
};

export function IncidentTimeline({ events, sla, incidentTitle }: {
    events: TimelineEvent[];
    sla: SLAMetrics;
    incidentTitle: string;
}) {
    return (
        <Card className="bg-card/30 border-primary/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Incident Timeline — {incidentTitle}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* SLA Metrics Bar */}
                <div className="grid grid-cols-3 gap-3">
                    <SLACard label="Time to Detect" hours={sla.ttd} target={1} />
                    <SLACard label="Time to Contain" hours={sla.ttc} target={4} />
                    <SLACard label="Time to Resolve" hours={sla.ttr} target={24} />
                </div>

                {/* Timeline */}
                <div className="relative pl-6 space-y-0">
                    {/* Vertical line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-500 via-yellow-500 to-emerald-500 opacity-30" />

                    {events.map((event, index) => (
                        <div key={index} className="relative pb-4 last:pb-0">
                            {/* Dot */}
                            <div className={`absolute -left-[14px] top-1.5 h-3 w-3 rounded-full ${TYPE_COLORS[event.type]} ring-2 ring-background shadow-lg`} />

                            {/* Content */}
                            <div className="ml-4 p-3 rounded-lg bg-background/30 border border-border/20 hover:border-border/40 transition-colors">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {TYPE_LABELS[event.type]}
                                        </Badge>
                                        <span className="text-sm font-medium text-white">{event.event}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{event.actor}</span>
                                </div>
                                {event.notes && (
                                    <p className="text-xs text-muted-foreground/80 mt-1.5 italic">&quot;{event.notes}&quot;</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SLACard({ label, hours, target }: { label: string; hours?: number; target: number }) {
    const met = hours !== undefined && hours <= target;
    const active = hours !== undefined;

    return (
        <div className={`p-2.5 rounded-lg border ${active ? (met ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5') : 'border-border/20 bg-background/20'}`}>
            <div className="text-[10px] text-muted-foreground">{label}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
                {active ? (
                    <>
                        {met ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <AlertTriangle className="h-3 w-3 text-red-400" />}
                        <span className={`text-sm font-bold ${met ? 'text-emerald-400' : 'text-red-400'}`}>{hours}h</span>
                        <span className="text-[10px] text-muted-foreground">/ {target}h SLA</span>
                    </>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </div>
        </div>
    );
}
