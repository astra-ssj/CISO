'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Cpu, Zap, DollarSign, Activity, Shield } from 'lucide-react';

interface AIMetrics {
    circuitState: 'closed' | 'half-open' | 'open';
    provider: string;
    queriesTotal: number;
    tokensUsed: number;
    costToday: number;
    autonomyMode: 'AUTONOMOUS' | 'SUPERVISED' | 'MANUAL';
}

export function AIActivity() {
    const [metrics, setMetrics] = useState<AIMetrics>({
        circuitState: 'closed',
        provider: 'GEMINI',
        queriesTotal: 247,
        tokensUsed: 45200,
        costToday: 2.14,
        autonomyMode: 'SUPERVISED',
    });

    useEffect(() => {
        fetch('/api/health')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.ai?.circuitBreaker) {
                    const cb = data.ai.circuitBreaker[0] || {};
                    setMetrics(prev => ({
                        ...prev,
                        circuitState: cb.state || 'closed',
                        provider: cb.provider || prev.provider,
                    }));
                }
            })
            .catch(() => { /* keep defaults */ });
    }, []);

    const circuitColors = {
        closed: { bg: 'rgba(34,211,238,0.08)', color: '#22d3ee', label: 'CLOSED' },
        'half-open': { bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', label: 'HALF-OPEN' },
        open: { bg: 'rgba(244,63,94,0.08)', color: '#f43f5e', label: 'OPEN' },
    };

    const circuit = circuitColors[metrics.circuitState];

    const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

    const metricRows = [
        { icon: Shield, label: 'Circuit Breaker', value: circuit.label, color: circuit.color },
        { icon: Cpu, label: 'Provider', value: `${metrics.provider} ●`, color: '#22d3ee' },
        { icon: Activity, label: 'Queries Today', value: String(metrics.queriesTotal), color: '#94a3b8' },
        { icon: Zap, label: 'Tokens Used', value: formatTokens(metrics.tokensUsed), color: '#94a3b8' },
        { icon: DollarSign, label: 'Est. Cost Today', value: `$${metrics.costToday.toFixed(2)}`, color: '#94a3b8' },
    ];

    return (
        <div
            className="rounded-xl border flex flex-col h-full"
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(56, 189, 248, 0.08)',
            }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(56, 189, 248, 0.08)' }}>
                <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">AI Activity</span>
                </div>
                <Link href="/settings" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    Economics <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="flex-1 px-3 py-2 space-y-0.5">
                {/* Circuit breaker visual */}
                <div className="flex items-center justify-center py-2 mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: circuit.bg }}>
                        <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: circuit.color }} />
                        <span className="text-[11px] font-mono font-bold" style={{ color: circuit.color }}>{circuit.label}</span>
                    </div>
                </div>

                {metricRows.map((row) => {
                    const Icon = row.icon;
                    return (
                        <div key={row.label} className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                            <Icon className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="text-[11px] text-slate-400 flex-1">{row.label}</span>
                            <span className="text-[11px] font-mono font-bold" style={{ color: row.color }}>{row.value}</span>
                        </div>
                    );
                })}

                {/* Autonomy mode */}
                <div className="pt-2 mt-1 border-t" style={{ borderColor: 'rgba(56, 189, 248, 0.06)' }}>
                    <div className="flex items-center gap-2 px-1.5">
                        <span className="text-[10px] text-slate-500">Autonomy:</span>
                        <span className="text-[10px] font-mono font-bold text-cyan-400">{metrics.autonomyMode}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
