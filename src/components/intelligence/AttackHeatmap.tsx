'use client';

/**
 * AttackHeatmap — MITRE ATT&CK matrix visualization.
 * Color intensity = active campaign usage. Pure CSS grid, no external libs.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BrainCircuit, ExternalLink, X, RefreshCw } from 'lucide-react';

interface HeatmapTechnique {
    id: string;
    name: string;
    count: number;
    tactic?: string;
}

// MITRE ATT&CK Enterprise Tactics in order
const TACTICS = [
    'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
    'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
    'Discovery', 'Lateral Movement', 'Collection', 'Command and Control',
    'Exfiltration', 'Impact',
];

// Static technique stubs per tactic (used when no OpenCTI data)
const STATIC_TECHNIQUES: Record<string, Array<{ id: string; name: string }>> = {
    'Reconnaissance': [{ id: 'T1595', name: 'Active Scanning' }, { id: 'T1592', name: 'Gather Victim Host Info' }, { id: 'T1589', name: 'Gather Victim Identity' }],
    'Resource Development': [{ id: 'T1583', name: 'Acquire Infrastructure' }, { id: 'T1588', name: 'Obtain Capabilities' }],
    'Initial Access': [{ id: 'T1566', name: 'Phishing' }, { id: 'T1190', name: 'Exploit Public-Facing App' }, { id: 'T1078', name: 'Valid Accounts' }, { id: 'T1199', name: 'Trusted Relationship' }],
    'Execution': [{ id: 'T1059', name: 'Command & Scripting' }, { id: 'T1204', name: 'User Execution' }, { id: 'T1203', name: 'Exploitation for Exec' }],
    'Persistence': [{ id: 'T1547', name: 'Boot Autostart' }, { id: 'T1053', name: 'Scheduled Task' }, { id: 'T1136', name: 'Create Account' }],
    'Privilege Escalation': [{ id: 'T1548', name: 'Abuse Elevation' }, { id: 'T1068', name: 'Exploitation for Priv Esc' }],
    'Defense Evasion': [{ id: 'T1070', name: 'Indicator Removal' }, { id: 'T1036', name: 'Masquerading' }, { id: 'T1027', name: 'Obfuscated Files' }, { id: 'T1562', name: 'Impair Defenses' }],
    'Credential Access': [{ id: 'T1110', name: 'Brute Force' }, { id: 'T1003', name: 'OS Credential Dumping' }, { id: 'T1555', name: 'Creds from Password Stores' }],
    'Discovery': [{ id: 'T1087', name: 'Account Discovery' }, { id: 'T1082', name: 'System Info Discovery' }, { id: 'T1046', name: 'Network Service Scan' }],
    'Lateral Movement': [{ id: 'T1021', name: 'Remote Services' }, { id: 'T1080', name: 'Taint Shared Content' }],
    'Collection': [{ id: 'T1114', name: 'Email Collection' }, { id: 'T1005', name: 'Data from Local System' }],
    'Command and Control': [{ id: 'T1071', name: 'Application Layer Protocol' }, { id: 'T1573', name: 'Encrypted Channel' }, { id: 'T1105', name: 'Ingress Tool Transfer' }],
    'Exfiltration': [{ id: 'T1041', name: 'Exfil Over C2' }, { id: 'T1567', name: 'Exfil Over Web Service' }],
    'Impact': [{ id: 'T1486', name: 'Data Encrypted for Impact' }, { id: 'T1489', name: 'Service Stop' }, { id: 'T1529', name: 'System Shutdown' }],
};

function heatColor(count: number): string {
    if (count === 0) return 'bg-muted/20 hover:bg-muted/30 text-muted-foreground';
    if (count <= 2) return 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30';
    if (count <= 5) return 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30';
}

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/40 rounded ${className}`} />;
}

export function AttackHeatmap() {
    const [techniques, setTechniques] = useState<HeatmapTechnique[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);
    const [selectedTechnique, setSelectedTechnique] = useState<HeatmapTechnique | null>(null);

    const fetchHeatmap = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/intelligence/attack-heatmap');
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            setTechniques(json.techniques);
            setConnected(true);
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHeatmap(); }, [fetchHeatmap]);

    // Build a lookup: techniqueId/name → count
    const countMap = useMemo(() => {
        const m = new Map<string, number>();
        for (const t of techniques) {
            m.set(t.id, t.count);
            m.set(t.name?.toLowerCase(), t.count);
        }
        return m;
    }, [techniques]);

    const getCount = (techId: string, techName: string) => {
        return countMap.get(techId) ?? countMap.get(techName.toLowerCase()) ?? 0;
    };

    if (!connected && !loading) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <BrainCircuit className="h-10 w-10 text-muted-foreground/30" />
                    <div>
                        <h3 className="text-lg font-semibold">Connect OpenCTI to see ATT&CK heatmap</h3>
                        <p className="text-sm text-muted-foreground mt-1">Attack technique usage data is sourced from OpenCTI campaigns and threat actors.</p>
                    </div>
                    <Link href="/integrations"><Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" /> Open Integration Hub</Button></Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted/30" /> 0</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-yellow-500/30" /> 1–2</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-orange-500/30" /> 3–5</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500/30" /> 6+</span>
                    <span className="text-[10px]">campaigns using technique</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={fetchHeatmap}><RefreshCw className="h-3 w-3" /> Refresh</Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-7 gap-2">{[...Array(42)].map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(TACTICS.length, 7)}, minmax(120px, 1fr))` }}>
                        {TACTICS.map(tactic => {
                            const tacticTechs = STATIC_TECHNIQUES[tactic] || [];
                            return (
                                <div key={tactic} className="space-y-1">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center px-1 truncate" title={tactic}>
                                        {tactic}
                                    </p>
                                    <div className="space-y-1">
                                        {tacticTechs.map(tech => {
                                            const count = getCount(tech.id, tech.name);
                                            return (
                                                <button
                                                    key={tech.id}
                                                    className={`w-full p-1.5 rounded-md text-[10px] leading-tight border border-transparent transition-all cursor-pointer text-left ${heatColor(count)}`}
                                                    onClick={() => setSelectedTechnique({ id: tech.id, name: tech.name, count, tactic })}
                                                >
                                                    <span className="font-mono text-[9px] block opacity-60">{tech.id}</span>
                                                    <span className="block truncate">{tech.name}</span>
                                                    {count > 0 && <span className="font-bold">{count}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected technique detail */}
            {selectedTechnique && (
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">
                            {selectedTechnique.id}: {selectedTechnique.name}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedTechnique(null)}><X className="h-3.5 w-3.5" /></Button>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Tactic: <strong className="text-foreground">{selectedTechnique.tactic}</strong></span>
                            <span>Active in: <strong className="text-foreground">{selectedTechnique.count} campaign{selectedTechnique.count !== 1 ? 's' : ''}</strong></span>
                        </div>
                        <a href={`https://attack.mitre.org/techniques/${selectedTechnique.id}/`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View on MITRE ATT&CK <ExternalLink className="h-3 w-3" />
                        </a>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
