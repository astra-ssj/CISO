"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Server, Database, Globe, ShieldAlert, Layers, Activity } from 'lucide-react';
import { RemediationModal } from '../active-defense/remediation-modal';
import { DataIngestionPanel } from './ingestion/data-ingestion-panel';

// --- Types ---
type NodeType = 'business' | 'app' | 'infra' | 'risk';

interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    x: number;
    y: number;
    value?: string;
    status?: 'healthy' | 'warning' | 'critical';
}

interface GraphLink {
    source: string;
    target: string;
    active?: boolean;
}

// --- Mock Data ---
const INITIAL_NODES: GraphNode[] = [
    // Business Units (Top Layer)
    { id: 'bu-1', label: 'Global Finance', type: 'business', x: 50, y: 15, value: '$1.2B', status: 'healthy' },
    { id: 'bu-2', label: 'E-Commerce', type: 'business', x: 20, y: 15, value: '$850M', status: 'critical' },
    { id: 'bu-3', label: 'Supply Chain', type: 'business', x: 80, y: 15, value: '$400M', status: 'warning' },

    // Applications (Middle Layer)
    { id: 'app-1', label: 'Trading Platform', type: 'app', x: 50, y: 45, status: 'healthy' },
    { id: 'app-2', label: 'Checkout API', type: 'app', x: 20, y: 45, status: 'critical' },
    { id: 'app-3', label: 'Logistics Core', type: 'app', x: 80, y: 45, status: 'warning' },
    { id: 'app-4', label: 'Payment Gateway', type: 'app', x: 35, y: 45, status: 'healthy' },

    // Infrastructure (Bottom Layer)
    { id: 'inf-1', label: 'AWS US-East-1', type: 'infra', x: 30, y: 75, status: 'critical' },
    { id: 'inf-2', label: 'On-Prem DB', type: 'infra', x: 70, y: 75, status: 'healthy' },

    // Risks (Floating)
    { id: 'risk-1', label: 'Log4j Variant', type: 'risk', x: 15, y: 70, status: 'critical' },
];

const INITIAL_LINKS: GraphLink[] = [
    { source: 'bu-1', target: 'app-1' },
    { source: 'bu-1', target: 'app-4' },
    { source: 'bu-2', target: 'app-2' },
    { source: 'bu-3', target: 'app-3' },
    { source: 'app-2', target: 'inf-1' },
    { source: 'app-4', target: 'inf-1' },
    { source: 'app-3', target: 'inf-2' },
    { source: 'risk-1', target: 'inf-1', active: true },
    { source: 'risk-1', target: 'app-2', active: true },
];

function NodeIcon({ type, className }: { type: NodeType, className?: string }) {
    switch (type) {
        case 'business': return <Globe className={className} />;
        case 'app': return <Layers className={className} />;
        case 'infra': return <Server className={className} />;
        case 'risk': return <ShieldAlert className={className} />;
        default: return <Database className={className} />;
    }
}

export function NexusGraph() {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [links, setLinks] = useState(INITIAL_LINKS);
    const [isRemediationOpen, setIsRemediationOpen] = useState(false);

    // Helper to find node coordinates
    const getNode = (id: string) => nodes.find(n => n.id === id);

    const handleNewDiscovery = (newNodes: any[]) => {
        setNodes(prev => [...prev, ...newNodes]);
        // Add fake links for demo
        setLinks(prev => [
            ...prev,
            { source: 'app-5', target: 'inf-3' },
            { source: 'bu-1', target: 'app-5' }
        ]);
    };

    return (
        <div className="relative w-full h-[600px] bg-black/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl backdrop-blur-xl">
            <RemediationModal
                isOpen={isRemediationOpen}
                onClose={() => setIsRemediationOpen(false)}
                threatId="CVE-2024-9992"
                threatTitle="Log4j Critical Variant"
            />

            <DataIngestionPanel onDiscoveryComplete={handleNewDiscovery} />

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

            {/* Header */}
            <div className="absolute top-6 left-6 z-10">
                <div className="flex items-center gap-3 mb-1">
                    <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                    <h2 className="text-xl font-bold tracking-tight text-white">NEXUS <span className="text-zinc-500">Context Graph</span></h2>
                </div>
                <p className="text-sm text-zinc-400 font-mono">mapping: BUSINESS_VALUE :: INFRA_RISK</p>
            </div>

            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {INITIAL_LINKS.map((link, i) => {
                    const start = getNode(link.source);
                    const end = getNode(link.target);
                    if (!start || !end) return null;

                    const isRiskPath = link.active || (selectedNode && (link.source === selectedNode || link.target === selectedNode));

                    return (
                        <g key={i}>
                            <motion.line
                                x1={`${start.x}%`}
                                y1={`${start.y}%`}
                                x2={`${end.x}%`}
                                y2={`${end.y}%`}
                                stroke={isRiskPath ? "#ef4444" : "#27272a"}
                                strokeWidth={isRiskPath ? 2 : 1}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                            />
                            {isRiskPath && (
                                <circle r="2" fill="#ef4444">
                                    <animateMotion dur="2s" repeatCount="indefinite"
                                        path={`M${start.x * 10},${start.y * 6} L${end.x * 10},${end.y * 6}`} // Approximate for demo scaling
                                    />
                                </circle>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 w-full h-full">
                {nodes.map((node) => (
                    <motion.div
                        key={node.id}
                        className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group",
                            "flex flex-col items-center justify-center gap-2"
                        )}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        onClick={() => setSelectedNode(node.id)}
                        whileHover={{ scale: 1.1 }}
                    >
                        {/* Node Circle */}
                        <div className={cn(
                            "relative w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-md transition-all duration-500",
                            node.status === 'critical' ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" :
                                node.status === 'warning' ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                                    "bg-zinc-900/50 border-zinc-700 text-zinc-300 group-hover:border-emerald-500 group-hover:text-emerald-500"
                        )}>
                            <NodeIcon type={node.type} className="w-5 h-5" />

                            {/* Ripple Effect for Critical Nodes */}
                            {node.status === 'critical' && (
                                <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20" />
                            )}
                        </div>

                        {/* Label Badge */}
                        <div className="flex flex-col items-center">
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-black/80",
                                node.status === 'critical' ? "border-red-500/50 text-red-400" : "border-zinc-800 text-zinc-400"
                            )}>
                                {node.label}
                            </span>
                            {node.value && (
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{node.value}</span>
                            )}
                        </div>

                    </motion.div>
                ))}
            </div>

            {/* Context Panel (Drill Down) */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute top-0 right-0 h-full w-80 bg-zinc-900/95 border-l border-zinc-800 p-6 backdrop-blur-xl z-20 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white">Node Analysis</h3>
                            <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white">✕</button>
                        </div>

                        {/* Node Details Content */}
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-900">
                                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Asset ID</div>
                                <div className="font-mono text-emerald-400">{selectedNode}</div>
                            </div>

                            <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-900">
                                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Risk Correlation</div>
                                <div className="text-sm text-zinc-300 leading-relaxed">
                                    Direct impact on <span className="text-white font-bold">$850M</span> annual revenue stream via Checkout API dependency.
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="text-xs text-red-400 uppercase tracking-widest mb-1">Active Threats</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-bold text-red-400">CVE-2024-9992</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsRemediationOpen(true)}
                                className="w-full py-2 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors rounded"
                            >
                                Initiate Remediation
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
