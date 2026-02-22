"use client";

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Upload, FileText, Loader2, CheckCircle2, AlertTriangle,
    Trash2, Check, X, FileUp, Sparkles
} from 'lucide-react';
import type { ExtractedKPI } from '@/lib/kpi-engine/kpi-extractor';
import { useUploadedKPIStore, UploadedKPI } from '@/lib/kpi-engine/uploaded-kpi-store';

const CATEGORY_COLORS: Record<string, string> = {
    RISK: 'bg-red-500/10 text-red-400 border-red-500/20',
    COMPLIANCE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    INCIDENT: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    VULNERABILITY: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    VENDOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    PEOPLE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    BUDGET: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    POSTURE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

interface Props {
    onClose: () => void;
}

type UploadState = 'idle' | 'uploading' | 'reviewing' | 'done' | 'error';

export function KPIUploader({ onClose }: Props) {
    const [state, setState] = useState<UploadState>('idle');
    const [fileName, setFileName] = useState('');
    const [extractedKPIs, setExtractedKPIs] = useState<ExtractedKPI[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [errorMsg, setErrorMsg] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addKPIs } = useUploadedKPIStore();

    const handleFile = useCallback(async (file: File) => {
        setFileName(file.name);
        setState('uploading');
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/kpi-upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || 'Upload failed');
                setState('error');
                return;
            }

            if (data.kpis.length === 0) {
                setErrorMsg('No KPI metrics found in this document. Try a file with numeric security metrics.');
                setState('error');
                return;
            }

            setExtractedKPIs(data.kpis);
            setSelectedIds(new Set(data.kpis.map((k: ExtractedKPI) => k.id)));
            setState('reviewing');
        } catch {
            setErrorMsg('Network error — could not upload file.');
            setState('error');
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const toggleKPI = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const importSelected = () => {
        const selected = extractedKPIs.filter(k => selectedIds.has(k.id));
        const now = new Date().toISOString();
        const toImport: UploadedKPI[] = selected.map(k => ({
            id: k.id,
            name: k.name,
            value: k.value,
            unit: k.unit,
            target: k.target || 0,
            category: k.category,
            health: k.health || 'AMBER',
            trend: k.trend || 'STABLE',
            sourceFile: fileName,
            uploadedAt: now,
        }));
        addKPIs(toImport);
        setState('done');
    };

    return (
        <Card className="border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileUp className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Import KPIs from File</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* ─── IDLE: Drop Zone ─── */}
                {state === 'idle' && (
                    <div
                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
                            ${isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-primary/20 hover:border-primary/40'}`}
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg mb-1">
                            {isDragOver ? 'Drop file here' : 'Drag & drop your file'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            PowerPoint (.pptx) or Word (.docx) — board decks, quarterly reports, etc.
                        </p>
                        <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" /> Browse Files
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pptx,.docx"
                            className="hidden"
                            onChange={onFileChange}
                        />
                    </div>
                )}

                {/* ─── UPLOADING ─── */}
                {state === 'uploading' && (
                    <div className="text-center py-10 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                        <div>
                            <h3 className="font-semibold text-lg">Analyzing {fileName}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Extracting text and scanning for KPI metrics...</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                            Pattern matching across 20+ security metric keywords
                        </div>
                    </div>
                )}

                {/* ─── REVIEW ─── */}
                {state === 'reviewing' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    {extractedKPIs.length} KPIs found in {fileName}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedIds.size} selected for import. Click rows to toggle.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                                    Deselect All
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set(extractedKPIs.map(k => k.id)))}>
                                    Select All
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                            {extractedKPIs.map(kpi => {
                                const isSelected = selectedIds.has(kpi.id);
                                const catColor = CATEGORY_COLORS[kpi.category] || '';
                                return (
                                    <div
                                        key={kpi.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected
                                                ? 'border-primary/40 bg-primary/5'
                                                : 'border-border/30 bg-card/30 opacity-60'
                                            }`}
                                        onClick={() => toggleKPI(kpi.id)}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                                            ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{kpi.name}</span>
                                                <Badge variant="outline" className={`text-[9px] py-0 ${catColor}`}>{kpi.category}</Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground truncate">{kpi.sourceText}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-bold">
                                                {kpi.unit === '$' ? `$${(kpi.value / 1_000_000).toFixed(1)}M` : kpi.value}
                                                {kpi.unit !== '$' && <span className="text-xs text-muted-foreground ml-1">{kpi.unit}</span>}
                                            </div>
                                            {kpi.target && (
                                                <span className="text-[10px] text-muted-foreground">Target: {kpi.target}{kpi.unit !== '$' ? kpi.unit : ''}</span>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            <Badge variant="outline" className={`text-[9px] py-0 ${kpi.confidence >= 70 ? 'bg-emerald-500/10 text-emerald-400' : kpi.confidence >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {kpi.confidence}%
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                            <Button onClick={() => { setState('idle'); setExtractedKPIs([]); }} variant="outline">
                                <Trash2 className="h-4 w-4 mr-2" /> Discard
                            </Button>
                            <Button onClick={importSelected} disabled={selectedIds.size === 0} className="flex-1">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Import {selectedIds.size} KPI{selectedIds.size !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ─── DONE ─── */}
                {state === 'done' && (
                    <div className="text-center py-10 space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                        <div>
                            <h3 className="font-semibold text-lg text-emerald-400">
                                {selectedIds.size} KPIs Imported Successfully
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                From {fileName} — visible on the KPI dashboard with 📎 badge.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => { setState('idle'); setExtractedKPIs([]); setSelectedIds(new Set()); }}>
                                Upload Another
                            </Button>
                            <Button onClick={onClose}>Done</Button>
                        </div>
                    </div>
                )}

                {/* ─── ERROR ─── */}
                {state === 'error' && (
                    <div className="text-center py-10 space-y-4">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                        <div>
                            <h3 className="font-semibold text-lg text-amber-400">Extraction Issue</h3>
                            <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
                        </div>
                        <Button variant="outline" onClick={() => setState('idle')}>
                            Try Another File
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
