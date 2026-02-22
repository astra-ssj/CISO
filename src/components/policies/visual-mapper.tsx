"use client";

import { motion } from "framer-motion";
import { usePolicyStore } from "@/lib/policy-store";
import { Card } from "@/components/ui/card";

export function VisualPolicyMap({ policyId }: { policyId: string }) {
    const { policies } = usePolicyStore();
    const policy = policies.find(p => p.id === policyId);

    if (!policy) return <div className="p-8 text-center text-muted-foreground">Policy not found.</div>;

    // Compute Layout (Mock Auto-layout)
    // Level 1: Policy Node
    const policyNode = { id: 'root', type: 'POLICY', label: policy.title, x: 50, y: 300 };

    // Level 2: Framework Nodes
    const frameworks = Array.from(new Set(policy.mappings.map(m => m.frameworkId)));
    const fwNodes = frameworks.map((fw, i) => ({
        id: `fw-${fw}`,
        type: 'FRAMEWORK',
        label: fw.replace(/_/g, ' '),
        x: 400,
        y: 100 + (i * 150)
    }));

    // Level 3: Control Nodes
    const controlNodes = policy.mappings.map((m, i) => ({
        id: `ctrl-${m.frameworkId}-${m.controlId}`,
        type: 'CONTROL',
        label: `${m.controlId} (${m.coverage})`,
        parentId: `fw-${m.frameworkId}`,
        coverage: m.coverage,
        x: 750,
        y: 80 + (i * 80)
    }));

    const allNodes = [policyNode, ...fwNodes, ...controlNodes];

    return (
        <div className="w-full h-[600px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Draw edges from Policy to Frameworks */}
                {fwNodes.map(fw => (
                    <motion.path
                        key={`edge-root-${fw.id}`}
                        d={`M ${policyNode.x + 200} ${policyNode.y + 40} C ${policyNode.x + 300} ${policyNode.y + 40}, ${fw.x - 100} ${fw.y + 30}, ${fw.x} ${fw.y + 30}`}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        strokeOpacity="0.3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                    />
                ))}
                {/* Draw edges from Frameworks to Controls */}
                {controlNodes.map(ctrl => {
                    const parent = fwNodes.find(fn => fn.id === ctrl.parentId);
                    if (!parent) return null;
                    return (
                        <motion.path
                            key={`edge-${parent.id}-${ctrl.id}`}
                            d={`M ${parent.x + 200} ${parent.y + 30} C ${parent.x + 250} ${parent.y + 30}, ${ctrl.x - 50} ${ctrl.y + 20}, ${ctrl.x} ${ctrl.y + 20}`}
                            fill="none"
                            stroke={ctrl.coverage === 'FULL' ? '#10b981' : '#f59e0b'}
                            strokeWidth="1.5"
                            strokeOpacity="0.4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        />
                    )
                })}
            </svg>

            {/* Render Nodes */}
            {allNodes.map((node) => (
                <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ position: 'absolute', left: node.x, top: node.y }}
                    className="w-[200px]"
                >
                    <Card className={`p-3 backdrop-blur-md shadow-md hover:shadow-lg transition-shadow border-l-4 ${node.type === 'POLICY' ? 'border-l-primary bg-card/90' :
                            node.type === 'FRAMEWORK' ? 'border-l-indigo-400 bg-white/80' :
                                'coverage' in node && node.coverage === 'FULL' ? 'border-l-emerald-500 bg-emerald-50/90' : 'border-l-amber-500 bg-amber-50/90'
                        }`}>
                        <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{node.type}</div>
                        <div className="font-semibold text-sm truncate" title={node.label}>{node.label}</div>
                    </Card>
                </motion.div>
            ))}

            <div className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded border shadow-sm text-xs">
                <div className="font-bold mb-1">Visual Governance Map</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Full Coverage</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Partial Coverage</div>
            </div>
        </div>
    );
}
