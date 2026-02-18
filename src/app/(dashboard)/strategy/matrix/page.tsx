"use client";

import React, { useState, useMemo } from "react";
import { ThreatMatrix, ThreatRow } from "@/components/strategy/matrix/threat-matrix";
import { Safeguard } from "@/components/strategy/matrix/safeguard-cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, Info, Plus, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Zustand Store for Threats ──────────────────────────────────
const NIST_FUNCTIONS = ["identify", "protect", "detect", "respond", "recover"] as const;

const INITIAL_THREATS: ThreatRow[] = [
    {
        id: "1", threat: "Ransomware (Double Extortion)",
        description: "Adversary encrypts data and threatens leak. Entry via phishing or VPN exploit.",
        severity: "Critical",
        identify: [
            { id: "s1", name: "Data Asset Inventory", type: "Process", status: "healthy", score: 95 },
            { id: "s2", name: "Vuln Scanner (Tenable)", type: "Technology", status: "healthy", score: 92 },
        ],
        protect: [
            { id: "s3", name: "MFA (Okta)", type: "Technology", status: "healthy", score: 99 },
            { id: "s4", name: "Email Gateway (Proofpoint)", type: "Technology", status: "degraded", score: 78 },
        ],
        detect: [
            { id: "s5", name: "EDR (CrowdStrike)", type: "Technology", status: "healthy", score: 96 },
            { id: "s6", name: "SIEM Ruleset: Ransomware", type: "Technology", status: "degraded", score: 65 },
        ],
        respond: [
            { id: "s7", name: "IR Playbook: Ransomware", type: "Process", status: "healthy", score: 90 },
            { id: "s8", name: "Auto-Isolation Policy", type: "Technology", status: "failing", score: 40 },
        ],
        recover: [
            { id: "s9", name: "Immutable Backups", type: "Technology", status: "healthy", score: 98 },
            { id: "s10", name: "Restoration Drill", type: "People", status: "degraded", score: 70 },
        ]
    },
    {
        id: "2", threat: "Insider Data Exfiltration",
        description: "Disgruntled employee copies IP to personal cloud storage.",
        severity: "High",
        identify: [{ id: "s11", name: "User Access Review", type: "Process", status: "degraded", score: 60 }],
        protect: [
            { id: "s12", name: "USB Blocking (DLP)", type: "Technology", status: "healthy", score: 94 },
            { id: "s13", name: "CASB (Netskope)", type: "Technology", status: "failing", score: 45 },
        ],
        detect: [{ id: "s14", name: "UBA Anomaly Detection", type: "Technology", status: "degraded", score: 72 }],
        respond: [{ id: "s15", name: "HR/Legal Notification", type: "Process", status: "healthy", score: 100 }],
        recover: []
    },
    {
        id: "3", threat: "Supply Chain Compromise",
        description: "Malicious code injected via 3rd party vendor library.",
        severity: "Critical",
        identify: [{ id: "s16", name: "Vendor Risk Assessment", type: "Process", status: "healthy", score: 88 }],
        protect: [{ id: "s17", name: "SCA (Snyk)", type: "Technology", status: "healthy", score: 91 }],
        detect: [],
        respond: [{ id: "s18", name: "Vendor Breach Clause", type: "Process", status: "healthy", score: 100 }],
        recover: []
    }
];

interface MatrixStore {
    threats: ThreatRow[];
    addThreat: (t: Omit<ThreatRow, "id">) => void;
    addSafeguard: (threatId: string, func: string, s: Omit<Safeguard, "id">) => void;
}

const useMatrixStore = create<MatrixStore>()(
    persist(
        (set) => ({
            threats: INITIAL_THREATS,
            addThreat: (t) => set(state => ({
                threats: [...state.threats, { ...t, id: `T-${Date.now()}` }]
            })),
            addSafeguard: (threatId, func, s) => set(state => ({
                threats: state.threats.map(th =>
                    th.id === threatId
                        ? { ...th, [func]: [...(th[func as keyof ThreatRow] as Safeguard[] || []), { ...s, id: `S-${Date.now()}` }] }
                        : th
                )
            })),
        }),
        { name: "aegis-matrix-store" }
    )
);

