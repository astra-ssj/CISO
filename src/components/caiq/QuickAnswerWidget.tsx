"use client";

/**
 * Quick Answer Widget
 *
 * 4-step guided wizard:
 *   Step 1 — Upload questionnaire Excel/CSV
 *   Step 2 — KB Match (instant, no AI)
 *   Step 3 — AI Fill (SSE-streamed AI enhancement)
 *   Step 4 — Review & Export
 */

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Upload, Zap, Brain, Download, CheckCircle2, Loader2,
    AlertTriangle, FileSpreadsheet, ArrowRight, RefreshCw,
    Pencil, Save, X, ChevronRight,
} from "lucide-react";
import type { AnsweredQuestion } from "@/lib/caiq/caiq-knowledge-base";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;
type SourceMode = "kb" | "upload" | "both";

interface ParseResult {
    result: {
        totalQuestions: number;
        answeredByA2A: number;
        coveragePct: number;
        questions: AnsweredQuestion[];
    };
    mode: string;
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function confidenceColor(q: AnsweredQuestion) {
    if (q.source === "manual") return "text-red-400 border-red-500/30 bg-red-500/10";
    if (q.confidence === 'high') return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (q.confidence === 'medium') return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    return "text-orange-400 border-orange-500/30 bg-orange-500/10";
}

function sourceLabel(src: string) {
    const map: Record<string, string> = {
        a2a: "Direct KB",
        kb: "KB Match",
        semantic: "Semantic",
        context: "AI Gen",
        manual: "Unmatched",
    };
    return map[src] ?? src;
}

// ────────────────────────────────────────────
// Step indicator
// ────────────────────────────────────────────

const STEPS = [
    { id: 1, label: "Upload", icon: <Upload className="h-4 w-4" /> },
    { id: 2, label: "KB Match", icon: <Zap className="h-4 w-4" /> },
    { id: 3, label: "AI Fill", icon: <Brain className="h-4 w-4" /> },
    { id: 4, label: "Export", icon: <Download className="h-4 w-4" /> },
];

function StepBar({ current }: { current: Step }) {
    return (
        <div className="flex items-center gap-0 w-full max-w-lg mx-auto">
            {STEPS.map((s, i) => {
                const done = current > s.id;
                const active = current === s.id;
                return (
                    <React.Fragment key={s.id}>
                        <div className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${active ? "opacity-100" : done ? "opacity-70" : "opacity-30"}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${active ? "border-primary bg-primary/20 text-primary" : done ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-border bg-card text-muted-foreground"}`}>
                                {done ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
                            </div>
                            <span className="text-[10px] font-medium">{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-px mx-1 transition-all ${done ? "bg-emerald-500/40" : "bg-border/30"}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ────────────────────────────────────────────
// Main Widget
// ────────────────────────────────────────────

export default function QuickAnswerWidget() {
    const [step, setStep] = useState<Step>(1);
    const [sourceMode, setSourceMode] = useState<SourceMode>("kb");

    // Files
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const targetInputRef = useRef<HTMLInputElement>(null);
    const sourceInputRef = useRef<HTMLInputElement>(null);

    // Step 2 — parse result
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    // Step 3 — AI enhance
    const [questions, setQuestions] = useState<AnsweredQuestion[]>([]);
    const [enhancing, setEnhancing] = useState(false);
    const [enhanceProgress, setEnhanceProgress] = useState({ message: "", processed: 0, total: 0 });
    const [enhanceError, setEnhanceError] = useState<string | null>(null);

    // Step 4 — review
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [exporting, setExporting] = useState(false);

    // ── Step 1  → 2: Parse & KB match ────────

    const handleParse = useCallback(async () => {
        if (!targetFile) return;
        setParsing(true);
        setParseError(null);

        try {
            const form = new FormData();
            form.append("target", targetFile);
            if ((sourceMode === "upload" || sourceMode === "both") && sourceFile) {
                form.append("source", sourceFile);
            }

            const res = await fetch("/api/caiq/parse", { method: "POST", body: form });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Parse failed");
            }
            const data: ParseResult = await res.json();
            setParseResult(data);
            setQuestions(data.result.questions);
            setStep(2);
        } catch (e) {
            setParseError(e instanceof Error ? e.message : "Parse failed");
        } finally {
            setParsing(false);
        }
    }, [targetFile, sourceFile, sourceMode]);

    // ── Step 2 → 3: AI enhancement ────────────

    const handleEnhance = useCallback(async () => {
        if (questions.length === 0) return;
        setEnhancing(true);
        setEnhanceError(null);
        setStep(3);

        try {
            const res = await fetch("/api/caiq/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questions,
                    sourceEntries: [],
                    profile: { industry: "Technology", certifications: [], orgSize: "Mid-size", cloudProvider: "Cloud", additionalContext: "" },
                }),
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    const lines = part.split("\n");
                    let event = "", data = "";
                    for (const l of lines) {
                        if (l.startsWith("event:")) event = l.slice(6).trim();
                        if (l.startsWith("data:")) data = l.slice(5).trim();
                    }
                    if (!data) continue;
                    const payload = JSON.parse(data);

                    if (event === "progress") {
                        setEnhanceProgress({ message: payload.message, processed: payload.processed, total: payload.total });
                    } else if (event === "complete") {
                        setQuestions(payload.questions);
                    } else if (event === "error") {
                        throw new Error(payload.message);
                    }
                }
            }

            setStep(4);
        } catch (e) {
            setEnhanceError(e instanceof Error ? e.message : "AI enhancement failed");
        } finally {
            setEnhancing(false);
        }
    }, [questions]);

    // ── Step 3 → 4 : skip AI ────────────────

    const handleSkipAI = useCallback(() => setStep(4), []);

    // ── Step 4: inline edit ──────────────────

    const saveEdit = (idx: number) => {
        setQuestions(prev => prev.map((q, i) =>
            i === idx ? { ...q, answer: editDraft } : q
        ));
        setEditingIdx(null);
    };

    // ── Step 4: export ───────────────────────

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/caiq/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questions,
                    fileName: targetFile?.name?.replace(/\.[^.]+$/, "-answered") ?? "questionnaire-answers",
                }),
            });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = targetFile?.name?.replace(/\.[^.]+$/, "-answered.xlsx") ?? "questionnaire-answers.xlsx";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setExporting(false);
        }
    }, [questions, targetFile]);

    // ── Reset ────────────────────────────────

    const handleReset = () => {
        setStep(1);
        setTargetFile(null);
        setSourceFile(null);
        setParseResult(null);
        setQuestions([]);
        setParseError(null);
        setEnhanceError(null);
        setEnhanceProgress({ message: "", processed: 0, total: 0 });
    };

    // ────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────

    return (
        <div className="space-y-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" /> Quick Answer
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Upload any questionnaire Excel and auto-populate answers from the Knowledge Base.
                    </p>
                </div>
                {step > 1 && (
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                        <RefreshCw className="h-3.5 w-3.5" /> Start Over
                    </Button>
                )}
            </div>

            {/* Step indicator */}
            <StepBar current={step} />

            {/* ── STEP 1: Upload ─────────────────────── */}
            {step === 1 && (
                <Card className="border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Upload className="h-4 w-4 text-primary" /> Upload Questionnaire
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Source mode picker */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Answer Source</p>
                            <div className="flex gap-2">
                                {(["kb", "upload", "both"] as SourceMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSourceMode(m)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sourceMode === m
                                            ? "border-primary bg-primary/20 text-primary"
                                            : "border-border bg-card text-muted-foreground hover:text-white"}`}
                                    >
                                        {m === "kb" ? "Knowledge Base" : m === "upload" ? "Upload Source File" : "Both"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target file upload */}
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/40"}`}
                            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setTargetFile(f); }}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => targetInputRef.current?.click()}
                        >
                            <input ref={targetInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) setTargetFile(f); }} />
                            {targetFile ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="h-10 w-10 text-emerald-400" />
                                    <p className="font-medium text-sm">{targetFile.name}</p>
                                    <p className="text-xs text-muted-foreground">{(targetFile.size / 1024).toFixed(1)} KB</p>
                                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Ready</Badge>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-10 w-10 opacity-40" />
                                    <p className="text-sm font-medium">Drop questionnaire here or click to browse</p>
                                    <p className="text-xs">.xlsx · .xls · .csv supported</p>
                                </div>
                            )}
                        </div>

                        {/* Optional source file */}
                        {(sourceMode === "upload" || sourceMode === "both") && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source File (Answered Q&amp;A)</p>
                                <div
                                    className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-all"
                                    onClick={() => sourceInputRef.current?.click()}
                                >
                                    <input ref={sourceInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) setSourceFile(f); }} />
                                    {sourceFile ? (
                                        <p className="text-sm font-medium flex items-center justify-center gap-2">
                                            <FileSpreadsheet className="h-4 w-4 text-violet-400" /> {sourceFile.name}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Click to upload source Q&amp;A file</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {parseError && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <AlertTriangle className="h-4 w-4 shrink-0" /> {parseError}
                            </div>
                        )}

                        <Button
                            className="w-full gap-2"
                            disabled={!targetFile || parsing}
                            onClick={handleParse}
                        >
                            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                            {parsing ? "Parsing & Matching…" : "Parse & Match KB"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── STEP 2: KB Match results ──────────── */}
            {step === 2 && parseResult && (
                <div className="space-y-4">
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                        <CardContent className="p-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{parseResult.result.totalQuestions}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Questions Found</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-400">{parseResult.result.answeredByA2A}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">KB Matched</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-400">{parseResult.result.totalQuestions - parseResult.result.answeredByA2A}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Need AI Fill</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-primary">{Math.round(parseResult.result.coveragePct)}%</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Coverage</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button className="flex-1 gap-2" onClick={handleEnhance}>
                            <Brain className="h-4 w-4" /> Run AI Fill for Remaining
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={handleSkipAI}>
                            Skip AI <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: AI Enhancement progress ──── */}
            {step === 3 && (
                <Card className="border-violet-500/20 bg-violet-500/5">
                    <CardContent className="p-8 flex flex-col items-center gap-5 text-center">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 flex items-center justify-center">
                                <Brain className="h-7 w-7 text-violet-400" />
                            </div>
                            {enhancing && (
                                <Loader2 className="h-16 w-16 animate-spin text-violet-400 absolute inset-0" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold">{enhancing ? "AI is filling answers…" : enhanceError ? "AI Enhancement Error" : "AI Enhancement Complete"}</p>
                            <p className="text-sm text-muted-foreground mt-1">{enhanceProgress.message || "Initialising AI pipeline…"}</p>
                        </div>
                        {enhanceProgress.total > 0 && (
                            <div className="w-full max-w-xs space-y-1">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 rounded-full transition-all"
                                        style={{ width: `${Math.round((enhanceProgress.processed / enhanceProgress.total) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{enhanceProgress.processed} / {enhanceProgress.total}</p>
                            </div>
                        )}
                        {enhanceError && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3 w-full max-w-sm">
                                <AlertTriangle className="h-4 w-4 shrink-0" /> {enhanceError}
                            </div>
                        )}
                        {!enhancing && (
                            <Button onClick={() => setStep(4)} className="gap-2">
                                Review Results <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── STEP 4: Review & Export ───────────── */}
            {step === 4 && (
                <div className="space-y-4">
                    {/* Summary pills */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { src: "a2a", label: "Direct KB", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                            { src: "kb", label: "KB Match", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                            { src: "semantic", label: "Semantic", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
                            { src: "context", label: "AI Gen", color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
                            { src: "manual", label: "Unmatched", color: "text-red-400 border-red-500/30 bg-red-500/10" },
                        ].map(({ src, label, color }) => {
                            const count = questions.filter(q => q.source === src).length;
                            if (count === 0) return null;
                            return (
                                <Badge key={src} variant="outline" className={`${color} text-xs`}>
                                    {label}: {count}
                                </Badge>
                            );
                        })}
                    </div>

                    {/* Review table */}
                    <Card className="border-border/50">
                        <div className="max-h-[480px] overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="px-3 py-2 w-8">#</th>
                                        <th className="px-3 py-2">Question</th>
                                        <th className="px-3 py-2 min-w-[250px]">Answer</th>
                                        <th className="px-3 py-2 w-24 text-center">Confidence</th>
                                        <th className="px-3 py-2 w-20 text-center">Source</th>
                                        <th className="px-3 py-2 w-14" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {questions.map((q, idx) => (
                                        <tr key={idx} className="hover:bg-muted/10 align-top">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2 max-w-[260px]">
                                                <p className="line-clamp-3" title={q.questionText}>{q.questionText}</p>
                                            </td>
                                            <td className="px-3 py-2 min-w-[250px]">
                                                {editingIdx === idx ? (
                                                    <div className="space-y-1.5">
                                                        <textarea
                                                            className="w-full min-h-[80px] bg-background border border-border rounded-md p-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                                                            value={editDraft}
                                                            onChange={e => setEditDraft(e.target.value)}
                                                        />
                                                        <div className="flex gap-1.5">
                                                            <Button size="sm" className="h-6 text-[10px]" onClick={() => saveEdit(idx)}>
                                                                <Save className="h-3 w-3 mr-1" /> Save
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setEditingIdx(null)}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="line-clamp-4 text-muted-foreground" title={q.answer}>
                                                        {q.answer || <em className="text-red-400/70">No answer</em>}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <Badge variant="outline" className={`text-[9px] ${confidenceColor(q)}`}>
                                                    {q.source === "manual" ? "—" : q.confidence}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <Badge variant="outline" className={`text-[9px] ${confidenceColor(q)}`}>
                                                    {sourceLabel(q.source)}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                                {editingIdx !== idx && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => { setEditingIdx(idx); setEditDraft(q.answer || ""); }}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Export button */}
                    <Button
                        size="lg"
                        className="w-full gap-2"
                        disabled={exporting}
                        onClick={handleExport}
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {exporting ? "Exporting…" : "Export Populated Excel"}
                    </Button>
                </div>
            )}
        </div>
    );
}
