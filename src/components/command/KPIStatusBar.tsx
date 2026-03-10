'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ShieldCheck, AlertTriangle, FileCheck, Users, Globe, Activity,
    TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react';
import { useAstraStore } from '@/lib/store';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';
import { getRisks } from '@/lib/risk/actions';

/* ── Design tokens ─────────────────────────────────── */
const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';
const HOVER_BD = 'rgba(56, 189, 248, 0.18)';

const STATUS_COLORS = { success: '#22d3ee', warning: '#fbbf24', danger: '#f43f5e' };
const STATUS_BG = { success: 'rgba(34,211,238,0.08)', warning: 'rgba(251,191,36,0.08)', danger: 'rgba(244,63,94,0.08)' };

/* ── SVG Sparkline component ───────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
    const w = 80, h = 28, pad = 2;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const points = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${x},${y}`;
    }).join(' ');

    const gradientId = `sg-${color.replace('#', '')}`;

    // Build area path for gradient fill
    const firstX = pad;
    const lastX = pad + (w - pad * 2);
    const areaPath = `M ${firstX},${h} L ${points.split(' ').map(p => p).join(' L ')} L ${lastX},${h} Z`;

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Last dot */}
            {(() => {
                const lastPt = points.split(' ').pop()!;
                const [cx, cy] = lastPt.split(',');
                return <circle cx={cx} cy={cy} r="2" fill={color} />;
            })()}
        </svg>
    );
}

/* ── Types ─────────────────────────────────────────── */
interface KPIItem {
    id: string;
    label: string;
    value: string;
    icon: React.ElementType;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    status: 'success' | 'warning' | 'danger';
    href: string;
    sparkline: number[];
}

/* ── Component ─────────────────────────────────────── */
export function KPIStatusBar() {
    const { complianceScore, activeThreats } = useAstraStore();
    const vendors = useVendorRiskStore((s) => s.vendors);
    const [visible, setVisible] = useState(false);
    const [openRisks, setOpenRisks] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);

        // Fetch real open risks from database
        getRisks({ status: 'Open' }).then(res => setOpenRisks(res.length)).catch(console.error);

        return () => clearTimeout(timer);
    }, []);
    const pendingVendors = vendors.filter((v) => v.riskTier === 'Critical' || v.riskTier === 'High').length;
    const postureScore = Math.min(100, Math.round(complianceScore * 0.4 + (100 - activeThreats * 5) * 0.3 + (100 - openRisks * 2) * 0.3));

    const kpis: KPIItem[] = [
        {
            id: 'posture', label: 'Security Posture', value: `${postureScore}%`,
            icon: ShieldCheck, trend: 'up', trendValue: '+2.1%',
            status: postureScore >= 80 ? 'success' : postureScore >= 60 ? 'warning' : 'danger',
            href: '/strategy', sparkline: [65, 68, 72, 70, 75, 78, postureScore],
        },
        {
            id: 'incidents', label: 'Active Incidents', value: String(activeThreats),
            icon: AlertTriangle, trend: activeThreats > 2 ? 'up' : 'down', trendValue: activeThreats > 2 ? '+1' : '-1',
            status: activeThreats === 0 ? 'success' : activeThreats <= 3 ? 'warning' : 'danger',
            href: '/incidents', sparkline: [3, 4, 2, 5, 3, 2, activeThreats],
        },
        {
            id: 'risks', label: 'Open Risks', value: String(openRisks),
            icon: Activity, trend: 'down', trendValue: '-3',
            status: openRisks <= 5 ? 'success' : openRisks <= 15 ? 'warning' : 'danger',
            href: '/governance', sparkline: [18, 15, 14, 12, 13, 11, openRisks],
        },
        {
            id: 'compliance', label: 'Compliance', value: `${complianceScore}%`,
            icon: FileCheck, trend: 'up', trendValue: '+1.5%',
            status: complianceScore >= 90 ? 'success' : complianceScore >= 70 ? 'warning' : 'danger',
            href: '/governance', sparkline: [78, 80, 82, 84, 86, 88, complianceScore],
        },
        {
            id: 'vendors', label: 'Vendor Assessments', value: `${pendingVendors} pending`,
            icon: Users, trend: 'neutral', trendValue: '',
            status: pendingVendors === 0 ? 'success' : pendingVendors <= 5 ? 'warning' : 'danger',
            href: '/vendors', sparkline: [5, 7, 6, 8, 5, 4, pendingVendors],
        },
        {
            id: 'cii', label: 'CII Alerts', value: '0',
            icon: Globe, trend: 'neutral', trendValue: '',
            status: 'success',
            href: '/intelligence', sparkline: [0, 0, 1, 0, 0, 1, 0],
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                const delay = idx * 50;
                const color = STATUS_COLORS[kpi.status];
                return (
                    <Link key={kpi.id} href={kpi.href}>
                        <div
                            className="relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer group"
                            style={{
                                background: CARD_BG,
                                borderColor: CARD_BD,
                                opacity: visible ? 1 : 0,
                                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                                transitionDelay: `${delay}ms`,
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = HOVER_BD; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = CARD_BD; }}
                        >
                            <div className="p-3.5">
                                {/* Header: label + icon */}
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className="text-[10px] uppercase tracking-wider font-medium"
                                        style={{ color: '#64748b', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                                    >
                                        {kpi.label}
                                    </span>
                                    <div className="p-1 rounded-md" style={{ background: STATUS_BG[kpi.status] }}>
                                        <Icon className="h-3 w-3" style={{ color }} />
                                    </div>
                                </div>

                                {/* Value + trend */}
                                <div className="flex items-baseline gap-1.5">
                                    <span
                                        className="text-xl font-bold tracking-tight"
                                        style={{ color: '#f1f5f9', fontFamily: 'var(--font-jetbrains), monospace' }}
                                    >
                                        {kpi.value}
                                    </span>
                                    {kpi.trend !== 'neutral' && kpi.trendValue && (
                                        <span className={`flex items-center text-[10px] font-medium ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {kpi.trend === 'up' ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                                            {kpi.trendValue}
                                        </span>
                                    )}
                                </div>

                                {/* SVG Sparkline */}
                                <div className="mt-2.5">
                                    <Sparkline data={kpi.sparkline} color={color} />
                                </div>
                            </div>

                            {/* Hover arrow */}
                            <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
