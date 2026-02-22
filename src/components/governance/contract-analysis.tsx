"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileText, BrainCircuit, Search } from 'lucide-react';
import { ClauseInspector, ClauseData, RiskLevel } from './clause-inspector';
import { Card } from '@/components/ui/card';

// --- Mock Data: SaaS MSA ---

interface Node {
    id: string;
    label: string;
    type: 'root' | 'category' | 'clause';
    risk?: RiskLevel;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    parentId?: string;
    description?: string; // For category nodes
    clauseData?: ClauseData; // For clause nodes
}

const MOCK_NODES: Node[] = [
    // Root
    { id: 'root', label: 'Vendor MSA v2.4', type: 'root', x: 50, y: 50 },

    // Categories (Branches)
    { id: 'cat-liability', label: 'Liability & Indemnity', type: 'category', x: 20, y: 30, description: 'Caps, exclusions, and hold harmless clauses.' },
    { id: 'cat-data', label: 'Data & Privacy', type: 'category', x: 80, y: 30, description: 'GDPR, ownership, and breach notification.' },
    { id: 'cat-term', label: 'Term & Termination', type: 'category', x: 20, y: 70, description: 'Renewal, exit rights, and survival.' },
    { id: 'cat-ip', label: 'IP Rights', type: 'category', x: 80, y: 70, description: 'License grants and ownership of deliverables.' },

    // Clauses (Leaves)
    // Liability Branch
    {
        id: 'cl-cap', label: 'Liability Cap', type: 'clause', risk: 'critical', x: 10, y: 20, parentId: 'cat-liability',
        clauseData: {
            id: "12.2",
            title: "Limitation of Liability",
            originalText: "IN NO EVENT SHALL VENDOR'S AGGREGATE LIABILITY EXCEED THE TOTAL FEES PAID BY CUSTOMER IN THE ONE (1) MONTH PERIOD PRECEDING THE CLAIM.",
            goldenText: "IN NO EVENT SHALL VENDOR'S AGGREGATE LIABILITY EXCEED THE TOTAL FEES PAID BY CUSTOMER IN THE TWELVE (12) MONTH PERIOD PRECEDING THE CLAIM, OR $1,000,000, WHICHEVER IS GREATER.",
            counterDraft: "IN NO EVENT SHALL VENDOR'S AGGREGATE LIABILITY EXCEED THE GREATER OF (A) THE TOTAL FEES PAID BY CUSTOMER IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM, OR (B) ONE MILLION DOLLARS ($1,000,000).",
            riskLevel: 'critical',
            aiAnalysis: "This cap is extremely low (1 month of fees). Market standard for enterprise SaaS is typically 12 months.",
            recommendations: ["Increase cap to 12 months fees.", "Carve out data breach and indemnity from the cap."]
        }
    },
    {
        id: 'cl-indemnity', label: 'Indemnification', type: 'clause', risk: 'medium', x: 30, y: 15, parentId: 'cat-liability',
        clauseData: {
            id: "13.1",
            title: "Vendor Indemnity",
            originalText: "Vendor shall indemnify Customer against third-party claims that the Service infringes IP rights, provided Customer gives prompt notice.",
            goldenText: "Vendor shall indemnify, defend, and hold Customer harmless against any Claim alleging that the Service infringes any Intellectual Property Right or violates any Privacy Law.",
            riskLevel: 'medium',
            aiAnalysis: "Standard IP indemnity, but lacks coverage for data breaches or gross negligence.",
            recommendations: ["Expand to include Data Breach defense."]
        }
    },

    // Data Branch
    {
        id: 'cl-ownership', label: 'Data Ownership', type: 'clause', risk: 'high', x: 70, y: 15, parentId: 'cat-data',
        clauseData: {
            id: "8.4",
            title: "Derivative Data",
            originalText: "Customer grants Vendor a perpetual, irrevocable license to use Customer Data to train AI models and improve services. Vendor owns all insights metrics.",
            goldenText: "Customer retains all right, title, and interest in and to Customer Data. Vendor may use Customer Data solely to provide the Services.",
            counterDraft: "Customer retains all rights to Customer Data. Vendor is granted a limited license to use Customer Data solely for the purpose of providing the Services to Customer. Vendor shall not use Customer Data to train shared AI models.",
            riskLevel: 'high',
            aiAnalysis: "Vendor claims rights to train their AI on your confidential data. This effectively leaks your IP into their model.",
            recommendations: ["Restrict usage to 'providing the service' only.", "Explicitly forbid AI training on Customer Data."]
        }
    },
    {
        id: 'cl-breach', label: 'Breach Notice', type: 'clause', risk: 'low', x: 90, y: 20, parentId: 'cat-data',
        clauseData: {
            id: "9.2",
            title: "Security Incident Response",
            originalText: "Vendor will notify Customer of confirmed Security Breaches within 72 hours of discovery.",
            riskLevel: 'low',
            aiAnalysis: "72 hours aligns with GDPR requirements.",
            recommendations: ["Consider requesting 24 or 48 hours for critical incidents."]
        }
    },

    // Term Branch
    {
        id: 'cl-auto-renew', label: 'Auto-Renewal', type: 'clause', risk: 'medium', x: 10, y: 80, parentId: 'cat-term',
        clauseData: {
            id: "4.2",
            title: "Automatic Renewal",
            originalText: "Term automatically renews for 1 year unless notice is given 90 days prior to expiration.",
            goldenText: "Term automatically renews for 1 year unless notice is given 30 days prior to expiration.",
            riskLevel: 'medium',
            aiAnalysis: "90-day notice window is unusually long and easy to miss (Standard is 30 or 60).",
            recommendations: ["Reduce non-renewal notice period to 30 days."]
        }
    },

    // IP Branch
    {
        id: 'cl-license', label: 'Software License', type: 'clause', risk: 'low', x: 90, y: 80, parentId: 'cat-ip',
        clauseData: {
            id: "3.1",
            title: "Grant of License",
            originalText: "Vendor grants Customer a non-exclusive, non-transferable right to access the Service.",
            riskLevel: 'low',
            aiAnalysis: "Standard SaaS license language.",
            recommendations: []
        }
    },
];

