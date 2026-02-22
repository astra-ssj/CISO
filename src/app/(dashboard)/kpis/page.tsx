"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    computeAllKPIs, KPI_CATEGORY_META, HEALTH_META,
    type KPI, type KPICategory
} from "@/lib/kpi-engine/kpi-engine";
import {
    TrendingUp, TrendingDown, Minus, BarChart3, Eye, Monitor,
    Target, Upload, Paperclip, Trash2
} from "lucide-react";
import { KPIUploader } from "@/components/strategy/kpi-uploader";
import { useUploadedKPIStore } from "@/lib/kpi-engine/uploaded-kpi-store";

function Sparkline({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 32;

    const points = data.map((v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
    ).join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8" preserveAspectRatio="none">
            <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} opacity={0.8} />
            <circle cx={(data.length - 1) / (data.length - 1) * width}
                cy={height - ((data[data.length - 1] - min) / range) * height}
                r="2.5" fill={color} />
        </svg>
    );
}

function KPICard({ kpi }: { kpi: KPI }) {
    const [showBoard, setShowBoard] = useState(false);
    const health = HEALTH_META[kpi.health];
    const trendColor = kpi.trend === 'IMPROVING' ? 'text-emerald-400' : kpi.trend === 'DEGRADING' ? 'text-red-400' : 'text-gray-400';
    const sparkColor = kpi.health === 'GREEN' ? '#34d399' : kpi.health === 'AMBER' ? '#fbbf24' : '#f87171';

    const formatted = kpi.unit === '$'
        ? `$${(kpi.value / 1000000).toFixed(1)}M`
        : kpi.unit === '%' || kpi.unit === 'score' || kpi.unit === 'count' || kpi.unit === 'level'
            ? `${kpi.value}`
            : `${kpi.value} ${kpi.unit}`;

    const targetFormatted = kpi.unit === '$'
        ? `$${(kpi.target / 1000000).toFixed(1)}M`
        : `${kpi.target}`;

    return (
        <Card className="bg-card/30 backdrop-blur-sm border-border/30 hover:border-primary/20 transition-all group">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-muted-foreground truncate">{kpi.name}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-white">{formatted}</span>
                            <span className="text-[10px] text-muted-foreground">{kpi.unit !== '$' && kpi.unit}</span>
                        </div>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${health.bgColor} ${health.color}`}>
                        {health.label}
                    </div>
                </div>

                {/* Target & Trend */}
                <div className="flex items-center justify-between text-[10px] mb-2">
                    <span className="text-muted-foreground">
                        <Target className="h-3 w-3 inline mr-1" />
                        Target: {targetFormatted}{kpi.unit !== '$' ? kpi.unit : ''}
                    </span>
                    <span className={`flex items-center gap-0.5 ${trendColor}`}>
                        {kpi.trend === 'IMPROVING' ? <TrendingUp className="h-3 w-3" /> :
                            kpi.trend === 'DEGRADING' ? <TrendingDown className="h-3 w-3" /> :
                                <Minus className="h-3 w-3" />}
                        {Math.abs(kpi.trendDelta)}%
                    </span>
                </div>

                {/* Sparkline */}
                <div className="mb-2">
                    <Sparkline data={kpi.sparkline} color={sparkColor} />
                </div>

                {/* Benchmark */}
                <div className="flex items-center justify-between">
                    {kpi.benchmarkPercentile && (
                        <span className="text-[9px] text-muted-foreground">
                            📊 Peer P{kpi.benchmarkPercentile}
                        </span>
                    )}
                    <button
                        onClick={() => setShowBoard(!showBoard)}
                        className="text-[9px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors"
                    >
                        <Eye className="h-2.5 w-2.5" />
                        {showBoard ? 'Technical' : 'Board view'}
                    </button>
                </div>

                {/* Board Translation */}
                {showBoard && (
                    <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10 text-[11px] text-primary/80 animate-in fade-in duration-200">
                        💼 {kpi.boardTranslation}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function KPIsPage() {
    const kpis = useMemo(() => computeAllKPIs(), []);
    const [activeCategory, setActiveCategory] = useState<KPICategory | 'ALL'>('ALL');
    const [showUploader, setShowUploader] = useState(false);
    const { uploadedKPIs, removeKPI: removeUploadedKPI, clearAll: clearUploaded } = useUploadedKPIStore();

    const filteredKPIs = activeCategory === 'ALL' ? kpis : kpis.filter(k => k.category === activeCategory);
    const filteredUploaded = activeCategory === 'ALL' ? uploadedKPIs : uploadedKPIs.filter(k => k.category === activeCategory);
    const greenCount = kpis.filter(k => k.health === 'GREEN').length;
    const amberCount = kpis.filter(k => k.health === 'AMBER').length;
    const redCount = kpis.filter(k => k.health === 'RED').length;
    const avgBenchmark = Math.round(kpis.filter(k => k.benchmarkPercentile).reduce((s, k) => s + (k.benchmarkPercentile || 0), 0) /
        kpis.filter(k => k.benchmarkPercentile).length);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-primary" />
                        KPI Command Center
                    </h1>
                    <p className="text-muted-foreground">
                        {kpis.length} computed + {uploadedKPIs.length} imported metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/30">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs">{greenCount}</span>
                        <span className="h-2 w-2 rounded-full bg-amber-500 ml-2" /><span className="text-xs">{amberCount}</span>
                        <span className="h-2 w-2 rounded-full bg-red-500 ml-2" /><span className="text-xs">{redCount}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] gap-1">
                        <Monitor className="h-3 w-3" /> Avg P{avgBenchmark} vs peers
                    </Badge>
                    <Button size="sm" onClick={() => setShowUploader(!showUploader)} variant={showUploader ? 'default' : 'outline'}>
                        <Upload className="h-4 w-4 mr-1" /> Import File
                    </Button>
                </div>
            </div>

            {/* Upload Panel */}
            {showUploader && (
                <div className="max-w-2xl mx-auto">
                    <KPIUploader onClose={() => setShowUploader(false)} />
                </div>
            )}

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={activeCategory === 'ALL' ? 'default' : 'outline'}
                    className="h-7 text-[11px]" onClick={() => setActiveCategory('ALL')}>
                    All ({kpis.length})
                </Button>
                {(Object.keys(KPI_CATEGORY_META) as KPICategory[]).map(cat => {
                    const meta = KPI_CATEGORY_META[cat];
                    const count = kpis.filter(k => k.category === cat).length;
                    if (count === 0) return null;
                    return (
                        <Button key={cat} size="sm"
                            variant={activeCategory === cat ? 'default' : 'outline'}
                            className="h-7 text-[11px]"
                            onClick={() => setActiveCategory(cat)}>
                            {meta.label} ({count})
                        </Button>
                    );
                })}
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredKPIs.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}

                {/* Uploaded KPIs */}
                {filteredUploaded.map(kpi => (
                    <Card key={kpi.id} className="bg-card/30 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all group relative">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Paperclip className="h-3 w-3 text-primary shrink-0" />
                                        <h3 className="text-xs font-medium text-muted-foreground truncate">{kpi.name}</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-bold text-white">
                                            {kpi.unit === '$' ? `$${(kpi.value / 1_000_000).toFixed(1)}M` : kpi.value}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{kpi.unit !== '$' && kpi.unit}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-[9px] py-0 bg-primary/10 text-primary border-primary/20">📎 Imported</Badge>
                                    <button onClick={() => removeUploadedKPI(kpi.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all">
                                        <Trash2 className="h-3 w-3 text-red-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground">
                                    <Target className="h-3 w-3 inline mr-1" />
                                    Target: {kpi.target}{kpi.unit !== '$' ? kpi.unit : ''}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border
                                    ${kpi.health === 'GREEN' ? 'bg-emerald-500/10 text-emerald-400' : kpi.health === 'RED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {HEALTH_META[kpi.health].label}
                                </span>
                            </div>
                            <div className="mt-2 text-[9px] text-muted-foreground truncate" title={kpi.sourceFile}>
                                📁 {kpi.sourceFile}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Clear imported KPIs */}
            {uploadedKPIs.length > 0 && (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-red-400" onClick={clearUploaded}>
                        <Trash2 className="h-3 w-3 mr-1" /> Clear all imported KPIs ({uploadedKPIs.length})
                    </Button>
                </div>
            )}
        </div>
    );
}
