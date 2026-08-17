"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, Clock, Plus, FileText, Siren, Users } from "lucide-react";
import { usePlaybookStore, Playbook } from "@/lib/playbook-store";
import { PlaybookActiveView } from "@/components/incidents/playbook-active-view";

function TabletopExercisesTab() {
    return (
        <div className="space-y-4 py-8 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Tabletop sessions live under Exercises — this tab no longer seeds demo drills.</p>
            <Button asChild size="sm"><Link href="/exercises">Open Exercises</Link></Button>
        </div>
    );
}

// ─── Incident Response Tab (original /incidents content) ───
function IncidentResponseTab() {
    const { playbooks, startPlaybook, activePlaybookId, resolvePlaybook, createPlaybook, fetchPlaybooks } = usePlaybookStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newSeverity, setNewSeverity] = useState("MEDIUM");
    useEffect(() => { fetchPlaybooks(); }, [fetchPlaybooks]);

    const activePlaybook = activePlaybookId ? playbooks.find(p => p.id === activePlaybookId) : null;

    if (activePlaybook) {
        return <PlaybookActiveView playbookId={activePlaybook.id} onExit={() => resolvePlaybook(activePlaybook.id)} />;
    }

    const handleStartPlaybook = (id: string) => {
        if (confirm("Initiate Incident Response Protocol?")) startPlaybook(id);
    };

    const handleCreatePlaybook = () => {
        const newPlaybook: Playbook = {
            id: `pb-custom-${Date.now()}`, title: newTitle, description: newDesc,
            severity: newSeverity as 'CRITICAL' | 'HIGH' | 'MEDIUM', status: 'READY', evidenceLog: [],
            phases: [{ id: 'p1', title: '1. Initial Triage', status: 'PENDING', steps: [{ id: '1.1', instruction: 'Verify incident scope.', type: 'CHECKBOX', isCompleted: false }, { id: '1.2', instruction: 'Assign incident commander.', type: 'TEXT_INPUT', isCompleted: false }] }]
        };
        createPlaybook(newPlaybook);
        setIsCreateOpen(false); setNewTitle(""); setNewDesc("");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Select a playbook to enter the War Room.</p>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Playbook</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Define New Protocol</DialogTitle><DialogDescription>Create a custom incident response playbook.</DialogDescription></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2"><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Lost Device Protocol" /></div>
                            <div className="grid gap-2"><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="When to use this..." /></div>
                            <div className="grid gap-2"><Label>Severity</Label><Select value={newSeverity} onValueChange={setNewSeverity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CRITICAL">Critical</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem></SelectContent></Select></div>
                        </div>
                        <DialogFooter><Button onClick={handleCreatePlaybook}>Create Protocol</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card/50 border-destructive/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Incidents</CardTitle><ShieldAlert className="h-4 w-4 text-destructive" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold font-mono">—</div><p className="text-xs text-muted-foreground">No Incident rows yet. War Room is exercise-mode until this register is used.</p></CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">MTTR (Avg)</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold font-mono">—</div><p className="text-xs text-muted-foreground">Unscored until resolved incidents exist</p></CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Playbook Library</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {playbooks.map(playbook => (
                    <Card key={playbook.id} className="bg-card/40 hover:bg-card/60 transition-colors cursor-pointer border-primary/10 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Badge variant={playbook.severity === 'CRITICAL' ? 'destructive' : playbook.severity === 'HIGH' ? 'default' : 'secondary'} className="text-[10px]">{playbook.severity}</Badge>
                        </div>
                        <CardHeader><CardTitle className="text-lg">{playbook.title}</CardTitle><CardDescription className="line-clamp-2">{playbook.description}</CardDescription></CardHeader>
                        <CardFooter className="flex justify-between items-center border-t border-primary/5 pt-4 bg-primary/5">
                            <span className="text-xs text-muted-foreground font-mono">{playbook.phases.length} PHASES</span>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-primary/20 hover:bg-primary/10 hover:text-primary" onClick={() => handleStartPlaybook(playbook.id)}>Initiate</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function IncidentsPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Incidents & Response</h1>

            <Tabs defaultValue="response" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="response" className="gap-2"><Siren className="h-4 w-4" />Incident Response</TabsTrigger>
                    <TabsTrigger value="tabletop" className="gap-2"><Users className="h-4 w-4" />Tabletop Exercises</TabsTrigger>
                </TabsList>

                <TabsContent value="response"><IncidentResponseTab /></TabsContent>
                <TabsContent value="tabletop"><TabletopExercisesTab /></TabsContent>
            </Tabs>
        </div>
    );
}
