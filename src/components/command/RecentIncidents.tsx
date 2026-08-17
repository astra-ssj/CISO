'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';

interface IncidentItem {
    id: string;
    title: string;
    severity: string;
    status: string;
    startedAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
    P1: '#f43f5e',
    CRITICAL: '#f43f5e',
    P2: '#fb923c',
    HIGH: '#fb923c',
    P3: '#fbbf24',
    MEDIUM: '#fbbf24',
    P4: '#94a3b8',
    LOW: '#94a3b8',
};

function formatTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function RecentIncidents() {
    const [incidents, setIncidents] = useState<IncidentItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/incidents')
            .then(async (res) => {
                if (!res.ok) return { incidents: [] as IncidentItem[] };
                return res.json() as Promise<{ incidents: IncidentItem[] }>;
            })
            .then((data) => setIncidents(data.incidents ?? []))
            .catch(() => setIncidents([]))
            .finally(() => setLoaded(true));
    }, []);

    return (
        <div
            className="rounded-xl border flex flex-col h-full"
            style={{ background: CARD_BG, borderColor: CARD_BD }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: CARD_BD }}>
                <span
                    className="text-xs font-semibold uppercase tracking-wider text-white"
                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                    Recent Incidents
                </span>
                <Link href="/incidents" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="flex-1 px-2 py-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
                {loaded && incidents.length === 0 && (
                    <p className="text-[11px] text-slate-500 px-2 py-6 text-center">No incidents in the register. This widget does not invent tickets.</p>
                )}
                {incidents.map((inc) => {
                    const sev = inc.severity.toUpperCase();
                    const color = SEVERITY_COLORS[sev] || '#94a3b8';
                    return (
                        <Link key={inc.id} href="/incidents">
                            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                    style={{ background: `${color}15`, color, fontFamily: 'var(--font-jetbrains), monospace' }}
                                >
                                    {sev}
                                </span>
                                <span
                                    className="text-[11px] text-slate-300 flex-1 min-w-0 truncate group-hover:text-white transition-colors"
                                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                                >
                                    {inc.title}
                                </span>
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 text-slate-400">
                                    {inc.status}
                                </span>
                                <span
                                    className="text-[9px] text-slate-600 shrink-0 w-10 text-right"
                                    style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
                                >
                                    {formatTimeAgo(inc.startedAt)}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
