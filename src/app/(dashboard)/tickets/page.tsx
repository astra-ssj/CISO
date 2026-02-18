"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    TicketCheck, ArrowLeft, Plus, Clock, AlertTriangle, CheckCircle2,
    Send, Edit3, Trash2, ExternalLink, Search, Filter, FileText,
    Shield, Wrench, Users, Target, Siren, Clipboard, XCircle, CircleDot
} from 'lucide-react';
import { TICKET_CATEGORIES, TICKET_TEMPLATES, TicketCategory, TicketTemplate, getTemplatesByCategory } from "@/lib/jira/jira-templates";
import { useJiraStore, Ticket } from "@/lib/jira/jira-store";

type TabView = 'create' | 'tickets' | 'templates';

const CATEGORY_ICONS: Record<TicketCategory, React.ReactNode> = {
    INCIDENT_RESPONSE: <Siren className="h-5 w-5" />,
    RISK_COMPLIANCE: <Shield className="h-5 w-5" />,
    INFRASTRUCTURE: <Wrench className="h-5 w-5" />,
    VENDOR_MANAGEMENT: <Users className="h-5 w-5" />,
    STRATEGIC: <Target className="h-5 w-5" />,
};

const PRIORITY_CONFIG = {
    CRITICAL: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Critical' },
    HIGH: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'High' },
    MEDIUM: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Medium' },
    LOW: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Low' },
};

const STATUS_CONFIG: Record<Ticket['status'], { color: string; icon: React.ReactNode }> = {
    DRAFT: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: <Edit3 className="h-3 w-3" /> },
    SUBMITTED: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Send className="h-3 w-3" /> },
    IN_PROGRESS: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <CircleDot className="h-3 w-3" /> },
    RESOLVED: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    CLOSED: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', icon: <XCircle className="h-3 w-3" /> },
};

