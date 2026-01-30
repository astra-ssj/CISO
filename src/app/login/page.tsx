"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAstraStore } from '@/lib/store';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Terminal, Lock, Cpu, Fingerprint, ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAstraStore();

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Animation State
    const [loginStage, setLoginStage] = useState<'IDLE' | 'DECRYPTING' | 'ACCESS_GRANTED'>('IDLE');
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    useEffect(() => {
        if (isAuthenticated) router.push('/');
    }, [isAuthenticated, router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Governance Check: Use Environment Variables (or default for dev safety)
        const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'admin';
        const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'password';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            setIsLoading(true);
            setLoginStage('DECRYPTING');

            // Initiate simulated decryption sequence
            const sequence = [
                "Establishing secure handshake...",
                "Verifying biometric signature...",
                "Decrypting user keys [AES-256]...",
                "Access Level: SYSTEM ADMINISTRATOR confirmed.",
            ];

            let delay = 0;
            sequence.forEach((line, index) => {
                setTimeout(() => {
                    setTerminalLines(prev => [...prev, line]);
                    if (index === sequence.length - 1) {
                        setTimeout(() => {
                            setLoginStage('ACCESS_GRANTED');
                            setTimeout(() => {
                                login();
                                router.push('/');
                            }, 1000);
                        }, 800);
                    }
                }, delay);
                delay += 600;
            });
        } else {
            setError("ACCESS DENIED. Invalid Credentials.");
            setTerminalLines(prev => [...prev, `[ERROR] Failed login attempt for user: ${username}`]);
        }
    };

    return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center relative overflow-hidden font-mono">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent to-black pointer-events-none" />

            <div className="relative z-10 w-full max-w-md p-6">
                <Card className="bg-black/80 border-primary/30 backdrop-blur-xl shadow-[0_0_50px_rgba(var(--primary),0.2)]">
                    <CardContent className="p-8 space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/50 relative group">
                                <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-20" />
                                <ShieldAlert className="h-8 w-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-widest text-primary">ASTRA<span className="text-white">OS</span></h1>
                            <p className="text-xs text-muted-foreground tracking-widest uppercase">Restricted Access // CISO Clearance</p>
                        </div>

                        {/* Login Form (When Idle) */}
                        {loginStage === 'IDLE' && (
                            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Terminal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="IDENTITY"
                                            className="pl-10 bg-secondary/10 border-primary/20 text-primary font-mono placeholder:text-muted-foreground/50 h-10"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="KEYPHRASE"
                                            className="pl-10 bg-secondary/10 border-primary/20 text-primary font-mono placeholder:text-muted-foreground/50 h-10"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-xs text-red-500 font-bold border border-red-500/20 bg-red-500/10 p-2 rounded flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3" /> {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider relative overflow-hidden group"
                                    disabled={isLoading}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        AUTHENTICATE <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>

                                <div className="text-[10px] text-center text-muted-foreground opacity-50">
                                    Contact System Administrator for Access Keys
                                </div>
                            </form>
                        )}


                        {/* Decryption Sequence */}
                        {loginStage === 'DECRYPTING' && (
                            <div className="space-y-4 font-mono text-xs">
                                {terminalLines.map((line, i) => (
                                    <div key={i} className="text-primary/80 animate-in fade-in slide-in-from-left-2 direction-alternate">
                                        {'>'} {line}
                                    </div>
                                ))}
                                <div className="h-1 w-3 bg-primary animate-pulse inline-block" />
                            </div>
                        )}

                        {/* Success State */}
                        {loginStage === 'ACCESS_GRANTED' && (
                            <div className="text-center space-y-4 animate-in zoom-in duration-300">
                                <Fingerprint className="h-16 w-16 mx-auto text-emerald-500 animate-pulse" />
                                <div className="text-xl font-bold text-emerald-500 tracking-widest">ACCEPTED</div>
                                <div className="text-xs text-muted-foreground">Redirecting to Command Center...</div>
                            </div>
                        )}

                    </CardContent>

                    {/* Decorative Footer */}
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                </Card>
            </div>

            {/* Version */}
            <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground font-mono opacity-30">
                v2.4.0-sentry // SECURE CONNECTION
            </div>
        </div >
    );
}

// Helper icon
function AlertTriangle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
    )
}
