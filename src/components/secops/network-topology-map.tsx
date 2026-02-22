"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Server,
    Database,
    Globe,
    Laptop
} from "lucide-react";

// Types for our topology
type NodeStatus = "healthy" | "warning" | "critical";
type NodeType = "service" | "database" | "client" | "internet";

interface TopologyNode {
    id: string;
    label: string;
    type: NodeType;
    status: NodeStatus;
    x: number;
    y: number;
    metadata?: {
        version?: string;
        namespace?: string;
        rps?: number;
    };
}

interface TopologyEdge {
    source: string;
    target: string;
    traffic: "low" | "medium" | "high";
    protocol: "tcp" | "http" | "grpc";
    status: "allow" | "drop";
}

// Mock Data mimicking an active Kubernetes cluster
const NODES: TopologyNode[] = [
    { id: "internet", label: "Internet", type: "internet", status: "healthy", x: 50, y: 50 },
    { id: "load-balancer", label: "Ingress Gateway", type: "service", status: "healthy", x: 50, y: 25 },
    { id: "frontend", label: "Frontend SVC", type: "service", status: "healthy", x: 30, y: 50 },
    { id: "auth-service", label: "Auth SVC", type: "service", status: "warning", x: 70, y: 50 },
    { id: "api-gateway", label: "API Gateway", type: "service", status: "healthy", x: 50, y: 65 },
    { id: "payment-svc", label: "Payment SVC", type: "service", status: "healthy", x: 30, y: 80 },
    { id: "user-db", label: "User DB", type: "database", status: "healthy", x: 70, y: 80 },
    { id: "audit-log", label: "Audit Logger", type: "service", status: "healthy", x: 90, y: 65 },
];

const EDGES: TopologyEdge[] = [
    { source: "internet", target: "load-balancer", traffic: "high", protocol: "http", status: "allow" },
    { source: "load-balancer", target: "frontend", traffic: "high", protocol: "http", status: "allow" },
    { source: "load-balancer", target: "auth-service", traffic: "medium", protocol: "http", status: "allow" },
    { source: "frontend", target: "api-gateway", traffic: "medium", protocol: "http", status: "allow" },
    { source: "auth-service", target: "user-db", traffic: "low", protocol: "tcp", status: "allow" },
    { source: "api-gateway", target: "payment-svc", traffic: "medium", protocol: "grpc", status: "allow" },
    { source: "api-gateway", target: "audit-log", traffic: "low", protocol: "tcp", status: "allow" },
    // Suspicious traffic simulation
    { source: "internet", target: "user-db", traffic: "low", protocol: "tcp", status: "drop" },
];

export function NetworkTopologyMap() {
    const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
    const [trafficRps, setTrafficRps] = useState(0);
    useEffect(() => {
        if (!selectedNode) return;
        const id = setTimeout(() => setTrafficRps(Math.floor(Math.random() * 500) + 50), 0);
        return () => clearTimeout(id);
    }, [selectedNode]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            });
        }
    }, []);

    // Helper to scale coordinates
    const scale = (val: number, max: number) => (val / 100) * max;

    return (
        <Card className="border-primary/10 bg-card overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Network Topology
                </CardTitle>
                <CardDescription>
                    Real-time visualization of service mesh traffic and policy enforcement
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative h-[500px]" ref={containerRef}>
                <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

                {/* SVG Layer for Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
                        </marker>
                        <linearGradient id="traffic-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    {EDGES.map((edge, i) => {
                        const src = NODES.find(n => n.id === edge.source)!;
                        const dst = NODES.find(n => n.id === edge.target)!;
                        const x1 = scale(src.x, dimensions.width);
                        const y1 = scale(src.y, dimensions.height);
                        const x2 = scale(dst.x, dimensions.width);
                        const y2 = scale(dst.y, dimensions.height);

                        return (
                            <g key={i}>
                                {/* Base Line */}
                                <line
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={edge.status === 'drop' ? '#ef4444' : '#374151'}
                                    strokeWidth={edge.traffic === 'high' ? 3 : 1.5}
                                    strokeDasharray={edge.status === 'drop' ? '5,5' : 'none'}
                                    markerEnd={edge.status === 'drop' ? '' : 'url(#arrowhead)'}
                                    opacity={0.6}
                                />

                                {/* Animated Traffic Particle */}
                                {edge.status === 'allow' && (
                                    <motion.circle r="3" fill="#3b82f6">
                                        <animateMotion
                                            dur={`${edge.traffic === 'high' ? '1s' : '3s'}`}
                                            repeatCount="indefinite"
                                            path={`M${x1},${y1} L${x2},${y2}`}
                                        />
                                    </motion.circle>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* DOM Layer for Nodes */}
                {NODES.map((node) => {
                    const x = scale(node.x, dimensions.width);
                    const y = scale(node.y, dimensions.height);

                    return (
                        <motion.div
                            key={node.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                                ${selectedNode?.id === node.id ? 'z-10' : 'z-0'}
                            `}
                            style={{ left: x, top: y }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => setSelectedNode(node)}
                        >
                            <div className={`
                                relative flex items-center justify-center w-12 h-12 rounded-full border-2 
                                bg-background shadow-xl transition-colors
                                ${node.status === 'critical' ? 'border-red-500 shadow-red-500/20' :
                                    node.status === 'warning' ? 'border-amber-500 shadow-amber-500/20' :
                                        'border-primary/50 shadow-primary/20'}
                            `}>
                                {node.type === 'internet' && <Globe className="h-6 w-6 text-muted-foreground" />}
                                {node.type === 'service' && <Server className="h-6 w-6 text-primary" />}
                                {node.type === 'database' && <Database className="h-6 w-6 text-amber-500" />}
                                {node.type === 'client' && <Laptop className="h-6 w-6 text-blue-400" />}

                                {/* Status Dot */}
                                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background 
                                    ${node.status === 'healthy' ? 'bg-emerald-500' :
                                        node.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
                                `} />
                            </div>

                            {/* Label */}
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap bg-background/80 px-2 py-0.5 rounded backdrop-blur-sm border border-border/50">
                                {node.label}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Node Detail Popup */}
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 right-4 bg-background/95 backdrop-blur border p-4 rounded-lg shadow-lg w-64 z-20"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{selectedNode.label}</h4>
                            <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Status</span>
                                <Badge variant={selectedNode.status === 'healthy' ? 'outline' : 'destructive'} className="text-[10px] h-5">
                                    {selectedNode.status.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Type</span>
                                <span className="capitalize">{selectedNode.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Traffic</span>
                                <span>{selectedNode ? trafficRps : 0} RPS</span>
                            </div>
                            <div className="pt-2 border-t mt-2">
                                <span className="text-xs">Latest Flows:</span>
                                <div className="space-y-1 mt-1">
                                    {EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).slice(0, 3).map((e, i) => (
                                        <div key={i} className="flex items-center justify-between text-[10px]">
                                            <span>{e.source === selectedNode.id ? '→ ' + e.target : '← ' + e.source}</span>
                                            <span className={e.status === 'drop' ? 'text-red-500' : 'text-emerald-500'}>
                                                {e.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
