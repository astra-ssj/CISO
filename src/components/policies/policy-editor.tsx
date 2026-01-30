"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Policy, PolicySection, PolicyStatus } from "@/lib/policy-store";
import { Plus, Trash2, Info } from "lucide-react";

interface PolicyEditorProps {
    initialPolicy?: Partial<Policy>;
    onSave: (policy: Policy) => void;
    onCancel: () => void;
}

export function PolicyEditor({ initialPolicy, onSave, onCancel }: PolicyEditorProps) {
    const isEditing = !!initialPolicy?.id;

    const [title, setTitle] = useState(initialPolicy?.title || "");
    const [type, setType] = useState<Policy['type']>(initialPolicy?.type || "ISMS");
    const [owner, setOwner] = useState(initialPolicy?.owner || "");
    const [status, setStatus] = useState<PolicyStatus>(initialPolicy?.status || "DRAFT");
    const [version, setVersion] = useState(initialPolicy?.version || "0.1.0");
    const [incrementVersion, setIncrementVersion] = useState(false);

    const [sections, setSections] = useState<PolicySection[]>(initialPolicy?.sections || [
        { id: 's1', title: 'Purpose', content: '' },
        { id: 's2', title: 'Scope', content: '' },
        { id: 's3', title: 'Roles & Responsibilities', content: '' } // Governance-First default
    ]);

    // Enforce Draft on Creation
    useEffect(() => {
        if (!isEditing) {
            setStatus("DRAFT");
            setVersion("0.1.0");
        }
    }, [isEditing]);

    const handleAddSection = () => {
        setSections([...sections, { id: `s${Date.now()}`, title: 'New Section', content: '' }]);
    };

    const handleUpdateSection = (id: string, field: 'title' | 'content', value: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleDeleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const calculateNextVersion = (current: string) => {
        const parts = current.split('.').map(Number);
        if (parts.length !== 3) return current;
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }

    const handleSave = () => {
        if (!title.trim() || !owner.trim()) {
            alert("Please fill in the Policy Title and Owner.");
            return;
        }

        const finalVersion = (isEditing && incrementVersion) ? calculateNextVersion(version) : version;

        const newPolicy: Policy = {
            id: initialPolicy?.id || crypto.randomUUID(),
            title,
            type,
            version: finalVersion,
            status: isEditing ? status : "DRAFT", // Force Draft on create
            owner,
            lastUpdated: new Date().toISOString(),
            sections,
            mappings: initialPolicy?.mappings || []
        };
        onSave(newPolicy);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Policy Title <span className="text-destructive">*</span></Label>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Access Control Policy"
                        className={!title.trim() ? "border-red-500/50" : ""}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ISMS">Information Security (ISMS)</SelectItem>
                            <SelectItem value="PRIVACY">Privacy & GDPR</SelectItem>
                            <SelectItem value="AI_GOV">AI Governance</SelectItem>
                            <SelectItem value="ACCESS">Access Control</SelectItem>
                            <SelectItem value="INCIDENT">Incident Response</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Policy Owner <span className="text-destructive">*</span></Label>
                    <Input
                        value={owner}
                        onChange={e => setOwner(e.target.value)}
                        placeholder="e.g. CISO, Head of Engineering"
                        className={!owner.trim() ? "border-red-500/50" : ""}
                    />
                </div>

                {/* Status & Versioning Control */}
                <div className="space-y-2">
                    <Label>Status & Version</Label>
                    <div className="flex gap-2 items-center">
                        <Select value={status} onValueChange={(v: any) => setStatus(v)} disabled={!isEditing}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="RETIRED">Retired</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="px-3 py-2 bg-secondary rounded text-sm font-mono border">v{isEditing && incrementVersion ? calculateNextVersion(version) : version}</div>
                    </div>
                    {isEditing && (
                        <div className="flex items-center space-x-2 mt-1">
                            <Checkbox id="inc-ver" checked={incrementVersion} onCheckedChange={(c: any) => setIncrementVersion(c)} />
                            <label htmlFor="inc-ver" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Increment Patch Version
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Policy Sections</Label>
                    <Button variant="outline" size="sm" onClick={handleAddSection}>
                        <Plus className="h-4 w-4 mr-2" /> Add Section
                    </Button>
                </div>

                <div className="space-y-4 policy-sections-container max-h-[400px] overflow-y-auto pr-2">
                    {sections.map((section, index) => (
                        <div key={section.id} className="p-4 border rounded-md bg-secondary/10 space-y-3 relative group">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteSection(section.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div>
                                <Input
                                    value={section.title}
                                    onChange={e => handleUpdateSection(section.id, 'title', e.target.value)}
                                    className="font-semibold bg-transparent border-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                    placeholder="Section Title"
                                />
                            </div>
                            <Textarea
                                value={section.content}
                                onChange={e => handleUpdateSection(section.id, 'content', e.target.value)}
                                placeholder="Enter policy text here..."
                                className="min-h-[100px] bg-background text-sm"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>
                    {isEditing ? 'Save Changes' : 'Create Policy'}
                </Button>
            </div>
        </div>
    );
}
