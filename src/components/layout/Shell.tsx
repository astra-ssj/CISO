"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    ShieldAlert,
    LayoutDashboard,
    FileCheck,
    Siren,
    Bug,
    Menu,
    Activity,
    BrainCircuit,
    Lock,
    ScrollText,
    LogOut,
    Network,
    Shield,
    FileText,
    ChevronLeft,
    ChevronRight,
    Gamepad2,
    Sparkles,
    GitBranch,
    FileBarChart,
    Presentation,
    Triangle,
    BookOpen,
    Eye,
    EyeOff,
    HelpCircle,
    Settings,
    Target,
    Building2,
    Bell,
    BarChart3,
    FolderKanban,
    Zap,
    TicketCheck,
    Coins
} from 'lucide-react';
import { useAstraStore } from '@/lib/store';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ui/chat-interface';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GlobalThreatPulse } from '@/components/federated/global-threat-pulse';
import { NotificationCenter } from '@/components/notifications/notification-center';

const navItems = [
    { name: 'Command Center', href: '/', icon: LayoutDashboard },
    { name: 'Decision Center', href: '/decisions', icon: Zap },
    { name: 'KPI Dashboard', href: '/kpis', icon: BarChart3 },
    { name: 'Program Tracker', href: '/projects', icon: FolderKanban },
    { name: 'Executive Brief', href: '/executive-brief', icon: Presentation },
    { name: 'Strategy & OKRs', href: '/strategy', icon: Target },
    { name: 'Defense Matrix', href: '/strategy/matrix', icon: Shield },
    { name: 'Threat Intelligence', href: '/intelligence', icon: BrainCircuit },
    { name: 'Policy Engine', href: '/policies', icon: ScrollText },
    { name: 'Governance & Risk', href: '/governance', icon: FileText },
    { name: 'Vendor Risk', href: '/vendors', icon: Building2 },
    { name: 'Knowledge Base', href: '/vendors/knowledge', icon: BookOpen },
    { name: 'Incidents', href: '/incidents', icon: Siren },
    { name: 'AppSec Dashboard', href: '/appsec', icon: Shield },
    { name: 'Wargames', href: '/wargames', icon: Gamepad2 },
    { name: 'Tickets', href: '/tickets', icon: TicketCheck },
    { name: 'Reporting', href: '/reporting', icon: FileBarChart },
    { name: 'AI Economics', href: '/admin/economics', icon: Coins },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help Center', href: '/help', icon: HelpCircle },
];

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { } = useAstraStore();

    if (!isSidebarOpen) {
        // Mobile sidebar closed state logic if needed, or just standard return
    }

    return (
        <TooltipProvider delayDuration={0}>
            <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transform transition-all duration-300 ease-out md:translate-x-0 md:static md:inset-auto md:h-screen flex flex-col",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                        isCollapsed ? "w-[68px]" : "w-64"
                    )}
                >
                    {/* Logo */}
                    <div className={cn(
                        "h-16 flex items-center border-b border-sidebar-border transition-all duration-300",
                        isCollapsed ? "px-4 justify-center" : "px-5"
                    )}>
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <ShieldAlert className="h-6 w-6 text-primary" />
                                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            {!isCollapsed && (
                                <span className="font-bold text-lg tracking-wide text-foreground">ASTRA</span>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                            const navButton = (
                                <Link key={item.name} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-200 group",
                                            isCollapsed && "justify-center px-2",
                                            isActive && "bg-sidebar-accent text-primary font-medium"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200",
                                            isCollapsed ? "mr-0" : "mr-3",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )} />
                                        {!isCollapsed && (
                                            <span className="text-sm truncate">{item.name}</span>
                                        )}
                                        {isActive && !isCollapsed && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                                        )}
                                    </Button>
                                </Link>
                            );

                            if (isCollapsed) {
                                return (
                                    <Tooltip key={item.name}>
                                        <TooltipTrigger asChild>
                                            {navButton}
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium">
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return navButton;
                        })}
                    </nav>

                    {/* Footer */}
                    <div className={cn(
                        "p-3 border-t border-sidebar-border space-y-2",
                        isCollapsed && "px-2"
                    )}>
                        {/* Collapse Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full h-9 text-muted-foreground hover:text-foreground transition-colors hidden md:flex",
                                isCollapsed ? "justify-center" : "justify-start"
                            )}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    <span className="text-xs">Collapse</span>
                                </>
                            )}
                        </Button>

                        {/* Logout */}
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-9 justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => signOut({ callbackUrl: '/login' })}
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Log Out</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                <span className="text-xs">Log Out</span>
                            </Button>
                        )}

                        {/* Version Info */}
                        {!isCollapsed && (
                            <div className="bg-secondary/30 p-2.5 rounded-lg text-[11px] text-muted-foreground font-mono space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>SYS_STATUS: ONLINE</span>
                                </div>
                                <div className="opacity-60">VER: 0.9.3 (UNICORN)</div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
                    {/* Header */}
                    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border z-30 bg-background/80 backdrop-blur-xl">
                        {/* Left: Mobile menu + Breadcrumb */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden h-9 w-9"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            <nav className="flex items-center text-sm">
                                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Astra CISO
                                </Link>
                                <span className="mx-2 text-border">/</span>
                                <span className="font-medium text-foreground">
                                    {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                                </span>
                            </nav>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hidden md:flex text-xs h-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    localStorage.removeItem("astra_tour_completed");
                                    window.location.reload();
                                }}
                            >
                                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                Restart Tour
                            </Button>

                            <div className="h-5 w-px bg-border mx-1 hidden md:block" />

                            <ThemeSwitcher />

                            <div className="h-5 w-px bg-border mx-1" />

                            <NotificationCenter />

                            <div className="h-5 w-px bg-border mx-1" />

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hidden md:inline">SECURE</span>
                            </div>
                        </div>
                    </header>

                    {/* Federated Defense Ticker */}
                    <GlobalThreatPulse />

                    {/* Page Content */}
                    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                        <div className="animate-fade-in">
                            {children}
                        </div>
                    </div>

                    {/* Global Components */}
                    <ChatInterface />
                </main>

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}
