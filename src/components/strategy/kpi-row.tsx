"use client";

import { useState } from 'react';
import { KPI, useAstraStore } from '@/lib/store';
import { ArrowUp, ArrowDown, Minus, Edit2, Check, X } from 'lucide-react';

interface KPIRowProps {
    kpi: KPI;
}

export function KPIRow({ kpi }: KPIRowProps) {
    const updateKPI = useAstraStore(state => state.updateKPI);
    const deleteKPI = useAstraStore(state => state.deleteKPI);

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(kpi.value.toString());
    const [editTarget, setEditTarget] = useState(kpi.target.toString());

    const handleSave = () => {
        const val = parseFloat(editValue);
        const tgt = parseFloat(editTarget);

        if (isNaN(val) || isNaN(tgt)) return;

        // Auto-calculate trend and status simple logic
        const trend = val > kpi.value ? 'up' : val < kpi.value ? 'down' : 'neutral';
        // Simple heuristic: if value >= target, success. This logic might need to be inverted for some KPIs (like "incidents")
        // forcing a manual status update or sophisticated logic would be better, but for now:
        const status = val >= tgt ? 'success' : val >= tgt * 0.8 ? 'warning' : 'danger';

        updateKPI(kpi.id, {
            value: val,
            target: tgt,
            trend,
            status
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this KPI?')) {
            deleteKPI(kpi.id);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${kpi.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        kpi.status === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                    }`}>
                    {kpi.trend === 'up' ? <ArrowUp className="w-4 h-4" /> :
                        kpi.trend === 'down' ? <ArrowDown className="w-4 h-4" /> :
                            <Minus className="w-4 h-4" />}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-zinc-100">{kpi.title}</h3>
                    <p className="text-xs text-zinc-500">Target: {kpi.target} {kpi.unit}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 bg-black border border-zinc-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-zinc-600">/</span>
                        <input
                            type="number"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                            className="w-20 bg-black border border-zinc-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={handleSave} className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-red-500/20 text-red-500 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-zinc-100">
                            {kpi.value} <span className="text-sm font-normal text-zinc-500">{kpi.unit}</span>
                        </div>
                    </div>
                )}

                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                        <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={handleDelete} className="p-2 hover:bg-red-900/20 rounded-md text-zinc-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
