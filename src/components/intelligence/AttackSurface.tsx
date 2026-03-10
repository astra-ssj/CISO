'use client';

/**
 * AttackSurface — Intelligence → Attack Surface tab.
 * Monitors organization assets via Shodan API for exposed services,
 * vulnerabilities, SSL issues, and geo mismatches.
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Shield, Scan, AlertTriangle, Lock, Globe, Server, Plus, X, Loader2,
     
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Download, ShieldAlert, ExternalLink, ChevronDown,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface ExposedService {
    service: string;
    port: number;
    host: string;
    risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
}

interface SSLIssue {
    host: string;
    issue: string;
    severity: 'HIGH' | 'MEDIUM';
}

interface AssetMinimal {
    ip: string;
    hostnames: string[];
    org: string;
    country: string;
    ports: number[];
    vulns: string[];
    lastUpdate: string;
}

interface ScanReport {
    scanDate: string;
    totalAssets: number;
    totalServices: number;
    totalVulnerabilities: number;
    criticalVulns: string[];
    highVulns: string[];
    exposedServices: ExposedService[];
    sslIssues: SSLIssue[];
    geoMismatches: { ip: string; expectedCountry: string; actualCountry: string; hostname: string }[];
    assets: AssetMinimal[];
    riskScore: number;
}

// ── Design tokens ──────────────────────────────────────────────

const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';

const RISK_COLORS: Record<string, string> = {
    CRITICAL: '#f43f5e',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
};

const RISK_BG: Record<string, string> = {
    CRITICAL: 'rgba(244,63,94,0.08)',
    HIGH: 'rgba(249,115,22,0.08)',
    MEDIUM: 'rgba(234,179,8,0.08)',
    LOW: 'rgba(34,197,94,0.08)',
};

// ── Subtab type ────────────────────────────────────────────────
type FindingTab = 'all' | 'critical' | 'exposed' | 'ssl' | 'geo';

// ── Component ──────────────────────────────────────────────────

export function AttackSurface() {
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [ips, setIPs] = useState<string[]>([]);
    const [domains, setDomains] = useState<string[]>([]);
    const [ipInput, setIpInput] = useState('');
    const [domainInput, setDomainInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [report, setReport] = useState<ScanReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FindingTab>('all');
    const [credits, setCredits] = useState<number | null>(null);

    // Check configuration on mount
    const checkConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/intelligence/shodan/health');
            const data = await res.json();
            setConfigured(data.connected || false);
            if (data.credits) setCredits(data.credits);
        } catch {
            setConfigured(false);
        }
    }, []);

    // Run on first render
    useEffect(() => { checkConfig(); }, [checkConfig]);

    const addIP = () => {
        const v = ipInput.trim();
        if (v && !ips.includes(v)) { setIPs([...ips, v]); setIpInput(''); }
    };
    const addDomain = () => {
        const v = domainInput.trim();
        if (v && !domains.includes(v)) { setDomains([...domains, v]); setDomainInput(''); }
    };
    const removeIP = (ip: string) => setIPs(ips.filter((i) => i !== ip));
    const removeDomain = (d: string) => setDomains(domains.filter((dm) => dm !== d));

    const runScan = async () => {
        setScanning(true);
        setError(null);
        try {
            const res = await fetch('/api/intelligence/shodan/attack-surface', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ips, domains }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error || 'Scan failed');
                if (json.configured === false) setConfigured(false);
            } else {
                setReport(json.data);
            }
        } catch (err) {
            setError('Network error during scan');
            console.error(err);
        } finally {
            setScanning(false);
        }
    };

    // ── Not configured state ──────────────────────────────────
    if (configured === false) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-full bg-cyan-500/10 mb-4">
                    <Shield className="h-10 w-10 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Attack Surface Monitoring</h3>
                <p className="text-sm text-slate-400 max-w-md mb-4">
                    Configure your Shodan API key in <strong>Settings → Integrations</strong> to enable
                    attack surface monitoring. Get a free key at{' '}
                    <a href="https://account.shodan.io" target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline">
                        account.shodan.io
                    </a>
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings?tab=integrations'}>
                    Go to Settings
                </Button>
            </div>
        );
    }

    // ── Build filtered findings ───────────────────────────────
    const getFilteredAssets = (): AssetMinimal[] => {
        if (!report) return [];
        switch (activeTab) {
            case 'critical':
                return report.assets.filter((a) => a.vulns.length > 0);
            case 'exposed':
                return report.assets.filter((a) =>
                    a.ports.some((p) => [3389, 23, 21, 445, 1433, 3306, 5432, 27017, 6379, 9200].includes(p)),
                );
            default:
                return report.assets;
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 80) return RISK_COLORS.CRITICAL;
        if (score >= 60) return RISK_COLORS.HIGH;
        if (score >= 30) return RISK_COLORS.MEDIUM;
        return RISK_COLORS.LOW;
    };

    return (
        <div className="space-y-5">
            {/* ── Config Panel ────────────────────────────────── */}
            <div
                className="rounded-xl border p-5"
                style={{ background: CARD_BG, borderColor: CARD_BD }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Scan className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-white uppercase tracking-wider"
                            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            Monitored Assets
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        {credits !== null && (
                            <span style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
                                Credits: <span className="text-cyan-400">{credits}</span>
                            </span>
                        )}
                        {report && (
                            <span>
                                Last Scan: {new Date(report.scanDate).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* IP Ranges */}
                <div className="mb-3">
                    <label className="text-xs text-slate-400 mb-1.5 block">IP Addresses / CIDR Ranges</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. 203.0.113.0/24"
                            value={ipInput}
                            onChange={(e) => setIpInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addIP()}
                            className="flex-1 bg-white/[0.03] border-white/[0.06] text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={addIP} className="gap-1">
                            <Plus className="h-3 w-3" /> Add
                        </Button>
                    </div>
                    {ips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {ips.map((ip) => (
                                <span key={ip} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                    {ip}
                                    <button onClick={() => removeIP(ip)} className="hover:text-white"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Domains */}
                <div className="mb-4">
                    <label className="text-xs text-slate-400 mb-1.5 block">Domains</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. astralabs.com"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                            className="flex-1 bg-white/[0.03] border-white/[0.06] text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={addDomain} className="gap-1">
                            <Plus className="h-3 w-3" /> Add
                        </Button>
                    </div>
                    {domains.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {domains.map((d) => (
                                <span key={d} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                    {d}
                                    <button onClick={() => removeDomain(d)} className="hover:text-white"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={runScan}
                        disabled={scanning || (ips.length === 0 && domains.length === 0)}
                        className="gap-2"
                        style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.3)' }}
                    >
                        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                        {scanning ? 'Scanning...' : 'Run Scan'}
                    </Button>
                    {report && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = `attack-surface-${new Date().toISOString().slice(0, 10)}.json`;
                            a.click(); URL.revokeObjectURL(url);
                        }}>
                            <Download className="h-3.5 w-3.5" /> Export Report
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                )}
            </div>

            {/* ── Results ─────────────────────────────────────── */}
            {report && (
                <>
                    {/* Risk Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Assets', value: report.totalAssets, icon: Server, color: '#22d3ee' },
                            { label: 'Exposed Services', value: report.totalServices, icon: Globe, color: '#f97316', sub: report.exposedServices.length > 0 ? `⚠ ${report.exposedServices.length} risky` : undefined },
                            { label: 'Vulnerabilities', value: report.totalVulnerabilities, icon: ShieldAlert, color: '#f43f5e' },
                            { label: 'SSL Issues', value: report.sslIssues.length, icon: Lock, color: '#eab308' },
                        ].map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="border" style={{ background: CARD_BG, borderColor: CARD_BD }}>
                                    <CardContent className="pt-4 pb-3 px-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500"
                                                style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>{card.label}</span>
                                            <Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
                                        </div>
                                        <div className="text-2xl font-bold" style={{ color: card.color, fontFamily: 'var(--font-jetbrains), monospace' }}>
                                            {card.value}
                                        </div>
                                        {card.sub && <div className="text-[10px] text-amber-400 mt-0.5">{card.sub}</div>}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Risk Score Bar */}
                    <div className="rounded-xl border p-4 flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BD }}>
                        <div className="text-center">
                            <div className="text-3xl font-bold" style={{ color: getRiskColor(report.riskScore), fontFamily: 'var(--font-jetbrains), monospace' }}>
                                {report.riskScore}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Score</div>
                        </div>
                        <div className="flex-1">
                            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${report.riskScore}%`, background: getRiskColor(report.riskScore) }}
                                />
                            </div>
                        </div>
                        <div className="text-xs text-slate-400" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                            {report.riskScore >= 80 ? 'CRITICAL' : report.riskScore >= 60 ? 'HIGH' : report.riskScore >= 30 ? 'MEDIUM' : 'LOW'}
                        </div>
                    </div>

                    {/* Findings Table */}
                    <div className="rounded-xl border overflow-hidden" style={{ background: CARD_BG, borderColor: CARD_BD }}>
                        {/* Sub-tabs */}
                        <div className="flex border-b px-2 gap-1 py-1" style={{ borderColor: CARD_BD }}>
                            {([
                                { id: 'all', label: 'All' },
                                { id: 'critical', label: `Critical (${report.assets.filter((a) => a.vulns.length > 0).length})` },
                                { id: 'exposed', label: `Exposed Services (${report.exposedServices.length})` },
                                { id: 'ssl', label: `SSL Issues (${report.sslIssues.length})` },
                                { id: 'geo', label: `Geo Mismatches (${report.geoMismatches.length})` },
                            ] as { id: FindingTab; label: string }[]).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="px-3 py-1.5 text-xs rounded-md transition-colors"
                                    style={{
                                        background: activeTab === tab.id ? 'rgba(6,182,212,0.1)' : 'transparent',
                                        color: activeTab === tab.id ? '#22d3ee' : '#94a3b8',
                                        fontFamily: 'var(--font-dm-sans), sans-serif',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {activeTab === 'ssl' ? (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b" style={{ borderColor: CARD_BD }}>
                                            <th className="px-4 py-2">Host</th>
                                            <th className="px-4 py-2">Issue</th>
                                            <th className="px-4 py-2">Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.sslIssues.length === 0 ? (
                                            <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No SSL issues found</td></tr>
                                        ) : report.sslIssues.map((issue, i) => (
                                            <tr key={i} className="border-b hover:bg-white/[0.01]" style={{ borderColor: CARD_BD }}>
                                                <td className="px-4 py-2.5 text-slate-300 font-mono">{issue.host}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{issue.issue}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                        style={{ background: RISK_BG[issue.severity], color: RISK_COLORS[issue.severity] }}>
                                                        {issue.severity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : activeTab === 'exposed' ? (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b" style={{ borderColor: CARD_BD }}>
                                            <th className="px-4 py-2">Host</th>
                                            <th className="px-4 py-2">Port</th>
                                            <th className="px-4 py-2">Service</th>
                                            <th className="px-4 py-2">Risk</th>
                                            <th className="px-4 py-2">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.exposedServices.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No dangerous exposed services found</td></tr>
                                        ) : report.exposedServices.map((svc, i) => (
                                            <tr key={i} className="border-b hover:bg-white/[0.01]"
                                                style={{ borderColor: CARD_BD, background: svc.risk === 'CRITICAL' ? 'rgba(244,63,94,0.03)' : svc.risk === 'HIGH' ? 'rgba(249,115,22,0.03)' : undefined }}>
                                                <td className="px-4 py-2.5 text-slate-300 font-mono">{svc.host}</td>
                                                <td className="px-4 py-2.5 font-mono text-cyan-300">{svc.port}</td>
                                                <td className="px-4 py-2.5 text-slate-300">{svc.service}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                        style={{ background: RISK_BG[svc.risk], color: RISK_COLORS[svc.risk] }}>
                                                        {svc.risk}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-400">{svc.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : activeTab === 'geo' ? (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b" style={{ borderColor: CARD_BD }}>
                                            <th className="px-4 py-2">IP</th>
                                            <th className="px-4 py-2">Hostname</th>
                                            <th className="px-4 py-2">Expected</th>
                                            <th className="px-4 py-2">Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.geoMismatches.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No geo mismatches found</td></tr>
                                        ) : report.geoMismatches.map((g, i) => (
                                            <tr key={i} className="border-b hover:bg-white/[0.01]" style={{ borderColor: CARD_BD, background: 'rgba(234,179,8,0.03)' }}>
                                                <td className="px-4 py-2.5 text-slate-300 font-mono">{g.ip}</td>
                                                <td className="px-4 py-2.5 text-slate-300">{g.hostname}</td>
                                                <td className="px-4 py-2.5 text-emerald-400">{g.expectedCountry}</td>
                                                <td className="px-4 py-2.5 text-amber-400">{g.actualCountry}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                /* all / critical tabs — asset table */
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b" style={{ borderColor: CARD_BD }}>
                                            <th className="px-4 py-2">IP</th>
                                            <th className="px-4 py-2">Hostname</th>
                                            <th className="px-4 py-2">Org</th>
                                            <th className="px-4 py-2">Country</th>
                                            <th className="px-4 py-2">Ports</th>
                                            <th className="px-4 py-2">CVEs</th>
                                            <th className="px-4 py-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredAssets().length === 0 ? (
                                            <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                {scanning ? 'Scanning...' : 'No results. Run a scan to see findings.'}
                                            </td></tr>
                                        ) : getFilteredAssets().map((asset) => {
                                            const hasDanger = asset.ports.some((p) => [3389, 23, 21, 445, 1433, 3306, 5432, 27017, 6379, 9200].includes(p));
                                            const hasVulns = asset.vulns.length > 0;
                                            return (
                                                <tr key={asset.ip}
                                                    className="border-b hover:bg-white/[0.01] transition-colors"
                                                    style={{
                                                        borderColor: CARD_BD,
                                                        background: hasVulns ? 'rgba(244,63,94,0.03)' : hasDanger ? 'rgba(249,115,22,0.03)' : undefined,
                                                    }}>
                                                    <td className="px-4 py-2.5 text-slate-300 font-mono">{asset.ip}</td>
                                                    <td className="px-4 py-2.5 text-slate-300">{asset.hostnames[0] || '—'}</td>
                                                    <td className="px-4 py-2.5 text-slate-400">{asset.org || '—'}</td>
                                                    <td className="px-4 py-2.5 text-slate-400">{asset.country}</td>
                                                    <td className="px-4 py-2.5 font-mono text-cyan-300">{asset.ports.length}</td>
                                                    <td className="px-4 py-2.5">
                                                        {hasVulns ? (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                                style={{ background: RISK_BG.CRITICAL, color: RISK_COLORS.CRITICAL }}>
                                                                {asset.vulns.length}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-500">✓</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/[0.05] text-cyan-400 transition-colors"
                                                                onClick={() => {
                                                                    const params = new URLSearchParams({
                                                                        title: `[SHODAN] Exposed asset: ${asset.ip}`,
                                                                        severity: hasVulns ? 'P1' : 'P3',
                                                                    });
                                                                    window.open(`/incidents/war-room?action=create&${params.toString()}`, '_blank');
                                                                }}
                                                            >Incident</button>
                                                            <button
                                                                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/[0.05] text-amber-400 transition-colors"
                                                                onClick={() => {
                                                                    const params = new URLSearchParams({
                                                                        title: `Attack surface finding: ${asset.ip}`,
                                                                        description: `${asset.vulns.length} CVEs, ${asset.ports.length} open ports`,
                                                                        severity: hasVulns ? 'high' : 'medium',
                                                                    });
                                                                    window.open(`/governance?tab=risk&action=create&${params.toString()}`, '_blank');
                                                                }}
                                                            >Risk</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Empty state (no scan yet) ────────────────────── */}
            {!report && !scanning && configured !== null && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-3 rounded-full bg-cyan-500/10 mb-3">
                        <Shield className="h-8 w-8 text-cyan-400/50" />
                    </div>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Add your IP ranges and domains above, then click <strong className="text-slate-300">Run Scan</strong> to
                        discover your external attack surface via Shodan.
                    </p>
                </div>
            )}

            {/* ── Shodan Maps ─────────────────────────────────── */}
            {configured !== null && (
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: CARD_BG, borderColor: CARD_BD }}
                >
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm font-semibold text-white uppercase tracking-wider"
                                style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                                Shodan Maps
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { label: 'Our Assets', query: `org:${domains[0] || 'AstraLabs'}` },
                                { label: 'Our SSL Certs', query: `ssl:${domains[0] || 'astralabs.com'}` },
                                { label: 'Exposed RDP', query: `port:3389+org:${domains[0] || 'AstraLabs'}` },
                                { label: 'Exposed DBs', query: `port:3306,5432,27017+org:${domains[0] || 'AstraLabs'}` },
                            ].map((btn) => (
                                <a
                                    key={btn.label}
                                    href={`https://maps.shodan.io/#search/${encodeURIComponent(btn.query)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] px-2 py-1 rounded-md font-medium transition-colors
                                        bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/15"
                                >
                                    {btn.label} ↗
                                </a>
                            ))}
                        </div>
                    </div>
                    <a
                        href={`https://maps.shodan.io/#search/${encodeURIComponent(`org:${domains[0] || 'AstraLabs'}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mx-4 mb-4 rounded-lg overflow-hidden group cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(6,95,130,0.12) 100%)', border: '1px solid rgba(6,182,212,0.15)' }}
                    >
                        <div className="flex items-center justify-center gap-3 py-12">
                            <Globe className="h-10 w-10 text-cyan-400/40 group-hover:text-cyan-400/70 transition-colors" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
                                    Open Shodan Maps ↗
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Interactive map of org:{domains[0] || 'AstraLabs'}
                                </p>
                            </div>
                        </div>
                    </a>
                </div>
            )}
        </div>
    );
}
