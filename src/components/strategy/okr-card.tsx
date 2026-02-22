"use client";

import { useState } from 'react';
import { OKR, useAstraStore } from '@/lib/store';
import { ChevronDown, ChevronRight, Plus, Trash2, Target } from 'lucide-react';

interface OKRCardProps {
    okr: OKR;
}

export function OKRCard({ okr }: OKRCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditingKR, setIsEditingKR] = useState<string | null>(null);
    const updateKeyResult = useAstraStore(state => state.updateKeyResult);
    const deleteOKR = useAstraStore(state => state.deleteOKR);
    const addKeyResult = useAstraStore(state => state.addKeyResult);

    const handleProgressUpdate = (krId: string, newCurrent: number, target: number) => {
        // Calculate percentage
        const progress = Math.min(100, Math.max(0, Math.round((newCurrent / target) * 100)));
        updateKeyResult(okr.id, krId, { current: newCurrent, progress });
        setIsEditingKR(null);
    };

    const handleAddKR = () => {
        const desc = prompt("Enter Key Result Description:");
        if (!desc) return;
        const targetStr = prompt("Enter Target Value:", "100");
        const unit = prompt("Enter Unit (e.g., %, users, ms):", "%");

        const target = parseFloat(targetStr || "100");

        if (desc && !isNaN(target)) {
            addKeyResult(okr.id, {
                description: desc,
                target,
                current: 0,
                progress: 0,
                unit: unit || ''
            });
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-start justify-between bg-zinc-900/50">
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-1 text-zinc-500 hover:text-white transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-white">{okr.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${okr.status === 'ON_TRACK' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                    okr.status === 'AT_RISK' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                        'border-red-500/30 text-red-400 bg-red-500/10'
                                }`}>
                                {okr.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-2xl">{okr.description}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">{okr.progress}%</span>
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Complete</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${okr.status === 'ON_TRACK' ? 'bg-emerald-500' :
                                    okr.status === 'AT_RISK' ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${okr.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Key Results */}
            {isExpanded && (
                <div className="border-t border-zinc-800 bg-black/20 p-4 space-y-3">
                    {okr.keyResults.map((kr) => (
                        <div key={kr.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors group">
                            <Target className="w-4 h-4 text-zinc-600 flex-shrink-0" />

                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-zinc-300 font-medium">{kr.description}</span>
                                    {isEditingKR === kr.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="number"
                                                defaultValue={kr.current}
                                                className="w-16 bg-black border border-zinc-700 rounded px-1 text-xs text-right focus:border-blue-500 outline-none"
                                                onBlur={(e) => handleProgressUpdate(kr.id, parseFloat(e.target.value), kr.target)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleProgressUpdate(kr.id, parseFloat(e.currentTarget.value), kr.target);
                                                    }
                                                }}
                                            />
                                            <span className="text-xs text-zinc-500">/ {kr.target} {kr.unit}</span>
                                        </div>
                                    ) : (
                                        <div
                                            className="flex items-center gap-2 cursor-pointer hover:text-white text-zinc-400"
                                            onClick={() => setIsEditingKR(kr.id)}
                                        >
                                            <span className="text-sm font-mono">{kr.current} / {kr.target} {kr.unit}</span>
                                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden ml-2">
                                                <div
                                                    className="h-full bg-blue-500/80 rounded-full"
                                                    style={{ width: `${kr.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-800/50">
                        <button
                            onClick={handleAddKR}
                            className="flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add Key Result
                        </button>

                        <button
                            onClick={() => confirm('Delete entire OKR?') && deleteOKR(okr.id)}
                            className="flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove OKR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