const LINKS = [
    { source: 'root', target: 'cat-liability' },
    { source: 'root', target: 'cat-data' },
    { source: 'root', target: 'cat-term' },
    { source: 'root', target: 'cat-ip' },
    { source: 'cat-liability', target: 'cl-cap' },
    { source: 'cat-liability', target: 'cl-indemnity' },
    { source: 'cat-data', target: 'cl-ownership' },
    { source: 'cat-data', target: 'cl-breach' },
    { source: 'cat-term', target: 'cl-auto-renew' },
    { source: 'cat-ip', target: 'cl-license' },
];

export function ContractAnalysis() {
    const [selectedClause, setSelectedClause] = useState<ClauseData | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Get color based on risk
    const getRiskColor = (risk?: RiskLevel) => {
        switch (risk) {
            case 'critical': return '#ef4444'; // Red-500
            case 'high': return '#f97316'; // Orange-500
            case 'medium': return '#f59e0b'; // Amber-500
            case 'low': return '#10b981'; // Emerald-500
            default: return '#71717a'; // Zinc-500
        }
    };

    // Helper to find node coordinates for lines
    const getNode = (id: string) => MOCK_NODES.find(n => n.id === id);

    return (
        <Card className="relative w-full h-[600px] bg-black/95 border-zinc-800 overflow-hidden shadow-2xl backdrop-blur-xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Header */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-bold tracking-tight text-white">Contract <span className="text-zinc-500">Mindmap</span></h2>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-1.5 w-64">
                    <Search className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Search clauses...</span>
                </div>
            </div>

            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {LINKS.map((link, i) => {
                    const start = getNode(link.source);
                    const end = getNode(link.target);
                    if (!start || !end) return null;

                    return (
                        <motion.line
                            key={i}
                            x1={`${start.x}%`}
                            y1={`${start.y}%`}
                            x2={`${end.x}%`}
                            y2={`${end.y}%`}
                            stroke="#3f3f46" // Zinc-700
                            strokeWidth="1"
                            strokeOpacity="0.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                        />
                    );
                })}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 w-full h-full">
                {MOCK_NODES.map((node) => {
                    const isRoot = node.type === 'root';
                    const isCategory = node.type === 'category';
                    const isClause = node.type === 'clause';
                    const color = getRiskColor(node.risk);

                    return (
                        <motion.div
                            key={node.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                            whileHover={{ scale: 1.1 }}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={() => node.clauseData && setSelectedClause(node.clauseData)}
                        >
                            {/* Visual Shape */}
                            <div className={cn(
                                "relative flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-lg border",
                                isRoot ? "w-32 h-32 rounded-full bg-purple-500/10 border-purple-500" :
                                    isCategory ? "w-24 h-24 rounded-2xl bg-zinc-900/80 border-zinc-700 hover:border-zinc-500" :
                                        "w-12 h-12 rounded-full bg-black/80" // Clause node
                            )}
                                style={{ borderColor: isClause ? color : undefined }}
                            >
                                {isRoot && <FileText className="w-10 h-10 text-purple-500" />}
                                {isCategory && (
                                    <div className="text-center p-2">
                                        <div className="text-xs font-bold text-zinc-300">{node.label}</div>
                                    </div>
                                )}
                                {isClause && (
                                    <div className={cn("w-3 h-3 rounded-full", node.risk === 'critical' ? 'animate-pulse' : '')} style={{ backgroundColor: color }} />
                                )}

                                {/* Hover Tooltip for Category */}
                                {isCategory && hoveredNode === node.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full mt-2 w-48 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 pointer-events-none"
                                    >
                                        <p className="text-[10px] text-zinc-400">{node.description}</p>
                                    </motion.div>
                                )}

                                {/* Label for Clause */}
                                {isClause && (
                                    <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                        {node.label}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Sidebar Inspector */}
            <AnimatePresence>
                {selectedClause && (
                    <ClauseInspector
                        clause={selectedClause}
                        onClose={() => setSelectedClause(null)}
                    />
                )}
            </AnimatePresence>
        </Card>
    );
}
