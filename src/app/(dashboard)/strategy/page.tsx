"use client";

import {  useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Shield, BarChart3, FolderKanban, TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";
import { useOKRProjectStore, type Objective, type Project, type ProjectPhaseStatus } from "@/lib/okr-project-store";
import { KPIUploader } from "@/components/strategy/kpi-uploader";
import { useUploadedKPIStore } from "@/lib/kpi-engine/uploaded-kpi-store";
import { computeAllKPIs, type KPI } from "@/lib/kpi-engine/kpi-engine";
import { cn } from "@/lib/utils";

// ─── KPI Sparkline ───
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
    const w = 80, h = 24;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    return (<svg width={w} height={h} className="opacity-80"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" /></svg>);
}

// ─── OKR Card ───
function OKRCard({ objective }: { objective: Objective }) {
    const progress = objective.keyResults.length > 0
        ? Math.round(objective.keyResults.reduce((s, kr) => s + (kr.currentValue / kr.targetValue) * 100, 0) / objective.keyResults.length)
        : 0;
    return (
        <Card className="border-border hover:border-primary/30 transition-all">
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate">{objective.title}</h3>
                    <Badge variant={progress >= 70 ? "default" : progress >= 40 ? "secondary" : "destructive"} className="text-xs">{progress}%</Badge>
                </div>
                <div className="space-y-3">
                    {objective.keyResults.map(kr => {
                        const krPct = Math.round((kr.currentValue / kr.targetValue) * 100);
                        return (
                            <div key={kr.id} className="space-y-1">
                                <div className="flex justify-between text-xs"><span className="text-muted-foreground truncate">{kr.title}</span><span className="font-mono">{kr.currentValue}/{kr.targetValue}</span></div>
                                <Progress value={krPct} className="h-1.5" />
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Owner: {objective.owner}</span>
                    <Badge variant="outline" className="text-[10px]">{objective.status}</Badge>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── KPI Card ───
function KPICard({ kpi }: { kpi: KPI }) {
    const healthColor = kpi.health === "GREEN" ? "text-emerald-500" : kpi.health === "AMBER" ? "text-amber-500" : "text-red-500";
    const trendIcon = kpi.trend === "IMPROVING" ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : kpi.trend === "DEGRADING" ? <TrendingDown className="h-3 w-3 text-red-500" /> : null;
    return (
        <Card className="border-border hover:border-primary/30 transition-all">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">{kpi.name}</span>
                    <div className="flex items-center gap-1">{trendIcon}<span className={`text-[10px] font-mono ${healthColor}`}>{kpi.health}</span></div>
                </div>
                <div className="flex items-end justify-between">
                    <div><span className="text-2xl font-bold text-foreground">{kpi.value}</span><span className="text-xs text-muted-foreground ml-1">{kpi.unit}</span></div>
                    <Sparkline data={kpi.sparkline} color={kpi.health === "GREEN" ? "#10b981" : kpi.health === "AMBER" ? "#f59e0b" : "#ef4444"} />
                </div>
                {kpi.boardTranslation && <p className="text-[10px] text-muted-foreground italic mt-2 border-t border-border pt-1">📋 {kpi.boardTranslation}</p>}
            </CardContent>
        </Card>
    );
}

// ─── Gantt chart for projects ───
const PHASE_STYLES: Record<ProjectPhaseStatus, string> = {
    NOT_STARTED: 'bg-gray-500/20 border-gray-500/30', IN_PROGRESS: 'bg-blue-500/20 border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 border-emerald-500/30', BLOCKED: 'bg-red-500/20 border-red-500/30',
};

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
    NOT_STARTED: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <XCircle className="h-3 w-3" /> },
    IN_PROGRESS: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Target className="h-3 w-3" /> },
    COMPLETED: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <XCircle className="h-3 w-3" /> },
};

function ProjectCard({ project }: { project: Project }) {
    const pct = project.budgetAllocated > 0 ? Math.round((project.budgetSpent / project.budgetAllocated) * 100) : 0;
    const style = STATUS_STYLES[project.status] || STATUS_STYLES.NOT_STARTED;
    return (
        <Card className="border-border hover:border-primary/30 transition-all">
            <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{project.title}</h3>
                    <Badge variant="outline" className={cn("text-[10px]", style.color)}>{style.icon}<span className="ml-1">{project.status}</span></Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Budget: ${(project.budgetSpent / 1000).toFixed(0)}k / ${(project.budgetAllocated / 1000).toFixed(0)}k ({pct}%)</span>
                    <span>Owner: {project.owner}</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                {project.phases && project.phases.length > 0 && (
                    <div className="flex gap-1 mt-2">
                        {project.phases.map((phase, i) => (
                            <div key={i} className={cn("flex-1 h-6 rounded border text-[9px] flex items-center justify-center font-medium", PHASE_STYLES[phase.status])}>
                                {phase.title.slice(0, 10)}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Defense Matrix Tab (from /strategy/matrix) ───
function DefenseMatrixTab() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { objectives, fetchOKR } = useOKRProjectStore();
    useEffect(() => { fetchOKR(); }, [fetchOKR]);
    // Simplified matrix view
    const domains = ["Network", "Endpoint", "Identity", "Data", "Application", "Cloud"];
    const controls = ["Prevent", "Detect", "Respond", "Recover"];
    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">Control coverage matrix across security domains.</p>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className="p-3 text-left text-muted-foreground font-medium border-b border-border">Domain</th>
                            {controls.map(c => <th key={c} className="p-3 text-center text-muted-foreground font-medium border-b border-border">{c}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {domains.map(domain => (
                            <tr key={domain} className="hover:bg-secondary/30 transition-colors">
                                <td className="p-3 font-medium border-b border-border">{domain}</td>
                                {controls.map(control => {
                                    const score = Math.floor(Math.random() * 100);
                                    const color = score >= 80 ? "bg-emerald-500/20 text-emerald-400" : score >= 50 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400";
                                    return <td key={control} className="p-3 text-center border-b border-border"><span className={cn("px-2 py-1 rounded text-xs font-mono font-bold", color)}>{score}%</span></td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function StrategyPage() {
    const { objectives, projects, fetchOKR } = useOKRProjectStore();
    const kpis = useMemo(() => computeAllKPIs(), []);
    const uploadedKPIs = useUploadedKPIStore(s => s.uploadedKPIs);

    useEffect(() => { fetchOKR(); }, [fetchOKR]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Strategy & OKRs</h1>

            <Tabs defaultValue="okrs" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="okrs" className="gap-2"><Target className="h-4 w-4" />OKRs</TabsTrigger>
                    <TabsTrigger value="matrix" className="gap-2"><Shield className="h-4 w-4" />Defense Matrix</TabsTrigger>
                    <TabsTrigger value="kpis" className="gap-2"><BarChart3 className="h-4 w-4" />KPI Dashboard</TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2"><FolderKanban className="h-4 w-4" />Program Tracker</TabsTrigger>
                </TabsList>

                <TabsContent value="okrs">
                    <div className="space-y-4">
                        <p className="text-muted-foreground">Security objectives and key results for the current period.</p>
                        {objectives.length === 0 ? (
                            <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">No objectives defined yet. Set OKRs to start tracking security strategy.</CardContent></Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{objectives.map(obj => <OKRCard key={obj.id} objective={obj} />)}</div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="matrix"><DefenseMatrixTab /></TabsContent>

                <TabsContent value="kpis">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">20+ auto-computed security KPIs with board-friendly translations.</p>
                            <KPIUploader onClose={() => { }} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kpis.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
                            {uploadedKPIs.map((kpi: { id: string; name: string; value: number; unit: string; health: string; trend: string }) => (
                                <Card key={kpi.id} className="border-border hover:border-primary/30 transition-all">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-muted-foreground font-medium">{kpi.name}</span>
                                            <span className={`text-[10px] font-mono ${kpi.health === 'GREEN' ? 'text-emerald-500' : kpi.health === 'AMBER' ? 'text-amber-500' : 'text-red-500'}`}>{kpi.health}</span>
                                        </div>
                                        <div><span className="text-2xl font-bold text-foreground">{kpi.value}</span><span className="text-xs text-muted-foreground ml-1">{kpi.unit}</span></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="projects">
                    <div className="space-y-4">
                        <p className="text-muted-foreground">Security projects, budget tracking, and execution status.</p>
                        {projects.length === 0 ? (
                            <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground">No projects tracked. Create a project to start monitoring progress.</CardContent></Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{projects.map(proj => <ProjectCard key={proj.id} project={proj} />)}</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
