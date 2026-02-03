"use client";

import { usePolicyStore } from "@/lib/policy-store";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export function PolicyDependencyGraph() {
    const { policies } = usePolicyStore();

    // Simple layout algorithm
    // Root nodes: Policies with 0 dependencies
    // Level 1: Policies that depend on Root nodes

    // For this mock, we'll just hardcode positions based on IDs for the demo visual
    // In a real app, use 'dagre' or 'elkjs' for layout

    const getNodePos = (id: string, index: number) => {
        // Mock positions
        if (id === 'pol-isms-001') return { x: 350, y: 50 }; // Root
        if (id === 'pol-access-001') return { x: 150, y: 200 };
        if (id === 'pol-priv-001') return { x: 550, y: 200 };
        if (id === 'pol-net-001') return { x: 350, y: 350 };
        if (id === 'pol-vendor-001') return { x: 750, y: 350 };
        if (id === 'pol-ai-001') return { x: 550, y: 500 };

        return { x: 100 + (index * 150), y: 50 }; // Default fallback
    };

    const nodes = policies.map((p, i) => ({
        ...p,
        pos: getNodePos(p.id, i)
    }));

    return (
        <div className="w-full h-[600px] bg-slate-50 dark:bg-slate-900 border rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {nodes.map(node => (
                    (node.dependencies || []).map(depId => {
                        const target = nodes.find(n => n.id === depId);
                        if (!target) return null;

                        return (
                            <motion.path
                                key={`${node.id}-${target.id}`}
                                d={`M ${node.pos.x + 100} ${node.pos.y} L ${target.pos.x + 100} ${target.pos.y + 60}`}
                                fill="none"
                                stroke="var(--primary)"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1 }}
                            />
                        );
                    })
                ))}
            </svg>

            {nodes.map(node => (
                <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ position: 'absolute', left: node.pos.x, top: node.pos.y }}
                    className="w-[200px]"
                >
                    <Card className="p-3 shadow-md bg-card/90 backdrop-blur border-l-4 border-l-primary cursor-pointer hover:scale-105 transition-transform">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">{node.type}</div>
                        <div className="font-semibold text-sm truncate" title={node.title}>{node.title}</div>
                        {(node.dependencies || []).length > 0 && (
                            <div className="mt-1 text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1 rounded w-fit">
                                Depends on {(node.dependencies || []).length} Policy
                            </div>
                        )}
                    </Card>
                </motion.div>
            ))}

            <div className="absolute bottom-4 right-4 p-3 bg-white/90 dark:bg-black/90 rounded-lg text-xs border shadow-sm max-w-[200px]">
                <h4 className="font-bold mb-1">Dependency Analysis</h4>
                <p className="text-muted-foreground">Arrows indicate dependency direction. Changing a parent policy (e.g., Global ISMS) may require updates to downstream policies.</p>
            </div>
        </div>
    );
}
