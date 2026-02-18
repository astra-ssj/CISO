"use client";

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ShieldAlert, FileCheck, Building2, Siren, BrainCircuit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore, NotificationType, NotificationSeverity } from '@/lib/notification-store';
import Link from 'next/link';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
    THREAT: <ShieldAlert className="h-4 w-4 text-red-400" />,
    COMPLIANCE: <FileCheck className="h-4 w-4 text-yellow-400" />,
    VENDOR: <Building2 className="h-4 w-4 text-orange-400" />,
    INCIDENT: <Siren className="h-4 w-4 text-red-400" />,
    SYSTEM: <Settings className="h-4 w-4 text-blue-400" />,
    AI_INSIGHT: <BrainCircuit className="h-4 w-4 text-purple-400" />,
};

const SEVERITY_ACCENT: Record<NotificationSeverity, string> = {
    CRITICAL: 'border-l-red-500',
    HIGH: 'border-l-orange-500',
    MEDIUM: 'border-l-yellow-500',
    LOW: 'border-l-blue-500',
    INFO: 'border-l-slate-500',
};

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationCenter() {
    const { notifications, getUnreadCount, markRead, markAllRead, clearAll } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const unreadCount = getUnreadCount();

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 max-h-[500px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <h3 className="font-semibold text-sm text-white">Notifications</h3>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
                                <CheckCheck className="h-3 w-3" /> Mark all read
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300 gap-1" onClick={clearAll}>
                                <Trash2 className="h-3 w-3" /> Clear
                            </Button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[400px] divide-y divide-border/20">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-3 border-l-2 hover:bg-white/[0.02] transition-colors cursor-pointer ${SEVERITY_ACCENT[n.severity]} ${!n.read ? 'bg-primary/[0.03]' : ''}`}
                                    onClick={() => {
                                        markRead(n.id);
                                        if (n.actionUrl) setIsOpen(false);
                                    }}
                                >
                                    {n.actionUrl ? (
                                        <Link href={n.actionUrl} className="block">
                                            <NotificationItem n={n} />
                                        </Link>
                                    ) : (
                                        <NotificationItem n={n} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function NotificationItem({ n }: { n: { type: NotificationType; title: string; message: string; read: boolean; timestamp: number } }) {
    return (
        <div className="flex gap-3">
            <div className="mt-0.5">{TYPE_ICONS[n.type]}</div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${n.read ? 'text-muted-foreground' : 'text-white'}`}>
                        {n.title}
                    </span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">{timeAgo(n.timestamp)}</span>
            </div>
        </div>
    );
}
