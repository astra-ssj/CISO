'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TransferredAnswer } from '@/lib/caiq/caiq-transfer-engine';
import {
    Upload, FileSpreadsheet, Sparkles, Download, Loader2, Edit3,
    Check, X, ArrowRight, AlertTriangle, CheckCircle, Eye,
    ChevronDown, ChevronUp, Filter, RefreshCw, ExternalLink,
} from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface TransferStats {
    sourceCount: number;
    targetCount: number;
    tier1Matches: number;
    tier2Matches: number;
    tier3Matches: number;
    unmatched: number;
    coveragePct: number;
}

type Step = 'upload' | 'processing' | 'review';

const TIER_STYLES = {
    tier1: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Tier 1 · Direct Match', icon: '✅' },
    tier2: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Tier 2 · Semantic Match', icon: '🟡' },
    tier3: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Tier 3 · AI Adaptation', icon: '🟠' },
    unmatched: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Tier 4 · Flagged', icon: '🔴' },
};

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export interface KnowledgeTransferProps {
    /** Callback to switch to the Review Queue tab (e.g. for editing/approving). */
    onNavigateToReviewQueue?: () => void;
}

export default function KnowledgeTransfer({ onNavigateToReviewQueue }: KnowledgeTransferProps) {
    // Step state
    const [step, setStep] = useState<Step>('upload');

    // Upload state
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDraggingSource, setIsDraggingSource] = useState(false);
    const [isDraggingTarget, setIsDraggingTarget] = useState(false);
    const sourceRef = useRef<HTMLInputElement>(null);
    const targetRef = useRef<HTMLInputElement>(null);

    // Results state
    const [stats, setStats] = useState<TransferStats | null>(null);
    const [answers, setAnswers] = useState<TransferredAnswer[]>([]);
    const [filterTier, setFilterTier] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editAnswer, setEditAnswer] = useState('');
    const [editYesNo, setEditYesNo] = useState('');
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [exporting, setExporting] = useState(false);

    // ── Handlers ──

    const handleFileDrop = useCallback((e: React.DragEvent, type: 'source' | 'target') => {
        e.preventDefault();
        if (type === 'source') setIsDraggingSource(false); else setIsDraggingTarget(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            if (type === 'source') setSourceFile(file); else setTargetFile(file);
            setError(null);
        } else {
            setError('Please upload .xlsx, .xls, or .csv files.');
        }
    }, []);

    const handleProcess = async () => {
        if (!sourceFile || !targetFile) return;
        setStep('processing');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('source', sourceFile);
            formData.append('target', targetFile);
            formData.append('action', 'process');

            const res = await fetch('/api/vendors/caiq/transfer', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Processing failed');

            setStats(data.stats);
            setAnswers(data.answers);
            setStep('review');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setStep('upload');
        }
    };

    const handleBulkApprove = () => {
        setAnswers(prev => prev.map(a =>
            a.tier === 'tier1' && a.confidence >= 80
                ? { ...a, reviewStatus: 'approved' }
                : a
        ));
    };

    const handleApprove = (idx: number) => {
        setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, reviewStatus: 'approved' } : a));
    };

    const handleStartEdit = (idx: number) => {
        setEditingIdx(idx);
        setEditAnswer(answers[idx].answer);
        setEditYesNo(answers[idx].yesNo);
    };

    const handleSaveEdit = () => {
        if (editingIdx === null) return;
        setAnswers(prev => prev.map((a, i) =>
            i === editingIdx
                ? { ...a, answer: editAnswer, yesNo: editYesNo, reviewStatus: 'edited', isAmbiguous: false }
                : a
        ));
        setEditingIdx(null);
        setEditAnswer('');
        setEditYesNo('');
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const formData = new FormData();
            formData.append('action', 'export');
            formData.append('answers', JSON.stringify(answers));
            if (targetFile) {
                formData.append('targetFile', targetFile);
            }

            const res = await fetch('/api/vendors/caiq/transfer', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Download
            const byteChars = atob(data.exportBase64);
            const byteArray = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CAIQ_Transfer_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    const handleReset = () => {
        setStep('upload');
        setSourceFile(null);
        setTargetFile(null);
        setStats(null);
        setAnswers([]);
        setError(null);
        setFilterTier('all');
        setFilterStatus('all');
    };

    // Filtered answers
    const filtered = answers.filter(a => {
        if (filterTier !== 'all' && a.tier !== filterTier) return false;
        if (filterStatus === 'needs-review' && a.reviewStatus !== 'pending' && a.reviewStatus !== 'flagged') return false;
        if (filterStatus === 'approved' && a.reviewStatus !== 'approved' && a.reviewStatus !== 'edited') return false;
        return true;
    });

    const approvedCount = answers.filter(a => a.reviewStatus === 'approved' || a.reviewStatus === 'edited').length;
    const pendingCount = answers.filter(a => a.reviewStatus === 'pending' || a.reviewStatus === 'flagged').length;

    // ── RENDER ──

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-blue-950/40 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                            <RefreshCw className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Knowledge Transfer Engine</h2>
                            <p className="text-sm text-zinc-400">
                                Source file = your organization’s real answers (Golden Source). Export writes back into the target file’s format.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-6 mt-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="text-emerald-400">✅</span>
                            <span>Tier 1: Same question ID → copy answer (0.95+)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="text-amber-400">🟡</span>
                            <span>Tier 2: Semantic match (0.80–0.95)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="text-orange-400">🟠</span>
                            <span>Tier 3: AI from source + org context (0.60–0.80)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="text-red-400">🔴</span>
                            <span>Tier 4: Flagged for manual (&lt;0.60)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ UPLOAD STEP ═══════ */}
            {step === 'upload' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Source Upload */}
                        <Card className="bg-card/30 border-zinc-800/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                                    Source File (Answered)
                                </CardTitle>
                                <p className="text-xs text-zinc-500">Upload the completed questionnaire to learn from</p>
                            </CardHeader>
                            <CardContent>
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDraggingSource(true); }}
                                    onDragLeave={() => setIsDraggingSource(false)}
                                    onDrop={e => handleFileDrop(e, 'source')}
                                    onClick={() => sourceRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDraggingSource ? 'border-emerald-400 bg-emerald-500/5 scale-[1.01]'
                                        : sourceFile ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-700/50 hover:border-zinc-600/60'
                                        }`}
                                >
                                    <input ref={sourceRef} type="file" accept=".xlsx,.xls,.csv"
                                        className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setSourceFile(f); }} />
                                    {sourceFile ? (
                                        <div className="space-y-2">
                                            <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-400" />
                                            <p className="text-sm font-medium text-emerald-400">{sourceFile.name}</p>
                                            <p className="text-xs text-zinc-500">{(sourceFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-10 w-10 mx-auto text-zinc-500" />
                                            <p className="text-sm text-zinc-400"><span className="text-emerald-400 font-medium">Click to upload</span> or drag & drop</p>
                                            <p className="text-xs text-zinc-600">Excel file with answered questions</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Target Upload */}
                        <Card className="bg-card/30 border-zinc-800/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                                    Target File (Empty)
                                </CardTitle>
                                <p className="text-xs text-zinc-500">Upload the new questionnaire to auto-fill</p>
                            </CardHeader>
                            <CardContent>
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDraggingTarget(true); }}
                                    onDragLeave={() => setIsDraggingTarget(false)}
                                    onDrop={e => handleFileDrop(e, 'target')}
                                    onClick={() => targetRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDraggingTarget ? 'border-cyan-400 bg-cyan-500/5 scale-[1.01]'
                                        : targetFile ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-zinc-700/50 hover:border-zinc-600/60'
                                        }`}
                                >
                                    <input ref={targetRef} type="file" accept=".xlsx,.xls,.csv"
                                        className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setTargetFile(f); }} />
                                    {targetFile ? (
                                        <div className="space-y-2">
                                            <FileSpreadsheet className="h-10 w-10 mx-auto text-cyan-400" />
                                            <p className="text-sm font-medium text-cyan-400">{targetFile.name}</p>
                                            <p className="text-xs text-zinc-500">{(targetFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-10 w-10 mx-auto text-zinc-500" />
                                            <p className="text-sm text-zinc-400"><span className="text-cyan-400 font-medium">Click to upload</span> or drag & drop</p>
                                            <p className="text-xs text-zinc-600">Empty/unanswered questionnaire</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Process Button */}
                    <div className="flex justify-center">
                        <Button
                            onClick={handleProcess}
                            disabled={!sourceFile || !targetFile}
                            size="lg"
                            className="gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-6 text-base"
                        >
                            <Sparkles className="h-5 w-5" />
                            Start Knowledge Transfer
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ PROCESSING STEP ═══════ */}
            {step === 'processing' && (
                <Card className="bg-card/30 border-cyan-500/20 backdrop-blur-sm">
                    <CardContent className="p-12 text-center space-y-4">
                        <Loader2 className="h-12 w-12 mx-auto text-cyan-400 animate-spin" />
                        <div>
                            <h3 className="text-lg font-semibold text-white">Processing Knowledge Transfer</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Running 4-tier matching: ID → semantic → AI → flag...
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 text-xs text-zinc-500">
                            <span>📄 Source: {sourceFile?.name}</span>
                            <span>→</span>
                            <span>📄 Target: {targetFile?.name}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════ REVIEW STEP ═══════ */}
            {step === 'review' && stats && (
                <div className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                        <Card className="bg-card/30 border-zinc-800/50">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-white">{stats.targetCount}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Questions</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-emerald-500/20">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-emerald-400">{stats.coveragePct}%</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Coverage</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-emerald-500/20">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-emerald-400">{stats.tier1Matches}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tier 1</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-amber-500/20">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-amber-400">{stats.tier2Matches}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tier 2</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-orange-500/20">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-orange-400">{stats.tier3Matches}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tier 3</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-blue-500/20">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-blue-400">{approvedCount}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Approved</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/30 border-amber-500/20">
                            <CardContent className="p-3 text-center">
                                <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pending</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                            <Select value={filterTier} onValueChange={setFilterTier}>
                                <SelectTrigger className="w-[150px] h-8 text-xs">
                                    <Filter className="h-3 w-3 mr-1" />
                                    <SelectValue placeholder="Filter Tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tiers</SelectItem>
                                    <SelectItem value="tier1">✅ Tier 1</SelectItem>
                                    <SelectItem value="tier2">🟡 Tier 2</SelectItem>
                                    <SelectItem value="tier3">🟠 Tier 3</SelectItem>
                                    <SelectItem value="unmatched">🔴 Tier 4 Flagged</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[150px] h-8 text-xs">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="needs-review">Needs Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 flex-wrap items-center">
                            {onNavigateToReviewQueue && (
                                <Button variant="outline" size="sm" className="gap-2 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                    onClick={onNavigateToReviewQueue}>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Review Queue
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleBulkApprove}>
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                Approve All High-Conf
                            </Button>
                            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-xs"
                                onClick={handleExport} disabled={exporting}>
                                {exporting
                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting...</>
                                    : <><Download className="h-3.5 w-3.5" /> Export Excel</>}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs text-zinc-400" onClick={handleReset}>
                                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                            </Button>
                        </div>
                    </div>

                    {/* Answers Review Table */}
                    <Card className="bg-card/20 border-zinc-800/50">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                                        <tr className="border-b border-border/40">
                                            <th className="text-left p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider w-[80px]">ID</th>
                                            <th className="text-left p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider w-[60px]">Tier</th>
                                            <th className="text-left p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Question</th>
                                            <th className="text-left p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider w-[50px]">Y/N</th>
                                            <th className="text-left p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Answer</th>
                                            <th className="text-left p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider w-[70px]">Conf.</th>
                                            <th className="text-right p-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider w-[120px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((a, idx) => {
                                            const style = TIER_STYLES[a.tier];
                                            const realIdx = answers.indexOf(a);
                                            const isEditing = editingIdx === realIdx;
                                            const isExpanded = expandedIdx === realIdx;

                                            return (
                                                <tr key={`${a.targetRowIndex}-${idx}`}
                                                    className={`border-b border-border/10 transition-colors group ${a.isAmbiguous ? style.bg : 'hover:bg-white/[0.02]'
                                                        } ${a.reviewStatus === 'approved' || a.reviewStatus === 'edited' ? 'opacity-75' : ''}`}
                                                >
                                                    <td className="p-3 text-xs font-mono text-zinc-400">{a.targetQuestionId}</td>
                                                    <td className="p-3">
                                                        <Badge className={`${style.bg} ${style.text} ${style.border} border text-[10px] px-1.5`}>
                                                            {style.icon}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <button onClick={() => setExpandedIdx(isExpanded ? null : realIdx)}
                                                            className="text-left text-xs text-zinc-300 hover:text-white transition-colors flex items-start gap-1">
                                                            {isExpanded ? <ChevronUp className="h-3 w-3 mt-0.5 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-40" />}
                                                            <span className={isExpanded ? '' : 'line-clamp-2'}>
                                                                {a.targetQuestionText}
                                                            </span>
                                                        </button>
                                                        {isExpanded && a.matchedSourceQuestion && (
                                                            <div className="mt-2 ml-4 p-2 rounded bg-zinc-800/40 border border-zinc-700/30 text-[10px] text-zinc-500">
                                                                <span className="text-zinc-400 font-medium">Matched source:</span> {a.matchedSourceQuestion}
                                                                {a.matchedSourceId && <span className="ml-1 text-zinc-600">({a.matchedSourceId})</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-xs font-medium text-zinc-300">
                                                        {isEditing ? (
                                                            <Select value={editYesNo} onValueChange={setEditYesNo}>
                                                                <SelectTrigger className="h-6 w-14 text-[10px]"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Yes">Yes</SelectItem>
                                                                    <SelectItem value="No">No</SelectItem>
                                                                    <SelectItem value="N/A">N/A</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : a.yesNo}
                                                    </td>
                                                    <td className="p-3">
                                                        {isEditing ? (
                                                            <Textarea value={editAnswer} onChange={e => setEditAnswer(e.target.value)}
                                                                className="text-xs min-h-[80px] bg-zinc-800/60" />
                                                        ) : (
                                                            <p className={`text-xs text-zinc-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                                {a.answer || <span className="text-red-400 italic">No answer</span>}
                                                            </p>
                                                        )}
                                                        {a.isAdapted && !isEditing && (
                                                            <Badge variant="outline" className="mt-1 text-[9px] text-amber-400 border-amber-500/30">
                                                                Adapted
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`text-xs font-mono ${a.confidence >= 80 ? 'text-emerald-400' : a.confidence >= 50 ? 'text-amber-400' : 'text-red-400'
                                                            }`}>
                                                            {a.confidence}%
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            {isEditing ? (
                                                                <>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-400" onClick={handleSaveEdit}>
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400" onClick={() => setEditingIdx(null)}>
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {a.reviewStatus !== 'approved' && a.reviewStatus !== 'edited' && (
                                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-400 opacity-0 group-hover:opacity-100"
                                                                            onClick={() => handleApprove(realIdx)} title="Approve">
                                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 opacity-0 group-hover:opacity-100"
                                                                        onClick={() => handleStartEdit(realIdx)} title="Edit">
                                                                        <Edit3 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {(a.reviewStatus === 'approved' || a.reviewStatus === 'edited') && !isEditing && (
                                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {filtered.length === 0 && (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>No answers match the current filters.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
