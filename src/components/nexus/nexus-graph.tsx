"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Server, Database, Globe, ShieldAlert, Layers, Activity, Network, MousePointer2, Scale } from 'lucide-react';
import { RemediationModal } from '../active-defense/remediation-modal';
import { DataIngestionPanel } from './ingestion/data-ingestion-panel';
import { Button } from '@/components/ui/button';
import { useUnificationStore } from '@/lib/unification-store';

// --- Types ---
type NodeType = 'business' | 'app' | 'infra' | 'risk';
type ViewMode = 'business' | 'network';

interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    x: number;
    y: number;
    value?: string;
    status?: 'healthy' | 'warning' | 'critical';
    networkStats?: {
        throughput: string;
        activeFlows: number;
        dropRate: string;
    };
}

interface GraphLink {
    source: string;
    target: string;
    active?: boolean;
    type?: 'logical' | 'network';
    trafficVolume?: 'low' | 'medium' | 'high';
}

// --- Mock Data ---
const INITIAL_NODES: GraphNode[] = [
    // Business Units (Top Layer)
    {
        id: 'bu-1', label: 'Global Finance', type: 'business', x: 50, y: 15, value: '$1.2B', status: 'healthy',
        networkStats: { throughput: '450 MB/s', activeFlows: 24, dropRate: '0.01%' }
    },
    {
        id: 'bu-2', label: 'E-Commerce', type: 'business', x: 20, y: 15, value: '$850M', status: 'critical',
        networkStats: { throughput: '1.2 GB/s', activeFlows: 156, dropRate: '2.4%' }
    },
    {
        id: 'bu-3', label: 'Supply Chain', type: 'business', x: 80, y: 15, value: '$400M', status: 'warning',
        networkStats: { throughput: '200 MB/s', activeFlows: 12, dropRate: '0.1%' }
    },

    // Applications (Middle Layer)
    {
        id: 'app-1', label: 'Trading Platform', type: 'app', x: 50, y: 45, status: 'healthy',
        networkStats: { throughput: '800 MB/s', activeFlows: 45, dropRate: '0%' }
    },
    {
        id: 'app-2', label: 'Checkout API', type: 'app', x: 20, y: 45, status: 'critical',
        networkStats: { throughput: '1.5 GB/s', activeFlows: 202, dropRate: '5.2%' }
    },
    {
        id: 'app-3', label: 'Logistics Core', type: 'app', x: 80, y: 45, status: 'warning',
        networkStats: { throughput: '150 MB/s', activeFlows: 18, dropRate: '0.5%' }
    },
    {
        id: 'app-4', label: 'Payment Gateway', type: 'app', x: 35, y: 45, status: 'healthy',
        networkStats: { throughput: '500 MB/s', activeFlows: 89, dropRate: '0%' }
    },

    // Infrastructure (Bottom Layer)
    {
        id: 'inf-1', label: 'AWS US-East-1', type: 'infra', x: 30, y: 75, status: 'critical',
        networkStats: { throughput: '5.2 GB/s', activeFlows: 1205, dropRate: '1.2%' }
    },
    {
        id: 'inf-2', label: 'On-Prem DB', type: 'infra', x: 70, y: 75, status: 'healthy',
        networkStats: { throughput: '800 MB/s', activeFlows: 42, dropRate: '0%' }
    },

    // Risks (Floating)
    {
        id: 'risk-1', label: 'Log4j Variant', type: 'risk', x: 15, y: 70, status: 'critical',
        networkStats: { throughput: 'N/A', activeFlows: 0, dropRate: 'N/A' }
    },
];

const BUSINESS_LINKS: GraphLink[] = [
    { source: 'bu-1', target: 'app-1', type: 'logical' },
    { source: 'bu-1', target: 'app-4', type: 'logical' },
    { source: 'bu-2', target: 'app-2', type: 'logical' },
    { source: 'bu-3', target: 'app-3', type: 'logical' },
    { source: 'app-2', target: 'inf-1', type: 'logical' },
    { source: 'app-4', target: 'inf-1', type: 'logical' },
    { source: 'app-3', target: 'inf-2', type: 'logical' },
    { source: 'risk-1', target: 'inf-1', active: true, type: 'logical' },
    { source: 'risk-1', target: 'app-2', active: true, type: 'logical' },
];

