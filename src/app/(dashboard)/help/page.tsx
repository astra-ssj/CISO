"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, Search, MessageSquare, Book, Terminal, ShieldAlert, Cpu, Triangle, FileCheck, Skull, Bot, ExternalLink } from "lucide-react";
import { useAstraStore } from "@/lib/store";

export default function HelpPage() {
    const { setChatOpen, sendQuery } = useAstraStore();

    const handleEscalate = () => {
        setChatOpen(true);
        sendQuery("I need to escalate a critical issue. Please connect me to advanced support.");
    };

    const handleAskAI = (query: string) => {
        setChatOpen(true);
        sendQuery(query);
    };

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <HelpCircle className="h-8 w-8 text-primary" />
                    Help & Support Center
                </h1>
                <p className="text-muted-foreground text-lg">
                    Comprehensive documentation and AI-powered assistance for the Astra CISO Platform.
                </p>
            </div>

            {/* AI Search / Hero */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Terminal className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">How can Astra AI assist you today?</h2>

                    <div className="relative w-full max-w-lg">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Ask about compliance, dashboards, or integrations..."
                            className="pl-10 h-12 bg-background/50 border-primary/20 text-lg"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAskAI((e.currentTarget as HTMLInputElement).value);
                                }
                            }}
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                        <span>Popular:</span>
                        <button onClick={() => handleAskAI("How do I add a new policy?")} className="hover:text-primary underline">How to add a policy?</button>
                        <span className="text-primary/30">•</span>
                        <button onClick={() => handleAskAI("Explain the risk scoring logic")} className="hover:text-primary underline">Risk Logic</button>
                        <span className="text-primary/30">•</span>
                        <button onClick={() => handleAskAI("How does the Wargame scoring work?")} className="hover:text-primary underline">Wargame Scoring</button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-secondary/30 p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-background">Platform Overview</TabsTrigger>
                    <TabsTrigger value="modules" className="data-[state=active]:bg-background">Module Guides</TabsTrigger>
                    <TabsTrigger value="support" className="data-[state=active]:bg-background">Support & Escalation</TabsTrigger>
                </TabsList>

                {/* --- Platform Overview Tab --- */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-primary/10 bg-card/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-blue-400" />
                                    The Signal Bus Architecture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    Astra CISO uses a reactive <strong>Signal Bus</strong> to connect tactical events with strategic decisions.
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Inputs:</strong> SIEM feeds, Trivy scans, and Threat Intel streams.</li>
                                    <li><strong>Processing:</strong> The Intelligence Engine normalizes these into "Signals".</li>
                                    <li><strong>Outputs:</strong> Signals trigger automatic updates to Risk Scores and promote relevant items in the Strategy Pyramid.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 bg-card/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-emerald-400" />
                                    Locally Inferenced AI
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    All AI operations are performed <strong>locally</strong> using Llama-3 via Ollama.
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Privacy:</strong> No sensitive data leaves your infrastructure.</li>
                                    <li><strong>Latency:</strong> Zero-latency inference for real-time chat.</li>
                                    <li><strong>Customization:</strong> Models are fine-tuned on your specific policy documents.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Module Guides Tab --- */}
                <TabsContent value="modules" className="space-y-6">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="intel" className="border-border/50 px-4 bg-card/20 rounded-lg mb-2">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-md"><Cpu className="h-4 w-4 text-blue-500" /></div>
                                    <span className="font-semibold">Threat Intelligence</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pl-12 pr-4 pb-4 space-y-2">
                                <p>
                                    The <strong>Threat Intelligence</strong> module aggregates global security feeds.
                                    The "Live Operations" view shows real-time attacks.
                                    Use the <strong>MITRE ATT&CK Matrix</strong> to visualize adversary tactics coverage.
                                    Red cells indicate active detection gaps.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="strategy" className="border-border/50 px-4 bg-card/20 rounded-lg mb-2">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-md"><Triangle className="h-4 w-4 text-purple-500" /></div>
                                    <span className="font-semibold">Strategy Pyramid</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pl-12 pr-4 pb-4 space-y-2">
                                <p>
                                    The <strong>Strategy Pyramid</strong> aligns security initiatives with business goals.
                                    Items at the bottom (Tactical) bubble up to the top (Mission).
                                    Click "Adopt" on any card to move it to your active roadmap.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="policy" className="border-border/50 px-4 bg-card/20 rounded-lg mb-2">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-md"><FileCheck className="h-4 w-4 text-emerald-500" /></div>
                                    <span className="font-semibold">Policy Engine</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pl-12 pr-4 pb-4 space-y-2">
                                <p>
                                    The <strong>Policy Engine</strong> automates GRC tasks.
                                    Upload documents to run compliance checks against ISO 27001 and NIST CSF.
                                    The "Golden Library" ensures all generated policies use pre-approved legal language.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="wargames" className="border-border/50 px-4 bg-card/20 rounded-lg mb-2">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-md"><Skull className="h-4 w-4 text-red-500" /></div>
                                    <span className="font-semibold">Wargames & Simulation</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pl-12 pr-4 pb-4 space-y-2">
                                <p>
                                    Test your incident response reflexes in the <strong>Wargames</strong> module.
                                    Scores are calculated based on reaction time, decision accuracy, and risk mitigation.
                                    Use "AI Red Team" mode for a dynamic adversary that adapts to your choices.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                {/* --- Support Tab --- */}
                <TabsContent value="support" className="space-y-6">
                    <Card className="bg-card/40 border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-amber-500" />
                                Escalation Protocols
                            </CardTitle>
                            <CardDescription>Direct lines to advanced support and incident response teams.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-lg bg-secondary/10 border border-border flex flex-col justify-between">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-primary" />
                                        OmniChat AI Support
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Immediate Level 1 & 2 support. The AI agent has full access to your platform's context and documentation.
                                    </p>
                                </div>
                                <Button onClick={handleEscalate} className="w-full">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Open Priority Chat
                                </Button>
                            </div>

                            <div className="p-6 rounded-lg bg-secondary/10 border border-border flex flex-col justify-between">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        <ExternalLink className="h-5 w-5 text-blue-400" />
                                        External SOC Link
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        For P1/P0 incidents, connect directly with the Managed SOC provider via secure channel.
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full cursor-not-allowed opacity-50" title="Requires SOC Integration">
                                    Connect to SOC (Disabled)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <h4 className="font-semibold text-sm mb-2 text-emerald-500">System Status</h4>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                            <div className="flex justify-between p-2 bg-background/50 rounded">
                                <span>API Gateway</span>
                                <span className="text-emerald-500 font-mono">ONLINE</span>
                            </div>
                            <div className="flex justify-between p-2 bg-background/50 rounded">
                                <span>Local Inference</span>
                                <span className="text-emerald-500 font-mono">ONLINE</span>
                            </div>
                            <div className="flex justify-between p-2 bg-background/50 rounded">
                                <span>Signal Bus</span>
                                <span className="text-emerald-500 font-mono">ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
