"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, Database, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscoveryNode {
    id: string;
    label: string;
    type: 'business' | 'app' | 'infra' | 'risk';
    x: number;
    y: number;
    value?: string;
    status?: 'healthy' | 'warning' | 'critical';
}

interface IngestionPanelProps {
    onDiscoveryComplete: (newNodes: DiscoveryNode[]) => void;
}

export function DataIngestionPanel({ onDiscoveryComplete }: IngestionPanelProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'complete'>('idle');
    const [progress, setProgress] = useState(0);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        startSimulation();
    };

    const startSimulation = async () => {
        setStatus('scanning');

        // Phase 1: Upload & Scan
        for (let i = 0; i <= 100; i += 10) {
            setProgress(i);
            await new Promise(r => setTimeout(r, 200));
        }

        setStatus('processing');

        // Phase 2: NLP Extraction
        await new Promise(r => setTimeout(r, 1500));

        setStatus('complete');
        onDiscoveryComplete([
            { id: 'app-5', label: 'Legacy Billing', type: 'app', x: 60, y: 30, status: 'warning' },
            { id: 'inf-3', label: 'On-Prem Svr 12', type: 'infra', x: 65, y: 80, status: 'healthy' }
        ]);

        setTimeout(() => {
            setStatus('idle');
            setProgress(0);
        }, 3000);
    };

    return (
        <div className="absolute top-6 right-6 z-20 w-80 bg-black/90 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-zinc-900/50">
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Unstructured Data Ingest</span>
            </div>

            {/* Drop Zone */}
            <div className="p-4">
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={status === 'idle' ? startSimulation : undefined}
                    className={cn(
                        "relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group",
                        isDragOver ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700",
                        status !== 'idle' && "pointer-events-none"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                                    <Upload className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <div className="text-xs font-bold text-zinc-300">Drop Architecture Docs</div>
                                    <div className="text-[10px] text-zinc-500 mt-1">PDF, Visio, Confluence Exports</div>
                                </div>
                            </motion.div>
                        )}

                        {(status === 'scanning' || status === 'processing') && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="w-full flex flex-col items-center gap-3"
                            >
                                <div className="relative w-10 h-10">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-800" />
                                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-emerald-500 transition-all duration-200"
                                            strokeDasharray={113}
                                            strokeDashoffset={113 - (113 * progress) / 100}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-zinc-300 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs font-bold text-emerald-400">
                                        {status === 'scanning' ? 'Scanning Document...' : 'Extracting Topology...'}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                                        {status === 'scanning' ? `Read ${progress}%` : 'LLM Inference: GPT-4o'}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {status === 'complete' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <div className="text-xs font-bold text-white">Ingestion Complete</div>
                                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center justify-center gap-1">
                                        <Network className="w-3 h-3" />
                                        2 New Nodes Mapped
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
