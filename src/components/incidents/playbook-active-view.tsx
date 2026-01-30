"use client";

import { useState, useEffect } from "react";
import { usePlaybookStore, Playbook } from "@/lib/playbook-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Clock, CheckCircle2, Flag, Send, ChevronRight, PlayCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaybookActiveViewProps {
    playbookId: string;
    onExit: () => void;
}

export function PlaybookActiveView({ playbookId, onExit }: PlaybookActiveViewProps) {
    const { playbooks, toggleStep, resolvePlaybook, logEvidence } = usePlaybookStore();
    const playbook = playbooks.find(p => p.id === playbookId);

    const [evidenceInput, setEvidenceInput] = useState("");
    const [elapsedTime, setElapsedTime] = useState("00:00:00");

    // Simple Timer
    useEffect(() => {
        if (!playbook?.startTime || playbook.status !== 'ACTIVE') return;

        const interval = setInterval(() => {
            const diff = Date.now() - playbook.startTime!;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [playbook]);

    if (!playbook) return <div>Playbook not found</div>;

    const handleLogEvidence = () => {
        if (!evidenceInput.trim()) return;
        logEvidence(playbookId, evidenceInput);
        setEvidenceInput("");
    };

    const handleResolve = () => {
        if (confirm("Are you sure you want to close this incident? This will finalize the report.")) {
            resolvePlaybook(playbookId);
            onExit();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* War Room Header */}
            <div className="flex items-center justify-between bg-card p-6 rounded-xl border border-destructive/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 animate-pulse" />

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            ACTIVE INCIDENT
                        </Badge>
                        <span className="font-mono text-sm text-destructive font-bold uppercase tracking-wider">
                            Severity: {playbook.severity}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mt-1">{playbook.title}</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">Incident Duration</span>
                        <div className="font-mono text-3xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="h-6 w-6 text-primary" />
                            {elapsedTime}
                        </div>
                    </div>
                    <Button variant="outline" size="lg" className="border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={handleResolve}>
                        <Flag className="mr-2 h-5 w-5" />
                        Declare Resolved
                    </Button>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left: Steps & Phases */}
                <Card className="col-span-8 flex flex-col h-full border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            Response Procedure
                        </CardTitle>
                        <CardDescription>Follow the steps below to contain and eradicate the threat.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2">
                        <div className="space-y-8">
                            {playbook.phases.map((phase, index) => (
                                <div key={phase.id} className="relative pl-6 border-l-2 border-border/50 pb-6 last:pb-0">
                                    <div className={cn(
                                        "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center",
                                        phase.status === 'COMPLETED' ? "border-emerald-500 text-emerald-500" :
                                            phase.status === 'IN_PROGRESS' ? "border-primary text-primary animate-pulse" : "border-muted text-muted-foreground"
                                    )}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    </div>

                                    <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2",
                                        phase.status === 'COMPLETED' ? "text-emerald-500" :
                                            phase.status === 'IN_PROGRESS' ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {phase.title}
                                        {phase.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4" />}
                                    </h3>

                                    <div className="space-y-3">
                                        {phase.steps.map(step => (
                                            <div key={step.id} className={cn(
                                                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                                step.isCompleted ? "bg-secondary/30 border-secondary/50" : "bg-card border-border hover:border-primary/30"
                                            )}>
                                                <Checkbox
                                                    id={step.id}
                                                    checked={step.isCompleted}
                                                    onCheckedChange={() => toggleStep(playbook.id, phase.id, step.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <label
                                                        htmlFor={step.id}
                                                        className={cn(
                                                            "text-sm font-medium leading-none cursor-pointer",
                                                            step.isCompleted && "text-muted-foreground line-through decoration-muted-foreground/50"
                                                        )}
                                                    >
                                                        {step.instruction}
                                                    </label>

                                                    {step.type === 'TEXT_INPUT' && !step.isCompleted && (
                                                        <Input
                                                            placeholder="Enter finding or value..."
                                                            className="h-8 text-xs font-mono bg-secondary/20"
                                                            onBlur={(e) => {
                                                                if (e.target.value) toggleStep(playbook.id, phase.id, step.id, e.target.value);
                                                            }}
                                                        />
                                                    )}

                                                    {step.evidence && (
                                                        <div className="text-xs font-mono bg-secondary/50 p-1.5 rounded text-muted-foreground inline-block">
                                                            Captured: {step.evidence}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Evidence & Logs */}
                <div className="col-span-4 flex flex-col h-full gap-6">
                    {/* Live Evidence Feed */}
                    <Card className="flex-1 flex flex-col border-primary/10">
                        <CardHeader className="py-3 bg-secondary/20">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                                Incident Log & Evidence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 flex flex-col">
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {playbook.evidenceLog.length === 0 && (
                                        <div className="text-center text-muted-foreground text-xs py-10 opacity-50">
                                            No evidence logged yet.
                                        </div>
                                    )}
                                    {playbook.evidenceLog.map((log, i) => (
                                        <div key={i} className="flex gap-3 text-sm">
                                            <div className="flex flex-col items-center gap-1 min-w-[50px]">
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="w-px h-full bg-border/50" />
                                            </div>
                                            <div className="bg-secondary/10 p-2 rounded-lg border border-border/40 text-xs text-foreground/90 flex-1">
                                                {log.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-3 border-t bg-card mt-auto">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Log observation or paste evidence..."
                                        className="min-h-[60px] resize-none text-xs font-mono bg-secondary/20"
                                        value={evidenceInput}
                                        onChange={(e) => setEvidenceInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleLogEvidence();
                                            }
                                        }}
                                    />
                                    <Button size="icon" className="h-auto w-12" onClick={handleLogEvidence}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 text-right">
                                    Press Enter to log
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats or Ref References could go here */}
                    <Card className="h-1/3 border-primary/10 bg-blue-500/5">
                        <CardContent className="pt-6">
                            <h4 className="font-semibold text-sm mb-2 text-blue-400">Team Contact Info</h4>
                            <ul className="text-xs space-y-2 text-muted-foreground">
                                <li className="flex justify-between"><span>SOC Manager:</span> <span className="text-foreground">+1 (555) 0199</span></li>
                                <li className="flex justify-between"><span>Legal Counsel:</span> <span className="text-foreground">+1 (555) 0244</span></li>
                                <li className="flex justify-between"><span>PR Comms:</span> <span className="text-foreground">+1 (555) 0311</span></li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
