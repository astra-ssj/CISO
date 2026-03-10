'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Download, Loader2,
    Check, XCircle, Edit3, BarChart3, Sparkles, Shield, Brain,
    RefreshCw, CheckCircle, AlertTriangle, Filter, Database, PlusCircle,
} from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface CAIQResult {
    totalQuestions: number;
    answeredByA2A: number;
    answeredBySemantic: number;
    answeredByContext: number;
    unanswered: number;
    coveragePct: number;
    questions: AnsweredQuestion[];
    domainBreakdown: Record<string, { total: number; answered: number; pct: number }>;
}

interface AnsweredQuestion {
    rowIndex: number;
    questionId?: string;
    questionText: string;
    answer: string;
    yesNo: 'Yes' | 'No' | 'N/A' | '';
    confidence: 'high' | 'medium' | 'low';
    source: 'a2a' | 'semantic' | 'context' | 'manual';
    evidenceRef: string;
    addedToRepo?: boolean;
}

interface SourceEntry {
    rowIndex: number;
    questionId?: string;
    questionText: string;
    answerText: string;
    yesNo: 'Yes' | 'No' | 'N/A' | '';
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const CERTIFICATIONS = [
    { id: 'soc2', label: 'SOC 2 Type II' },
    { id: 'iso27001', label: 'ISO 27001' },
    { id: 'nis2', label: 'NIS 2' },
    { id: 'euai', label: 'EU AI Act' },
    { id: 'gdpr', label: 'GDPR' },
    { id: 'hipaa', label: 'HIPAA' },
    { id: 'pci', label: 'PCI DSS' },
];

const SOURCE_BADGES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    a2a: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'A2A', icon: '🎯' },
    semantic: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'SEM', icon: '🔗' },
    context: { bg: 'bg-violet-500/15', text: 'text-violet-400', label: 'CTX', icon: '🧠' },
    manual: { bg: 'bg-zinc-700/30', text: 'text-zinc-500', label: 'Manual', icon: '✍️' },
};

const CONFIDENCE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'High' },
    medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Medium' },
    low: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Low' },
};

const STEPS = [
    { num: 1, label: 'Upload & Configure' },
    { num: 2, label: 'Parse & Match' },
    { num: 3, label: 'AI Enhancement' },
    { num: 4, label: 'Review & Export' },
];

// ════════════════════════════════════════════
// CAIQWizard Component
// ════════════════════════════════════════════

