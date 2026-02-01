"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Shield,
    CheckCircle,
    XCircle,
    Phone,
    Users,
    FileText,
    Activity,
    Loader2,
    Siren,
    Target,
    Zap
} from "lucide-react";

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface Incident {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'active' | 'investigating' | 'contained' | 'resolved';
    startTime: Date;
    type: string;
    affectedSystems: string[];
}

// Mock AI responses for the copilot
const AI_RESPONSES = [
    "Based on the IOCs you've described, this appears to be consistent with **APT29 (Cozy Bear)** tactics. I recommend:\n\n1. **Isolate affected hosts immediately** - Block network access for the compromised endpoints\n2. **Preserve forensic evidence** - Take memory dumps before any remediation\n3. **Check lateral movement** - Review authentication logs from the past 72 hours\n4. **Rotate credentials** - Especially service accounts that may have been exposed",
    "I've analyzed the logs you mentioned. The anomalous outbound traffic to the C2 domain suggests **data exfiltration may be in progress**.\n\n**Immediate actions:**\n- Block egress to `185.220.101.x/24` at your perimeter firewall\n- Enable enhanced logging on your DNS resolvers\n- Alert your MSSP/MDR for additional monitoring\n\nWould you like me to draft an executive communication?",
    "The ransomware variant you're describing matches the **BlackCat/ALPHV** family. Key indicators:\n\n- Extension: `.sphynx`\n- Ransom note: `RECOVER-sphynx-FILES.txt`\n- Known to target ESXi hypervisors\n\n**Do NOT pay the ransom.** I can help you:\n1. Locate available backups\n2. Assess recovery time objectives\n3. Prepare regulatory notifications (GDPR 72-hour requirement)",
    "Good question. For your incident response playbook, here's the recommended notification timeline:\n\n| Stakeholder | Timeframe | Method |\n|-------------|-----------|--------|\n| CISO | Immediate | Phone + Secure Chat |\n| Legal | Within 1 hour | Email + Meeting |\n| Executives | Within 2 hours | Briefing |\n| Regulators | Within 72 hours | Formal Notice |\n| Customers | TBD | After legal review |\n\nShall I help draft any of these communications?"
];

const MOCK_INCIDENT: Incident = {
    id: "INC-2026-0142",
    title: "Suspected Ransomware Activity - Finance Servers",
    severity: "critical",
    status: "investigating",
    startTime: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    type: "Ransomware",
    affectedSystems: ["fin-srv-01", "fin-srv-02", "backup-nas-03"]
};

const PLAYBOOK_ITEMS = [
    { id: 1, text: "Isolate affected systems from network", completed: true },
    { id: 2, text: "Notify incident response team lead", completed: true },
    { id: 3, text: "Preserve evidence (memory dumps, logs)", completed: false },
    { id: 4, text: "Identify scope of compromise", completed: false },
    { id: 5, text: "Determine attack vector", completed: false },
    { id: 6, text: "Assess data impact", completed: false },
    { id: 7, text: "Prepare executive briefing", completed: false },
    { id: 8, text: "Initiate recovery procedures", completed: false },
];

export default function WarRoomPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'system',
            content: `🚨 **War Room Activated** for ${MOCK_INCIDENT.id}\n\nIncident: ${MOCK_INCIDENT.title}\nSeverity: ${MOCK_INCIDENT.severity.toUpperCase()}\nStatus: ${MOCK_INCIDENT.status}\n\nI'm your AI incident response advisor. I can help with containment strategies, forensic guidance, communication templates, and playbook recommendations.`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [playbook, setPlaybook] = useState(PLAYBOOK_ITEMS);
    const scrollRef = useRef<HTMLDivElement>(null);

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
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsTyping(false);
        }, 1500);
    };

    const togglePlaybookItem = (id: number) => {
        setPlaybook(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const elapsedMinutes = Math.floor((Date.now() - MOCK_INCIDENT.startTime.getTime()) / 1000 / 60);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 max-w-7xl mx-auto">
            {/* Incident Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <Siren className="h-6 w-6 text-red-500 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{MOCK_INCIDENT.id}</h1>
                            <Badge variant="destructive" className="animate-pulse">
                                {MOCK_INCIDENT.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                                {MOCK_INCIDENT.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">{MOCK_INCIDENT.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span className="font-mono font-bold text-red-500">{elapsedMinutes}m</span>
                        <span className="text-muted-foreground">elapsed</span>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Call Bridge
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                        <Users className="h-4 w-4" />
                        Team: 4 active
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
                {/* Chat Panel */}
                <Card className="lg:col-span-3 flex flex-col min-h-0">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bot className="h-5 w-5 text-primary" />
                                Incident Response Copilot
                            </CardTitle>
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                AI Online
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
                                        <div className={`p-2 rounded-lg h-fit ${message.role === 'system' ? 'bg-amber-500/10' : 'bg-primary/10'
                                            }`}>
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
                                placeholder="Ask the AI advisor... (e.g., 'What are the next steps?' or 'Draft an executive update')"
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
                        <div className="flex gap-2 mt-2">
                            {['Containment steps', 'Draft exec update', 'Check compliance', 'Recovery plan'].map((suggestion) => (
                                <Button
                                    key={suggestion}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setInput(suggestion)}
                                >
                                    {suggestion}
                                </Button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Side Panel */}
                <div className="space-y-4">
                    {/* Playbook */}
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Response Playbook
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
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

                    {/* Affected Systems */}
                    <Card className="border-red-500/10 bg-red-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                                <Target className="h-4 w-4" />
                                Affected Systems
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {MOCK_INCIDENT.affectedSystems.map((system) => (
                                <div
                                    key={system}
                                    className="flex items-center justify-between p-2 bg-background/50 rounded text-xs"
                                >
                                    <span className="font-mono">{system}</span>
                                    <Badge variant="destructive" className="text-[10px]">Isolated</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                                <Shield className="h-3.5 w-3.5 mr-2" />
                                Run IOC Scan
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                                <Activity className="h-3.5 w-3.5 mr-2" />
                                View Timeline
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                                <FileText className="h-3.5 w-3.5 mr-2" />
                                Generate Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
