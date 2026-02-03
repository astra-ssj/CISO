"use client";

import React from "react";
import { ThreatMatrix, ThreatRow } from "@/components/strategy/matrix/threat-matrix";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";

const MOCK_DATA: ThreatRow[] = [
    {
        id: "1",
        threat: "Ransomware (Double Extortion)",
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
        id: "2",
        threat: "Insider Data Exfiltration",
        description: "Disgruntled employee copies IP to personal cloud storage.",
        severity: "High",
        identify: [
            { id: "s11", name: "User Access Review", type: "Process", status: "degraded", score: 60 },
        ],
        protect: [
            { id: "s12", name: "USB Blocking (DLP)", type: "Technology", status: "healthy", score: 94 },
            { id: "s13", name: "CASB (Netskope)", type: "Technology", status: "failing", score: 45 },
        ],
        detect: [
            { id: "s14", name: "UBA Anomaly Detection", type: "Technology", status: "degraded", score: 72 },
        ],
        respond: [
            { id: "s15", name: "HR/Legal Notification", type: "Process", status: "healthy", score: 100 },
        ],
        recover: [
            // GAPS
        ]
    },
    {
        id: "3",
        threat: "Supply Chain Compromise",
        description: "Malicious code injected via 3rd party vendor library.",
        severity: "Critical",
        identify: [
            { id: "s16", name: "Vendor Risk Assessment", type: "Process", status: "healthy", score: 88 }
        ],
        protect: [
            { id: "s17", name: "SCA (Snyk)", type: "Technology", status: "healthy", score: 91 }
        ],
        detect: [
            // GAPS
        ],
        respond: [
            { id: "s18", name: "Vendor Breach Clause", type: "Process", status: "healthy", score: 100 }
        ],
        recover: []
    }
];

export default function DefenseMatrixPage() {
    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Defense Matrix (TaSM)</h1>
                    <p className="text-muted-foreground">Real-time health of safeguards mapped to the NIST Cybersecurity Framework.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Info className="mr-2 h-4 w-4" /> Methodology
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Matrix */}
            <ThreatMatrix data={MOCK_DATA} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Legend */}
                <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 text-sm">
                    <h3 className="font-semibold mb-2">Health Legend</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-zinc-300">Effective (90%+)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span className="text-zinc-300">Degraded (60-89%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-zinc-300">Failing / Missing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
