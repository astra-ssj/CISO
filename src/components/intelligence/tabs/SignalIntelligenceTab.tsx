'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Activity, AlertTriangle, TrendingUp, TrendingDown,
    Radio, Zap, MapPin, RefreshCw, Loader2,
} from 'lucide-react';

interface AnomalyEvent {
    id: string;
    type: string;
    region: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    baseline: number;
    current: number;
    deviationPct: number;
    timestamp: string;
    description: string;
}

interface ConvergenceAlert {
    id: string;
    location: string;
    threatTypes: string[];
    riskScore: number;
    details: string;
    timestamp: string;
}

export function SignalIntelligenceTab() {
    const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
    const [convergences, setConvergences] = useState<ConvergenceAlert[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [anomalyRes, convergenceRes] = await Promise.allSettled([
                fetch('/api/intelligence/anomalies'),
                fetch('/api/intelligence/convergence'),
            ]);

            if (anomalyRes.status === 'fulfilled' && anomalyRes.value.ok) {
                const data = await anomalyRes.value.json();
                setAnomalies(data.anomalies || []);
            }
            if (convergenceRes.status === 'fulfilled' && convergenceRes.value.ok) {
                const data = await convergenceRes.value.json();
                setConvergences(data.alerts || []);
            }
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Signal fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const severityColor = (s: string) => {
        switch (s) {
            case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Radio className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Signal Intelligence</h3>
                        <p className="text-xs text-muted-foreground">
                            Anomaly detection · Convergence alerts · Baseline deviation monitoring
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                            Last: {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-red-500/5 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Critical Anomalies</div>
                        <div className="text-2xl font-bold text-red-400">
                            {anomalies.filter((a) => a.severity === 'critical').length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Convergences</div>
                        <div className="text-2xl font-bold text-amber-400">{convergences.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-500/5 border-cyan-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Signals</div>
                        <div className="text-2xl font-bold text-cyan-400">{anomalies.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Deviation</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {anomalies.length > 0
                                ? `${Math.round(anomalies.reduce((s, a) => s + a.deviationPct, 0) / anomalies.length)}%`
                                : '—'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Anomalies Column */}
                <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-amber-400" />
                        Temporal Baseline Anomalies
                    </h4>
                    <ScrollArea className="h-[500px] rounded-lg border border-border/30 bg-card/10">
                        <div className="p-3 space-y-2">
                            {anomalies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <Activity className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">No anomalies detected</p>
                                    <p className="text-xs mt-1">Click refresh to scan for baseline deviations</p>
                                </div>
                            ) : (
                                anomalies.map((a) => (
                                    <Card key={a.id} className="bg-card/30">
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`text-[10px] ${severityColor(a.severity)}`}>
                                                        {a.severity}
                                                    </Badge>
                                                    <span className="text-sm font-medium">{a.type}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {a.deviationPct > 0 ? (
                                                        <TrendingUp className="h-3 w-3 text-red-400" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3 text-emerald-400" />
                                                    )}
                                                    <span className={`text-xs font-bold ${a.deviationPct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {a.deviationPct > 0 ? '+' : ''}{a.deviationPct}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                                                <MapPin className="h-3 w-3" /> {a.region}
                                            </div>
                                            <p className="text-xs text-slate-400">{a.description}</p>
                                            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                                                <span>Baseline: {a.baseline}</span>
                                                <span>Current: {a.current}</span>
                                                <span>{new Date(a.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Convergence Alerts */}
                <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-red-400" />
                        Geographic Convergence Alerts
                    </h4>
                    <ScrollArea className="h-[500px] rounded-lg border border-border/30 bg-card/10">
                        <div className="p-3 space-y-2">
                            {convergences.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <Zap className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">No convergence alerts</p>
                                    <p className="text-xs mt-1">Alerts appear when multiple threat types cluster geographically</p>
                                </div>
                            ) : (
                                convergences.map((c) => (
                                    <Card key={c.id} className="bg-card/30 border-red-500/10">
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                                    <span className="text-sm font-semibold">{c.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-bold text-red-400">
                                                        Risk: {c.riskScore}/100
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {c.threatTypes.map((t) => (
                                                    <Badge key={t} variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400">{c.details}</p>
                                            <div className="text-[10px] text-muted-foreground mt-2">
                                                {new Date(c.timestamp).toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
