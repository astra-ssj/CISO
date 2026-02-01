"use client";

import { useState, useEffect } from "react";
import { usePlaybookStore, Playbook } from "@/lib/playbook-store";
import { usePolicyStore, Policy } from "@/lib/policy-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertCircle,
    Clock,
    CheckCircle2,
    Flag,
    Send,
    PlayCircle,
    ShieldAlert,
    FileText,
    Scale,
    Fingerprint,
    Download,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PlaybookActiveViewProps {
    playbookId: string;
    onExit: () => void;
}

export function PlaybookActiveView({ playbookId, onExit }: PlaybookActiveViewProps) {
    const { playbooks, toggleStep, resolvePlaybook, logEvidence } = usePlaybookStore();
    const { policies } = usePolicyStore();
    const playbook = playbooks.find(p => p.id === playbookId);

    const [evidenceInput, setEvidenceInput] = useState("");
    const [elapsedTime, setElapsedTime] = useState("00:00:00");
    const [selectedStepType, setSelectedStepType] = useState<string>("");

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
        // In a real app, we'd calculate a hash here
        const mockHash = "SHA256:" + Math.random().toString(36).substring(2, 15);
        logEvidence(playbookId, `${evidenceInput} [${mockHash}]`);
        setEvidenceInput("");
    };

    const handleResolve = () => {
        if (confirm("Are you sure you want to close this incident? This will finalize the report.")) {
            resolvePlaybook(playbookId);
            onExit();
        }
    };

    const handleExportLitigationReport = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38); // Red
        doc.text("CONFIDENTIAL - LITIGATION REPORT", 105, 20, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`Incident: ${playbook.title}`, 14, 40);
        doc.setFontSize(10);
        doc.text(`Incident ID: ${playbook.id}`, 14, 46);
        doc.text(`Start Time: ${new Date(playbook.startTime!).toLocaleString()}`, 14, 52);
        doc.text(`Duration: ${elapsedTime}`, 14, 58);
        doc.text(`Severity: ${playbook.severity}`, 14, 64);

        // Chain of Custody Table
        doc.setFontSize(12);
        doc.text("Chain of Custody / Evidence Log", 14, 80);

        const evidenceData = playbook.evidenceLog.map(log => [
            new Date(log.timestamp).toLocaleString(),
            "CISO (Active User)",
            log.message,
            "VERIFIED"
        ]);

        autoTable(doc, {
            head: [['Timestamp', 'Custodian', 'Evidence / Action', 'Integrity']],
            body: evidenceData,
            startY: 85,
            theme: 'grid',
            headStyles: { fillColor: [41, 41, 41] }
        });

        // Steps Compliance
        const currentY = (doc as any).lastAutoTable.finalY + 20;
        doc.text("Procedural Compliance Record", 14, currentY);

        const stepsData: any[] = [];
        playbook.phases.forEach(phase => {
            phase.steps.forEach(step => {
                stepsData.push([
                    phase.title,
                    step.instruction,
                    step.isCompleted ? "COMPLETED" : "PENDING",
                    step.evidence || "-"
                ]);
            });
        });

        autoTable(doc, {
            head: [['Phase', 'Procedure', 'Status', 'Notes']],
            body: stepsData,
            startY: currentY + 5,
            theme: 'striped'
        });

        doc.save(`litigation-report-${playbook.id}.pdf`);
    };

    // Determine active policy context based on clicked step or phase
    // Advanced: Search policy store for keywords
    const getPolicyContext = () => {
        let policy: Policy | undefined;
        let snippet = "Follow the procedures outlined in the playbook. Document every action.";
        let title = "General Guidelines";

        // Heuristic mapping
        if (selectedStepType.toLowerCase().includes('isolate') || selectedStepType.toLowerCase().includes('contain')) {
            policy = policies.find(p => p.title.includes("Incident Response"));
            if (policy) {
                title = policy.title;
                const section = policy.sections.find(s => s.title.includes("Containment"));
                snippet = section ? section.content : policy.sections[0].content;
            }
        } else if (selectedStepType.toLowerCase().includes('hash') || selectedStepType.toLowerCase().includes('evidence')) {
            policy = policies.find(p => p.title.includes("Incident Response"));
            if (policy) {
                title = policy.title;
                const section = policy.sections.find(s => s.title.includes("Reporting") || s.title.includes("Evidence")); // Approximate
                snippet = section ? section.content : "Ensure all evidence is hashed and logged.";
            }
        } else if (selectedStepType.toLowerCase().includes('access')) {
            policy = policies.find(p => p.title.includes("Access Control"));
            if (policy) {
                title = policy.title;
                snippet = policy.sections[0].content;
            }
        }

        return { title, content: snippet };
    };

    const policyCtx = getPolicyContext();

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* War Room Header */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-destructive/20 shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 animate-pulse" />

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            ACTIVE INCIDENT
                        </Badge>
                        <span className="font-mono text-sm text-destructive font-bold uppercase tracking-wider">
                            Sev: {playbook.severity}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mt-1">{playbook.title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Elapsed Time</span>
                        <div className="font-mono text-2xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            {elapsedTime}
                        </div>
                    </div>

                    <Button variant="secondary" onClick={handleExportLitigationReport}>
                        <Scale className="mr-2 h-4 w-4" />
                        Litigation Report
                    </Button>

                    <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={handleResolve}>
                        <Flag className="mr-2 h-4 w-4" />
                        Resolve
                    </Button>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left: Steps & Phases */}
                <Card className="col-span-12 lg:col-span-7 flex flex-col h-full border-primary/10">
                    <CardHeader className="py-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            Response Procedure
                        </CardTitle>
                        <CardDescription>Select a step to view relevant policy context.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2">
                        <div className="space-y-6">
                            {playbook.phases.map((phase, index) => (
                                <div key={phase.id} className="relative pl-6 border-l-2 border-border/50 pb-6 last:pb-0">
                                    <div className={cn(
                                        "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center",
                                        phase.status === 'COMPLETED' ? "border-emerald-500 text-emerald-500" :
                                            phase.status === 'IN_PROGRESS' ? "border-primary text-primary animate-pulse" : "border-muted text-muted-foreground"
                                    )}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    </div>

                                    <h3 className={cn("text-base font-semibold mb-3 flex items-center gap-2",
                                        phase.status === 'COMPLETED' ? "text-emerald-500" :
                                            phase.status === 'IN_PROGRESS' ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {phase.title}
                                        {phase.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4" />}
                                    </h3>

                                    <div className="space-y-2">
                                        {phase.steps.map(step => (
                                            <div
                                                key={step.id}
                                                onClick={() => setSelectedStepType(step.instruction)}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                                    selectedStepType === step.instruction ? "ring-1 ring-primary border-primary" : "hover:border-primary/30",
                                                    step.isCompleted ? "bg-secondary/30 border-secondary/50" : "bg-card border-border"
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
                                                            "text-xs md:text-sm font-medium leading-none cursor-pointer",
                                                            step.isCompleted && "text-muted-foreground line-through decoration-muted-foreground/50"
                                                        )}
                                                    >
                                                        {step.instruction}
                                                    </label>

                                                    {step.type === 'TEXT_INPUT' && !step.isCompleted && (
                                                        <Input
                                                            placeholder="Enter finding..."
                                                            className="h-7 text-xs font-mono bg-secondary/20"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onBlur={(e) => {
                                                                if (e.target.value) toggleStep(playbook.id, phase.id, step.id, e.target.value);
                                                            }}
                                                        />
                                                    )}

                                                    {step.evidence && (
                                                        <div className="text-[10px] font-mono bg-emerald-500/10 p-1 rounded text-emerald-600 inline-block border border-emerald-500/20">
                                                            <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                                            {step.evidence}
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

                {/* Right: Evidence & Policy */}
                <div className="col-span-12 lg:col-span-5 flex flex-col h-full gap-4">

                    {/* Policy Context Card */}
                    <Card className="flex-shrink-0 bg-blue-950/20 border-blue-500/20">
                        <CardHeader className="py-2 px-4 border-b border-blue-500/10">
                            <CardTitle className="text-xs font-bold text-blue-400 flex items-center gap-2">
                                <BookOpen className="h-3 w-3" />
                                SMART POLICY ASSIST
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-sm mb-1">{policyCtx.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {policyCtx.content}
                            </p>
                            <div className="mt-2 text-[10px] text-blue-400 cursor-pointer hover:underline">
                                View full document ↗
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evidence / Chain of Custody */}
                    <Card className="flex-1 flex flex-col border-primary/10">
                        <CardHeader className="py-3 bg-secondary/20">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-amber-500" />
                                Evidence Locker (Chain of Custody)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                            <ScrollArea className="flex-1 p-3">
                                <div className="space-y-3">
                                    {playbook.evidenceLog.length === 0 && (
                                        <div className="text-center text-muted-foreground text-xs py-10 opacity-50">
                                            No evidence collected yet.
                                        </div>
                                    )}
                                    {playbook.evidenceLog.map((log, i) => (
                                        <div key={i} className="flex flex-col gap-1 bg-card border border-border/60 p-2 rounded text-xs">
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono bg-secondary/30 p-1 rounded-sm">
                                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                <span className="flex items-center gap-1">
                                                    <Fingerprint className="h-3 w-3" />
                                                    CISO (User)
                                                </span>
                                            </div>
                                            <div className="px-1 text-foreground/90 font-medium">
                                                {log.message.split('[')[0]}
                                            </div>
                                            {log.message.includes('[') && (
                                                <div className="px-1 text-[9px] font-mono text-amber-600 truncate">
                                                    Hash: {log.message.split('[')[1].replace(']', '')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-3 border-t bg-card mt-auto z-10">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Detailed observation or file hash..."
                                        className="min-h-[60px] resize-none text-xs font-mono bg-secondary/10"
                                        value={evidenceInput}
                                        onChange={(e) => setEvidenceInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleLogEvidence();
                                            }
                                        }}
                                    />
                                    <Button size="icon" className="h-auto w-12 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleLogEvidence}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                                    <span>All entries are cryptographically signed.</span>
                                    <span>Enter to log</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
