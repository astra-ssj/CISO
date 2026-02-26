'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Zap } from 'lucide-react';

/* ── Design tokens ─────────────────────────────────── */
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

const SAMPLE_THREATS: ThreatItem[] = [
    { id: 't1', title: 'APT29 phishing campaign targeting EU institutions', severity: 'critical', source: 'ThreatFox', time: '2h ago', region: 'EU' },
    { id: 't2', title: 'LockBit 3.0 ransomware surge in healthcare sector', severity: 'critical', source: 'MalwareBazaar', time: '4h ago', region: 'Global' },
    { id: 't3', title: 'DDoS advisory for financial services — Killnet', severity: 'high', source: 'GDELT', time: '6h ago', region: 'EU/US' },
    { id: 't4', title: 'New Qakbot variant detected in email campaigns', severity: 'high', source: 'URLhaus', time: '8h ago', region: 'APAC' },
    { id: 't5', title: 'RedLine Stealer distribution via fake software updates', severity: 'medium', source: 'ThreatFox', time: '12h ago', region: 'Global' },
    { id: 't6', title: 'Emotet resurgence with updated C2 infrastructure', severity: 'high', source: 'MalwareBazaar', time: '14h ago', region: 'EU' },
    { id: 't7', title: 'Cobalt Strike beacon detected on infrastructure scan', severity: 'medium', source: 'OTX', time: '18h ago', region: 'APAC' },
    { id: 't8', title: 'SolarWinds-style supply chain advisory active', severity: 'medium', source: 'GDELT', time: '1d ago', region: 'US' },
];

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
    const [threats, setThreats] = useState<ThreatItem[]>(SAMPLE_THREATS);
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
            }
        } catch {
            // Keep existing data (sample or previously loaded live data)
            if (!isLive) setFeedError(true);
        }
    }, [isLive]);

    useEffect(() => {
        fetchThreats();
        // Auto-refresh every 5 minutes
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
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span
                        className="text-xs font-semibold uppercase tracking-wider text-white"
                        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                    >
                        Active Threats
                    </span>
                    {!isLive && !feedError && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(30,41,59,0.6)', color: '#94a3b8' }}>Sample Data</span>
                    )}
                    {isLive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>LIVE</span>
                    )}
                </div>
                <Link href="/intelligence" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            {feedError && !isLive && (
                <div className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] text-amber-400" style={{ background: 'rgba(251,191,36,0.05)' }}>
                    <Zap className="h-3 w-3" />
                    Threat feeds temporarily unavailable — showing cached data
                </div>
            )}
            <div className="flex-1 overflow-y-auto px-2 py-1" style={{ maxHeight: '300px' }}>
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
