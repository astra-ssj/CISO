"use client";

import { useState } from 'react';
import { usePolicyStore, Policy } from '@/lib/policy-store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, LayoutGrid, List, FileText, CheckCircle2, AlertTriangle, Network, Pencil, File } from "lucide-react";
import { VisualPolicyMap } from "@/components/policies/visual-mapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PolicyEditor } from "@/components/policies/policy-editor";
import { exportToDocx, exportToPdf } from "@/lib/export-utils";
import { POLICY_TEMPLATES } from "@/lib/policy-templates";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PoliciesPage() {
    const { policies, addPolicy, updatePolicy } = usePolicyStore();
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(policies[0]?.id || null);
    const [viewMode, setViewMode] = useState<'LIST' | 'VISUAL'>('LIST');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

    const handleCreatePolicy = (policy: Policy) => {
        addPolicy(policy);
        setSelectedPolicyId(policy.id);
        setIsCreateDialogOpen(false);
    };

    const handleUpdatePolicy = (policy: Policy) => {
        updatePolicy(policy.id, policy);
        setIsEditDialogOpen(false);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileText className="h-8 w-8 text-primary" />
                        Policy Engineering & Governance
                    </h1>
                    <p className="text-muted-foreground">Lifecycle management, framework mapping, and visual governance.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-secondary p-1 rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={viewMode === 'LIST' ? 'bg-background shadow-sm' : ''}
                            onClick={() => setViewMode('LIST')}
                        >
                            <List className="h-4 w-4 mr-2" /> List
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={viewMode === 'VISUAL' ? 'bg-background shadow-sm' : ''}
                            onClick={() => setViewMode('VISUAL')}
                        >
                            <Network className="h-4 w-4 mr-2" /> Visual Map
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <File className="h-4 w-4" />
                                    Templates
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Standard Templates</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {POLICY_TEMPLATES.map(tpl => (
                                    <DropdownMenuItem key={tpl.id} onClick={() => {
                                        // TODO: Pass template to editor
                                        // For now we just open the dialog, but in a real app we'd pass initialValues
                                        // I'll simulate this by setting a state or just alerting for now as a POC
                                        // actually better: I'll Modify PolicyEditor to accept initial values, but I can't do that easily without seeing it.
                                        // Instead, I'll allow creating a "Draft" immediately from template.
                                        const newPolicy: Policy = {
                                            id: `pol-${Date.now()}`,
                                            title: tpl.title,
                                            type: 'ISMS', // Default to ISMS for templates
                                            status: 'DRAFT',
                                            version: '0.1.0',
                                            lastUpdated: new Date().toISOString(),
                                            owner: 'CISO Office',
                                            sections: [
                                                { id: 's1', title: 'Content', content: tpl.content }
                                            ],
                                            mappings: []
                                        };
                                        handleCreatePolicy(newPolicy);
                                    }}>
                                        {tpl.title}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90">
                                    <Plus className="mr-2 h-4 w-4" /> New Policy
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create New Policy</DialogTitle>
                                </DialogHeader>
                                <PolicyEditor
                                    onSave={handleCreatePolicy}
                                    onCancel={() => setIsCreateDialogOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Sidebar: Policy List */}
                <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
                    <Card className="h-full border-primary/10 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Policy Library</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-2">
                            <ScrollArea className="h-[600px] pr-4">
                                <div className="space-y-2">
                                    {policies.map(policy => (
                                        <div
                                            key={policy.id}
                                            onClick={() => setSelectedPolicyId(policy.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-secondary/50 ${selectedPolicyId === policy.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-transparent'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant="outline" className={`text-[10px] ${policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                                    policy.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                                        'text-muted-foreground'
                                                    }`}>
                                                    {policy.status}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">v{policy.version}</span>
                                            </div>
                                            <div className="font-semibold text-sm line-clamp-2 mb-1">{policy.title}</div>
                                            <div className="text-[10px] text-muted-foreground">Owner: {policy.owner}</div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="col-span-12 md:col-span-9 h-full">
                    {selectedPolicy ? (
                        <div className="space-y-6 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-start bg-card p-6 rounded-xl border shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{selectedPolicy.title}</h2>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>Type: <span className="font-mono text-foreground">{selectedPolicy.type}</span></span>
                                        <span>Last Updated: <span className="font-mono text-foreground">{new Date(selectedPolicy.lastUpdated).toLocaleDateString()}</span></span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1 bg-secondary/30 p-1 px-2 rounded-md mr-2">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">Export:</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportToDocx(selectedPolicy)} title="Export to DOCX">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportToPdf(selectedPolicy)} title="Export to PDF">
                                            <File className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                    <Badge variant="secondary" className="px-3 py-1 h-fit">Frameworks: {new Set(selectedPolicy.mappings.map(m => m.frameworkId)).size}</Badge>
                                    <Badge variant="secondary" className="px-3 py-1 h-fit">Controls: {selectedPolicy.mappings.length}</Badge>

                                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Policy
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Edit Policy: {selectedPolicy.title}</DialogTitle>
                                            </DialogHeader>
                                            <PolicyEditor
                                                initialPolicy={selectedPolicy}
                                                onSave={handleUpdatePolicy}
                                                onCancel={() => setIsEditDialogOpen(false)}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            {/* View Toggle Content */}
                            {viewMode === 'VISUAL' ? (
                                <VisualPolicyMap policyId={selectedPolicy.id} />
                            ) : (
                                <div className="grid grid-cols-2 gap-6 h-full overflow-hidden">
                                    {/* Policy Content Editor View (Read Only for now) */}
                                    <Card className="h-full flex flex-col border-primary/10">
                                        <CardHeader>
                                            <CardTitle>Policy Content</CardTitle>
                                            <CardDescription>Structured definitions and clauses.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 overflow-auto">
                                            <div className="space-y-6">
                                                {selectedPolicy.sections.map(section => (
                                                    <div key={section.id}>
                                                        <h4 className="font-bold text-sm uppercase text-primary mb-2 border-b border-primary/20 pb-1">{section.title}</h4>
                                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Governance & Mapping View */}
                                    <Card className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                                        <CardHeader>
                                            <CardTitle>Governance & Mapping</CardTitle>
                                            <CardDescription>Traceability to standards.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 overflow-auto">
                                            <div className="space-y-3">
                                                {selectedPolicy.mappings.map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-background rounded border border-border/60 hover:border-primary/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            {m.coverage === 'FULL' ?
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                            }
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-xs font-bold">{m.frameworkId}</span>
                                                                <span className="text-xs text-muted-foreground">Control {m.controlId}</span>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={m.coverage === 'FULL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                                                            {m.coverage}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">Select a policy to view details.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
