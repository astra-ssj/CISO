"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculatePostureScore, type PostureInputs, type PostureGrade } from '@/lib/posture-score';
import { calculateComplianceScore, getDynamicControls } from '@/lib/governance';
import { useVendorRiskStore } from '@/lib/vendor-risk-store';
import { usePolicyStore } from '@/lib/policy-store';
import { usePlaybookStore } from '@/lib/playbook-store';
import { getRisks } from '@/lib/risk/actions';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Shield, Target } from 'lucide-react';
import type { Risk } from '@prisma/client';

const GRADE_COLORS: Record<PostureGrade, string> = {
    A: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    B: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    C: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    D: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    F: 'text-red-400 border-red-500/30 bg-red-500/10',
};

const TREND_ICONS = {
    IMPROVING: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    STABLE: <Minus className="h-4 w-4 text-yellow-400" />,
    DECLINING: <TrendingDown className="h-4 w-4 text-red-400" />,
};

export function PostureGauge() {
    const { policies } = usePolicyStore();
    const { playbooks } = usePlaybookStore();
    const vendorStore = useVendorRiskStore();
    const [averageRiskScore, setAverageRiskScore] = useState(50);

    useEffect(() => {
        getRisks().then(res => {
            if (res.length === 0) return setAverageRiskScore(50);
            const avg = res.reduce((acc: number, r: Risk) => acc + (r.inherentScore * 4), 0) / res.length;
            setAverageRiskScore(Math.round(avg));
        }).catch(console.error);
    }, []);

    const result = useMemo(() => {
        const controls = getDynamicControls(policies, playbooks);
        const complianceScore = calculateComplianceScore(controls);
        const resolvedIncidents = playbooks.filter(p => p.status === 'RESOLVED');
        const openIncidents = playbooks.filter(p => p.status !== 'RESOLVED');

        const inputs: PostureInputs = {
            complianceScore,
            riskScore: averageRiskScore,
            incidentMTTR: 8,
            openIncidents: openIncidents.length,
            resolvedIncidents: resolvedIncidents.length,
            vendorAvgRiskScore: vendorStore.getAverageRiskScore(),
            criticalVulns: 2,
            totalVulns: 12,
            previousScore: 58
        };

        return calculatePostureScore(inputs);
    }, [policies, playbooks, averageRiskScore, vendorStore]);

    const strokeDasharray = `${(result.overallScore / 100) * 251.2}, 251.2`;

    return (
        <Card className="bg-card/30 border-primary/20 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Security Posture
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    {/* Gauge */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                                className="text-white/5" strokeWidth="8" />
                            <circle cx="50" cy="50" r="40" fill="none"
                                stroke="url(#postureGradient)" strokeWidth="8"
                                strokeLinecap="round" strokeDasharray={strokeDasharray} />
                            <defs>
                                <linearGradient id="postureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={result.grade === 'A' || result.grade === 'B' ? '#34d399' : '#fbbf24'} />
                                    <stop offset="100%" stopColor={result.grade === 'A' ? '#06b6d4' : result.grade === 'B' ? '#3b82f6' : '#f97316'} />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-white">{result.overallScore}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 ${GRADE_COLORS[result.grade]}`}>
                                {result.grade}
                            </Badge>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                        {Object.entries(result.breakdown).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground w-20 truncate capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                                        style={{ width: `${val.score}%` }} />
                                </div>
                                <span className="text-muted-foreground w-6 text-right font-mono">{val.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                    <div className="flex items-center gap-1.5 text-xs">
                        {TREND_ICONS[result.trend]}
                        <span className="text-muted-foreground">{result.trend}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            P{result.peerBenchmark.percentile} vs peers (avg: {result.peerBenchmark.industryAverage})
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
