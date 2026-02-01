"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Terminal, ShieldAlert, Skull, Zap, ArrowLeft, Play, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from "next/link";

interface ThreatActorProfile {
    id: string;
    name: string;
    description: string;
    tactics: string[];
}

interface OrganizationTemplate {
    id: string;
    name: string;
    employees: number;
    criticalAssets: string[];
}

interface PlayerOption {
    text: string;
    description: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    cost: number;
}

interface GameState {
    scenarioType: string;
    turnNumber: number;
    playerActions: string[];
    currentSituation: string;
    threatActorProfile: string;
    organizationProfile: string;
    narrative: string;
    severity: string;
    playerOptions: PlayerOption[];
    isGameOver: boolean;
    gameOverReason: string | null;
    provider?: string;
    model?: string;
}

export default function AIWargamePage() {
    const [threatActors, setThreatActors] = useState<ThreatActorProfile[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationTemplate[]>([]);
    const [selectedThreatActor, setSelectedThreatActor] = useState<string>('');
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [customScenario, setCustomScenario] = useState<string>('');

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
    const historyRef = useRef<HTMLDivElement>(null);

    // Fetch profiles on mount
    useEffect(() => {
        fetch('/api/agent/wargame')
            .then(res => res.json())
            .then(data => {
                setThreatActors(data.threatActorProfiles || []);
                setOrganizations(data.organizationTemplates || []);
            })
            .catch(console.error);
    }, []);

    // Auto-scroll history
    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    const startGame = async () => {
        if (!selectedThreatActor || !selectedOrg) return;

        const actor = threatActors.find(t => t.id === selectedThreatActor);
        const org = organizations.find(o => o.id === selectedOrg);

        const initialState = {
            scenarioType: customScenario || 'GENERAL_BREACH',
            turnNumber: 1,
            playerActions: [],
            currentSituation: `Initial breach detected. ${actor?.name} has gained a foothold in ${org?.name}'s network.`,
            threatActorProfile: `${actor?.name}: ${actor?.description}. Tactics: ${actor?.tactics.join(', ')}`,
            organizationProfile: `${org?.name} (${org?.employees} employees). Critical Assets: ${org?.criticalAssets.join(', ')}`
        };

        setIsLoading(true);
        setHistory([{ role: 'system', content: '🎮 Initializing AI Red Team Simulation...' }]);

        try {
            const response = await fetch('/api/agent/wargame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: initialState,
                    playerAction: 'Game Start - Initial reconnaissance by threat actor'
                })
            });

            const result = await response.json();

            setGameState({
                ...initialState,
                narrative: result.narrative,
                severity: result.severity,
                playerOptions: result.playerOptions,
                isGameOver: result.isGameOver,
                gameOverReason: result.gameOverReason,
                provider: result.provider,
                model: result.model,
                turnNumber: 1
            });

            setHistory(prev => [
                ...prev,
                { role: 'adversary', content: result.narrative },
                { role: 'system', content: `⚠️ Threat Level: ${result.severity}` }
            ]);
        } catch (error) {
            console.error('Game start failed:', error);
            setHistory(prev => [...prev, { role: 'system', content: '❌ Failed to initialize. Check API connection.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const submitAction = async (action: PlayerOption) => {
        if (!gameState || isLoading) return;

        setIsLoading(true);
        setHistory(prev => [...prev, { role: 'player', content: `🛡️ ${action.text}: ${action.description}` }]);

        try {
            const updatedState = {
                ...gameState,
                playerActions: [...gameState.playerActions, action.text],
                turnNumber: gameState.turnNumber + 1
            };

            const response = await fetch('/api/agent/wargame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: updatedState,
                    playerAction: `${action.text} - ${action.description}`
                })
            });

            const result = await response.json();

            setGameState({
                ...updatedState,
                currentSituation: result.newSituation || gameState.currentSituation,
                narrative: result.narrative,
                severity: result.severity,
                playerOptions: result.playerOptions,
                isGameOver: result.isGameOver,
                gameOverReason: result.gameOverReason,
                provider: result.provider,
                model: result.model,
                turnNumber: result.turnNumber
            });

            setHistory(prev => [
                ...prev,
                { role: 'adversary', content: result.narrative },
                { role: 'system', content: `⚠️ Threat Level: ${result.severity}` }
            ]);

            if (result.isGameOver) {
                setHistory(prev => [...prev, { role: 'system', content: `🏁 GAME OVER: ${result.gameOverReason}` }]);
            }
        } catch (error) {
            console.error('Action failed:', error);
            setHistory(prev => [...prev, { role: 'system', content: '❌ Action failed. Please retry.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetGame = () => {
        setGameState(null);
        setHistory([]);
    };

    // Setup Screen
    if (!gameState) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/wargames">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Skull className="h-8 w-8 text-red-500" />
                            AI Red Team Mode
                        </h1>
                        <p className="text-muted-foreground">Dynamic adversary simulation powered by LLM</p>
                    </div>
                </div>

                <Card className="border-red-500/20 bg-red-950/10">
                    <CardHeader>
                        <CardTitle className="text-red-500">⚠️ Experimental Feature</CardTitle>
                        <CardDescription>
                            This mode uses AI to dynamically generate adversary responses. Results may vary based on the connected LLM provider.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Threat Actor</CardTitle>
                            <CardDescription>Select who you're up against</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={selectedThreatActor} onValueChange={setSelectedThreatActor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose threat actor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {threatActors.map(actor => (
                                        <SelectItem key={actor.id} value={actor.id}>
                                            {actor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedThreatActor && (
                                <div className="text-sm text-muted-foreground p-3 bg-secondary/20 rounded-lg">
                                    {threatActors.find(t => t.id === selectedThreatActor)?.description}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Target Organization</CardTitle>
                            <CardDescription>Your organization profile</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose organization..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedOrg && (
                                <div className="text-sm text-muted-foreground p-3 bg-secondary/20 rounded-lg">
                                    <strong>Critical Assets:</strong> {organizations.find(o => o.id === selectedOrg)?.criticalAssets.join(', ')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Custom Scenario (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Describe a specific scenario you want to simulate, e.g., 'Active ransomware attack with data exfiltration in progress'..."
                            value={customScenario}
                            onChange={(e) => setCustomScenario(e.target.value)}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={startGame}
                    disabled={!selectedThreatActor || !selectedOrg || isLoading}
                >
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing AI...</>
                    ) : (
                        <><Play className="mr-2 h-4 w-4" /> Launch Simulation</>
                    )}
                </Button>
            </div>
        );
    }

    // Game Screen
    return (
        <div className="h-[calc(100vh-100px)] max-w-7xl mx-auto p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={resetGame}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Exit
                    </Button>
                    <h2 className="text-xl font-bold font-mono text-red-500 flex items-center gap-2">
                        <span className="animate-pulse">●</span> AI RED TEAM ACTIVE
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono">Turn {gameState.turnNumber}</Badge>
                    <Badge
                        variant={gameState.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                        className="font-mono"
                    >
                        {gameState.severity}
                    </Badge>
                    {gameState.provider && (
                        <Badge variant="outline" className="text-xs opacity-50">
                            {gameState.provider}/{gameState.model}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Main Console */}
                <Card className="lg:col-span-2 flex flex-col border-red-500/20 bg-black/40 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="border-b border-red-500/10 bg-black/20">
                        <CardTitle className="font-mono text-lg text-red-500 tracking-wider">
                            /// ADVERSARY TRANSMISSION
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-lg text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
                                {gameState.narrative}
                            </p>
                        </div>

                        {gameState.isGameOver ? (
                            <div className="mt-8 p-8 bg-black/50 border border-red-500/30 rounded-xl text-center space-y-4">
                                {gameState.gameOverReason?.toLowerCase().includes('victory') ? (
                                    <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
                                ) : (
                                    <Skull className="h-16 w-16 mx-auto text-red-500" />
                                )}
                                <h3 className="text-2xl font-bold">{gameState.gameOverReason}</h3>
                                <Button onClick={resetGame} size="lg">New Simulation</Button>
                            </div>
                        ) : (
                            <div className="grid gap-3 mt-auto">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Your Response:</Label>
                                {gameState.playerOptions?.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => submitAction(option)}
                                        disabled={isLoading}
                                        className="text-left p-4 rounded-lg bg-secondary/10 border border-primary/10 hover:bg-primary/10 hover:border-primary/50 transition-all group flex justify-between items-center disabled:opacity-50"
                                    >
                                        <div>
                                            <div className="font-bold text-foreground group-hover:text-primary flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-primary/50" /> {option.text}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1 pl-6">{option.description}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs font-mono opacity-50 group-hover:opacity-100">
                                            <span className={option.risk === 'HIGH' ? 'text-red-400' : option.risk === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}>
                                                RISK: {option.risk}
                                            </span>
                                            <span>COST: ${option.cost.toLocaleString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Side Panel - Tactical Log */}
                <Card className="hidden lg:flex flex-col border-primary/10 bg-card/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
                            <Terminal className="h-4 w-4" /> Tactical Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent ref={historyRef} className="flex-1 overflow-y-auto font-mono text-xs space-y-2 p-4">
                        {history.map((entry, i) => (
                            <div
                                key={i}
                                className={`border-l-2 pl-2 py-1 ${entry.role === 'adversary' ? 'border-red-500 text-red-400' :
                                        entry.role === 'player' ? 'border-emerald-500 text-emerald-400' :
                                            'border-primary/20 text-muted-foreground'
                                    }`}
                            >
                                {entry.content.slice(0, 200)}{entry.content.length > 200 ? '...' : ''}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="animate-pulse text-red-500 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Adversary responding...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
