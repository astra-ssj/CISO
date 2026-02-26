'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ShieldCheck, AlertTriangle, FileCheck, Users, Globe, Activity,
    TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react';
import { useAstraStore } from '@/lib/store';
import { useRiskRegisterStore } from '@/lib/risk-register-store';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';

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

export function KPIStatusBar() {
    const { complianceScore, activeThreats } = useAstraStore();
    const risks = useRiskRegisterStore((s) => s.entries);
    const vendors = useVendorRiskStore((s) => s.vendors);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const openRisks = risks.filter((r) => r.status !== 'ACCEPTED' && r.status !== 'CLOSED').length;
    const pendingVendors = vendors.filter((v) => v.riskTier === 'CRITICAL' || v.riskTier === 'HIGH').length;
    const postureScore = Math.min(100, Math.round(complianceScore * 0.4 + (100 - activeThreats * 5) * 0.3 + (100 - openRisks * 2) * 0.3));

    const kpis: KPIItem[] = [
        {
            id: 'posture', label: 'Security Posture', value: `${postureScore}%`,
            icon: ShieldCheck, trend: 'up', trendValue: '+2.1%',
            status: postureScore >= 80 ? 'success' : postureScore >= 60 ? 'warning' : 'danger',
            href: '/strategy', sparkline: [65, 68, 72, 70, 75, 78, 82, 85, postureScore],
        },
        {
            id: 'incidents', label: 'Active Incidents', value: String(activeThreats),
            icon: AlertTriangle, trend: activeThreats > 2 ? 'up' : 'down', trendValue: activeThreats > 2 ? '+1' : '-1',
            status: activeThreats === 0 ? 'success' : activeThreats <= 3 ? 'warning' : 'danger',
            href: '/incidents', sparkline: [3, 4, 2, 5, 3, 2, 4, 3, activeThreats],
        },
        {
            id: 'risks', label: 'Open Risks', value: String(openRisks),
            icon: Activity, trend: 'down', trendValue: '-3',
            status: openRisks <= 5 ? 'success' : openRisks <= 15 ? 'warning' : 'danger',
            href: '/governance', sparkline: [18, 15, 14, 12, 13, 11, 10, 9, openRisks],
        },
        {
            id: 'compliance', label: 'Compliance', value: `${complianceScore}%`,
            icon: FileCheck, trend: 'up', trendValue: '+1.5%',
            status: complianceScore >= 90 ? 'success' : complianceScore >= 70 ? 'warning' : 'danger',
            href: '/governance', sparkline: [78, 80, 82, 81, 84, 86, 88, 90, complianceScore],
        },
        {
            id: 'vendors', label: 'Vendor Assessments', value: `${pendingVendors} pending`,
            icon: Users, trend: 'neutral', trendValue: '',
            status: pendingVendors === 0 ? 'success' : pendingVendors <= 5 ? 'warning' : 'danger',
            href: '/vendors', sparkline: [5, 7, 6, 8, 5, 4, 6, 5, pendingVendors],
        },
        {
            id: 'cii', label: 'CII Alerts', value: '0',
            icon: Globe, trend: 'neutral', trendValue: '',
            status: 'success',
            href: '/intelligence', sparkline: [0, 0, 1, 0, 0, 0, 0, 1, 0],
        },
    ];

    const statusColors = { success: '#22d3ee', warning: '#fbbf24', danger: '#f43f5e' };
    const statusBg = { success: 'rgba(34,211,238,0.08)', warning: 'rgba(251,191,36,0.08)', danger: 'rgba(244,63,94,0.08)' };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                const delay = idx * 50;
                return (
                    <Link key={kpi.id} href={kpi.href}>
                        <div
                            className="relative overflow-hidden rounded-xl border transition-all duration-300 hover:border-[rgba(56,189,248,0.2)] cursor-pointer group"
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                borderColor: 'rgba(56, 189, 248, 0.08)',
                                opacity: visible ? 1 : 0,
                                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                                transitionDelay: `${delay}ms`,
                            }}
                        >
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{kpi.label}</span>
                                    <div className="p-1 rounded-md" style={{ background: statusBg[kpi.status] }}>
                                        <Icon className="h-3 w-3" style={{ color: statusColors[kpi.status] }} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold font-mono tracking-tight text-white">{kpi.value}</span>
                                    {kpi.trend !== 'neutral' && kpi.trendValue && (
                                        <span className={`flex items-center text-[10px] font-medium ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {kpi.trend === 'up' ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                                            {kpi.trendValue}
                                        </span>
                                    )}
                                </div>
                                {/* Mini sparkline */}
                                <div className="mt-2 h-6 flex items-end gap-[2px]">
                                    {kpi.sparkline.map((val, i) => {
                                        const max = Math.max(...kpi.sparkline, 1);
                                        const h = Math.max(8, (val / max) * 100);
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-sm transition-all duration-300"
                                                style={{
                                                    height: `${h}%`,
                                                    background: i === kpi.sparkline.length - 1 ? statusColors[kpi.status] : 'rgba(148,163,184,0.15)',
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