const NETWORK_LINKS: GraphLink[] = [
    // High volume traffic between Critical App and Infra
    { source: 'app-2', target: 'inf-1', type: 'network', trafficVolume: 'high' },
    // Payment Gateway Traffic
    { source: 'app-4', target: 'inf-1', type: 'network', trafficVolume: 'medium' },
    // Internal DB Traffic
    { source: 'app-3', target: 'inf-2', type: 'network', trafficVolume: 'low' },
    // Cross-Service Traffic (Not visible in Logical view usually)
    { source: 'app-1', target: 'app-4', type: 'network', trafficVolume: 'medium' },
    { source: 'app-2', target: 'app-4', type: 'network', trafficVolume: 'high' },
    // Suspicious Activity
    { source: 'risk-1', target: 'app-2', type: 'network', active: true, trafficVolume: 'low' },
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
    const [viewMode, setViewMode] = useState<ViewMode>('business');
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [isRemediationOpen, setIsRemediationOpen] = useState(false);

    // Unification Store
    const activeConstraints = useUnificationStore((state) => state.activeConstraints);

    // Dynamic links based on view mode
    const activeLinks = viewMode === 'business' ? BUSINESS_LINKS : NETWORK_LINKS;

    // Helper to find node coordinates
    const getNode = (id: string) => nodes.find(n => n.id === id);

    const handleNewDiscovery = (newNodes: any[]) => {
        setNodes(prev => [...prev, ...newNodes]);
    };

    // Helper to check for active constraint on a node
    const getActiveConstraint = (nodeId: string) => {
        return activeConstraints.find(c => c.affectedNodeIds.includes(nodeId));
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

            {/* Header & Controls */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <h2 className="text-xl font-bold tracking-tight text-white">NEXUS <span className="text-zinc-500">Context Graph</span></h2>
                    </div>
                    <p className="text-sm text-zinc-400 font-mono">
                        {viewMode === 'business' ? 'mapping: BUSINESS_VALUE :: INFRA_RISK' : 'mapping: REAL_TIME_TRAFFIC :: NET_FLOWS'}
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-fit">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('business')}
                        className={cn(
                            "h-7 text-xs font-medium px-3 transition-all",
                            viewMode === 'business' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Layers className="w-3.5 h-3.5 mr-1.5" />
                        Business
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('network')}
                        className={cn(
                            "h-7 text-xs font-medium px-3 transition-all",
                            viewMode === 'network' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Network className="w-3.5 h-3.5 mr-1.5" />
                        Network
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 z-10 flex gap-4 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
                </div>
                {viewMode === 'network' && (
                    <div className="flex items-center gap-1.5 ml-4 text-emerald-400">
                        <Activity className="w-3 h-3" /> Active Traffic
                    </div>
                )}
            </div>

            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <AnimatePresence mode='wait'>
                    {(activeLinks || []).map((link, i) => {
                        const start = getNode(link.source);
                        const end = getNode(link.target);
                        if (!start || !end) return null;

                        const isRiskPath = link.active || (selectedNode && (link.source === selectedNode || link.target === selectedNode));
                        const isNetworkMode = viewMode === 'network';

                        // Network visualization props
                        const strokeColor = isNetworkMode
                            ? (link.active ? "#ef4444" : "#10b981") // Red for risk, Green for normal traffic
                            : (isRiskPath ? "#ef4444" : "#27272a");

                        const strokeWidth = isNetworkMode
                            ? (link.trafficVolume === 'high' ? 3 : link.trafficVolume === 'medium' ? 2 : 1)
                            : (isRiskPath ? 2 : 1);

                        const strokeOpacity = isNetworkMode ? 0.6 : 1;

                        return (
                            <g key={`${viewMode}-${i}`}>
                                <motion.line
                                    x1={`${start.x}%`}
                                    y1={`${start.y}%`}
                                    x2={`${end.x}%`}
                                    y2={`${end.y}%`}
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    strokeOpacity={strokeOpacity}
                                    strokeDasharray={isNetworkMode && link.active ? "4,4" : "none"} // Dashed for suspicious traffic
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                />
                                {/* Traffic Particles for Network Mode or Risk Paths */}
                                {(isRiskPath || isNetworkMode) && (
                                    <circle r={isNetworkMode ? 2 : 2} fill={isNetworkMode && !link.active ? "#10b981" : "#ef4444"}>
                                        <animateMotion dur={link.trafficVolume === 'high' ? "1s" : "2s"} repeatCount="indefinite"
                                            path={`M${start.x * 10},${start.y * 6} L${end.x * 10},${end.y * 6}`} // Approximate for demo scaling
                                        />
                                    </circle>
                                )}
                            </g>
                        );
                    })}
                </AnimatePresence>
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 w-full h-full">
                {(nodes || []).map((node) => {
                    const violation = getActiveConstraint(node.id);
                    const isCritical = node.status === 'critical' || !!violation;

                    return (
                        <motion.div
                            key={node.id}
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                                isCritical ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" :
                                    node.status === 'warning' ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                                        "bg-zinc-900/50 border-zinc-700 text-zinc-300 group-hover:border-emerald-500 group-hover:text-emerald-500"
                            )}>
                                <NodeIcon type={node.type} className="w-5 h-5" />

                                {/* Ripple Effect for Critical Nodes */}
                                {isCritical && (
                                    <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20" />
                                )}

                                {/* Violation Indicator */}
                                {violation && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1"
                                    >
                                        <Scale className="w-4 h-4 text-red-500 fill-black" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Label Badge */}
                            <div className="flex flex-col items-center">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-black/80",
                                    isCritical ? "border-red-500/50 text-red-400" : "border-zinc-800 text-zinc-400"
                                )}>
                                    {node.label}
                                </span>
                                {/* In Business Mode: Show Value. In Network Mode: Show Throughput */}
                                <span className={cn(
                                    "text-[10px] font-mono mt-0.5 flex items-center gap-1",
                                    viewMode === 'network' ? "text-emerald-500" : "text-zinc-500"
                                )}>
                                    {viewMode === 'network' && <Activity className="w-2 h-2" />}
                                    {viewMode === 'network' ? node.networkStats?.throughput : node.value}
                                </span>
                            </div>

                        </motion.div>
                    );
                })}
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

                            {/* Active Legal Violations */}
                            {getActiveConstraint(selectedNode) && (
                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Scale className="w-4 h-4 text-red-500" />
                                        <div className="text-xs text-red-500 font-bold uppercase tracking-widest">
                                            Legal Violation
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1">{getActiveConstraint(selectedNode)?.name}</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                                        {getActiveConstraint(selectedNode)?.description}
                                    </p>
                                    <Button size="sm" variant="destructive" className="w-full text-xs h-8">
                                        View Legal Context
                                    </Button>
                                </div>
                            )}

                            {/* VIEW SPECIFIC DETAILS */}
                            {viewMode === 'business' ? (
                                <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-900">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Risk Correlation</div>
                                    <div className="text-sm text-zinc-300 leading-relaxed">
                                        Direct impact on <span className="text-white font-bold">$850M</span> annual revenue stream via Checkout API dependency.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                        <div className="text-xs text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Network Telemetry
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-2xl font-mono text-white">{getNode(selectedNode)?.networkStats?.throughput}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase">Throughput</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-mono text-white">{getNode(selectedNode)?.networkStats?.activeFlows}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase">Active Flows</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-900 flex justify-between items-center">
                                        <span className="text-sm text-zinc-400">Packet Drop Rate</span>
                                        <span className={cn(
                                            "font-mono font-bold",
                                            getNode(selectedNode)?.networkStats?.dropRate === '0%' ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            {getNode(selectedNode)?.networkStats?.dropRate}
                                        </span>
                                    </div>
                                </div>
                            )}

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
