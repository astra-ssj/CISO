"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOKRProjectStore, type Objective, type Project, type OKRStatus, type ProjectPhaseStatus } from "@/lib/okr-project-store";
import {
    Target, Calendar, DollarSign, FolderKanban, ChevronRight,
    CheckCircle2, AlertTriangle, XCircle, Clock, ArrowRight, Layers
} from "lucide-react";

const STATUS_STYLES: Record<OKRStatus, { color: string; icon: React.ReactNode }> = {
    ON_TRACK: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    AT_RISK: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
    BEHIND: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
    COMPLETED: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <XCircle className="h-3 w-3" /> },
};

const PHASE_STYLES: Record<ProjectPhaseStatus, string> = {
    NOT_STARTED: 'bg-gray-500/20 border-gray-500/30',
    IN_PROGRESS: 'bg-blue-500/20 border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 border-emerald-500/30',
    BLOCKED: 'bg-red-500/20 border-red-500/30',
};

const PRIORITY_STYLES: Record<string, string> = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500/80 text-black',
    LOW: 'bg-blue-500/60 text-white',
};

function OKRCard({ objective }: { objective: Objective }) {
    const { getOKRProgress } = useOKRProjectStore();
    const progress = getOKRProgress(objective.id);
    const statusStyle = STATUS_STYLES[objective.status];

    return (
        <Card className="bg-card/30 backdrop-blur-sm border-border/30 hover:border-primary/20 transition-all">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${statusStyle.color} border text-[10px] gap-1`}>
                                {statusStyle.icon} {objective.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">{objective.id}</span>
                        </div>
                        <h3 className="font-semibold text-white text-sm">{objective.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{objective.description}</p>
                    </div>
                    <div className="flex flex-col items-center ml-3">
                        <div className="relative h-14 w-14">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15" fill="none"
                                    className={progress >= 80 ? 'text-emerald-400' : progress >= 50 ? 'text-amber-400' : 'text-red-400'}
                                    stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                    strokeDasharray={`${(progress / 100) * 94.2}, 94.2`} />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{progress}%</span>
                        </div>
                    </div>
                </div>

                {/* Key Results */}
                <div className="space-y-2.5 mt-4">
                    {objective.keyResults.map(kr => {
                        const krProgress = Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100));
                        const krStatus = STATUS_STYLES[kr.status];
                        return (
                            <div key={kr.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        {kr.isAutoTracked && (
                                            <span className="text-[8px] px-1 py-0 rounded bg-primary/20 text-primary border border-primary/30 flex-shrink-0">
                                                AUTO
                                            </span>
                                        )}
                                        <span className="text-xs text-white/80 truncate">{kr.title}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                                        {kr.currentValue}/{kr.targetValue} {kr.unit}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Progress value={krProgress} className="h-1.5 flex-1" />
                                    <Badge className={`${krStatus.color} border text-[8px] px-1 py-0`}>
                                        {kr.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20 text-[10px] text-muted-foreground">
                    <span>👤 {objective.owner}</span>
                    <span>{objective.quarter} {objective.year}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function GanttChart({ project }: { project: Project }) {
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.targetEndDate).getTime();
    const totalRange = end - start;
    const now = Date.now();
    const nowPos = Math.min(100, Math.max(0, ((now - start) / totalRange) * 100));

    return (
        <Card className="bg-card/30 backdrop-blur-sm border-border/30">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${PRIORITY_STYLES[project.priority]} text-[10px]`}>{project.priority}</Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">{project.id}</span>
                        </div>
                        <h3 className="font-semibold text-white text-sm">{project.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                    </div>
                </div>

                {/* Budget Bar */}
                <div className="flex items-center gap-3 mb-4 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <DollarSign className="h-4 w-4 text-cyan-400" />
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">Budget: ${(project.budgetSpent / 1000).toFixed(0)}K / ${(project.budgetAllocated / 1000).toFixed(0)}K</span>
                            <span className="text-cyan-400">{Math.round((project.budgetSpent / project.budgetAllocated) * 100)}%</span>
                        </div>
                        <Progress value={(project.budgetSpent / project.budgetAllocated) * 100} className="h-1.5" />
                    </div>
                </div>

                {/* Gantt Bars */}
                <div className="relative space-y-2">
                    {/* Today Marker */}
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-primary/40 z-10"
                        style={{ left: `${nowPos}%` }}>
                        <span className="absolute -top-4 -translate-x-1/2 text-[8px] text-primary bg-primary/20 px-1 rounded">
                            Today
                        </span>
                    </div>

                    {project.phases.map(phase => {
                        const phaseStart = new Date(phase.startDate).getTime();
                        const phaseEnd = new Date(phase.endDate).getTime();
                        const left = ((phaseStart - start) / totalRange) * 100;
                        const width = ((phaseEnd - phaseStart) / totalRange) * 100;

                        return (
                            <div key={phase.id} className="relative h-10">
                                <div className={`absolute top-1 h-8 rounded-md border flex items-center px-2 ${PHASE_STYLES[phase.status]}`}
                                    style={{ left: `${left}%`, width: `${width}%` }}>
                                    <span className="text-[10px] text-white/80 font-medium truncate">{phase.title}</span>
                                    <span className="text-[9px] text-white/50 ml-auto pl-1 flex-shrink-0">{phase.progress}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Phase dates */}
                <div className="flex justify-between mt-3 text-[9px] text-muted-foreground">
                    <span>{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <span>{new Date(project.targetEndDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>

                {/* Milestones */}
                <div className="mt-3 pt-3 border-t border-border/20">
                    <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider mb-2 block">Milestones</span>
                    <div className="space-y-1">
                        {project.phases.flatMap(p => p.milestones).map(ms => (
                            <div key={ms.id} className="flex items-center gap-2 text-[11px]">
                                {ms.status === 'COMPLETED'
                                    ? <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                    : ms.status === 'IN_PROGRESS'
                                        ? <Clock className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                        : <span className="h-3 w-3 rounded-full border border-white/20 flex-shrink-0" />
                                }
                                <span className={ms.status === 'COMPLETED' ? 'text-white/50 line-through' : 'text-white/80'}>
                                    {ms.title}
                                </span>
                                <span className="text-muted-foreground ml-auto text-[9px] flex-shrink-0">
                                    {new Date(ms.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tags & Owner */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20 text-[10px] text-muted-foreground">
                    <span>👤 {project.owner}</span>
                    <div className="flex gap-1">
                        {project.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{t}</span>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ProjectsPage() {
    const { objectives, projects, getOverallOKRHealth } = useOKRProjectStore();
    const health = getOverallOKRHealth();

    const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
    const totalBudget = projects.reduce((s, p) => s + p.budgetAllocated, 0);
    const spentBudget = projects.reduce((s, p) => s + p.budgetSpent, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FolderKanban className="h-7 w-7 text-primary" />
                        Security Program Tracker
                    </h1>
                    <p className="text-muted-foreground">OKRs, projects, milestones & budget tracking</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Target className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-2xl font-bold text-white">{objectives.length}</p>
                            <p className="text-[10px] text-muted-foreground">Active Objectives</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex gap-1">
                            <span className="h-6 w-2 rounded-full bg-emerald-500" />
                            <span className="h-6 w-2 rounded-full bg-amber-500" />
                            <span className="h-6 w-2 rounded-full bg-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{health.onTrack}✓ {health.atRisk}⚠ {health.behind}✗</p>
                            <p className="text-[10px] text-muted-foreground">OKR Health</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Layers className="h-8 w-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{activeProjects}</p>
                            <p className="text-[10px] text-muted-foreground">Active Projects</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                    <CardContent className="p-4 flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-cyan-400" />
                        <div>
                            <p className="text-sm font-bold text-white">${(spentBudget / 1000).toFixed(0)}K / ${(totalBudget / 1000).toFixed(0)}K</p>
                            <p className="text-[10px] text-muted-foreground">Budget Utilization ({Math.round((spentBudget / totalBudget) * 100)}%)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="okrs" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="okrs" className="gap-2">
                        <Target className="h-4 w-4" /> Objectives & Key Results
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2">
                        <Calendar className="h-4 w-4" /> Project Portfolio
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="okrs" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {objectives.map(obj => <OKRCard key={obj.id} objective={obj} />)}
                    </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {projects.map(proj => <GanttChart key={proj.id} project={proj} />)}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
