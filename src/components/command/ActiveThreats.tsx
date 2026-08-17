'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Zap } from 'lucide-react';

const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';

interface ThreatItem {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    source: string;
    time: string;
    region?: string;
}

const SEVERITY_COLORS = {
    critical: '#f43f5e',
    high: '#fb923c',
    medium: '#fbbf24',
    low: '#22d3ee',
};

const SOURCE_COLORS: Record<string, string> = {
    ThreatFox: '#f59e0b',
    URLhaus: '#f97316',
    MalwareBazaar: '#ef4444',
};

export function ActiveThreats() {
    const [threats, setThreats] = useState<ThreatItem[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [feedError, setFeedError] = useState(false);

    const fetchThreats = useCallback(async () => {
        try {
            const res = await fetch('/api/intelligence/threats');
            if (!res.ok) throw new Error('API error');
            const data = await res.json();

            if (data?.data?.length > 0) {
                const liveThreats: ThreatItem[] = data.data.slice(0, 8).map((t: Record<string, unknown>, i: number) => ({
                    id: `live-${i}`,
                    title: String(t.title || 'Unknown threat'),
                    severity: (String(t.severity || 'MEDIUM').toLowerCase()) as ThreatItem['severity'],
                    source: String(t.source || 'Unknown'),
                    time: t.firstSeen ? formatTimeAgo(String(t.firstSeen)) : 'recent',
                    region: t.country ? String(t.country) : 'Global',
                }));
                setThreats(liveThreats);
                setIsLive(true);
                setFeedError(false);
            } else {
                setThreats([]);
                setIsLive(false);
                setFeedError(false);
            }
        } catch {
            setThreats([]);
            setIsLive(false);
            setFeedError(true);
        }
    }, []);

    useEffect(() => {
        fetchThreats();
        const interval = setInterval(fetchThreats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchThreats]);

    return (
        <div
            className="rounded-xl border flex flex-col h-full"
            style={{ background: CARD_BG, borderColor: CARD_BD }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: CARD_BD }}>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: isLive ? '#10b981' : '#64748b' }} />
                    <span
                        className="text-xs font-semibold uppercase tracking-wider text-white"
                        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                    >
                        Active Threats
                    </span>
                    {isLive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>LIVE</span>
                    )}
                    {!isLive && !feedError && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(30,41,59,0.6)', color: '#94a3b8' }}>EMPTY</span>
                    )}
                </div>
                <Link href="/intelligence" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            {feedError && (
                <div className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] text-amber-400" style={{ background: 'rgba(251,191,36,0.05)' }}>
                    <Zap className="h-3 w-3" />
                    Threat feeds unavailable — showing empty, not cached samples
                </div>
            )}
            <div className="flex-1 overflow-y-auto px-2 py-1" style={{ maxHeight: '300px' }}>
                {threats.length === 0 && !feedError && (
                    <p className="text-[11px] text-slate-500 px-2 py-6 text-center">No live IOCs. Abuse.ch returned empty or is unreachable.</p>
                )}
                {threats.map((t, i) => (
                    <div
                        key={t.id}
                        className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        style={{
                            animation: `slideInRight 0.3s ease ${i * 40}ms both`,
                        }}
                    >
                        <div className="mt-1.5 shrink-0">
                            <div className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS[t.severity] }} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 group-hover:text-white transition-colors" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>{t.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: `${SEVERITY_COLORS[t.severity]}15`, color: SEVERITY_COLORS[t.severity], fontFamily: 'var(--font-jetbrains), monospace' }}
                                >
                                    {t.severity.toUpperCase()}
                                </span>
                                <span
                                    className="text-[9px] font-medium px-1 py-0.5 rounded"
                                    style={{
                                        color: SOURCE_COLORS[t.source] || '#94a3b8',
                                        background: `${SOURCE_COLORS[t.source] || '#94a3b8'}10`,
                                    }}
                                >
                                    {t.source}
                                </span>
                                <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>{t.time}</span>
                                {t.region && (
                                    <span className="text-[9px] text-slate-600 flex items-center gap-0.5">
                                        <MapPin className="h-2 w-2" />{t.region}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(12px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

function formatTimeAgo(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const diff = Date.now() - d.getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    } catch {
        return 'recent';
    }
}
