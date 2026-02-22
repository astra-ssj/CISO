"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Database, Shield, Key, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface AccessNode {
    id: string;
    type: 'USER' | 'ROLE' | 'RESOURCE' | 'GROUP';
    label: string;
    subLabel?: string;
    x: number;
    y: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AccessEdge {
    source: string;
    target: string;
    permission: 'READ' | 'WRITE' | 'ADMIN' | 'MEMBER';
    active?: boolean;
}

// --- Data ---
const NODES: AccessNode[] = [
    { id: 'u1', type: 'USER', label: 'Alice.Dev', subLabel: 'DevOps Lead', x: 15, y: 20, risk: 'LOW' },
    { id: 'u2', type: 'USER', label: 'Bob.SRE', subLabel: 'Site Reliability', x: 15, y: 80, risk: 'HIGH' },

    { id: 'g1', type: 'GROUP', label: 'Engops', subLabel: 'G-Suite', x: 40, y: 30, risk: 'LOW' },

    { id: 'r1', type: 'ROLE', label: 'K8s Admin', subLabel: 'ClusterAdmin', x: 60, y: 50, risk: 'HIGH' },
    { id: 'r2', type: 'ROLE', label: 'Log Viewer', subLabel: 'ReadOnly', x: 40, y: 70, risk: 'LOW' },

    { id: 'res1', type: 'RESOURCE', label: 'Prod DB', subLabel: 'PostgreSQL', x: 85, y: 30, risk: 'HIGH' },
    { id: 'res2', type: 'RESOURCE', label: 'Audit Logs', subLabel: 'S3 Bucket', x: 85, y: 70, risk: 'LOW' },
];

const EDGES: AccessEdge[] = [
    { source: 'u1', target: 'g1', permission: 'MEMBER' },
    { source: 'g1', target: 'r1', permission: 'ADMIN' }, // Inherited
    { source: 'u1', target: 'r2', permission: 'MEMBER' },

    { source: 'u2', target: 'r1', permission: 'ADMIN', active: true }, // Bob is using this now
    { source: 'r1', target: 'res1', permission: 'WRITE', active: true },

    { source: 'r2', target: 'res2', permission: 'READ' },

    // Dangerous direct link
    { source: 'u2', target: 'res1', permission: 'WRITE', active: true },
];

// --- Components ---

function NodeIcon({ type, className }: { type: AccessNode['type'], className?: string }) {
    switch (type) {
        case 'USER': return <User className={className} />;
        case 'ROLE': return <Key className={className} />;
        case 'RESOURCE': return <Database className={className} />;
        case 'GROUP': return <Shield className={className} />;
    }
}

export function AccessGraph() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Filter connections based on hover
    const isNodeDimmed = (id: string) => {
        if (!hoveredNode) return false;
        if (hoveredNode === id) return false;

        // Check if directly connected
        const connected = EDGES.some(e =>
            (e.source === hoveredNode && e.target === id) ||
            (e.target === hoveredNode && e.source === id)
        );
        return !connected;
    };

    const isEdgeDimmed = (edge: AccessEdge) => {
        if (!hoveredNode) return false;
        return edge.source !== hoveredNode && edge.target !== hoveredNode;
    };

    return (
        <div className="w-full h-[450px] bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden relative group backdrop-blur-sm">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 0%, #000 100%) pointer-events-none opacity-50" />

            {/* Header */}
            <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Identity Graph</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                    <span>ENTITIES: <span className="text-zinc-300">{NODES.length}</span></span>
                    <span>PATHS: <span className="text-emerald-400">{EDGES.length}</span></span>
                    <span>RISK: <span className="text-red-400">HIGH</span></span>
                </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="15" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#52525b" />
                    </marker>
                    <marker id="arrow-head-active" markerWidth="6" markerHeight="6" refX="15" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#10b981" />
                    </marker>
                    <marker id="arrow-head-danger" markerWidth="6" markerHeight="6" refX="15" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                    </marker>
                </defs>

                {EDGES.map((edge, i) => {
                    const source = NODES.find(n => n.id === edge.source)!;
                    const target = NODES.find(n => n.id === edge.target)!;

                    const isRisk = (edge.source.startsWith('u') && edge.target.startsWith('res')); // Simple logic for demo
                    const isActive = edge.active;
                    const dimmed = isEdgeDimmed(edge);

                    const strokeColor = isRisk ? '#ef4444' : isActive ? '#10b981' : '#52525b';
                    const marker = isRisk ? 'url(#arrow-head-danger)' : isActive ? 'url(#arrow-head-active)' : 'url(#arrow-head)';

                    return (
                        <g key={i} className={cn("transition-opacity duration-300", dimmed && "opacity-10")}>
                            {/* Line */}
                            <motion.line
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                x1={`${source.x}%`} y1={`${source.y}%`}
                                x2={`${target.x}%`} y2={`${target.y}%`}
                                stroke={strokeColor}
                                strokeWidth={isActive ? 2 : 1}
                                markerEnd={marker}
                                strokeDasharray={isActive ? "4,4" : "none"}
                                className={cn(isActive && "animate-pulse-slow")}
                            />

                            {/* Permission Label */}
                            {(hoveredNode === edge.source || hoveredNode === edge.target) && (
                                <foreignObject
                                    x={(source.x + target.x) / 2 + '%'}
                                    y={(source.y + target.y) / 2 + '%'}
                                    width="60" height="20"
                                    style={{ transform: 'translate(-30px, -10px)' }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "text-[9px] font-bold text-center rounded px-1 backdrop-blur-md border",
                                            isRisk ? "bg-red-500/20 text-red-300 border-red-500/50" : "bg-black/80 text-zinc-400 border-zinc-700"
                                        )}
                                    >
                                        {edge.permission}
                                    </motion.div>
                                </foreignObject>
                            )}
                        </g>
                    );
                })}
            </svg>

            <div className="absolute inset-0 w-full h-full">
                {NODES.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: isNodeDimmed(node.id) ? 0.2 : 1, scale: isNodeDimmed(node.id) ? 0.9 : 1 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer",
                        )}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                    >
                        <div className={cn(
                            "relative flex flex-col items-center gap-2 group",
                        )}>
                            {/* Card Body */}
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-2 bg-zinc-900/90 border rounded-xl backdrop-blur-md shadow-lg transition-all duration-300 min-w-[140px]",
                                node.risk === 'HIGH' ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" :
                                    node.type === 'RESOURCE' ? "border-amber-500/30" :
                                        "border-zinc-700 hover:border-emerald-500/50"
                            )}>
                                {/* Icon Box */}
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center border",
                                    node.risk === 'HIGH' ? "bg-red-500/20 border-red-500/30 text-red-400" :
                                        node.type === 'USER' ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
                                            "bg-zinc-800 border-zinc-700 text-zinc-400"
                                )}>
                                    <NodeIcon type={node.type} className="w-4 h-4" />
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-200">{node.label}</span>
                                    <span className="text-[10px] text-zinc-500">{node.subLabel}</span>
                                </div>

                                {/* Risk Indicator */}
                                {node.risk === 'HIGH' && (
                                    <div className="absolute -top-1 -right-1">
                                        <AlertTriangle className="w-4 h-4 text-red-500 fill-black" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

        </div>
    );
}

