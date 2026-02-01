"use client";

import { usePolicyStore, Policy, PolicyStatus } from "@/lib/policy-store";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLUMNS: { id: PolicyStatus; label: string; color: string }[] = [
    { id: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { id: 'IN_REVIEW', label: 'In Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'APPROVED', label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'ACTIVE', label: 'Published / Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 'RETIRED', label: 'Retired', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
];

export function PolicyKanbanBoard({ onPolicySelect }: { onPolicySelect: (id: string) => void }) {
    const { policies, updatePolicy } = usePolicyStore();

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as PolicyStatus;
        updatePolicy(draggableId, { status: newStatus });
    };

    const getColumnPolicies = (status: PolicyStatus) => {
        return policies.filter(p => p.status === status);
    };

    return (
        <div className="h-full overflow-x-auto">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-full min-w-[1200px] p-1">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex-1 min-w-[280px] flex flex-col gap-2">
                            <div className={`p-3 rounded-lg font-bold flex justify-between items-center ${col.color}`}>
                                {col.label}
                                <Badge variant="secondary" className="bg-white/20">{getColumnPolicies(col.id).length}</Badge>
                            </div>

                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 rounded-lg transition-colors p-2 space-y-3 ${snapshot.isDraggingOver ? 'bg-secondary/50' : 'bg-transparent'}`}
                                    >
                                        {getColumnPolicies(col.id).map((policy, index) => (
                                            <Draggable key={policy.id} draggableId={policy.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={provided.draggableProps.style}
                                                        onClick={() => onPolicySelect(policy.id)}
                                                    >
                                                        <Card className={`cursor-pointer hover:border-primary/50 transition-all ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-primary/20' : ''}`}>
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <Badge variant="outline" className="text-[10px]">{policy.type}</Badge>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button>
                                                                </div>

                                                                <h4 className="font-semibold text-sm leading-tight">{policy.title}</h4>

                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <FileText className="h-3 w-3" />
                                                                    <span>v{policy.version}</span>
                                                                    <span className="mx-1">•</span>
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>{new Date(policy.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                                </div>

                                                                <div className="flex justify-between items-center pt-2 border-t mt-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-5 w-5">
                                                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${policy.owner}`} />
                                                                            <AvatarFallback>{policy.owner[0]}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{policy.owner}</span>
                                                                    </div>
                                                                    {policy.acknowledgment && policy.acknowledgment.status !== 'COMPLETED' && (
                                                                        <Badge variant="secondary" className="text-[10px] h-5">
                                                                            {Math.round((policy.acknowledgment.signedUsers / policy.acknowledgment.totalUsers) * 100)}% Ack
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
