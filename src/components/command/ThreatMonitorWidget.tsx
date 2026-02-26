'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import officeLocations from '@/data/intelligence/office-locations.json';

// ── CII scores per office country ────────────────────────────
const CII_SCORES: Record<string, number> = {
    DE: 8, GB: 10, TH: 25, AU: 8, NZ: 5, ES: 12, AT: 7, US: 15,
};

function CIIScoreRow() {
    const flagEmoji: Record<string, string> = {
        DE: '🇩🇪', GB: '🇬🇧', TH: '🇹🇭', AU: '🇦🇺', NZ: '🇳🇿', ES: '🇪🇸', AT: '🇦🇹', US: '🇺🇸',
    };

    return (
        <div className="flex flex-wrap gap-1.5 px-3 py-2">
            {officeLocations.map((o) => {
                const score = CII_SCORES[o.country] ?? 0;
                const color = score >= 60 ? '#f43f5e' : score >= 30 ? '#fbbf24' : '#22d3ee';
                return (
                    <div
                        key={o.id}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                        style={{ background: `${color}10`, color }}
                    >
                        <span>{flagEmoji[o.country] || ''}</span>
                        <span>{o.country}</span>
                        <span>:</span>
                        <span>{score}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Dynamic mini map to avoid Leaflet SSR issues ─────────────
const MiniLeafletMap = dynamic(() => import('./MiniLeafletMap'), { ssr: false });

export function ThreatMonitorWidget() {
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMapReady(true), 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className="rounded-xl border overflow-hidden flex flex-col"
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(56, 189, 248, 0.08)',
            }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(56, 189, 248, 0.08)' }}>
                <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">Global Threat Monitor</span>
                </div>
                <Link href="/intelligence" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View Full Monitor <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div style={{ height: '320px', position: 'relative', background: '#0a0e17' }}>
                {mapReady ? (
                    <MiniLeafletMap />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500" />
                            <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest">Loading map...</span>
                        </div>
                    </div>
                )}
            </div>
            {/* CII Score Row */}
            <div className="border-t" style={{ borderColor: 'rgba(56, 189, 248, 0.06)' }}>
                <div className="flex items-center justify-between px-3 pt-2 pb-0">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">CII Scores by Office</span>
                </div>
                <CIIScoreRow />
            </div>
        </div>
    );
}
