'use client';

import { cn } from '@/lib/utils';
import { Globe, Building2 } from 'lucide-react';

export type RegionPreset = 'global' | 'europe' | 'mena' | 'asia-pacific' | 'americas' | 'africa' | 'offices';

interface RegionPresetsProps {
    value: RegionPreset;
    onChange: (preset: RegionPreset) => void;
}

export const REGION_VIEWS: Record<RegionPreset, { lat: number; lng: number; zoom: number; label: string }> = {
    global: { lat: 20, lng: 0, zoom: 2.2, label: 'Global' },
    europe: { lat: 50, lng: 10, zoom: 4, label: 'Europe' },
    mena: { lat: 28, lng: 42, zoom: 3.5, label: 'MENA' },
    'asia-pacific': { lat: 20, lng: 105, zoom: 3, label: 'Asia-Pac' },
    americas: { lat: 20, lng: -80, zoom: 3, label: 'Americas' },
    africa: { lat: 5, lng: 20, zoom: 3, label: 'Africa' },
    offices: { lat: 48, lng: 12, zoom: 4, label: 'Offices' },
};

const REGION_OPTIONS: { value: RegionPreset; label: string; icon?: React.ReactNode }[] = [
    { value: 'global', label: 'Global', icon: <Globe className="h-3 w-3" /> },
    { value: 'europe', label: 'Europe' },
    { value: 'mena', label: 'MENA' },
    { value: 'asia-pacific', label: 'Asia-Pac' },
    { value: 'americas', label: 'Americas' },
    { value: 'africa', label: 'Africa' },
    { value: 'offices', label: 'Offices', icon: <Building2 className="h-3 w-3" /> },
];

export function RegionPresets({ value, onChange }: RegionPresetsProps) {
    return (
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 border border-border/30">
            {REGION_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                        value === opt.value
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                    )}
                >
                    {opt.icon}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
