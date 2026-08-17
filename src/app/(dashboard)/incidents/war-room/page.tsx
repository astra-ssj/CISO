"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertTriangle,
    Send,
    Bot,
    User,
    Clock,
    CheckCircle,
    FileText,
    Loader2,
    Siren,
} from "lucide-react";
import { consultCommandCenter } from "@/app/actions/war-room-ai";

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface BoundIncident {
    id: string;
    title: string;
    severity: string;
    status: string;
    startedAt: string;
}

const EMPTY_PLAYBOOK: { id: number; text: string; completed: boolean }[] = [];

export default function WarRoomPage() {
    const [incident, setIncident] = useState<BoundIncident | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [playbook, setPlaybook] = useState(EMPTY_PLAYBOOK);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/incidents')
            .then(async (res) => {
                if (!res.ok) return { incidents: [] as BoundIncident[] };
                return res.json() as Promise<{ incidents: BoundIncident[] }>;
            })
            .then((data) => {
                const first = (data.incidents ?? [])[0] ?? null;
                setIncident(first);
                const exercise = !first;
                setMessages([{
                    id: '1',
                    role: 'system',
                    content: exercise
                        ? '**Exercise mode.** No Incident row exists. This is not live IR. Open a real incident or run a tabletop under Exercises. Copilot output is a labeled draft and cannot close a decision.'
                        : `War Room bound to incident **${first.id}** — ${first.title}. Copilot output is a draft (source: ai_draft). Containment still requires a human approve.`,
                    timestamp: new Date(),
                }]);
            })
            .catch(() => {
                setIncident(null);
                setMessages([{
                    id: '1',
                    role: 'system',
                    content: '**Exercise mode.** Incident list unavailable. Astra is not a SOC.',
                    timestamp: new Date(),
                }]);
            })
            .finally(() => setLoaded(true));
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const result = await consultCommandCenter(
                input,
                incident
                    ? { id: incident.id, title: incident.title, severity: incident.severity, status: incident.status }
                    : { id: 'exercise', title: 'No live incident', severity: 'none', status: 'exercise' },
                messages,
            );

            if (result.success) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: result.content,
                    timestamp: new Date(),
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'system',
                    content: `Draft unavailable: ${result.error ?? result.content}`,
                    timestamp: new Date(),
                }]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false);
        }
    };

    const togglePlaybookItem = (id: number) => {
        setPlaybook(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const elapsedMinutes = incident
        ? Math.max(0, Math.floor((Date.now() - new Date(incident.startedAt).getTime()) / 1000 / 60))
        : 0;

    if (!loaded) {
        return <p className="text-sm text-muted-foreground">Loading incident…</p>;
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <Siren className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{incident ? incident.id : 'Exercise mode'}</h1>
                            {incident ? (
                                <>
                                    <Badge variant="destructive">{incident.severity.toUpperCase()}</Badge>
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">{incident.status}</Badge>
                                </>
                            ) : (
                                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">Not live IR</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {incident ? incident.title : 'No Incident row. Rehearse under Exercises; do not invent a ransomware event.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {incident && (
                        <div className="flex items-center gap-2 text-sm bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="font-mono font-bold text-red-500">{elapsedMinutes}m</span>
                            <span className="text-muted-foreground">since startedAt</span>
                        </div>
                    )}
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/exercises">Open tabletop</Link>
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
                <Card className="lg:col-span-3 flex flex-col min-h-0">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bot className="h-5 w-5 text-primary" />
                                Copilot (ai_draft)
                            </CardTitle>
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                                Cannot close a decision
                            </Badge>
                        </div>
                    </CardHeader>

                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                                >
                                    {message.role !== 'user' && (
                                        <div className={`p-2 rounded-lg h-fit ${message.role === 'system' ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                                            {message.role === 'system' ? (
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <Bot className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                                        <div className={`p-3 rounded-lg text-sm ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : message.role === 'system'
                                                ? 'bg-amber-500/10 border border-amber-500/20'
                                                : 'bg-secondary/50'
                                            }`}>
                                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                                {message.content}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 block">
                                            {message.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="p-2 rounded-lg h-fit bg-secondary">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-lg h-fit bg-primary/10">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="p-3 rounded-lg bg-secondary/50">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ask for a draft (containment checklist, exec note). Not canonical."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                disabled={isTyping}
                                className="flex-1"
                            />
                            <Button onClick={sendMessage} disabled={isTyping || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Response Playbook
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {playbook.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Empty until a stored Playbook is attached. Use Incidents playbooks or <code>playbook.nextStep</code>.
                                </p>
                            )}
                            {playbook.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => togglePlaybookItem(item.id)}
                                    className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-2 transition-all ${item.completed
                                        ? 'bg-emerald-500/10 text-emerald-600 line-through opacity-60'
                                        : 'bg-secondary/30 hover:bg-secondary/50'
                                        }`}
                                >
                                    {item.completed ? (
                                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                                    )}
                                    <span>{item.text}</span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