export default function CAIQWizard() {
    // Wizard step
    const [step, setStep] = useState<Step>(1);

    // Step 1: Upload & Configure
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [isDraggingSource, setIsDraggingSource] = useState(false);
    const [isDraggingTarget, setIsDraggingTarget] = useState(false);
    const sourceInputRef = useRef<HTMLInputElement>(null);
    const targetInputRef = useRef<HTMLInputElement>(null);

    const [selectedCerts, setSelectedCerts] = useState<string[]>(['soc2', 'iso27001']);
    const [orgProfile, setOrgProfile] = useState({
        industry: 'Technology',
        orgSize: 'Mid-size',
        cloudProvider: 'AWS',
        additionalContext: '',
    });

    // Step 2: Parse results
    const [result, setResult] = useState<CAIQResult | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [sourceEntries, setSourceEntries] = useState<SourceEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 3: AI Enhancement
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [enhancing, setEnhancing] = useState(false);
    const [enhanceStage, setEnhanceStage] = useState<'semantic' | 'context' | 'done'>('semantic');
    const [enhanceProgress, setEnhanceProgress] = useState({ processed: 0, total: 0, message: '' });

    // Step 4: Review
    const [filterSource, setFilterSource] = useState<string>('all');
    const [filterConf, setFilterConf] = useState<string>('all');
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editAnswer, setEditAnswer] = useState('');
    const [exporting, setExporting] = useState(false);
    const [addingToRepo, setAddingToRepo] = useState<number | null>(null);
    const [addingAll, setAddingAll] = useState(false);

    // ── File Handlers ──

    const handleSourceDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingSource(false);
        const file = e.dataTransfer.files[0];
        if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
            setSourceFile(file);
            setError(null);
        }
    }, []);

    const handleTargetDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTarget(false);
        const file = e.dataTransfer.files[0];
        if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
            setTargetFile(file);
            setError(null);
        }
    }, []);

    const toggleCert = (certId: string) => {
        setSelectedCerts(prev =>
            prev.includes(certId)
                ? prev.filter(c => c !== certId)
                : [...prev, certId]
        );
    };

    // ── Step 2: Parse & Match ──

    const handleParse = async () => {
        if (!targetFile) return;
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('target', targetFile);
            if (sourceFile) {
                formData.append('source', sourceFile);
            }

            const res = await fetch('/api/caiq/parse', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Parse failed');

            setResult(data.result);
            if (data.sourceStats) {
                // Store source entries — will be needed for AI stages
                // Reparse the source file client-side to get entries
                // Actually they come from the server in the response's result
            }
            setStep(2);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Failed to parse files');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: AI Enhancement (SSE) ──

    const handleEnhance = async () => {
        if (!result) return;
        setEnhancing(true);
        setEnhanceStage('semantic');
        setEnhanceProgress({ processed: 0, total: 0, message: 'Starting AI enhancement...' });
        setStep(3);
        setError(null);

        try {
            // Build the certifications list from selected checkboxes
            const certLabels = selectedCerts.map(id => CERTIFICATIONS.find(c => c.id === id)?.label || id);
            const profile = {
                ...orgProfile,
                certifications: certLabels,
            };

            // We need to send source entries for AI stages
            // Parse source file again to get entries (or we could have stored them from step 2)
            let srcEntries: SourceEntry[] = [];
            if (sourceFile) {
                const sourceFormData = new FormData();
                sourceFormData.append('target', sourceFile); // Reuse the parse endpoint
                // Actually let's just send what we have
                // The enhance route needs the source entries
                // For now, send the source file data via the parse endpoint first
                const srcRes = await fetch('/api/caiq/parse', {
                    method: 'POST',
                    body: (() => {
                        const fd = new FormData();
                        fd.append('target', sourceFile);
                        return fd;
                    })(),
                });
                if (srcRes.ok) {
                    const srcData = await srcRes.json();
                    // Convert the parsed questions to source entries
                    srcEntries = srcData.result.questions.map((q: Record<string, unknown>) => ({
                        rowIndex: q.rowIndex as number,
                        questionId: q.questionId as string | undefined,
                        questionText: q.questionText as string,
                        answerText: (q.answer as string) || (q.originalAnswer as string) || '',
                        yesNo: (q.yesNo as 'Yes' | 'No' | 'N/A' | '') || '',
                    }));
                }
            }

            setSourceEntries(srcEntries);

            const res = await fetch('/api/caiq/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: result.questions,
                    sourceEntries: srcEntries,
                    profile,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Enhancement failed');
            }

            // Process SSE stream
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let eventType = '';
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ') && eventType) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (eventType === 'stage') {
                                setEnhanceStage(data.stage);
                                setEnhanceProgress({ processed: 0, total: data.total, message: data.message });
                            } else if (eventType === 'progress') {
                                setEnhanceProgress({
                                    processed: data.processed,
                                    total: data.total,
                                    message: data.message,
                                });
                            } else if (eventType === 'stage_complete') {
                                setEnhanceProgress(prev => ({ ...prev, message: data.message }));
                            } else if (eventType === 'complete') {
                                // Update result with enhanced questions
                                setResult(prev => prev ? {
                                    ...prev,
                                    questions: data.questions,
                                    answeredByA2A: data.stats.a2a,
                                    answeredBySemantic: data.stats.semantic,
                                    answeredByContext: data.stats.context,
                                    unanswered: data.stats.manual,
                                    coveragePct: Math.round(
                                        ((data.stats.a2a + data.stats.semantic + data.stats.context) / prev.totalQuestions) * 100
                                    ),
                                } : null);
                                setEnhanceStage('done');
                                setStep(4);
                            } else if (eventType === 'error') {
                                throw new Error(data.message);
                            }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (parseErr) {
                            // Ignore parse errors in SSE
                        }
                        eventType = '';
                    }
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'AI enhancement failed');
            setStep(2); // Go back
        } finally {
            setEnhancing(false);
        }
    };

    // ── Step 4: Review Actions ──

    const handleSaveEdit = (rowIndex: number) => {
        if (!result) return;
        const updated = result.questions.map(q =>
            q.rowIndex === rowIndex
                ? { ...q, answer: editAnswer, source: 'manual' as const, confidence: 'high' as const }
                : q
        );
        setResult({ ...result, questions: updated });
        setEditingRow(null);
        setEditAnswer('');
    };

    const handleExport = async () => {
        if (!result) return;
        setExporting(true);
        try {
            const res = await fetch('/api/caiq/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result }),
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CAIQ_Completed_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setExporting(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSourceFile(null);
        setTargetFile(null);
        setResult(null);
        setSourceEntries([]);
        setError(null);
        setEnhancing(false);
        setEnhanceStage('semantic');
    };

    const handleAddToRepo = async (q: AnsweredQuestion) => {
        if (!q.answer || q.answer.length < 5) return;
        setAddingToRepo(q.rowIndex);
        try {
            const res = await fetch('/api/knowledge/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: [q],
                    source: `CAIQ Wizard (Row ${q.rowIndex})`,
                }),
            });
            if (!res.ok) throw new Error('Failed to add to repository');

            setResult(prev => prev ? {
                ...prev,
                questions: prev.questions.map(reqQ =>
                    reqQ.rowIndex === q.rowIndex ? { ...reqQ, addedToRepo: true } : reqQ
                )
            } : null);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Failed to add to repository');
        } finally {
            setAddingToRepo(null);
        }
    };

    const handleAddAllManual = async () => {
        if (!result) return;
        const toAdd = result.questions.filter(q => q.source === 'manual' && q.answer && q.answer.length >= 5 && !q.addedToRepo);
        if (toAdd.length === 0) return;

        setAddingAll(true);
        try {
            const res = await fetch('/api/knowledge/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: toAdd,
                    source: `CAIQ Wizard (${targetFile?.name || 'Bulk'})`,
                }),
            });
            if (!res.ok) throw new Error('Failed to bulk add to repository');

            setResult(prev => prev ? {
                ...prev,
                questions: prev.questions.map(reqQ =>
                    (reqQ.source === 'manual' && reqQ.answer && reqQ.answer.length >= 5) ? { ...reqQ, addedToRepo: true } : reqQ
                )
            } : null);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Failed to bulk add to repository');
        } finally {
            setAddingAll(false);
        }
    };

    // Filter for review step
    const filteredQuestions = result?.questions.filter(q => {
        if (filterSource !== 'all' && q.source !== filterSource) return false;
        if (filterConf !== 'all' && q.confidence !== filterConf) return false;
        return true;
    }) || [];

    // ════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between px-2">
                {STEPS.map((s, i) => (
                    <div key={s.num} className="flex items-center flex-1">
                        <div className={`flex items-center gap-2 ${step >= s.num ? 'text-violet-400' : 'text-zinc-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step > s.num ? 'bg-violet-500 border-violet-500 text-white' :
                                step === s.num ? 'border-violet-500 text-violet-400' :
                                    'border-zinc-700 text-zinc-600'
                                }`}>
                                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                            </div>
                            <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-3 rounded transition-all ${step > s.num ? 'bg-violet-500' : 'bg-zinc-800'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ════════════════════════════════════ */}
            {/* STEP 1: Upload & Configure          */}
            {/* ════════════════════════════════════ */}
            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: File Upload */}
                    <Card className="border-zinc-800/50 bg-zinc-900/40">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-violet-400" />
                                Upload Files
                            </CardTitle>
                            <p className="text-xs text-zinc-500">Upload your source answers and the target questionnaire</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* SOURCE File */}
                            <div>
                                <Label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 block">
                                    📥 Source File (Your Answered Q&A)
                                </Label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDraggingSource(true); }}
                                    onDragLeave={() => setIsDraggingSource(false)}
                                    onDrop={handleSourceDrop}
                                    onClick={() => sourceInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${isDraggingSource ? 'border-emerald-400 bg-emerald-500/5' :
                                        sourceFile ? 'border-emerald-500/30 bg-emerald-500/5' :
                                            'border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    <input
                                        ref={sourceInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) { setSourceFile(f); setError(null); }
                                        }}
                                    />
                                    {sourceFile ? (
                                        <div className="flex items-center gap-2 justify-center">
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            <span className="text-sm text-emerald-300">{sourceFile.name}</span>
                                            <span className="text-xs text-zinc-500">({(sourceFile.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 mx-auto text-zinc-500 mb-1" />
                                            <p className="text-xs text-zinc-500">
                                                <span className="text-emerald-400 hover:underline">Click</span> or drag your answered questionnaire
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* TARGET File */}
                            <div>
                                <Label className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2 block">
                                    📤 Target File (Empty Questionnaire)
                                </Label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDraggingTarget(true); }}
                                    onDragLeave={() => setIsDraggingTarget(false)}
                                    onDrop={handleTargetDrop}
                                    onClick={() => targetInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${isDraggingTarget ? 'border-violet-400 bg-violet-500/5' :
                                        targetFile ? 'border-violet-500/30 bg-violet-500/5' :
                                            'border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    <input
                                        ref={targetInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) { setTargetFile(f); setError(null); }
                                        }}
                                    />
                                    {targetFile ? (
                                        <div className="flex items-center gap-2 justify-center">
                                            <CheckCircle className="h-4 w-4 text-violet-400" />
                                            <span className="text-sm text-violet-300">{targetFile.name}</span>
                                            <span className="text-xs text-zinc-500">({(targetFile.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 mx-auto text-zinc-500 mb-1" />
                                            <p className="text-xs text-zinc-500">
                                                <span className="text-violet-400 hover:underline">Click</span> or drag the empty questionnaire
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Organization Profile */}
                    <Card className="border-zinc-800/50 bg-zinc-900/40">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Shield className="h-5 w-5 text-amber-400" />
                                Organization Profile
                            </CardTitle>
                            <p className="text-xs text-zinc-500">Tailor AI answers to your organization</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Certifications — Multi-select checkboxes */}
                            <div>
                                <Label className="text-xs font-medium uppercase text-zinc-400 mb-2 block">Certifications</Label>
                                <div className="flex flex-wrap gap-2">
                                    {CERTIFICATIONS.map(cert => (
                                        <button
                                            key={cert.id}
                                            onClick={() => toggleCert(cert.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedCerts.includes(cert.id)
                                                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                                                }`}
                                        >
                                            {selectedCerts.includes(cert.id) && <span className="mr-1">✓</span>}
                                            {cert.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-medium uppercase text-zinc-400">Industry</Label>
                                    <Select value={orgProfile.industry} onValueChange={v => setOrgProfile(p => ({ ...p, industry: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['Technology', 'Finance', 'Healthcare', 'Government', 'Manufacturing', 'Retail', 'Education'].map(i => (
                                                <SelectItem key={i} value={i}>{i}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium uppercase text-zinc-400">Org Size</Label>
                                    <Select value={orgProfile.orgSize} onValueChange={v => setOrgProfile(p => ({ ...p, orgSize: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['Small (<500)', 'Mid-size', 'Enterprise (5000+)'].map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-medium uppercase text-zinc-400">Cloud Provider</Label>
                                <Select value={orgProfile.cloudProvider} onValueChange={v => setOrgProfile(p => ({ ...p, cloudProvider: v }))}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['AWS', 'Azure', 'GCP', 'Multi-cloud', 'On-Premise'].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-medium uppercase text-zinc-400">Additional Context</Label>
                                <Textarea
                                    value={orgProfile.additionalContext}
                                    onChange={e => setOrgProfile(p => ({ ...p, additionalContext: e.target.value }))}
                                    placeholder="Any specific policies, frameworks, or context..."
                                    className="mt-1 min-h-[60px] text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parse Button */}
                    <div className="lg:col-span-2">
                        <Button
                            onClick={handleParse}
                            disabled={!targetFile || loading}
                            className="w-full gap-2 bg-violet-600 hover:bg-violet-500 text-white py-5"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Parsing files...</>
                            ) : (
                                <><Sparkles className="h-4 w-4" /> Parse & Match (Tier 1) <ArrowRight className="h-4 w-4" /></>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════ */}
            {/* STEP 2: Parse & Match Results       */}
            {/* ════════════════════════════════════ */}
            {step === 2 && result && (
                <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <StatCard label="Total Questions" value={result.totalQuestions} icon={<BarChart3 className="h-4 w-4" />} color="zinc" />
                        <StatCard label="A-to-A Matched" value={result.answeredByA2A} icon={<span>🎯</span>} color="emerald" />
                        <StatCard label="Unmatched" value={result.unanswered} icon={<AlertTriangle className="h-4 w-4" />} color="amber" />
                        <StatCard label="Coverage" value={`${result.coveragePct}%`} icon={<Shield className="h-4 w-4" />} color="violet" />
                        <StatCard label="Need AI" value={result.unanswered} icon={<Brain className="h-4 w-4" />} color="blue" />
                    </div>

                    {/* Domain Breakdown */}
                    {Object.keys(result.domainBreakdown).length > 0 && (
                        <Card className="border-zinc-800/50 bg-zinc-900/40">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Domain Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.entries(result.domainBreakdown).map(([domain, data]) => (
                                        <div key={domain} className="bg-zinc-800/30 rounded-lg p-2">
                                            <div className="text-xs text-zinc-400 font-medium truncate">{domain}</div>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-sm font-bold text-zinc-200">{data.answered}/{data.total}</span>
                                                <span className="text-xs text-zinc-500">{data.pct}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-zinc-800 rounded-full mt-1">
                                                <div className="h-1 bg-violet-500 rounded-full transition-all" style={{ width: `${data.pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        {result.unanswered > 0 ? (
                            <Button onClick={handleEnhance} className="flex-1 gap-2 bg-violet-600 hover:bg-violet-500">
                                <Brain className="h-4 w-4" /> Enhance with AI (Tiers 2 & 3) <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={() => setStep(4)} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500">
                                <Check className="h-4 w-4" /> All matched — Review & Export <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════ */}
            {/* STEP 3: AI Enhancement              */}
            {/* ════════════════════════════════════ */}
            {step === 3 && (
                <Card className="border-zinc-800/50 bg-zinc-900/40">
                    <CardContent className="py-8">
                        <div className="max-w-md mx-auto text-center space-y-6">
                            <div className="inline-flex p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                                <Brain className="h-10 w-10 text-violet-400 animate-pulse" />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-zinc-200">AI Enhancement in Progress</h3>
                                <p className="text-sm text-zinc-500 mt-1">{enhanceProgress.message}</p>
                            </div>

                            {/* Stage indicators */}
                            <div className="space-y-3 text-left">
                                <StageIndicator
                                    label="Tier 2: Semantic Matching"
                                    icon="🔗"
                                    status={enhanceStage === 'semantic' ? 'active' : enhanceStage === 'context' || enhanceStage === 'done' ? 'complete' : 'pending'}
                                    progress={enhanceStage === 'semantic' && enhanceProgress.total > 0 ? Math.round((enhanceProgress.processed / enhanceProgress.total) * 100) : undefined}
                                />
                                <StageIndicator
                                    label="Tier 3: Context Synthesis"
                                    icon="🧠"
                                    status={enhanceStage === 'context' ? 'active' : enhanceStage === 'done' ? 'complete' : 'pending'}
                                    progress={enhanceStage === 'context' && enhanceProgress.total > 0 ? Math.round((enhanceProgress.processed / enhanceProgress.total) * 100) : undefined}
                                />
                            </div>

                            {enhanceStage === 'done' && (
                                <Button onClick={() => setStep(4)} className="gap-2 bg-emerald-600 hover:bg-emerald-500">
                                    <Check className="h-4 w-4" /> Continue to Review <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ════════════════════════════════════ */}
            {/* STEP 4: Review & Export              */}
            {/* ════════════════════════════════════ */}
            {step === 4 && result && (
                <div className="space-y-4">
                    {/* Summary bar */}
                    <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-400">
                                <strong className="text-zinc-200">{result.totalQuestions}</strong> questions
                            </span>
                            <div className="flex gap-2">
                                {(['a2a', 'semantic', 'context', 'manual'] as const).map(src => {
                                    const count = result.questions.filter(q => q.source === src).length;
                                    if (count === 0) return null;
                                    const badge = SOURCE_BADGES[src];
                                    return (
                                        <span key={src} className={`text-xs px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                                            {badge.icon} {badge.label}: {count}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${result.coveragePct >= 80 ? 'text-emerald-400' : result.coveragePct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                {result.coveragePct}%
                            </span>
                            <span className="text-xs text-zinc-500">coverage</span>
                        </div>
                    </div>

                    {/* Filters + Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-zinc-500" />
                            <Select value={filterSource} onValueChange={setFilterSource}>
                                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="a2a">🎯 A2A</SelectItem>
                                    <SelectItem value="semantic">🔗 Semantic</SelectItem>
                                    <SelectItem value="context">🧠 Context</SelectItem>
                                    <SelectItem value="manual">✍️ Manual</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterConf} onValueChange={setFilterConf}>
                                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Confidence" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Confidence</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1" />
                        {result.questions.some(q => q.source === 'manual' && q.answer && q.answer.length >= 5 && !q.addedToRepo) && (
                            <Button onClick={handleAddAllManual} disabled={addingAll} size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500">
                                {addingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                                Add Manual to Repo
                            </Button>
                        )}
                        <Button onClick={handleExport} disabled={exporting} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500">
                            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            Export Excel
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-zinc-500 hover:bg-zinc-800">
                            <RefreshCw className="h-3 w-3" /> Reset
                        </Button>
                    </div>

                    {/* Results Table */}
                    <Card className="border-zinc-800/50 bg-zinc-900/40">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                                        <tr className="border-b border-border/40">
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase w-[40px]">#</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Question</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase w-[60px]">Y/N</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Answer</th>
                                            <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase w-[80px]">Tier</th>
                                            <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase w-[80px]">Conf.</th>
                                            <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase w-[90px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredQuestions.map((q, idx) => (
                                            <tr key={q.rowIndex} className="border-b border-border/10 hover:bg-white/[0.02] transition-colors">
                                                <td className="p-3 text-xs text-zinc-600 font-mono">{idx + 1}</td>
                                                <td className="p-3 text-xs text-zinc-300 max-w-[250px]">
                                                    <p className="line-clamp-2">{q.questionText}</p>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`text-xs font-mono font-bold ${q.yesNo === 'Yes' ? 'text-emerald-400' :
                                                        q.yesNo === 'No' ? 'text-red-400' :
                                                            q.yesNo === 'N/A' ? 'text-zinc-500' : 'text-zinc-700'
                                                        }`}>{q.yesNo || '—'}</span>
                                                </td>
                                                <td className="p-3 max-w-[350px]">
                                                    {editingRow === q.rowIndex ? (
                                                        <div className="flex gap-2">
                                                            <Textarea
                                                                value={editAnswer}
                                                                onChange={e => setEditAnswer(e.target.value)}
                                                                className="text-xs min-h-[60px]"
                                                                autoFocus
                                                            />
                                                            <div className="flex flex-col gap-1">
                                                                <Button size="sm" className="h-7 px-2" onClick={() => handleSaveEdit(q.rowIndex)}>
                                                                    <Check className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingRow(null)}>
                                                                    <XCircle className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className={`text-xs line-clamp-3 ${q.answer ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
                                                            {q.answer || 'No answer — requires manual input'}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded ${SOURCE_BADGES[q.source]?.bg} ${SOURCE_BADGES[q.source]?.text}`}>
                                                        {SOURCE_BADGES[q.source]?.icon} {SOURCE_BADGES[q.source]?.label}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {q.answer && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_BADGES[q.confidence]?.bg} ${CONFIDENCE_BADGES[q.confidence]?.text}`}>
                                                            {CONFIDENCE_BADGES[q.confidence]?.label}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 hover:bg-violet-500/10"
                                                            onClick={() => { setEditingRow(q.rowIndex); setEditAnswer(q.answer || ''); }}
                                                            title="Edit Answer"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5 text-zinc-500 cursor-pointer" />
                                                        </Button>
                                                        {q.source === 'manual' && q.answer && q.answer.length >= 5 && !q.addedToRepo && (
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                className="h-7 w-7 p-0 hover:bg-emerald-500/10"
                                                                onClick={() => handleAddToRepo(q)}
                                                                disabled={addingToRepo === q.rowIndex}
                                                                title="Add to Knowledge Base"
                                                            >
                                                                {addingToRepo === q.rowIndex ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                                                                ) : (
                                                                    <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                                )}
                                                            </Button>
                                                        )}
                                                        {q.addedToRepo && (
                                                            <span title="Added to Knowledge Base">
                                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500/50" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredQuestions.length === 0 && (
                                <div className="p-8 text-center text-zinc-500 text-sm">
                                    No questions match the selected filters.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    const colorClasses: Record<string, string> = {
        zinc: 'text-zinc-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        violet: 'text-violet-400',
        blue: 'text-blue-400',
    };

    return (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-3">
            <div className={`flex items-center gap-1.5 mb-1 ${colorClasses[color] || 'text-zinc-400'}`}>
                {icon}
                <span className="text-xs font-medium text-zinc-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-zinc-200">{value}</p>
        </div>
    );
}

function StageIndicator({ label, icon, status, progress }: {
    label: string;
    icon: string;
    status: 'pending' | 'active' | 'complete';
    progress?: number;
}) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${status === 'active' ? 'border-violet-500/30 bg-violet-500/5' :
            status === 'complete' ? 'border-emerald-500/20 bg-emerald-500/5' :
                'border-zinc-800 bg-zinc-900/30'
            }`}>
            <span className="text-lg">{icon}</span>
            <div className="flex-1">
                <p className={`text-sm font-medium ${status === 'active' ? 'text-violet-300' :
                    status === 'complete' ? 'text-emerald-300' :
                        'text-zinc-500'
                    }`}>{label}</p>
                {status === 'active' && progress !== undefined && (
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1.5">
                        <div className="h-1.5 bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
            {status === 'complete' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
            {status === 'active' && <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />}
        </div>
    );
}
