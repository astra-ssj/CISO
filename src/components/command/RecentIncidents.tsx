'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/* ── Design tokens ─────────────────────────────────── */
const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';

interface IncidentItem {
    id: string;
    title: string;
    severity: 'P1' | 'P2' | 'P3' | 'P4';
    status: 'Open' | 'InProgress' | 'Resolved';
    time: string;
}

const SAMPLE_INCIDENTS: IncidentItem[] = [
    { id: 'INC-042', title: 'Suspicious login from unrecognized device — DE office', severity: 'P2', status: 'Open', time: '2h ago' },
    { id: 'INC-041', title: 'Elevated API error rate on payment gateway', severity: 'P3', status: 'InProgress', time: '5h ago' },
    { id: 'INC-040', title: 'Phishing email reported by 3 employees', severity: 'P3', status: 'InProgress', time: '8h ago' },
    { id: 'INC-039', title: 'AWS GuardDuty alert — cryptominer signature', severity: 'P1', status: 'Resolved', time: '14h ago' },
    { id: 'INC-038', title: 'SSL certificate expiry warning for staging env', severity: 'P4', status: 'Open', time: '1d ago' },
    { id: 'INC-037', title: 'Unauthorized S3 bucket access attempt', severity: 'P2', status: 'Resolved', time: '2d ago' },
];

const SEVERITY_COLORS: Record<string, string> = {
    P1: '#f43f5e',
    P2: '#fb923c',
    P3: '#fbbf24',
    P4: '#94a3b8',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    Open: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e' },
    InProgress: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
    Resolved: { bg: 'rgba(34,211,238,0.08)', text: '#22d3ee' },
};

export function RecentIncidents() {
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
                {SAMPLE_INCIDENTS.map((inc) => {
                    const statusStyle = STATUS_STYLES[inc.status] || STATUS_STYLES.Open;
                    return (
                        <Link key={inc.id} href="/incidents">
                            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                    style={{ background: `${SEVERITY_COLORS[inc.severity]}15`, color: SEVERITY_COLORS[inc.severity], fontFamily: 'var(--font-jetbrains), monospace' }}
                                >
                                    {inc.id}
                                </span>
                                <span
                                    className="text-[11px] text-slate-300 flex-1 min-w-0 truncate group-hover:text-white transition-colors"
                                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                                >
                                    {inc.title}
                                </span>
                                <span
                                    className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
                                    style={{ background: statusStyle.bg, color: statusStyle.text }}
                                >
                                    {inc.status}
                                </span>
                                <span
                                    className="text-[9px] text-slate-600 shrink-0 w-10 text-right"
                                    style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
                                >
                                    {inc.time}
                                </span>
                            </div>
                        </Link>
                    );
                })}
                <div className="flex items-center justify-center pt-1 pb-1">
                    <span className="text-[9px] px-2 py-0.5 rounded text-slate-500" style={{ background: 'rgba(15,23,42,0.6)' }}>Sample Data</span>
                </div>
            </div>
        </div>
    );
}
