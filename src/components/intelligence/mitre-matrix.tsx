"use client";

import { useState, useEffect } from "react";
import { TechniqueCard, TechniqueStatus } from "./technique-card";
import { motion } from "framer-motion";
import { Search, Filter, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Simplified MITRE Structure for Demo
const MITRE_DATA = {
    tactics: [
        {
            id: 'TA0001', name: 'Initial Access', techniques: [
                { id: 'T1190', name: 'Exploit Public-Facing Application' },
                { id: 'T1078', name: 'Valid Accounts' },
                { id: 'T1566', name: 'Phishing' },
                { id: 'T1133', name: 'External Remote Services' },
            ]
        },
        {
            id: 'TA0002', name: 'Execution', techniques: [
                { id: 'T1059', name: 'Command and Scripting Interpreter' },
                { id: 'T1204', name: 'User Execution' },
                { id: 'T1053', name: 'Scheduled Task/Job' },
                { id: 'T1106', name: 'Native API' },
            ]
        },
        {
            id: 'TA0003', name: 'Persistence', techniques: [
                { id: 'T1098', name: 'Account Manipulation' },
                { id: 'T1547', name: 'Boot or Logon Autostart Execution' },
                { id: 'T1543', name: 'Create or Modify System Process' },
                { id: 'T1136', name: 'Create Account' },
            ]
        },
        {
            id: 'TA0004', name: 'Privilege Escalation', techniques: [
                { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
                { id: 'T1134', name: 'Access Token Manipulation' },
                { id: 'T1068', name: 'Exploitation for Privilege Escalation' },
                { id: 'T1484', name: 'Domain Policy Modification' },
            ]
        },
        {
            id: 'TA0005', name: 'Defense Evasion', techniques: [
                { id: 'T1140', name: 'Deobfuscate/Decode Files or Information' },
                { id: 'T1006', name: 'Direct Volume Access' },
                { id: 'T1070', name: 'Indicator Removal' },
                { id: 'T1027', name: 'Obfuscated Files or Information' },
            ]
        },
        {
            id: 'TA0006', name: 'Credential Access', techniques: [
                { id: 'T1555', name: 'Credentials from Password Stores' },
                { id: 'T1003', name: 'OS Credential Dumping' },
                { id: 'T1110', name: 'Brute Force' },
                { id: 'T1558', name: 'Steal or Forge Kerberos Tickets' },
            ]
        },
        {
            id: 'TA0007', name: 'Discovery', techniques: [
                { id: 'T1087', name: 'Account Discovery' },
                { id: 'T1083', name: 'File and Directory Discovery' },
                { id: 'T1046', name: 'Network Service Discovery' },
                { id: 'T1012', name: 'Query Registry' },
            ]
        },
        {
            id: 'TA0009', name: 'Collection', techniques: [
                { id: 'T1560', name: 'Archive Collected Data' },
                { id: 'T1114', name: 'Email Collection' },
                { id: 'T1056', name: 'Input Capture' },
                { id: 'T1119', name: 'Automated Collection' },
            ]
        },
    ]
};

export function MitreMatrix() {
    const [activeThreats, setActiveThreats] = useState<Record<string, { status: TechniqueStatus, count: number }>>({});
    const [filter, setFilter] = useState('');

    // Simulate Live Activity
    useEffect(() => {
        // Initial Mock State
        setActiveThreats({
            'T1566': { status: 'blocked', count: 124 },
            'T1190': { status: 'active', count: 3 },
            'T1110': { status: 'blocked', count: 890 },
            'T1059': { status: 'active', count: 1 },
        });

        const interval = setInterval(() => {
            // Randomly flip a technique to active or blocked
            const tactic = MITRE_DATA.tactics[Math.floor(Math.random() * MITRE_DATA.tactics.length)];
            const technique = tactic.techniques[Math.floor(Math.random() * tactic.techniques.length)];

            setActiveThreats(prev => {
                const newState = { ...prev };
                if (Math.random() > 0.7) {
                    // 70% chance to clear or nothing, 30% chance to act
                    if (Math.random() > 0.5) {
                        newState[technique.id] = { status: 'active', count: Math.floor(Math.random() * 5) + 1 };
                    } else {
                        newState[technique.id] = { status: 'blocked', count: Math.floor(Math.random() * 50) + 10 };
                    }
                }
                return newState;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">MITRE ATT&CK Matrix (Enterprise)</h2>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find technique..."
                            className="pl-8 h-9 bg-secondary/20"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-[1200px] border border-border/50 rounded-lg bg-card/10 backdrop-blur-sm">
                    {/* Header Row */}
                    <div className="grid grid-cols-8 border-b border-border/50">
                        {MITRE_DATA.tactics.map(tactic => (
                            <div key={tactic.id} className="p-3 border-r border-border/50 last:border-r-0 bg-secondary/30">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tactic.name}</div>
                                <div className="text-[10px] text-muted-foreground/50">{tactic.techniques.length} techniques</div>
                            </div>
                        ))}
                    </div>

                    {/* Techniques Body */}
                    <div className="grid grid-cols-8">
                        {MITRE_DATA.tactics.map(tactic => (
                            <div key={tactic.id} className="border-r border-border/50 last:border-r-0 p-2 space-y-2">
                                {tactic.techniques
                                    .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()) || t.id.toLowerCase().includes(filter.toLowerCase()))
                                    .map(technique => (
                                        <div key={technique.id} className="h-20">
                                            <TechniqueCard
                                                id={technique.id}
                                                name={technique.name}
                                                status={activeThreats[technique.id]?.status || 'dormant'}
                                                detectionCount={activeThreats[technique.id]?.count}
                                            />
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
