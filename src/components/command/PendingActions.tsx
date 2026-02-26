'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileWarning, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';
import { usePolicyStore } from '@/lib/policy-store';
import { useRiskRegisterStore } from '@/lib/risk-register-store';
import { useAstraStore } from '@/lib/store';

interface ActionItem {
    id: string;
    icon: React.ElementType;
    label: string;
    count: number;
    urgency: 'overdue' | 'due-soon' | 'normal';
    href: string;
}

export function PendingActions() {
    const vendors = useVendorRiskStore((s) => s.vendors);
    const policies = usePolicyStore((s) => s.policies);
    const risks = useRiskRegisterStore((s) => s.entries);
    const decisions = useAstraStore((s) => s.decisionQueue);

    const pendingVendors = vendors.filter((v) => v.riskTier === 'CRITICAL' || v.riskTier === 'HIGH').length;
    const reviewPolicies = policies.filter((p) => p.status === 'DRAFT' || p.status === 'IN_REVIEW').length;
    const openDecisions = decisions.filter((d) => d.status === 'PENDING').length;
    const overdueRisks = risks.filter((r) => r.status === 'OPEN' && r.analysis.riskScore >= 70).length;

    const actions: ActionItem[] = [
        pendingVendors > 0 ? { id: 'vendors', icon: ClipboardCheck, label: `${pendingVendors} vendor assessment${pendingVendors > 1 ? 's' : ''} due`, count: pendingVendors, urgency: 'due-soon', href: '/vendors' } : null,
        reviewPolicies > 0 ? { id: 'policies', icon: FileWarning, label: `${reviewPolicies} polic${reviewPolicies > 1 ? 'ies' : 'y'} need review`, count: reviewPolicies, urgency: 'normal', href: '/governance' } : null,
        openDecisions > 0 ? { id: 'decisions', icon: AlertCircle, label: `${openDecisions} decision${openDecisions > 1 ? 's' : ''} awaiting review`, count: openDecisions, urgency: 'overdue', href: '/decisions' } : null,
        overdueRisks > 0 ? { id: 'risks', icon: ShieldAlert, label: `${overdueRisks} high-likelihood risk${overdueRisks > 1 ? 's' : ''} unmitigated`, count: overdueRisks, urgency: 'overdue', href: '/governance' } : null,
    ].filter(Boolean) as ActionItem[];

    // Sort: overdue first, then due-soon, then normal
    const priorityOrder = { overdue: 0, 'due-soon': 1, normal: 2 };
    actions.sort((a, b) => priorityOrder[a.urgency] - priorityOrder[b.urgency]);

    const urgencyColors = {
        overdue: '#f43f5e',
        'due-soon': '#fbbf24',
        normal: '#94a3b8',
    };

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
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">Pending Actions</span>
                    {actions.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">{actions.length}</span>
                    )}
                </div>
                <Link href="/decisions" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View Queue <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="flex-1 px-2 py-1">
                {actions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                        <ClipboardCheck className="h-8 w-8 text-emerald-500/20 mb-2" />
                        <p className="text-[11px] text-slate-500">All caught up — no pending actions.</p>
                    </div>
                ) : (
                    actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.id} href={action.href}>
                                <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                    <div className="p-1.5 rounded-md" style={{ background: `${urgencyColors[action.urgency]}10` }}>
                                        <Icon className="h-3.5 w-3.5" style={{ color: urgencyColors[action.urgency] }} />
                                    </div>
                                    <span className="text-[11px] text-slate-300 flex-1 group-hover:text-white transition-colors">{action.label}</span>
                                    <ArrowRight className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
