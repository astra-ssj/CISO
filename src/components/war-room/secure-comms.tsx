"use client";

import { useState, useEffect, useRef } from "react";
import { useOOBStore, OOBContact, OOBMessage } from "@/lib/oob-store";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioTower, Lock, Send, ShieldCheck, WifiOff, Minimize2, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SecureCommsWidget() {
    const {
        isSecureLinkActive,
        activateSecureLink,
        deactivateSecureLink,
        contacts,
        activeContactId,
        selectContact,
        messages,
        sendMessage
    } = useOOBStore();

    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeContactId]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText("");
    };

    if (!isSecureLinkActive) {
        return (
            <Button
                variant="destructive"
                size="lg"
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-[0_0_40px_-5px_theme(colors.red.600)] border-4 border-red-500/50 animate-pulse hover:animate-none z-50 bg-black"
                onClick={activateSecureLink}
                title="ESTABLISH SECURE LINK"
            >
                <RadioTower className="h-8 w-8 text-red-500" />
            </Button>
        );
    }

    const activeContact = contacts.find(c => c.id === activeContactId);
    const activeMessages = activeContactId ? (messages[activeContactId] || []) : [];

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[80vh] bg-black border border-emerald-500/30 shadow-[0_0_100px_-20px_theme(colors.emerald.900)] rounded-xl flex overflow-hidden font-mono text-emerald-500">

                {/* Sidebar: Contacts */}
                <div className="w-80 border-r border-emerald-500/20 flex flex-col bg-zinc-950/50">
                    <div className="p-4 border-b border-emerald-500/20 bg-emerald-950/10">
                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="font-bold tracking-wider">SECURE_LINK</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            ENCRYPTION: AES-256-GCM
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col p-2 gap-1">
                            {contacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => selectContact(contact.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                                        activeContactId === contact.id
                                            ? "bg-emerald-900/30 border border-emerald-500/30 text-emerald-300"
                                            : "hover:bg-emerald-900/10 text-emerald-700 hover:text-emerald-500"
                                    )}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center font-bold">
                                            {contact.avatarInitials}
                                        </div>
                                        <div className={cn(
                                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black",
                                            contact.status === 'ONLINE' ? 'bg-emerald-500' :
                                                contact.status === 'BUSY' ? 'bg-amber-500' : 'bg-zinc-500'
                                        )} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold truncate text-sm">{contact.name}</span>
                                        <span className="text-[10px] truncate opacity-70">{contact.role}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-emerald-500/20">
                        <Button
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900"
                            onClick={deactivateSecureLink}
                        >
                            <WifiOff className="mr-2 h-4 w-4" />
                            TERMINATE LINK
                        </Button>
                    </div>
                </div>

                {/* Main: Chat Interface */}
                <div className="flex-1 flex flex-col bg-black relative">
                    {/* Grid Background Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                    {activeContact ? (
                        <>
                            <div className="p-4 border-b border-emerald-500/20 bg-emerald-950/5 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="font-bold text-lg flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-emerald-500" />
                                        {activeContact.name}
                                    </h2>
                                    <p className="text-xs text-emerald-700">{activeContact.role} // ID: {activeContact.id.toUpperCase()}</p>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4 max-w-3xl mx-auto">
                                    {activeMessages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col max-w-[80%]",
                                                msg.isSystem ? "mx-auto items-center text-center my-6" :
                                                    msg.senderId === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                            )}
                                        >
                                            {msg.isSystem ? (
                                                <span className="text-[10px] text-emerald-800 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900">
                                                    {msg.content}
                                                </span>
                                            ) : (
                                                <>
                                                    <div className={cn(
                                                        "p-3 rounded-lg text-sm border",
                                                        msg.senderId === 'user'
                                                            ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-100 rounded-br-none"
                                                            : "bg-zinc-900/80 border-zinc-700 text-zinc-300 rounded-bl-none"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-600 mt-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>

                            <div className="p-4 bg-emerald-950/5 border-t border-emerald-500/20 z-10">
                                <div className="max-w-3xl mx-auto flex gap-2">
                                    <Input
                                        className="bg-black/50 border-emerald-500/30 text-emerald-300 placeholder:text-emerald-800 focus-visible:ring-emerald-500/50"
                                        placeholder="Type encrypted message..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-emerald-800 gap-4 opacity-50 z-10">
                            <RadioTower className="h-24 w-24 animate-pulse" />
                            <p className="text-xl tracking-widest font-bold">AWAITING CONNECTION...</p>
                            <p className="text-sm">Select a secure channel from the sidebar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
