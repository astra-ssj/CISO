import { motion, AnimatePresence } from 'framer-motion';
import { ThinkingStep, ToolExecution } from '@/lib/openclaw-client';
import { ChevronDown, ChevronRight, Terminal, Brain, CheckCircle2, CircleDashed } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AgentThinkingProps {
    thinking?: ThinkingStep[];
    tools?: ToolExecution[];
    isFinished?: boolean;
}

export function AgentThinking({ thinking, tools, isFinished }: AgentThinkingProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if ((!thinking || thinking.length === 0) && (!tools || tools.length === 0)) return null;

    return (
        <div className="w-full max-w-[90%] space-y-2 mb-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Agent Activity</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono">SIMULATION MODE</span>
            </div>
            {/* Thinking Block */}
            {thinking && thinking.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 w-full p-2 text-xs font-mono text-primary/80 hover:bg-primary/10 transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <Brain className="h-3 w-3" />
                        <span>Thought Process</span>
                        {!isFinished && <span className="animate-pulse ml-auto text-[10px] uppercase">Thinking...</span>}
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-2 pb-2"
                            >
                                <div className="space-y-1 pl-4 border-l border-primary/10 ml-1">
                                    {thinking.map((step, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            {step.status === 'completed' ? (
                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <CircleDashed className="h-3 w-3 animate-spin text-primary" />
                                            )}
                                            <span className={cn(step.status === 'active' && "text-primary font-medium")}>
                                                {step.description}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Tool Execution Block */}
            {tools && tools.map((tool, idx) => (
                <div key={idx} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-xs font-mono overflow-hidden">
                    <div className="flex items-center gap-2 p-2 border-b border-yellow-500/10 bg-yellow-500/10 text-yellow-500">
                        <Terminal className="h-3 w-3" />
                        <span>Running: {tool.tool}</span>
                        {tool.status === 'running' && <span className="animate-pulse ml-auto">...</span>}
                    </div>
                    <div className="p-2 space-y-2">
                        <div className="text-muted-foreground opacity-70 border-b border-white/5 pb-1">
                            $ {tool.input}
                        </div>
                        {tool.output && (
                            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                {tool.output}
                            </pre>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
