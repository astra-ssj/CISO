"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Search, MessageSquare, Book, Terminal, ShieldAlert } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="space-y-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <HelpCircle className="h-8 w-8 text-primary" />
                    Help & Support Center
                </h1>
                <p className="text-muted-foreground text-lg">
                    Documentation, FAQs, and AI-Powered Assistance for the CISO Platform.
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
                            className="pl-10 h-10 bg-background/50 border-primary/20"
                        />
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Popular:</span>
                        <span className="cursor-pointer hover:text-primary underline">How to add a policy?</span>
                        <span className="cursor-pointer hover:text-primary underline">Connecting a customized feed</span>
                        <span className="cursor-pointer hover:text-primary underline">Resetting risk scores</span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FAQ Section */}
                <Card className="md:col-span-2 bg-card/40 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Book className="h-5 w-5 text-emerald-500" />
                            Knowledge Base
                        </CardTitle>
                        <CardDescription>Common configurations and troubleshooting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-border/50">
                                <AccordionTrigger>How is the Threat Intelligence feed populated?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    The "Live Operations" feed ingests data using a robust signal bus architecture.
                                    By default, it simulates high-fidelity signals for demonstration, but can be connected to
                                    standard SIEM APIs (Splunk, Wazuh Key) via the <code>/api/integrations</code> endpoint.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2" className="border-border/50">
                                <AccordionTrigger>How do I promote a Strategic Initiative?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    Strategic Initiatives are automatically prioritized based on tactical signals.
                                    To manually adopt an initiative, navigate to the <strong>Strategy Pyramid</strong>,
                                    select a proposed card, and click "Adopt". This will move it to your active roadmap.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3" className="border-border/50">
                                <AccordionTrigger>Why is my Compliance Score low?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    The AI Engine analyzes your uploaded policies against active frameworks (ISO 27001, NIST).
                                    A low score indicates either missing mandatory clauses or vague language.
                                    Use the <strong>Policy Engine</strong> to run a gap analysis and apply suggested fixes.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4" className="border-border/50">
                                <AccordionTrigger>Is the AI processing data locally?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    Yes. The platform is configured to use <strong>Llama-3 (Local)</strong> via Ollama for all inference tasks,
                                    ensuring sensitive security data never leaves your environment. This satisfies Data Sovereignty requirements.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Direct Support */}
                <Card className="bg-card/40 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Escalation
                        </CardTitle>
                        <CardDescription>Need human or advanced support?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                            <h4 className="font-semibold text-sm mb-1">OmniChat AI</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                Detailed technical support is available 24/7 via the OmniChat agent (bottom right).
                            </p>
                            <Button size="sm" variant="outline" className="w-full">Open Chat</Button>
                        </div>

                        <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                            <h4 className="font-semibold text-sm mb-1">System Status</h4>
                            <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-muted-foreground">API Gateway</span>
                                <span className="text-emerald-500 font-mono">ONLINE</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-muted-foreground">Local Inference</span>
                                <span className="text-emerald-500 font-mono">ONLINE</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-muted-foreground">Signal Bus</span>
                                <span className="text-emerald-500 font-mono">ACTIVE</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
