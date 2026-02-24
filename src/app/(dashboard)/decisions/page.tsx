"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDecisionStore } from "@/lib/decision-engine/router";
import { DecisionCard } from "@/components/decisions/decision-card";
import { PILLAR_META, type DecisionPillar } from "@/lib/decision-engine/types";
import {
    BrainCircuit, CheckCircle2, Clock, Filter,
    ArrowUpDown, Gauge, Zap, TicketCheck, Plus, Search
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// ─── Action Queue Tab (from /tickets) ───
interface Ticket { id: string; title: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; status: "OPEN" | "IN_PROGRESS" | "RESOLVED"; assignee: string; createdAt: string; category: string; }

const DEMO_TICKETS: Ticket[] = [
    { id: "TIX-001", title: "Patch critical CVE-2026-1234", description: "Critical vulnerability in auth library needs immediate patching.", priority: "CRITICAL", status: "IN_PROGRESS", assignee: "SOC Team", createdAt: "2026-02-20", category: "Vulnerability" },
    { id: "TIX-002", title: "Review vendor SLA for CloudWare", description: "Missing SLA documentation for CloudWare vendor.", priority: "MEDIUM", status: "OPEN", assignee: "Vendor Manager", createdAt: "2026-02-18", category: "Vendor" },
    { id: "TIX-003", title: "Update access control policies", description: "Access control policies need revision for new zero-trust rollout.", priority: "HIGH", status: "OPEN", assignee: "Policy Lead", createdAt: "2026-02-15", category: "Compliance" },
    { id: "TIX-004", title: "DSAR response for user #4892", description: "Subject access request received, must be fulfilled within 30 days.", priority: "HIGH", status: "IN_PROGRESS", assignee: "Privacy Officer", createdAt: "2026-02-10", category: "Privacy" },
];

function ActionQueueTab() {
    const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS);
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPriority, setNewPriority] = useState("MEDIUM");
    const [newCategory, setNewCategory] = useState("General");

    const filtered = tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    const priorityStyle = (p: string) => p === "CRITICAL" ? "bg-red-500/10 text-red-500" : p === "HIGH" ? "bg-orange-500/10 text-orange-400" : p === "MEDIUM" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400";
    const statusStyle = (s: string) => s === "RESOLVED" ? "bg-emerald-500/10 text-emerald-500" : s === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" : "bg-secondary text-muted-foreground";

    const handleCreate = () => {
        setTickets(prev => [{ id: `TIX-${String(prev.length + 1).padStart(3, '0')}`, title: newTitle, description: newDesc, priority: newPriority as Ticket["priority"], status: "OPEN", assignee: "Unassigned", createdAt: new Date().toISOString().split("T")[0], category: newCategory }, ...prev]);
        setNewTitle(""); setNewDesc(""); setIsCreateOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Security tasks and action items.</p>
                <div className="flex gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9 w-64" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />New Ticket</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create Action Item</DialogTitle><DialogDescription>Create a new security task or action item.</DialogDescription></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2"><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Patch CVE-2026-XXXX" /></div>
                                <div className="grid gap-2"><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the action item..." /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label>Priority</Label><Select value={newPriority} onValueChange={setNewPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CRITICAL">Critical</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="LOW">Low</SelectItem></SelectContent></Select></div>
                                    <div className="grid gap-2"><Label>Category</Label><Select value={newCategory} onValueChange={setNewCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Vulnerability">Vulnerability</SelectItem><SelectItem value="Compliance">Compliance</SelectItem><SelectItem value="Vendor">Vendor</SelectItem><SelectItem value="Privacy">Privacy</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select></div>
                                </div>
                            </div>
                            <DialogFooter><Button onClick={handleCreate}>Create Ticket</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-3">
                {filtered.map(ticket => (
                    <Card key={ticket.id} className="border-border hover:border-primary/30 transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                                    <h4 className="font-medium text-sm">{ticket.title}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={priorityStyle(ticket.priority)}>{ticket.priority}</Badge>
                                    <Badge className={statusStyle(ticket.status)}>{ticket.status}</Badge>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{ticket.description}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>Assignee: {ticket.assignee}</span>
                                <span>{ticket.category} · {ticket.createdAt}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ─── Decision Feed Tab (original /decisions content) ───
function DecisionFeedTab() {
    const { decisions, getPending, getStats } = useDecisionStore();
    const stats = getStats();
    const pending = getPending();
    const [pillarFilter, setPillarFilter] = useState<DecisionPillar | 'ALL'>('ALL');
    const [showResolved, setShowResolved] = useState(false);

    const filtered = pillarFilter === 'ALL'
        ? (showResolved ? decisions : pending)
        : (showResolved ? decisions : pending).filter(d => d.pillar === pillarFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">AI-powered security decisions awaiting your approval.</p>
                <Button size="sm" variant={showResolved ? 'default' : 'outline'} className="h-8 text-xs gap-1" onClick={() => setShowResolved(!showResolved)}>
                    <Filter className="h-3.5 w-3.5" />{showResolved ? 'All Decisions' : 'Pending Only'}
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><Zap className="h-6 w-6 text-amber-400" /><div><p className="text-xl font-bold">{stats.pending}</p><p className="text-[10px] text-muted-foreground">Pending</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-400" /><div><p className="text-xl font-bold">{stats.approved}</p><p className="text-[10px] text-muted-foreground">Approved</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><Clock className="h-6 w-6 text-amber-400" /><div><p className="text-xl font-bold">{stats.deferred}</p><p className="text-[10px] text-muted-foreground">Deferred</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><Gauge className="h-6 w-6 text-blue-400" /><div><p className="text-xl font-bold">{stats.avgConfidence}%</p><p className="text-[10px] text-muted-foreground">Avg Confidence</p></div></CardContent></Card>
                <Card className="bg-card/30 border-border/30"><CardContent className="p-3 flex items-center gap-3"><ArrowUpDown className="h-6 w-6 text-purple-400" /><div><p className="text-xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></div></CardContent></Card>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={pillarFilter === 'ALL' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setPillarFilter('ALL')}>All Pillars</Button>
                {(Object.keys(PILLAR_META) as DecisionPillar[]).map(pillar => {
                    const meta = PILLAR_META[pillar]; const count = pending.filter(d => d.pillar === pillar).length;
                    return (
                        <Button key={pillar} size="sm" variant={pillarFilter === pillar ? 'default' : 'outline'} className="h-7 text-[11px] gap-1" onClick={() => setPillarFilter(pillar)}>
                            {meta.label}{count > 0 && <Badge className="h-4 w-4 p-0 justify-center rounded-full text-[9px] bg-primary/30">{count}</Badge>}
                        </Button>
                    );
                })}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground"><BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No decisions matching your filter.</p></div>
                )}
                {filtered.map(decision => <DecisionCard key={decision.id} decision={decision} />)}
            </div>
        </div>
    );
}

export default function DecisionsPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BrainCircuit className="h-7 w-7 text-primary" />Decision Center</h1>

            <Tabs defaultValue="decisions" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="decisions" className="gap-2"><Zap className="h-4 w-4" />Decisions</TabsTrigger>
                    <TabsTrigger value="queue" className="gap-2"><TicketCheck className="h-4 w-4" />Action Queue</TabsTrigger>
                </TabsList>

                <TabsContent value="decisions"><DecisionFeedTab /></TabsContent>
                <TabsContent value="queue"><ActionQueueTab /></TabsContent>
            </Tabs>
        </div>
    );
}
