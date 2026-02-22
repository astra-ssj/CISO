"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Terminal, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContextAwareness } from '@/lib/hooks/use-context-awareness';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export function OmniChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Systems online. I am tracking your context. How can I assist?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Live Context Hook
    const context = useContextAwareness();

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/notebook/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    context: context // Inject Context Here
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const data = await response.json();
            // Handle both streaming and static responses (simplified for now to static)
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || "I processed that context but received no output.",
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error: unknown) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Error connecting to Neural Core.";
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: message,
                timestamp: Date.now()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Toggle Button */}
            <motion.div
                layout
                className="pointer-events-auto"
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 border border-emerald-500/20",
                        isOpen ? "bg-zinc-900 rotate-90 scale-0 opacity-0" : "bg-black hover:bg-zinc-900 scale-100 opacity-100"
                    )}
                >
                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20" />
                    <Sparkles className="h-6 w-6 text-emerald-500" />
                </Button>
            </motion.div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "pointer-events-auto bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
                            isExpanded ? "w-[800px] h-[80vh]" : "w-[400px] h-[600px]"
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-white tracking-wide">OMNI<span className="text-zinc-500">CHAT</span></span>
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded ml-2 font-mono">
                                    {context.page}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-red-400" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex w-full mb-4",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-lg",
                                        msg.role === 'user'
                                            ? "bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 rounded-tr-sm"
                                            : "bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 rounded-tl-sm"
                                    )}>
                                        <ReactMarkdown
                                            components={{
                                                code: (props: React.ComponentProps<'code'>) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-emerald-400" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-800/50 rounded-2xl p-3 border border-zinc-700/50 rounded-tl-sm flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                                        <span className="text-xs text-zinc-500">Processing context...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                            {/* Context Indicator */}
                            {context.selectedNode && (
                                <div className="mb-2 flex items-center gap-2 text-[10px] text-zinc-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Active Context: Node {context.selectedNode.id}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a command or query..."
                                    className="bg-black/50 border-zinc-700 focus:border-emerald-500 text-white pr-12 h-11"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute right-1 top-1 h-9 w-9 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                    disabled={isLoading || !input.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
