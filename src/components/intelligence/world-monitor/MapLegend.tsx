'use client';

// import { } from '@/lib/utils';

interface LegendItem {
    color: string;
    label: string;
}

const SEVERITY_SCALE: LegendItem[] = [
    { color: '#94a3b8', label: 'Info' },
    { color: '#22c55e', label: 'Low' },
    { color: '#eab308', label: 'Medium' },
    { color: '#f97316', label: 'High' },
    { color: '#ef4444', label: 'Critical' },
];

const LAYER_COLORS: LegendItem[] = [
    { color: '#ef4444', label: 'Conflicts / APT' },
    { color: '#f97316', label: 'Military / Bases' },
    { color: '#06b6d4', label: 'Cables / Infra' },
    { color: '#8b5cf6', label: 'Datacenters' },
    { color: '#eab308', label: 'Nuclear' },
    { color: '#a3e635', label: 'Environmental' },
    { color: '#22c55e', label: 'Office Locations' },
];

export function MapLegend() {
    return (
        <div className="bg-slate-950/90 backdrop-blur-sm border border-border/30 rounded-lg p-3 text-[10px] space-y-2.5 min-w-[160px]">
            <div>
                <div className="font-semibold text-slate-300 mb-1.5">Severity</div>
                <div className="flex items-center gap-0.5">
                    {SEVERITY_SCALE.map((item) => (
                        <div key={item.label} className="flex flex-col items-center gap-0.5 flex-1">
                            <div className="w-full h-1.5 rounded-sm" style={{ backgroundColor: item.color }} />
                            <span className="text-[8px] text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t border-border/20 pt-2">
                <div className="font-semibold text-slate-300 mb-1.5">Layers</div>
                <div className="space-y-1">
                    {LAYER_COLORS.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
