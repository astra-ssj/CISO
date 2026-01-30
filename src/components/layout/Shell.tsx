"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    ShieldAlert,
    LayoutDashboard,
    FileCheck,
    Siren,
    Bug,
    Settings,
    Menu,
    Activity,
    BrainCircuit,
    Lock,
    ScrollText,
    LogOut,
    Network,
    Server,
    Shield,
    FileText
} from 'lucide-react';
import { useAstraStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ui/chat-interface';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

const navItems = [
    { name: 'Command Center', href: '/', icon: LayoutDashboard },
    { name: 'Policy Intelligence', href: '/intelligence', icon: BrainCircuit },
    { name: 'Policy Engine', href: '/policies', icon: ScrollText },
    { name: 'Data Privacy', href: '/privacy', icon: Lock },
    { name: 'Governance & Risk', href: '/governance', icon: FileText },
    { name: 'Incidents', href: '/incidents', icon: Siren },
    { name: 'AppSec Dashboard', href: '/appsec', icon: Shield },
    { name: 'Threat Modeling', href: '/threat-modeling', icon: Network },
    { name: 'Infrastructure', href: '/infrastructure', icon: Server },
    { name: 'Reporting', href: '/reporting', icon: LayoutDashboard },
    { name: 'Configuration', href: '/settings', icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout } = useAstraStore();

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-screen md:w-64",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                    <ShieldAlert className="h-6 w-6 text-primary mr-2" />
                    <span className="font-bold text-lg tracking-wider">ASTRA</span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.name} href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        isActive && "bg-sidebar-accent text-sidebar-primary font-medium shadow-[0_0_10px_rgba(var(--primary),0.1)] border-l-2 border-primary"
                                    )}
                                >
                                    <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                    {item.name}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-sidebar-border space-y-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => {
                            logout();
                            // Force redirect to be safe
                            window.location.href = '/login';
                        }}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Log Out
                    </Button>
                    <div className="bg-secondary/20 p-3 rounded text-xs text-muted-foreground font-mono">
                        <div>SYS_STATUS: ONLINE</div>
                        <div>VER: 0.9.1</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
                <header className="h-16 flex items-center justify-between px-6 border-b border-border z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <span className="font-semibold text-foreground">Astra CISO</span>
                        <span>/</span>
                        <span className="text-foreground">{navItems.find(i => i.href === pathname)?.name || 'Dashboard'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex text-xs h-8"
                            onClick={() => {
                                localStorage.removeItem("astra_tour_completed");
                                window.location.reload();
                            }}
                        >
                            Restart Tour
                        </Button>
                        {/* Header Actions */}
                        <ThemeSwitcher />
                        <div className="h-6 w-px bg-border mx-2" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono text-muted-foreground hidden md:inline-block">SECURE</span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 md:p-8 scroll-smooth">
                    {children}
                </div>

                {/* Global Components */}
                <ChatInterface />
            </main>
        </div>
    );
}
