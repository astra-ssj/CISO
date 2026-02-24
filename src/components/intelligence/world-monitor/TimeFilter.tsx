'use client';

import { cn } from '@/lib/utils';

export type TimeRange = '1h' | '6h' | '24h' | '48h' | '7d';

interface TimeFilterProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
    { value: '1h', label: '1H' },
    { value: '6h', label: '6H' },
    { value: '24h', label: '24H' },
    { value: '48h', label: '48H' },
    { value: '7d', label: '7D' },
];

export function TimeFilter({ value, onChange }: TimeFilterProps) {
    return (
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 border border-border/30">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider transition-all',
                        value === opt.value
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
