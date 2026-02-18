"use client";

import { useEffect, useRef, useState } from 'react';
import { User, Server, Database, Shield, Lock } from 'lucide-react';

interface Node {
    id: string;
    type: 'USER' | 'ROLE' | 'RESOURCE';
    label: string;
    x: number;
    y: number;
    risk?: 'LOW' | 'HIGH';
}

interface Edge {
    source: string;
    target: string;
    permission: 'READ' | 'WRITE' | 'ADMIN';
}

const INITIAL_NODES: Node[] = [
    { id: 'u1', type: 'USER', label: 'Alice (Dev)', x: 100, y: 100, risk: 'LOW' },
    { id: 'u2', type: 'USER', label: 'Bob (SRE)', x: 100, y: 300, risk: 'HIGH' },
    { id: 'r1', type: 'ROLE', label: 'Admin', x: 300, y: 200 },
    { id: 'r2', type: 'ROLE', label: 'Viewer', x: 300, y: 100 },
    { id: 'res1', type: 'RESOURCE', label: 'Prod DB', x: 500, y: 300, risk: 'HIGH' },
    { id: 'res2', type: 'RESOURCE', label: 'Logs', x: 500, y: 100 },
];

const INITIAL_EDGES: Edge[] = [
    { source: 'u1', target: 'r2', permission: 'READ' },
    { source: 'u2', target: 'r1', permission: 'ADMIN' },
    { source: 'r1', target: 'res1', permission: 'ADMIN' },
    { source: 'r2', target: 'res2', permission: 'READ' },
    { source: 'u2', target: 'res1', permission: 'WRITE' }, // Direct access (Risk)
];

export function AccessGraph() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Simple force simulation or just draggable logic could go here
    // For MVP, strictly static or simple drag

    const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        // Implement drag logic if needed
    };

    return (
        <div className="w-full h-[400px] bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Identity & Access Graph
                </h3>
                <p className="text-xs text-zinc-500">Visualizing permission pathways</p>
            </div>

            <svg ref={svgRef} className="w-full h-full">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#52525b" />
                    </marker>
                    <marker id="arrowhead-danger" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                </defs>

                {/* Edges */}
                {INITIAL_EDGES.map((edge, i) => {
                    const source = nodes.find(n => n.id === edge.source)!;
                    const target = nodes.find(n => n.id === edge.target)!;
                    const isDirectRisk = edge.source.startsWith('u') && edge.target.startsWith('res');

                    return (
                        <g key={i} className="transition-opacity duration-300" style={{ opacity: hoveredNode && (hoveredNode !== edge.source && hoveredNode !== edge.target) ? 0.2 : 1 }}>
                            <line
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                stroke={isDirectRisk ? "#ef4444" : "#52525b"}
                                strokeWidth={isDirectRisk ? 2 : 1}
                                markerEnd={isDirectRisk ? "url(#arrowhead-danger)" : "url(#arrowhead)"}
                                strokeDasharray={edge.permission === 'READ' ? "4" : "0"}
                            />
                            {hoveredNode === edge.source && (
                                <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 5} fill="white" fontSize="10" textAnchor="middle">
                                    {edge.permission}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map(node => (
                    <g
                        key={node.id}
                        transform={`translate(${node.x},${node.y})`}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className="cursor-pointer transition-transform hover:scale-110"
                    >
                        <circle
                            r="20"
                            fill={node.type === 'USER' ? '#3b82f6' : node.type === 'ROLE' ? '#a855f7' : '#10b981'}
                            className="shadow-lg"
                            stroke={node.risk === 'HIGH' ? '#ef4444' : 'none'}
                            strokeWidth={node.risk === 'HIGH' ? 3 : 0}
                        />
                        {node.type === 'USER' && <User className="w-5 h-5 text-white -ml-2.5 -mt-2.5 pointer-events-none" />}
                        {node.type === 'ROLE' && <Lock className="w-5 h-5 text-white -ml-2.5 -mt-2.5 pointer-events-none" />}
                        {node.type === 'RESOURCE' && <Database className="w-5 h-5 text-white -ml-2.5 -mt-2.5 pointer-events-none" />}

                        <text y="35" textAnchor="middle" fill="#e4e4e7" fontSize="12" fontWeight="500">{node.label}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
