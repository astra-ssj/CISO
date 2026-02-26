'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

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
    high: '#f97316',
    medium: '#fbbf24',
    low: '#22d3ee',
};

export function ActiveThreats() {
    const [threats, setThreats] = useState<ThreatItem[]>(SAMPLE_THREATS);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        // Try to fetch real threat data
        fetch('/api/intelligence/threatfox')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.data?.length > 0) {
                    const liveThreats: ThreatItem[] = data.data.slice(0, 8).map((ioc: Record<string, unknown>, i: number) => ({
                        id: `live-${i}`,
                        title: `${ioc.malware || 'Unknown'}: ${ioc.threatType || 'IOC'} — ${String(ioc.value || '').substring(0, 40)}`,
                        severity: Number(ioc.confidence || 0) >= 75 ? 'critical' : Number(ioc.confidence || 0) >= 50 ? 'high' : 'medium',
                        source: 'ThreatFox',
                        time: ioc.firstSeen ? formatTimeAgo(String(ioc.firstSeen)) : 'recent',
                        region: 'Global',
                    }));
                    setThreats(liveThreats);
                    setIsLive(true);
                }
            })
            .catch(() => { /* keep sample data */ });
    }, []);

    return (
        <div
            className="rounded-xl border flex flex-col h-full"
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(56, 189, 248, 0.08)',
            }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(56, 189, 248, 0.08)' }}>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">Active Threats</span>
                    {!isLive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-medium">Sample Data</span>
                    )}
                </div>
                <Link href="/intelligence" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
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
                            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 group-hover:text-white transition-colors">{t.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${SEVERITY_COLORS[t.severity]}15`, color: SEVERITY_COLORS[t.severity] }}>
                                    {t.severity.toUpperCase()}
                                </span>
                                <span className="text-[9px] text-slate-500">{t.source}</span>
                                <span className="text-[9px] text-slate-600">{t.time}</span>
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
