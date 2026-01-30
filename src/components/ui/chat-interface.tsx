"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, MessageSquare, X, Send, User, Mic } from 'lucide-react';
import { useAstraStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const { chatHistory, sendQuery } = useAstraStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isOpen]);

    const [isListening, setIsListening] = useState(false);

    // Voice Recognition Logic
    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Voice Error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } else {
            alert("Voice input is not supported in this browser.");
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        sendQuery(inputValue);
        setInputValue("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4"
                    >
                        <Card className="w-[350px] md:w-[400px] h-[500px] flex flex-col shadow-2xl border-primary/20 bg-card/95 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-white/5 bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <CardTitle className="text-sm font-mono text-primary">ASTRA_AI_CORE</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                {chatHistory.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex items-start gap-3 text-sm",
                                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                                            msg.role === 'assistant'
                                                ? "bg-primary/10 border-primary/20 text-primary"
                                                : "bg-secondary text-secondary-foreground border-border"
                                        )}>
                                            {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                        </div>
                                        <div className={cn(
                                            "p-3 rounded-lg max-w-[80%]",
                                            msg.role === 'assistant'
                                                ? "bg-card border border-primary/10 text-card-foreground"
                                                : "bg-primary text-primary-foreground"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <CardFooter className="p-3 border-t border-white/5 bg-background/50">
                                <form onSubmit={handleSubmit} className="flex w-full gap-2 items-center">
                                    <Input
                                        placeholder={isListening ? "Listening..." : "Query security database..."}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className={cn(
                                            "flex-1 bg-secondary/50 border-white/10 focus-visible:ring-primary/50",
                                            isListening && "border-emerald-500/50 animate-pulse bg-emerald-500/10 placeholder:text-emerald-500"
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-9 w-9 transition-colors",
                                            isListening ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" : "text-muted-foreground hover:text-primary"
                                        )}
                                        onClick={startListening}
                                    >
                                        <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
                                    </Button>
                                    <Button type="submit" size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.4)] bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all"
            >
                <Bot className="h-7 w-7" />
            </Button>
        </div>
    );
}
