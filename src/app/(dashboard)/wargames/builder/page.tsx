"use client";

import { useId, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Download, ArrowLeft } from 'lucide-react';
import { Scenario, GameStep, GameChoice } from "@/lib/wargames-data";
import Link from 'next/link';

export default function ScenarioBuilderPage() {
    const scenarioId = useId().replace(/:/g, '');
    const [scenario, setScenario] = useState<Scenario>({
        id: `custom_${scenarioId}`,
        title: "New Simulation",
        description: "Describe the threat scenario...",
        difficulty: "MEDIUM",
        initialStepId: "start",
        isCustom: true,
        steps: {
            "start": {
                id: "start",
                title: "Event Zero",
                description: "The incident begins...",
                choices: []
            }
        }
    });

    const [activeStepId, setActiveStepId] = useState<string>("start");

    const updateScenario = (field: keyof Scenario, value: Scenario[keyof Scenario]) => {
        setScenario(prev => ({ ...prev, [field]: value }));
    };

    const updateStep = (stepId: string, field: keyof GameStep, value: GameStep[keyof GameStep]) => {
        setScenario(prev => ({
            ...prev,
            steps: {
                ...prev.steps,
                [stepId]: { ...prev.steps[stepId], [field]: value }
            }
        }));
    };

    const addStep = () => {
        const newId = `step_${Object.keys(scenario.steps).length + 1}`;
        setScenario(prev => ({
            ...prev,
            steps: {
                ...prev.steps,
                [newId]: {
                    id: newId,
                    title: "New Step",
                    description: "",
                    choices: []
                }
            }
        }));
        setActiveStepId(newId);
    };

    const deleteStep = (stepId: string) => {
        if (stepId === 'start') return; // Prevent deleting start
        const newSteps = { ...scenario.steps };
        delete newSteps[stepId];
        setScenario(prev => ({ ...prev, steps: newSteps }));
        if (activeStepId === stepId) setActiveStepId('start');
    };

    const addChoice = (stepId: string) => {
        const newChoice: GameChoice = {
            id: `c_${Date.now()}`,
            text: "New Option",
            description: "",
            risk: "MEDIUM",
            cost: 0,
            nextStepId: "start",
            feedback: "Outcome description..."
        };

        const currentStep = scenario.steps[stepId];
        updateStep(stepId, 'choices', [...currentStep.choices, newChoice]);
    };

    const updateChoice = (stepId: string, choiceIndex: number, field: keyof GameChoice, value: GameChoice[keyof GameChoice]) => {
        const currentStep = scenario.steps[stepId];
        const newChoices = [...currentStep.choices];
        newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
        updateStep(stepId, 'choices', newChoices);
    };

    const deleteChoice = (stepId: string, choiceIndex: number) => {
        const currentStep = scenario.steps[stepId];
        const newChoices = currentStep.choices.filter((_, i) => i !== choiceIndex);
        updateStep(stepId, 'choices', newChoices);
    };

    const exportScenario = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${scenario.title.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="h-[calc(100vh-100px)] p-6 flex flex-col max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/wargames">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scenario Architect</h1>
                        <p className="text-muted-foreground">Design custom tabletop exercises.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportScenario}>
                        <Download className="mr-2 h-4 w-4" /> Export JSON
                    </Button>
                    <Button>
                        <Save className="mr-2 h-4 w-4" /> Save Local
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Panel: Scenario Settings & Steps List */}
                <Card className="col-span-3 flex flex-col">
                    <CardHeader>
                        <CardTitle>Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6">
                        <div className="space-y-2">
                            <Label>Scenario Title</Label>
                            <Input value={scenario.title} onChange={e => updateScenario('title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={scenario.difficulty} onValueChange={v => updateScenario('difficulty', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EASY">Easy</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HARD">Hard</SelectItem>
                                    <SelectItem value="LETHAL">Lethal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={scenario.description} onChange={e => updateScenario('description', e.target.value)} rows={3} />
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <Label>Steps ({Object.keys(scenario.steps).length})</Label>
                                <Button size="sm" variant="ghost" onClick={addStep}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="space-y-2">
                                {Object.values(scenario.steps).map(step => (
                                    <div
                                        key={step.id}
                                        className={`p-3 rounded-lg border text-sm cursor-pointer hover:bg-secondary/50 transition-colors flex justify-between items-center ${activeStepId === step.id ? 'bg-secondary border-primary' : 'bg-background'}`}
                                        onClick={() => setActiveStepId(step.id)}
                                    >
                                        <div className="truncate font-medium">{step.title}</div>
                                        {step.id !== 'start' && (
                                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Center Panel: Step Editor */}
                <Card className="col-span-6 flex flex-col">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            Editing: <span className="font-mono text-primary">{activeStepId}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="isEnding">Ending Step?</Label>
                            <input
                                type="checkbox"
                                id="isEnding"
                                checked={scenario.steps[activeStepId]?.isEnding || false}
                                onChange={(e) => updateStep(activeStepId, 'isEnding', e.target.checked)}
                                className="toggle"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6">
                        <div className="space-y-2">
                            <Label>Step Title</Label>
                            <Input value={scenario.steps[activeStepId]?.title} onChange={e => updateStep(activeStepId, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Narrative</Label>
                            <Textarea
                                value={scenario.steps[activeStepId]?.description}
                                onChange={e => updateStep(activeStepId, 'description', e.target.value)}
                                rows={5}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <Label>Player Choices</Label>
                                <Button size="sm" variant="outline" onClick={() => addChoice(activeStepId)}><Plus className="h-4 w-4 mr-2" /> Add Choice</Button>
                            </div>

                            {scenario.steps[activeStepId]?.choices?.map((choice, idx) => (
                                <Card key={choice.id} className="bg-secondary/10">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 space-y-2">
                                                <Label>Option Text</Label>
                                                <Input value={choice.text} onChange={e => updateChoice(activeStepId, idx, 'text', e.target.value)} />
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => deleteChoice(activeStepId, idx)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Risk Level</Label>
                                                <Select value={choice.risk} onValueChange={v => updateChoice(activeStepId, idx, 'risk', v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="LOW">Low</SelectItem>
                                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                                        <SelectItem value="HIGH">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Cost ($)</Label>
                                                <Input type="number" value={choice.cost} onChange={e => updateChoice(activeStepId, idx, 'cost', parseInt(e.target.value))} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Next Step</Label>
                                            <Select value={choice.nextStepId} onValueChange={v => updateChoice(activeStepId, idx, 'nextStepId', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(scenario.steps).map(sid => (
                                                        <SelectItem key={sid} value={sid}>{sid} - {scenario.steps[sid].title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Feedback (Consequence)</Label>
                                            <Textarea value={choice.feedback} onChange={e => updateChoice(activeStepId, idx, 'feedback', e.target.value)} rows={2} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Panel: Preview */}
                <Card className="col-span-3 flex flex-col bg-black/50 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-primary font-mono text-sm">Preview: {scenario.steps[activeStepId]?.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6">
                        <div className="font-mono text-xs text-muted-foreground">
                            {scenario.steps[activeStepId]?.description}
                        </div>
                        <div className="space-y-2">
                            {scenario.steps[activeStepId]?.choices?.map(c => (
                                <div key={c.id} className="p-2 border border-primary/20 rounded bg-primary/5 text-xs">
                                    <div className="font-bold text-primary">{c.text}</div>
                                    <div className="text-muted-foreground mt-1">{c.feedback}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
