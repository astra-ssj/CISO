"use client";

import { NexusGraph } from "@/components/nexus/nexus-graph";
import { motion } from "framer-motion";

export default function NexusPage() {
    return (
        <div className="flex flex-col h-full bg-black/95 p-6 md:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                        Nexus <span className="text-zinc-600">Graph</span>
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Visualizing the <span className="text-emerald-400 font-mono">Contextual Link</span> between Business Revenue and Technical Risk.
                    </p>
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 w-full"
            >
                <NexusGraph />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Total Revenue at Risk</h3>
                    <div className="text-3xl font-mono text-white">$1.25B</div>
                    <div className="text-xs text-red-500 mt-1">▲ 12% from last quarter</div>
                </div>
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Critical Dependencies</h3>
                    <div className="text-3xl font-mono text-white">3</div>
                    <div className="text-xs text-zinc-500 mt-1">Across 2 Business Units</div>
                </div>
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Graph Integrity</h3>
                    <div className="text-3xl font-mono text-emerald-400">98.2%</div>
                    <div className="text-xs text-zinc-500 mt-1">Real-time Sync Active</div>
                </div>
            </div>
        </div>
    );
}