export default function TicketsPage() {
    const [activeTab, setActiveTab] = useState<TabView>('create');
    const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state for ticket creation
    const [formSummary, setFormSummary] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriority, setFormPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
    const [formAssignee, setFormAssignee] = useState('');

    const { tickets, createTicketFromTemplate, deleteTicket, submitTicket } = useJiraStore();

    const selectTemplate = (template: TicketTemplate) => {
        setSelectedTemplate(template);
        setFormSummary(template.summary);
        setFormDescription(template.description);
        setFormPriority(template.priority);
        setFormAssignee(template.suggestedAssignee || '');
    };

    const handleCreateTicket = () => {
        if (!selectedTemplate) return;
        createTicketFromTemplate(selectedTemplate, {
            summary: formSummary,
            description: formDescription,
            priority: formPriority,
            assignee: formAssignee,
        });
        // Reset and go to tickets view
        setSelectedTemplate(null);
        setSelectedCategory(null);
        setActiveTab('tickets');
    };

    const filteredTickets = tickets.filter(t =>
        t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <TicketCheck className="h-8 w-8 text-primary" />
                    Request Tickets
                </h1>
                <p className="text-muted-foreground">
                    Create and track Jira tickets from prepopulated CISO templates.
                    <span className="text-primary font-mono ml-2">{tickets.length} tickets • {TICKET_TEMPLATES.length} templates</span>
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-primary/10 pb-3">
                {(['create', 'tickets', 'templates'] as TabView[]).map(tab => (
                    <Button
                        key={tab}
                        variant={activeTab === tab ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab(tab); setSelectedCategory(null); setSelectedTemplate(null); }}
                        className="capitalize"
                    >
                        {tab === 'create' && <Plus className="h-4 w-4 mr-1" />}
                        {tab === 'tickets' && <Clipboard className="h-4 w-4 mr-1" />}
                        {tab === 'templates' && <FileText className="h-4 w-4 mr-1" />}
                        {tab === 'create' ? 'Create Ticket' : tab === 'tickets' ? `My Tickets (${tickets.length})` : 'Templates'}
                    </Button>
                ))}
            </div>

            {/* ─── CREATE TICKET TAB ─── */}
            {activeTab === 'create' && !selectedCategory && !selectedTemplate && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-muted-foreground">Select a Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(Object.entries(TICKET_CATEGORIES) as [TicketCategory, typeof TICKET_CATEGORIES[TicketCategory]][]).map(([key, cat]) => (
                            <Card
                                key={key}
                                className="cursor-pointer group hover:border-primary/50 transition-all bg-card/50 backdrop-blur-sm border-primary/10"
                                onClick={() => setSelectedCategory(key)}
                            >
                                <CardContent className="p-6 flex items-start gap-4">
                                    <div className={`p-3 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors ${cat.color}`}>
                                        {CATEGORY_ICONS[key]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold group-hover:text-primary transition-colors">{cat.icon} {cat.label}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                                        <Badge variant="secondary" className="mt-2 text-xs">
                                            {getTemplatesByCategory(key).length} templates
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Template Selection */}
            {activeTab === 'create' && selectedCategory && !selectedTemplate && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <h2 className="text-lg font-semibold">
                            {TICKET_CATEGORIES[selectedCategory].icon} {TICKET_CATEGORIES[selectedCategory].label} Templates
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getTemplatesByCategory(selectedCategory).map(template => (
                            <Card
                                key={template.id}
                                className="cursor-pointer group hover:border-primary/50 transition-all bg-card/50 border-primary/10"
                                onClick={() => selectTemplate(template)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className={PRIORITY_CONFIG[template.priority].color}>
                                            {template.priority}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">{template.issueType}</Badge>
                                    </div>
                                    <CardTitle className="text-base group-hover:text-primary transition-colors">{template.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{template.summary}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex flex-wrap gap-1">
                                        {template.labels.slice(0, 3).map(l => (
                                            <Badge key={l} variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/5">{l}</Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                        {template.customFields.estimatedEffort && (
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {template.customFields.estimatedEffort}</span>
                                        )}
                                        {template.customFields.dueWithin && (
                                            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Due: {template.customFields.dueWithin}</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Ticket Form (Pre-filled from template) */}
            {activeTab === 'create' && selectedTemplate && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <h2 className="text-lg font-semibold">Create: {selectedTemplate.name}</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="border-primary/10">
                                <CardContent className="p-6 space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Summary</label>
                                        <Input
                                            value={formSummary}
                                            onChange={e => setFormSummary(e.target.value)}
                                            className="bg-secondary/10"
                                            placeholder="Ticket summary..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
                                        <Textarea
                                            value={formDescription}
                                            onChange={e => setFormDescription(e.target.value)}
                                            className="bg-secondary/10 min-h-[400px] font-mono text-sm"
                                            placeholder="Fill in the template fields..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <Card className="border-primary/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Priority</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                                                <Button
                                                    key={p}
                                                    size="sm"
                                                    variant={formPriority === p ? 'default' : 'outline'}
                                                    onClick={() => setFormPriority(p)}
                                                    className="text-xs"
                                                >
                                                    {p}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Assignee</label>
                                        <Input
                                            value={formAssignee}
                                            onChange={e => setFormAssignee(e.target.value)}
                                            className="bg-secondary/10"
                                            placeholder="Assignee name..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Issue Type</label>
                                        <Badge variant="outline">{selectedTemplate.issueType}</Badge>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Labels</label>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedTemplate.labels.map(l => (
                                                <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedTemplate.customFields.riskLevel && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Risk Level</label>
                                            <Badge variant="outline" className={PRIORITY_CONFIG[selectedTemplate.customFields.riskLevel as keyof typeof PRIORITY_CONFIG]?.color || ''}>
                                                {selectedTemplate.customFields.riskLevel}
                                            </Badge>
                                        </div>
                                    )}
                                    {selectedTemplate.customFields.complianceFrameworks && selectedTemplate.customFields.complianceFrameworks.length > 0 && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Compliance Frameworks</label>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedTemplate.customFields.complianceFrameworks.map(f => (
                                                    <Badge key={f} variant="secondary" className="text-xs bg-purple-500/10 text-purple-400">{f}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedTemplate.customFields.estimatedEffort && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Estimated Effort</label>
                                            <span className="text-sm">{selectedTemplate.customFields.estimatedEffort}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Button className="w-full" size="lg" onClick={handleCreateTicket}>
                                <TicketCheck className="h-4 w-4 mr-2" /> Create Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MY TICKETS TAB ─── */}
            {activeTab === 'tickets' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 bg-secondary/10"
                            />
                        </div>
                    </div>

                    {filteredTickets.length === 0 ? (
                        <Card className="border-dashed border-2 border-primary/10">
                            <CardContent className="p-12 text-center">
                                <TicketCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">No tickets yet</h3>
                                <p className="text-muted-foreground text-sm mb-4">Create your first ticket from a template to get started.</p>
                                <Button onClick={() => setActiveTab('create')}>
                                    <Plus className="h-4 w-4 mr-2" /> Create Ticket
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredTickets.map(ticket => {
                                const statusConf = STATUS_CONFIG[ticket.status];
                                const prioConf = PRIORITY_CONFIG[ticket.priority];
                                const catConf = TICKET_CATEGORIES[ticket.category];
                                return (
                                    <Card key={ticket.id} className="border-primary/10 hover:border-primary/30 transition-all bg-card/50">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                                                        {ticket.jiraKey && (
                                                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                                <ExternalLink className="h-2.5 w-2.5 mr-1" />{ticket.jiraKey}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-semibold truncate">{ticket.summary}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge variant="outline" className={prioConf.color}>{ticket.priority}</Badge>
                                                        <Badge variant="outline" className={statusConf.color}>
                                                            {statusConf.icon}
                                                            <span className="ml-1">{ticket.status}</span>
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">{catConf.icon} {catConf.label}</span>
                                                        <span className="text-xs text-muted-foreground">→ {ticket.assignee}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {ticket.status === 'DRAFT' && (
                                                        <Button variant="outline" size="sm" onClick={() => submitTicket(ticket.id)}>
                                                            <Send className="h-3 w-3 mr-1" /> Submit
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteTicket(ticket.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                                <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                {ticket.customFields.dueWithin && (
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> SLA: {ticket.customFields.dueWithin}</span>
                                                )}
                                                <Badge variant="secondary" className={`text-[10px] ${ticket.syncStatus === 'SYNCED' ? 'bg-emerald-500/10 text-emerald-400' : ticket.syncStatus === 'FAILED' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                                    {ticket.syncStatus}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ─── TEMPLATES TAB ─── */}
            {activeTab === 'templates' && (
                <div className="space-y-6">
                    {(Object.entries(TICKET_CATEGORIES) as [TicketCategory, typeof TICKET_CATEGORIES[TicketCategory]][]).map(([catKey, catVal]) => (
                        <div key={catKey}>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <span className={catVal.color}>{CATEGORY_ICONS[catKey as TicketCategory]}</span>
                                {catVal.icon} {catVal.label}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {getTemplatesByCategory(catKey as TicketCategory).map(t => (
                                    <Card key={t.id} className="border-primary/10 hover:border-primary/30 transition-all bg-card/50">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className={PRIORITY_CONFIG[t.priority].color}>{t.priority}</Badge>
                                                <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                                            </div>
                                            <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.summary}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                                <span>{t.issueType}</span>
                                                {t.customFields.estimatedEffort && <span>• {t.customFields.estimatedEffort}</span>}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => { selectTemplate(t); setActiveTab('create'); }}
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> Use Template
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
