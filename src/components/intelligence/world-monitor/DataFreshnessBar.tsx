'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Activity, AlertTriangle, ChevronDown, ChevronUp, Wifi, WifiOff, XCircle,
} from 'lucide-react';
import type { FreshnessSummary, DataSource, FreshnessStatus } from '@/lib/intelligence/data-freshness';

interface DataFreshnessBarProps {
    summary: FreshnessSummary;
}

function statusDot(status: FreshnessStatus) {
    const colors: Record<FreshnessStatus, string> = {
        FRESH: 'bg-green-500',
        STALE: 'bg-yellow-500',
        VERY_STALE: 'bg-orange-500',
        ERROR: 'bg-red-500',
        DISABLED: 'bg-slate-600',
    };
    const animateClass = status === 'FRESH' ? 'animate-pulse' : '';
    return <div className={`w-1.5 h-1.5 rounded-full ${colors[status]} ${animateClass}`} />;
}

export function DataFreshnessBar({ summary }: DataFreshnessBarProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm border border-border/30 rounded-lg overflow-hidden">
            {/* Compact bar */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800/30 transition-colors"
            >
                <div className="flex items-center gap-3 text-[11px]">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-green-400 font-medium">{summary.active} active</span>
                    {summary.stale > 0 && (
                        <span className="text-yellow-400">{summary.stale} stale</span>
                    )}
                    {summary.error > 0 && (
                        <span className="text-red-400">{summary.error} error</span>
                    )}
                    {summary.disabled > 0 && (
                        <span className="text-slate-500">{summary.disabled} unconfigured</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{summary.totalSources} sources</span>
                    {expanded ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
                </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-border/20 px-3 py-2 space-y-2 animate-in slide-in-from-top-1 duration-150">
                    {/* Intelligence gaps */}
                    {summary.gaps.length > 0 && (
                        <div className="space-y-1">
                            {summary.gaps.map((gap, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 px-2 py-1 rounded">
                                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                    {gap}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Source list */}
                    <div className="grid grid-cols-2 gap-1">
                        {summary.sources.map((source: DataSource) => (
                            <div key={source.id} className="flex items-center gap-1.5 text-[10px] py-0.5">
                                {statusDot(source.status)}
                                <span className={source.status === 'DISABLED' ? 'text-slate-600' : 'text-slate-300'}>
                                    {source.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
