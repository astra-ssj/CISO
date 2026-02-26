'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

/* ── Design tokens ─────────────────────────────────── */
const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';

interface FrameworkScore {
    id: string;
    name: string;
    score: number;
    status: 'pass' | 'warning' | 'fail';
}

const FRAMEWORKS: FrameworkScore[] = [
    { id: 'iso27001', name: 'ISO 27001', score: 94, status: 'pass' },
    { id: 'soc2', name: 'SOC 2', score: 91, status: 'pass' },
    { id: 'nis2', name: 'NIS2', score: 87, status: 'warning' },
    { id: 'gdpr', name: 'GDPR', score: 96, status: 'pass' },
    { id: 'cyberessentials', name: 'Cyber Essentials', score: 100, status: 'pass' },
    { id: 'euaiact', name: 'EU AI Act', score: 78, status: 'warning' },
];

export function CompliancePosture() {
    const statusConfig = {
        pass: { icon: CheckCircle2, color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', barColor: '#22d3ee' },
        warning: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', barColor: '#fbbf24' },
        fail: { icon: XCircle, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', barColor: '#f43f5e' },
    };

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
                    Compliance Posture
                </span>
                <Link href="/governance" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    Details <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="flex-1 px-3 py-2 space-y-1.5">
                {FRAMEWORKS.map((fw) => {
                    const cfg = statusConfig[fw.status];
                    const Icon = cfg.icon;
                    return (
                        <Link key={fw.id} href="/governance">
                            <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                                <span
                                    className="text-[11px] text-slate-300 flex-1 min-w-0 truncate group-hover:text-white transition-colors"
                                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                                >
                                    {fw.name}
                                </span>
                                <span
                                    className="text-[11px] font-bold shrink-0"
                                    style={{ color: cfg.color, fontFamily: 'var(--font-jetbrains), monospace' }}
                                >
                                    {fw.score}%
                                </span>
                                <div className="w-16 h-1.5 rounded-full shrink-0 overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${fw.score}%`, background: cfg.barColor }}
                                    />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