// ─── Page ───────────────────────────────────────────────────────
export default function DefenseMatrixPage() {
    const { threats, addThreat, addSafeguard } = useMatrixStore();

    // Dialogs
    const [showAddThreat, setShowAddThreat] = useState(false);
    const [showAddSafeguard, setShowAddSafeguard] = useState(false);
    const [threatTitle, setThreatTitle] = useState("");
    const [threatDesc, setThreatDesc] = useState("");
    const [threatSeverity, setThreatSeverity] = useState<"Critical" | "High" | "Medium">("High");
    const [sgThreatId, setSgThreatId] = useState("");
    const [sgFunction, setSgFunction] = useState("protect");
    const [sgName, setSgName] = useState("");
    const [sgType, setSgType] = useState<"Technology" | "Process" | "People">("Technology");
    const [sgScore, setSgScore] = useState("80");

    // Stats
    const stats = useMemo(() => {
        let totalControls = 0, healthyCount = 0, degradedCount = 0, failingCount = 0, gapCount = 0;

        const functionScores: Record<string, number[]> = {};
        NIST_FUNCTIONS.forEach(f => { functionScores[f] = []; });

        threats.forEach(t => {
            NIST_FUNCTIONS.forEach(f => {
                const safeguards = (t[f] as Safeguard[]) || [];
                if (safeguards.length === 0) gapCount++;
                safeguards.forEach(s => {
                    totalControls++;
                    functionScores[f].push(s.score);
                    if (s.status === "healthy") healthyCount++;
                    else if (s.status === "degraded") degradedCount++;
                    else failingCount++;
                });
            });
        });

        const avgScores: Record<string, number> = {};
        Object.entries(functionScores).forEach(([f, scores]) => {
            avgScores[f] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        });

        return { totalControls, healthyCount, degradedCount, failingCount, gapCount, avgScores };
    }, [threats]);

    const handleAddThreat = () => {
        if (!threatTitle.trim()) return;
        addThreat({
            threat: threatTitle, description: threatDesc, severity: threatSeverity,
            identify: [], protect: [], detect: [], respond: [], recover: []
        });
        setThreatTitle(""); setThreatDesc(""); setThreatSeverity("High");
        setShowAddThreat(false);
    };

    const handleAddSafeguard = () => {
        if (!sgName.trim() || !sgThreatId) return;
        const score = parseInt(sgScore);
        addSafeguard(sgThreatId, sgFunction, {
            name: sgName, type: sgType,
            status: score >= 90 ? "healthy" : score >= 60 ? "degraded" : "failing",
            score: isNaN(score) ? 80 : score,
        });
        setSgName(""); setSgScore("80");
        setShowAddSafeguard(false);
    };

    const exportCSV = () => {
        const rows = ["Threat,Severity,Function,Safeguard,Type,Status,Score"];
        threats.forEach(t => {
            NIST_FUNCTIONS.forEach(f => {
                const sgs = (t[f] as Safeguard[]) || [];
                if (sgs.length === 0) rows.push(`"${t.threat}",${t.severity},${f},GAP,-,-,0`);
                sgs.forEach(s => rows.push(`"${t.threat}",${t.severity},${f},"${s.name}",${s.type},${s.status},${s.score}`));
            });
        });
        const blob = new Blob([rows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "defense-matrix.csv"; a.click();
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Defense Matrix (TaSM)</h1>
                    <p className="text-muted-foreground">Real-time health of safeguards mapped to the NIST Cybersecurity Framework.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setShowAddThreat(true)}>
                        <Plus className="mr-1 h-4 w-4" /> Add Threat
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddSafeguard(true)}>
                        <Shield className="mr-1 h-4 w-4" /> Add Safeguard
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                        <Download className="mr-1 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Total Controls" value={stats.totalControls} />
                <StatCard label="Healthy" value={stats.healthyCount} icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
                <StatCard label="Degraded" value={stats.degradedCount} icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} />
                <StatCard label="Failing" value={stats.failingCount} icon={<XCircle className="w-4 h-4 text-red-400" />} />
                <StatCard label="Coverage Gaps" value={stats.gapCount} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} highlight />
            </div>

            {/* NIST Function Scores */}
            <div className="grid grid-cols-5 gap-2">
                {NIST_FUNCTIONS.map(f => {
                    const avg = stats.avgScores[f];
                    const color = avg >= 90 ? "bg-emerald-500" : avg >= 60 ? "bg-amber-500" : avg > 0 ? "bg-red-500" : "bg-zinc-700";
                    return (
                        <div key={f} className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-center">
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500">{f}</div>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${color}`} />
                                <span className="text-sm font-bold text-white">{avg || "—"}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Matrix */}
            <ThreatMatrix data={threats} />

            {/* Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 text-sm">
                    <h3 className="font-semibold mb-2">Health Legend</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-zinc-300">Effective (90%+)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-zinc-300">Degraded (60-89%)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-zinc-300">Failing / Missing</span></div>
                    </div>
                </div>
            </div>

            {/* ── Add Threat Dialog ── */}
            <Dialog open={showAddThreat} onOpenChange={setShowAddThreat}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" /> Add Threat Scenario
                        </DialogTitle>
                        <DialogDescription>Define a new threat to map safeguards against.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); handleAddThreat(); }}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Threat Name</Label>
                                <Input placeholder="e.g. Cloud Account Takeover" value={threatTitle} onChange={e => setThreatTitle(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea placeholder="Describe the attack vector and business impact..." value={threatDesc} onChange={e => setThreatDesc(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Severity</Label>
                                <Select value={threatSeverity} onValueChange={(v: any) => setThreatSeverity(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddThreat(false)}>Cancel</Button>
                            <Button type="submit"><Plus className="w-4 h-4 mr-1" /> Add Threat</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Add Safeguard Dialog ── */}
            <Dialog open={showAddSafeguard} onOpenChange={setShowAddSafeguard}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-400" /> Add Safeguard
                        </DialogTitle>
                        <DialogDescription>Map a new control/safeguard to a threat scenario.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); handleAddSafeguard(); }}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Threat</Label>
                                <Select value={sgThreatId} onValueChange={setSgThreatId}>
                                    <SelectTrigger><SelectValue placeholder="Select a threat..." /></SelectTrigger>
                                    <SelectContent>
                                        {threats.map(t => <SelectItem key={t.id} value={t.id}>{t.threat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>NIST Function</Label>
                                <Select value={sgFunction} onValueChange={setSgFunction}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {NIST_FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Safeguard Name</Label>
                                <Input placeholder="e.g. WAF (Cloudflare)" value={sgName} onChange={e => setSgName(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select value={sgType} onValueChange={(v: any) => setSgType(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technology">Technology</SelectItem>
                                            <SelectItem value="Process">Process</SelectItem>
                                            <SelectItem value="People">People</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Effectiveness Score (0-100)</Label>
                                    <Input type="number" min="0" max="100" value={sgScore} onChange={e => setSgScore(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddSafeguard(false)}>Cancel</Button>
                            <Button type="submit"><Plus className="w-4 h-4 mr-1" /> Add Safeguard</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon?: React.ReactNode; highlight?: boolean }) {
    return (
        <div className={`p-3 rounded-lg border text-center ${highlight ? "border-red-500/30 bg-red-500/5" : "border-zinc-800/50 bg-zinc-900/30"}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
                {icon}
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
            </div>
            <div className={`text-xl font-bold ${highlight ? "text-red-400" : "text-white"}`}>{value}</div>
        </div>
    );
}
